-- 0011_marketing_strategy.sql
-- Layer 1 — Strategy & Brand Foundation tables.

create table if not exists public.brand_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  asset_type text not null
    check (asset_type in ('logo', 'palette', 'typography', 'photography', 'template', 'voice_tone', 'other')),
  name text not null,
  file_url text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_brand_assets_workspace_type
  on public.brand_assets(workspace_id, asset_type);

create trigger trg_brand_assets_updated
  before update on public.brand_assets
  for each row execute procedure public.set_updated_at();

create table if not exists public.icp_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  tier text not null
    check (tier in ('tier_1', 'tier_2', 'tier_3', 'tier_4', 'tier_5', 'na_mid_market', 'custom')),
  name text not null,
  description text,
  firmographic_criteria jsonb not null default '{}'::jsonb,
  deal_size_min_usd integer,
  deal_size_max_usd integer,
  sales_motion text,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_icp_profiles_workspace
  on public.icp_profiles(workspace_id, tier);

create trigger trg_icp_profiles_updated
  before update on public.icp_profiles
  for each row execute procedure public.set_updated_at();

create table if not exists public.personas (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  icp_profile_id uuid references public.icp_profiles(id) on delete cascade,
  title text not null,
  role_description text,
  pain_points jsonb not null default '[]'::jsonb,
  hooks jsonb not null default '[]'::jsonb,
  content_recommendations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_personas_workspace_icp
  on public.personas(workspace_id, icp_profile_id);

create trigger trg_personas_updated
  before update on public.personas
  for each row execute procedure public.set_updated_at();

create table if not exists public.competitors (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  website text,
  positioning text,
  pricing_notes text,
  profile jsonb not null default '{}'::jsonb,
  last_scraped_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_competitors_workspace
  on public.competitors(workspace_id, active);

create trigger trg_competitors_updated
  before update on public.competitors
  for each row execute procedure public.set_updated_at();

create table if not exists public.competitor_signals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  signal_type text not null
    check (signal_type in ('pricing_change', 'new_messaging', 'hire', 'product_launch', 'press', 'social', 'other')),
  content text,
  source_url text,
  observed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_competitor_signals_competitor
  on public.competitor_signals(competitor_id, observed_at desc);

-- RLS
alter table public.brand_assets enable row level security;
alter table public.icp_profiles enable row level security;
alter table public.personas enable row level security;
alter table public.competitors enable row level security;
alter table public.competitor_signals enable row level security;

drop policy if exists brand_assets_read on public.brand_assets;
create policy brand_assets_read on public.brand_assets
  for select using (public.txg_can_read(workspace_id));
drop policy if exists brand_assets_write on public.brand_assets;
create policy brand_assets_write on public.brand_assets
  for all using (public.txg_can_write(workspace_id))
  with check (public.txg_can_write(workspace_id));

drop policy if exists icp_profiles_read on public.icp_profiles;
create policy icp_profiles_read on public.icp_profiles
  for select using (public.txg_can_read(workspace_id));
drop policy if exists icp_profiles_write on public.icp_profiles;
create policy icp_profiles_write on public.icp_profiles
  for all using (public.txg_can_write(workspace_id))
  with check (public.txg_can_write(workspace_id));

drop policy if exists personas_read on public.personas;
create policy personas_read on public.personas
  for select using (public.txg_can_read(workspace_id));
drop policy if exists personas_write on public.personas;
create policy personas_write on public.personas
  for all using (public.txg_can_write(workspace_id))
  with check (public.txg_can_write(workspace_id));

drop policy if exists competitors_read on public.competitors;
create policy competitors_read on public.competitors
  for select using (public.txg_can_read(workspace_id));
drop policy if exists competitors_write on public.competitors;
create policy competitors_write on public.competitors
  for all using (public.txg_can_write(workspace_id))
  with check (public.txg_can_write(workspace_id));

drop policy if exists competitor_signals_read on public.competitor_signals;
create policy competitor_signals_read on public.competitor_signals
  for select using (public.txg_can_read(workspace_id));
drop policy if exists competitor_signals_write on public.competitor_signals;
create policy competitor_signals_write on public.competitor_signals
  for all using (public.txg_can_write(workspace_id))
  with check (public.txg_can_write(workspace_id));
