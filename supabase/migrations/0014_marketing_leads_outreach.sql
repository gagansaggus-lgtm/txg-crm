-- 0014_marketing_leads_outreach.sql
-- Layer 5 — Outbound Engine tables. Leads table is new; customers remains for closed/active.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source text not null
    check (source in ('storeleads', 'manual', 'website_form', 'lead_magnet', 'calculator', 'quiz', 'referral', 'partner', 'event', 'inbound_dm', 'cold_research', 'other')),
  source_external_id text,
  legal_name text,
  display_name text,
  website text,
  vertical text,
  country text,
  city text,
  estimated_gmv_usd integer,
  funding_stage text,
  validation_stage text not null default 'raw'
    check (validation_stage in ('raw', 'pre_filtered', 'web_verified', 'signal_checked', 'icp_scored', 'contact_verified', 'rejected')),
  rejection_reason text,
  icp_profile_id uuid references public.icp_profiles(id) on delete set null,
  icp_score smallint,
  icp_grade text check (icp_grade in ('A', 'B', 'C', 'D', 'F')),
  enrichment_data jsonb not null default '{}'::jsonb,
  intent_signals jsonb not null default '[]'::jsonb,
  status text not null default 'new'
    check (status in ('new', 'researching', 'contacted', 'replied', 'call_booked', 'qualified', 'proposal', 'closed_won', 'closed_lost', 'nurture', 'do_not_contact')),
  customer_id uuid references public.customers(id) on delete set null,
  last_enriched_at timestamptz,
  last_contacted_at timestamptz,
  next_action_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_leads_workspace_validation
  on public.leads(workspace_id, validation_stage, icp_score desc);
create index if not exists idx_leads_workspace_status
  on public.leads(workspace_id, status, last_contacted_at desc nulls first);
create index if not exists idx_leads_workspace_grade
  on public.leads(workspace_id, icp_grade, status);
create unique index if not exists idx_leads_workspace_source_external
  on public.leads(workspace_id, source, source_external_id)
  where source_external_id is not null;
create index if not exists idx_leads_website on public.leads(workspace_id, website);

create trigger trg_leads_updated
  before update on public.leads
  for each row execute procedure public.set_updated_at();

create table if not exists public.lead_contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  full_name text,
  role_title text,
  persona_id uuid references public.personas(id) on delete set null,
  email text,
  email_status text default 'unverified'
    check (email_status in ('unverified', 'verified', 'invalid', 'risky', 'bounced')),
  linkedin_url text,
  whatsapp_number text,
  phone text,
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_lead_contacts_lead
  on public.lead_contacts(lead_id);
create index if not exists idx_lead_contacts_workspace_email
  on public.lead_contacts(workspace_id, email);

create trigger trg_lead_contacts_updated
  before update on public.lead_contacts
  for each row execute procedure public.set_updated_at();

create table if not exists public.outreach_sequences (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  channels text[] not null default '{}',
  steps jsonb not null default '[]'::jsonb,
  variant_group text,
  active boolean not null default true,
  for_icp_tier text,
  for_persona_id uuid references public.personas(id) on delete set null,
  performance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_outreach_sequences_workspace
  on public.outreach_sequences(workspace_id, active);

create trigger trg_outreach_sequences_updated
  before update on public.outreach_sequences
  for each row execute procedure public.set_updated_at();

create table if not exists public.outreach_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  sequence_id uuid references public.outreach_sequences(id) on delete set null,
  lead_id uuid not null references public.leads(id) on delete cascade,
  lead_contact_id uuid references public.lead_contacts(id) on delete set null,
  step_number smallint,
  channel text not null
    check (channel in ('email', 'linkedin_dm', 'linkedin_connection', 'whatsapp', 'voice_note', 'phone_call', 'sms', 'in_person')),
  subject text,
  body text not null,
  personalization_metadata jsonb not null default '{}'::jsonb,
  ai_job_id uuid references public.ai_jobs(id) on delete set null,
  status text not null default 'drafted'
    check (status in ('drafted', 'queued', 'sent', 'delivered', 'opened', 'replied', 'bounced', 'cancelled', 'failed')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  opened_at timestamptz,
  replied_at timestamptz,
  reply_body text,
  reply_sentiment text,
  external_message_id text,
  resend_id text,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_outreach_messages_workspace_status
  on public.outreach_messages(workspace_id, status, scheduled_at);
create index if not exists idx_outreach_messages_lead
  on public.outreach_messages(lead_id, sent_at desc);
create index if not exists idx_outreach_messages_assigned
  on public.outreach_messages(assigned_to, status, scheduled_at);

create trigger trg_outreach_messages_updated
  before update on public.outreach_messages
  for each row execute procedure public.set_updated_at();

create table if not exists public.sdr_assignments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  sdr_id uuid not null references public.profiles(id) on delete cascade,
  ae_id uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default timezone('utc', now()),
  transferred_at timestamptz,
  transferred_to uuid references public.profiles(id) on delete set null,
  transfer_reason text,
  active boolean not null default true
);

-- Partial unique index ensures only one active assignment per lead.
create unique index if not exists idx_sdr_assignments_one_active_per_lead
  on public.sdr_assignments(lead_id) where active = true;
create index if not exists idx_sdr_assignments_workspace_sdr
  on public.sdr_assignments(workspace_id, sdr_id, active);

create table if not exists public.abm_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  tier_priority smallint not null default 1,
  account_intel jsonb not null default '{}'::jsonb,
  stakeholders jsonb not null default '[]'::jsonb,
  one_pager_url text,
  one_pager_generated_at timestamptz,
  account_owner_id uuid references public.profiles(id) on delete set null,
  status text not null default 'cold'
    check (status in ('cold', 'aware', 'engaged', 'active', 'opportunity', 'closed_won', 'closed_lost', 'paused')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, lead_id)
);

create index if not exists idx_abm_accounts_workspace_status
  on public.abm_accounts(workspace_id, status, tier_priority);

create trigger trg_abm_accounts_updated
  before update on public.abm_accounts
  for each row execute procedure public.set_updated_at();

create table if not exists public.account_intelligence_signals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  abm_account_id uuid not null references public.abm_accounts(id) on delete cascade,
  signal_type text not null
    check (signal_type in ('linkedin_post', 'news_mention', 'hiring', 'funding', 'product_launch', 'website_change', 'social_engagement', 'press', 'other')),
  source_url text,
  signal_data jsonb not null default '{}'::jsonb,
  observed_at timestamptz not null default timezone('utc', now()),
  reviewed boolean not null default false
);

create index if not exists idx_account_intel_signals_account
  on public.account_intelligence_signals(abm_account_id, observed_at desc);

-- RLS
alter table public.leads enable row level security;
alter table public.lead_contacts enable row level security;
alter table public.outreach_sequences enable row level security;
alter table public.outreach_messages enable row level security;
alter table public.sdr_assignments enable row level security;
alter table public.abm_accounts enable row level security;
alter table public.account_intelligence_signals enable row level security;

drop policy if exists leads_read on public.leads;
create policy leads_read on public.leads for select using (public.txg_can_read(workspace_id));
drop policy if exists leads_write on public.leads;
create policy leads_write on public.leads for all
  using (public.txg_can_write(workspace_id))
  with check (public.txg_can_write(workspace_id));

drop policy if exists lead_contacts_read on public.lead_contacts;
create policy lead_contacts_read on public.lead_contacts for select using (public.txg_can_read(workspace_id));
drop policy if exists lead_contacts_write on public.lead_contacts;
create policy lead_contacts_write on public.lead_contacts for all
  using (public.txg_can_write(workspace_id))
  with check (public.txg_can_write(workspace_id));

drop policy if exists outreach_sequences_read on public.outreach_sequences;
create policy outreach_sequences_read on public.outreach_sequences for select using (public.txg_can_read(workspace_id));
drop policy if exists outreach_sequences_write on public.outreach_sequences;
create policy outreach_sequences_write on public.outreach_sequences for all
  using (public.txg_can_write(workspace_id))
  with check (public.txg_can_write(workspace_id));

drop policy if exists outreach_messages_read on public.outreach_messages;
create policy outreach_messages_read on public.outreach_messages for select using (public.txg_can_read(workspace_id));
drop policy if exists outreach_messages_write on public.outreach_messages;
create policy outreach_messages_write on public.outreach_messages for all
  using (public.txg_can_write(workspace_id))
  with check (public.txg_can_write(workspace_id));

drop policy if exists sdr_assignments_read on public.sdr_assignments;
create policy sdr_assignments_read on public.sdr_assignments for select using (public.txg_can_read(workspace_id));
drop policy if exists sdr_assignments_write on public.sdr_assignments;
create policy sdr_assignments_write on public.sdr_assignments for all
  using (public.txg_can_write(workspace_id))
  with check (public.txg_can_write(workspace_id));

drop policy if exists abm_accounts_read on public.abm_accounts;
create policy abm_accounts_read on public.abm_accounts for select using (public.txg_can_read(workspace_id));
drop policy if exists abm_accounts_write on public.abm_accounts;
create policy abm_accounts_write on public.abm_accounts for all
  using (public.txg_can_write(workspace_id))
  with check (public.txg_can_write(workspace_id));

drop policy if exists account_intel_read on public.account_intelligence_signals;
create policy account_intel_read on public.account_intelligence_signals for select using (public.txg_can_read(workspace_id));
drop policy if exists account_intel_write on public.account_intelligence_signals;
create policy account_intel_write on public.account_intelligence_signals for all
  using (public.txg_can_write(workspace_id))
  with check (public.txg_can_write(workspace_id));
