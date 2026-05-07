-- 0019_marketing_helpers.sql
-- Helper functions for marketing modules: round-robin SDR assignment, AI job lifecycle.

-- Helper: assign a lead round-robin across active SDRs in a workspace.
create or replace function public.assign_lead_round_robin(p_lead_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
  v_chosen_sdr uuid;
  v_existing_active uuid;
begin
  select workspace_id into v_workspace_id from public.leads where id = p_lead_id;
  if v_workspace_id is null then
    raise exception 'Lead % not found', p_lead_id;
  end if;

  select sdr_id into v_existing_active
  from public.sdr_assignments
  where lead_id = p_lead_id and active = true;

  if v_existing_active is not null then
    return v_existing_active;
  end if;

  select wm.user_id into v_chosen_sdr
  from public.workspace_members wm
  left join (
    select sdr_id, count(*) as load
    from public.sdr_assignments
    where workspace_id = v_workspace_id and active = true
    group by sdr_id
  ) sa on sa.sdr_id = wm.user_id
  where wm.workspace_id = v_workspace_id
    and wm.role = 'sdr'
    and wm.status = 'active'
  order by coalesce(sa.load, 0) asc, random()
  limit 1;

  if v_chosen_sdr is null then
    return null;
  end if;

  insert into public.sdr_assignments (workspace_id, lead_id, sdr_id)
  values (v_workspace_id, p_lead_id, v_chosen_sdr);

  return v_chosen_sdr;
end$$;

revoke execute on function public.assign_lead_round_robin(uuid) from public;
grant execute on function public.assign_lead_round_robin(uuid) to authenticated;

-- Helper: enqueue an AI job with consistent shape.
create or replace function public.enqueue_ai_job(
  p_workspace_id uuid,
  p_kind text,
  p_params jsonb default '{}'::jsonb,
  p_priority smallint default 100,
  p_scheduled_for timestamptz default null,
  p_requested_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_id uuid;
begin
  insert into public.ai_jobs (workspace_id, kind, params, priority, scheduled_for, requested_by)
  values (
    p_workspace_id,
    p_kind,
    p_params,
    p_priority,
    coalesce(p_scheduled_for, timezone('utc', now())),
    p_requested_by
  )
  returning id into v_job_id;
  return v_job_id;
end$$;

revoke execute on function public.enqueue_ai_job(uuid, text, jsonb, smallint, timestamptz, uuid) from public;
grant execute on function public.enqueue_ai_job(uuid, text, jsonb, smallint, timestamptz, uuid) to authenticated;

-- Helper: claim the next pending AI job atomically (used by Claude Code processor).
create or replace function public.claim_next_ai_job()
returns table (
  id uuid,
  workspace_id uuid,
  kind text,
  params jsonb,
  retry_count smallint,
  max_retries smallint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select j.id into v_id
  from public.ai_jobs j
  where j.status = 'pending'
    and j.scheduled_for <= timezone('utc', now())
  order by j.priority asc, j.scheduled_for asc
  limit 1
  for update skip locked;

  if v_id is null then
    return;
  end if;

  update public.ai_jobs
  set status = 'running', started_at = timezone('utc', now())
  where ai_jobs.id = v_id;

  return query
  select j.id, j.workspace_id, j.kind, j.params, j.retry_count, j.max_retries
  from public.ai_jobs j where j.id = v_id;
end$$;

revoke execute on function public.claim_next_ai_job() from public;
grant execute on function public.claim_next_ai_job() to authenticated;

-- Helper: complete an AI job with output.
create or replace function public.complete_ai_job(
  p_job_id uuid,
  p_output jsonb,
  p_tokens_in integer default null,
  p_tokens_out integer default null,
  p_model_used text default null,
  p_duration_ms integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ai_job_results (ai_job_id, output, tokens_in, tokens_out, model_used, duration_ms)
  values (p_job_id, p_output, p_tokens_in, p_tokens_out, p_model_used, p_duration_ms);

  update public.ai_jobs
  set status = 'completed', completed_at = timezone('utc', now())
  where id = p_job_id;
end$$;

revoke execute on function public.complete_ai_job(uuid, jsonb, integer, integer, text, integer) from public;
grant execute on function public.complete_ai_job(uuid, jsonb, integer, integer, text, integer) to authenticated;

-- Helper: fail an AI job with retry logic.
create or replace function public.fail_ai_job(
  p_job_id uuid,
  p_error text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_retry_count smallint;
  v_max_retries smallint;
begin
  select retry_count, max_retries
  into v_retry_count, v_max_retries
  from public.ai_jobs
  where id = p_job_id;

  insert into public.ai_job_results (ai_job_id, error)
  values (p_job_id, p_error);

  if v_retry_count + 1 >= v_max_retries then
    update public.ai_jobs
    set status = 'failed', completed_at = timezone('utc', now()), retry_count = retry_count + 1
    where id = p_job_id;
  else
    update public.ai_jobs
    set status = 'pending',
        scheduled_for = timezone('utc', now()) + interval '15 minutes',
        retry_count = retry_count + 1
    where id = p_job_id;
  end if;
end$$;

revoke execute on function public.fail_ai_job(uuid, text) from public;
grant execute on function public.fail_ai_job(uuid, text) to authenticated;
