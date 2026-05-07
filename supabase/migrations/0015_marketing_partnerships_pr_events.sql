-- 0015_marketing_partnerships_pr_events.sql
-- Layers 7 and 8 — Partnerships/PR + Events/Community/Influencers.

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  partner_type text not null check (partner_type in ('strategic', 'channel', 'tech', 'reseller', 'other')),
  website text,
  primary_contact_name text,
  primary_contact_email text,
  primary_contact_phone text,
  agreement_status text default 'prospect'
    check (agreement_status in ('prospect', 'negotiating', 'signed', 'active', 'paused', 'terminated')),
  agreement_url text,
  agreement_signed_at date,
  referral_pipeline_value_usd integer default 0,
  referrals_received integer not null default 0,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_partners_workspace_type_status
  on public.partners(workspace_id, partner_type, agreement_status);

create trigger trg_partners_updated
  before update on public.partners
  for each row execute procedure public.set_updated_at();

create table if not exists public.partner_activities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  activity_type text not null
    check (activity_type in ('outreach', 'meeting', 'agreement_step', 'co_marketing', 'referral', 'qbr', 'other')),
  occurred_at timestamptz not null default timezone('utc', now()),
  notes text,
  related_lead_id uuid references public.leads(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_partner_activities_partner
  on public.partner_activities(partner_id, occurred_at desc);

create table if not exists public.pr_contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  full_name text not null,
  publication text,
  role_title text,
  beat text,
  email text,
  twitter_handle text,
  linkedin_url text,
  preferred_contact text,
  pitch_history jsonb not null default '[]'::jsonb,
  last_pitched_at timestamptz,
  responded_count smallint not null default 0,
  published_count smallint not null default 0,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_pr_contacts_workspace_publication
  on public.pr_contacts(workspace_id, publication);

create trigger trg_pr_contacts_updated
  before update on public.pr_contacts
  for each row execute procedure public.set_updated_at();

create table if not exists public.press_pieces (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  status text not null default 'draft'
    check (status in ('draft', 'pitched', 'in_progress', 'published', 'declined', 'killed')),
  publication text,
  published_url text,
  published_at date,
  pitched_to uuid[] default '{}',
  pitch_body text,
  ai_job_id uuid references public.ai_jobs(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_press_pieces_updated
  before update on public.press_pieces
  for each row execute procedure public.set_updated_at();

create table if not exists public.speaking_engagements (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  event_name text not null,
  event_date date,
  event_location text,
  event_type text check (event_type in ('conference', 'panel', 'podcast', 'webinar', 'fireside', 'workshop', 'other')),
  speaker_id uuid references public.profiles(id) on delete set null,
  proposal_status text default 'idea'
    check (proposal_status in ('idea', 'submitted', 'accepted', 'declined', 'completed', 'cancelled')),
  proposal_url text,
  recording_url text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_speaking_engagements_updated
  before update on public.speaking_engagements
  for each row execute procedure public.set_updated_at();

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  event_type text not null check (event_type in ('trade_show', 'webinar', 'meetup', 'private_event', 'conference', 'other')),
  start_date date,
  end_date date,
  location text,
  status text not null default 'planned'
    check (status in ('planned', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  prep_checklist jsonb not null default '[]'::jsonb,
  lead_capture_method text,
  cost_usd integer,
  attended_by uuid[] default '{}',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_events_updated
  before update on public.events
  for each row execute procedure public.set_updated_at();

create table if not exists public.event_leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  source_within_event text,
  captured_by uuid references public.profiles(id) on delete set null,
  captured_at timestamptz not null default timezone('utc', now()),
  unique (event_id, lead_id)
);

create index if not exists idx_event_leads_event on public.event_leads(event_id);

create table if not exists public.influencers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  primary_platform text,
  follower_count integer,
  niche text,
  contact_email text,
  contact_phone text,
  social_handles jsonb not null default '{}'::jsonb,
  collaboration_history jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_influencers_updated
  before update on public.influencers
  for each row execute procedure public.set_updated_at();

create table if not exists public.influencer_outreach (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  influencer_id uuid not null references public.influencers(id) on delete cascade,
  outreach_status text not null default 'pending'
    check (outreach_status in ('pending', 'contacted', 'discussing', 'collaborating', 'completed', 'declined', 'paused')),
  last_contacted_at timestamptz,
  next_step text,
  collaboration_value_usd integer,
  ai_job_id uuid references public.ai_jobs(id) on delete set null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_influencer_outreach_updated
  before update on public.influencer_outreach
  for each row execute procedure public.set_updated_at();

-- RLS for all tables in this migration
alter table public.partners enable row level security;
alter table public.partner_activities enable row level security;
alter table public.pr_contacts enable row level security;
alter table public.press_pieces enable row level security;
alter table public.speaking_engagements enable row level security;
alter table public.events enable row level security;
alter table public.event_leads enable row level security;
alter table public.influencers enable row level security;
alter table public.influencer_outreach enable row level security;

do $$
declare t text;
begin
  for t in
    select unnest(array[
      'partners','partner_activities','pr_contacts','press_pieces',
      'speaking_engagements','events','event_leads',
      'influencers','influencer_outreach'
    ])
  loop
    execute format('drop policy if exists %I_read on public.%I;', t, t);
    execute format('create policy %I_read on public.%I for select using (public.txg_can_read(workspace_id));', t, t);
    execute format('drop policy if exists %I_write on public.%I;', t, t);
    execute format('create policy %I_write on public.%I for all using (public.txg_can_write(workspace_id)) with check (public.txg_can_write(workspace_id));', t, t);
  end loop;
end$$;
