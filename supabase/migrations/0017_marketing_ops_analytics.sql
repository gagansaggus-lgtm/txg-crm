-- 0017_marketing_ops_analytics.sql
-- Layer 10 — Marketing Ops, Analytics, Intelligence.

create table if not exists public.attribution_touches (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  touch_type text not null
    check (touch_type in (
      'website_visit', 'page_view', 'form_submit', 'tool_use',
      'lead_magnet_download', 'newsletter_signup', 'email_open',
      'email_click', 'social_engagement', 'outreach_sent', 'outreach_replied',
      'call_booked', 'call_attended', 'demo_completed', 'proposal_viewed', 'other'
    )),
  channel text,
  campaign text,
  source text,
  medium text,
  content_piece_id uuid references public.content_pieces(id) on delete set null,
  outreach_message_id uuid references public.outreach_messages(id) on delete set null,
  url text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  check (lead_id is not null or customer_id is not null)
);

create index if not exists idx_attribution_touches_lead
  on public.attribution_touches(lead_id, occurred_at desc);
create index if not exists idx_attribution_touches_customer
  on public.attribution_touches(customer_id, occurred_at desc);
create index if not exists idx_attribution_touches_workspace_channel
  on public.attribution_touches(workspace_id, channel, occurred_at desc);

create table if not exists public.kpi_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  metric_name text not null,
  metric_value numeric(20,4) not null,
  metric_unit text,
  source_module text,
  role_visibility text[] not null default '{}',
  snapshot_date date not null default current_date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_kpi_snapshots_workspace_metric_date
  on public.kpi_snapshots(workspace_id, metric_name, snapshot_date desc);

create table if not exists public.marketing_sales_sla (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  mqls_committed integer,
  mqls_delivered integer,
  sla_response_time_target_hours integer not null default 4,
  sla_response_time_avg_hours numeric(10,2),
  sla_response_time_breach_count integer not null default 0,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, period_start, period_end)
);

create trigger trg_marketing_sales_sla_updated
  before update on public.marketing_sales_sla
  for each row execute procedure public.set_updated_at();

create table if not exists public.tool_uses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  tool_slug text not null
    check (tool_slug in ('shipping_calculator', 'roi_calculator', 'readiness_quiz')),
  inputs jsonb not null default '{}'::jsonb,
  outputs jsonb not null default '{}'::jsonb,
  email text,
  full_name text,
  company text,
  resulting_lead_id uuid references public.leads(id) on delete set null,
  utm_params jsonb,
  user_agent text,
  ip_address inet,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_tool_uses_workspace_tool
  on public.tool_uses(workspace_id, tool_slug, created_at desc);
create index if not exists idx_tool_uses_email
  on public.tool_uses(workspace_id, email);

-- RLS
alter table public.attribution_touches enable row level security;
alter table public.kpi_snapshots enable row level security;
alter table public.marketing_sales_sla enable row level security;
alter table public.tool_uses enable row level security;

do $$
declare t text;
begin
  for t in select unnest(array['attribution_touches','kpi_snapshots','marketing_sales_sla','tool_uses'])
  loop
    execute format('drop policy if exists %I_read on public.%I;', t, t);
    execute format('create policy %I_read on public.%I for select using (public.txg_can_read(workspace_id));', t, t);
    execute format('drop policy if exists %I_write on public.%I;', t, t);
    execute format('create policy %I_write on public.%I for all using (public.txg_can_write(workspace_id)) with check (public.txg_can_write(workspace_id));', t, t);
  end loop;
end$$;
