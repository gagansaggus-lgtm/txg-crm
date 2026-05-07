-- 0016_marketing_sales_enablement.sql
-- Layer 9 — Sales Enablement.

create table if not exists public.sales_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  asset_type text not null
    check (asset_type in (
      'pitch_deck', 'case_study_one_pager', 'integration_doc',
      'compliance_doc', 'sla_doc', 'roi_calculator_internal',
      'objection_handling', 'discovery_script', 'demo_recording', 'other'
    )),
  name text not null,
  description text,
  file_url text,
  version text not null default '1.0',
  for_icp_tier text,
  for_persona_id uuid references public.personas(id) on delete set null,
  for_service text,
  for_geography text,
  active boolean not null default true,
  last_updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_sales_assets_workspace_type
  on public.sales_assets(workspace_id, asset_type, active);

create trigger trg_sales_assets_updated
  before update on public.sales_assets
  for each row execute procedure public.set_updated_at();

create table if not exists public.battle_cards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  positioning text,
  key_objections jsonb not null default '[]'::jsonb,
  comparative_pricing jsonb not null default '{}'::jsonb,
  win_themes jsonb not null default '[]'::jsonb,
  loss_themes jsonb not null default '[]'::jsonb,
  ai_job_id uuid references public.ai_jobs(id) on delete set null,
  last_refreshed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, competitor_id)
);

create trigger trg_battle_cards_updated
  before update on public.battle_cards
  for each row execute procedure public.set_updated_at();

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  service_tier text,
  projected_monthly_volume integer,
  total_value_usd integer,
  body text,
  pdf_url text,
  status text not null default 'draft'
    check (status in ('draft', 'review', 'sent', 'viewed', 'accepted', 'declined', 'expired')),
  sent_at timestamptz,
  viewed_at timestamptz,
  decided_at timestamptz,
  ai_job_id uuid references public.ai_jobs(id) on delete set null,
  prepared_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (lead_id is not null or customer_id is not null)
);

create index if not exists idx_proposals_workspace_status
  on public.proposals(workspace_id, status, sent_at desc);
create index if not exists idx_proposals_lead
  on public.proposals(lead_id);

create trigger trg_proposals_updated
  before update on public.proposals
  for each row execute procedure public.set_updated_at();

-- RLS
alter table public.sales_assets enable row level security;
alter table public.battle_cards enable row level security;
alter table public.proposals enable row level security;

do $$
declare t text;
begin
  for t in select unnest(array['sales_assets','battle_cards','proposals'])
  loop
    execute format('drop policy if exists %I_read on public.%I;', t, t);
    execute format('create policy %I_read on public.%I for select using (public.txg_can_read(workspace_id));', t, t);
    execute format('drop policy if exists %I_write on public.%I;', t, t);
    execute format('create policy %I_write on public.%I for all using (public.txg_can_write(workspace_id)) with check (public.txg_can_write(workspace_id));', t, t);
  end loop;
end$$;
