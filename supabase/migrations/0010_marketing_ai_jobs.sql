-- 0010_marketing_ai_jobs.sql
-- AI job queue for Claude Code agent runtime.
-- The queue lets Vector enqueue AI work that Claude Code processes on schedule.

create table if not exists public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  kind text not null,
  params jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'failed', 'cancelled')),
  priority smallint not null default 100,
  scheduled_for timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  completed_at timestamptz,
  retry_count smallint not null default 0,
  max_retries smallint not null default 3,
  requested_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_ai_jobs_pending
  on public.ai_jobs(workspace_id, status, scheduled_for)
  where status = 'pending';
create index if not exists idx_ai_jobs_kind on public.ai_jobs(workspace_id, kind, created_at desc);

create trigger trg_ai_jobs_updated
  before update on public.ai_jobs
  for each row execute procedure public.set_updated_at();

create table if not exists public.ai_job_results (
  id uuid primary key default gen_random_uuid(),
  ai_job_id uuid not null references public.ai_jobs(id) on delete cascade,
  output jsonb,
  error text,
  tokens_in integer,
  tokens_out integer,
  model_used text,
  duration_ms integer,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_ai_job_results_job on public.ai_job_results(ai_job_id);

alter table public.ai_jobs enable row level security;
alter table public.ai_job_results enable row level security;

drop policy if exists ai_jobs_read on public.ai_jobs;
create policy ai_jobs_read on public.ai_jobs
  for select using (public.txg_can_read(workspace_id));

drop policy if exists ai_jobs_write on public.ai_jobs;
create policy ai_jobs_write on public.ai_jobs
  for all using (public.txg_can_write(workspace_id))
  with check (public.txg_can_write(workspace_id));

drop policy if exists ai_job_results_read on public.ai_job_results;
create policy ai_job_results_read on public.ai_job_results
  for select using (
    exists (
      select 1 from public.ai_jobs j
      where j.id = ai_job_results.ai_job_id
        and public.txg_can_read(j.workspace_id)
    )
  );

drop policy if exists ai_job_results_write on public.ai_job_results;
create policy ai_job_results_write on public.ai_job_results
  for insert with check (
    exists (
      select 1 from public.ai_jobs j
      where j.id = ai_job_results.ai_job_id
        and public.txg_can_write(j.workspace_id)
    )
  );
