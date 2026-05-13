-- TXG Vector Marketing Platform - All migrations combined
-- Apply this once in Supabase Dashboard - SQL Editor - New query - Run
-- All migrations are idempotent (safe to re-run)

-- ============================================================
-- File: 0010_marketing_ai_jobs.sql
-- ============================================================

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


-- ============================================================
-- File: 0011_marketing_strategy.sql
-- ============================================================

-- 0011_marketing_strategy.sql
-- Layer 1 â€” Strategy & Brand Foundation tables.

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


-- ============================================================
-- File: 0012_marketing_content.sql
-- ============================================================

-- 0012_marketing_content.sql
-- Layer 3 â€” Content Production Engine tables.

create table if not exists public.content_pieces (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  content_type text not null
    check (content_type in (
      'seo_article', 'linkedin_post', 'instagram_reel_script',
      'youtube_script', 'youtube_short_script', 'twitter_thread',
      'newsletter_issue', 'lead_magnet_pdf', 'case_study',
      'whitepaper', 'video_script', 'podcast_outline'
    )),
  status text not null default 'draft'
    check (status in ('draft', 'in_review', 'approved', 'scheduled', 'published', 'archived')),
  pillar text check (pillar in ('education', 'authority', 'pain_solution', 'proof', 'behind_scenes')),
  title text not null,
  slug text,
  body text,
  excerpt text,
  metadata jsonb not null default '{}'::jsonb,
  target_persona_id uuid references public.personas(id) on delete set null,
  target_keyword text,
  secondary_keywords text[],
  seo_title text,
  seo_description text,
  hero_image_url text,
  author_id uuid references public.profiles(id) on delete set null,
  scheduled_at timestamptz,
  published_at timestamptz,
  ai_job_id uuid references public.ai_jobs(id) on delete set null,
  parent_content_id uuid references public.content_pieces(id) on delete set null,
  performance jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_content_pieces_workspace_status
  on public.content_pieces(workspace_id, status, scheduled_at);
create index if not exists idx_content_pieces_workspace_type
  on public.content_pieces(workspace_id, content_type, published_at desc);
create index if not exists idx_content_pieces_parent
  on public.content_pieces(parent_content_id);

create trigger trg_content_pieces_updated
  before update on public.content_pieces
  for each row execute procedure public.set_updated_at();

create table if not exists public.seo_keywords (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  keyword text not null,
  cluster text,
  search_volume integer,
  difficulty smallint,
  target_url text,
  current_rank smallint,
  last_checked_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, keyword)
);

create index if not exists idx_seo_keywords_cluster
  on public.seo_keywords(workspace_id, cluster);

create trigger trg_seo_keywords_updated
  before update on public.seo_keywords
  for each row execute procedure public.set_updated_at();

create table if not exists public.newsletters (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  list_type text not null check (list_type in ('prospect', 'internal', 'partner', 'investor')),
  issue_number integer,
  subject text not null,
  preheader text,
  body text,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipient_count integer,
  open_count integer,
  click_count integer,
  unsubscribe_count integer,
  resend_id text,
  ai_job_id uuid references public.ai_jobs(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_newsletters_workspace
  on public.newsletters(workspace_id, list_type, sent_at desc);

create trigger trg_newsletters_updated
  before update on public.newsletters
  for each row execute procedure public.set_updated_at();

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  list_type text not null check (list_type in ('prospect', 'internal', 'partner', 'investor')),
  email text not null,
  full_name text,
  source text,
  status text not null default 'active'
    check (status in ('active', 'unsubscribed', 'bounced', 'complained')),
  subscribed_at timestamptz not null default timezone('utc', now()),
  unsubscribed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  unique (workspace_id, list_type, email)
);

create index if not exists idx_newsletter_subscribers_workspace_status
  on public.newsletter_subscribers(workspace_id, list_type, status);

create table if not exists public.lead_magnets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  slug text not null,
  description text,
  file_url text,
  hero_image_url text,
  page_count integer,
  download_count integer not null default 0,
  email_required boolean not null default true,
  active boolean not null default true,
  trigger_email_sequence text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, slug)
);

create trigger trg_lead_magnets_updated
  before update on public.lead_magnets
  for each row execute procedure public.set_updated_at();

create table if not exists public.lead_magnet_downloads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_magnet_id uuid not null references public.lead_magnets(id) on delete cascade,
  email text not null,
  full_name text,
  company text,
  source_url text,
  utm_params jsonb,
  ip_address inet,
  user_agent text,
  downloaded_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_lead_magnet_downloads_workspace
  on public.lead_magnet_downloads(workspace_id, downloaded_at desc);
create index if not exists idx_lead_magnet_downloads_email
  on public.lead_magnet_downloads(workspace_id, email);

-- RLS
alter table public.content_pieces enable row level security;
alter table public.seo_keywords enable row level security;
alter table public.newsletters enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.lead_magnets enable row level security;
alter table public.lead_magnet_downloads enable row level security;

drop policy if exists content_pieces_read on public.content_pieces;
create policy content_pieces_read on public.content_pieces for select using (public.txg_can_read(workspace_id));
drop policy if exists content_pieces_write on public.content_pieces;
create policy content_pieces_write on public.content_pieces for all
  using (public.txg_can_write(workspace_id))
  with check (public.txg_can_write(workspace_id));

drop policy if exists seo_keywords_read on public.seo_keywords;
create policy seo_keywords_read on public.seo_keywords for select using (public.txg_can_read(workspace_id));
drop policy if exists seo_keywords_write on public.seo_keywords;
create policy seo_keywords_write on public.seo_keywords for all
  using (public.txg_can_write(workspace_id))
  with check (public.txg_can_write(workspace_id));

drop policy if exists newsletters_read on public.newsletters;
create policy newsletters_read on public.newsletters for select using (public.txg_can_read(workspace_id));
drop policy if exists newsletters_write on public.newsletters;
create policy newsletters_write on public.newsletters for all
  using (public.txg_can_write(workspace_id))
  with check (public.txg_can_write(workspace_id));

drop policy if exists newsletter_subs_read on public.newsletter_subscribers;
create policy newsletter_subs_read on public.newsletter_subscribers for select using (public.txg_can_read(workspace_id));
drop policy if exists newsletter_subs_write on public.newsletter_subscribers;
create policy newsletter_subs_write on public.newsletter_subscribers for all
  using (public.txg_can_write(workspace_id))
  with check (public.txg_can_write(workspace_id));

drop policy if exists lead_magnets_read on public.lead_magnets;
create policy lead_magnets_read on public.lead_magnets for select using (public.txg_can_read(workspace_id));
drop policy if exists lead_magnets_write on public.lead_magnets;
create policy lead_magnets_write on public.lead_magnets for all
  using (public.txg_can_write(workspace_id))
  with check (public.txg_can_write(workspace_id));

drop policy if exists lead_magnet_downloads_read on public.lead_magnet_downloads;
create policy lead_magnet_downloads_read on public.lead_magnet_downloads for select using (public.txg_can_read(workspace_id));
drop policy if exists lead_magnet_downloads_write on public.lead_magnet_downloads;
create policy lead_magnet_downloads_write on public.lead_magnet_downloads for insert with check (public.txg_can_write(workspace_id));


-- ============================================================
-- File: 0013_marketing_social.sql
-- ============================================================

-- 0013_marketing_social.sql
-- Layer 4 â€” Social Media & Distribution tables.

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  platform text not null
    check (platform in (
      'linkedin_company', 'linkedin_personal', 'instagram', 'youtube',
      'youtube_shorts', 'twitter', 'facebook', 'tiktok', 'threads'
    )),
  posted_as text,
  content_piece_id uuid references public.content_pieces(id) on delete set null,
  body text,
  media_urls jsonb not null default '[]'::jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'posted', 'failed', 'cancelled')),
  scheduled_at timestamptz,
  posted_at timestamptz,
  external_post_id text,
  external_post_url text,
  ayrshare_id text,
  performance jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_social_posts_workspace_schedule
  on public.social_posts(workspace_id, status, scheduled_at);
create index if not exists idx_social_posts_workspace_platform
  on public.social_posts(workspace_id, platform, posted_at desc);

create trigger trg_social_posts_updated
  before update on public.social_posts
  for each row execute procedure public.set_updated_at();

create table if not exists public.community_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel text not null
    check (channel in ('whatsapp', 'telegram', 'linkedin_group', 'discord', 'slack', 'other')),
  external_id text,
  display_name text,
  email text,
  whatsapp_number text,
  source text,
  joined_at timestamptz not null default timezone('utc', now()),
  engagement_score smallint default 0,
  last_active_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'inactive', 'removed', 'banned')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_community_members_workspace_channel
  on public.community_members(workspace_id, channel, status);

create trigger trg_community_members_updated
  before update on public.community_members
  for each row execute procedure public.set_updated_at();

create table if not exists public.social_mentions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_platform text not null,
  mention_text text not null,
  source_url text,
  author_handle text,
  sentiment text check (sentiment in ('positive', 'neutral', 'negative', 'mixed', 'unknown')),
  intent_signal text,
  related_competitor_id uuid references public.competitors(id) on delete set null,
  related_lead_id uuid,
  observed_at timestamptz not null default timezone('utc', now()),
  reviewed boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_social_mentions_workspace_observed
  on public.social_mentions(workspace_id, observed_at desc);

create table if not exists public.engagement_targets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  for_user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null,
  target_url text not null,
  target_author text,
  draft_comment text,
  status text not null default 'queued'
    check (status in ('queued', 'engaged', 'skipped', 'expired')),
  generated_for_date date not null default current_date,
  engaged_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_engagement_targets_user_date
  on public.engagement_targets(for_user_id, generated_for_date, status);

-- RLS
alter table public.social_posts enable row level security;
alter table public.community_members enable row level security;
alter table public.social_mentions enable row level security;
alter table public.engagement_targets enable row level security;

drop policy if exists social_posts_read on public.social_posts;
create policy social_posts_read on public.social_posts for select using (public.txg_can_read(workspace_id));
drop policy if exists social_posts_write on public.social_posts;
create policy social_posts_write on public.social_posts for all
  using (public.txg_can_write(workspace_id))
  with check (public.txg_can_write(workspace_id));

drop policy if exists community_members_read on public.community_members;
create policy community_members_read on public.community_members for select using (public.txg_can_read(workspace_id));
drop policy if exists community_members_write on public.community_members;
create policy community_members_write on public.community_members for all
  using (public.txg_can_write(workspace_id))
  with check (public.txg_can_write(workspace_id));

drop policy if exists social_mentions_read on public.social_mentions;
create policy social_mentions_read on public.social_mentions for select using (public.txg_can_read(workspace_id));
drop policy if exists social_mentions_write on public.social_mentions;
create policy social_mentions_write on public.social_mentions for all
  using (public.txg_can_write(workspace_id))
  with check (public.txg_can_write(workspace_id));

drop policy if exists engagement_targets_read on public.engagement_targets;
create policy engagement_targets_read on public.engagement_targets
  for select using (public.txg_can_read(workspace_id) or for_user_id = auth.uid());
drop policy if exists engagement_targets_write on public.engagement_targets;
create policy engagement_targets_write on public.engagement_targets for all
  using (public.txg_can_write(workspace_id))
  with check (public.txg_can_write(workspace_id));


-- ============================================================
-- File: 0014_marketing_leads_outreach.sql
-- ============================================================

-- 0014_marketing_leads_outreach.sql
-- Layer 5 â€” Outbound Engine tables. Leads table is new; customers remains for closed/active.

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


-- ============================================================
-- File: 0015_marketing_partnerships_pr_events.sql
-- ============================================================

-- 0015_marketing_partnerships_pr_events.sql
-- Layers 7 and 8 â€” Partnerships/PR + Events/Community/Influencers.

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


-- ============================================================
-- File: 0016_marketing_sales_enablement.sql
-- ============================================================

-- 0016_marketing_sales_enablement.sql
-- Layer 9 â€” Sales Enablement.

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


-- ============================================================
-- File: 0017_marketing_ops_analytics.sql
-- ============================================================

-- 0017_marketing_ops_analytics.sql
-- Layer 10 â€” Marketing Ops, Analytics, Intelligence.

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


-- ============================================================
-- File: 0018_marketing_role_extension.sql
-- ============================================================

-- 0018_marketing_role_extension.sql
-- Extend role enum on workspace_members and activities.kind. Link customers to leads.

-- Drop the existing auto-generated role check on workspace_members.
alter table public.workspace_members
  drop constraint if exists workspace_members_role_check;

alter table public.workspace_members
  add constraint workspace_members_role_check check (role in (
    'admin', 'ops_lead', 'ops_rep', 'warehouse_lead', 'warehouse_staff',
    'driver', 'sales', 'customer_contact',
    -- New marketing roles:
    'owner', 'public_face', 'ae', 'sdr', 'marketing_admin'
  ));

-- Link customers to their originating lead (if any).
alter table public.customers
  add column if not exists lead_origin_id uuid references public.leads(id) on delete set null,
  add column if not exists acquisition_source text,
  add column if not exists acquisition_campaign text;

create index if not exists idx_customers_workspace_acquisition
  on public.customers(workspace_id, acquisition_source);

-- Extend activities.kind to include marketing-relevant activities.
alter table public.activities
  drop constraint if exists activities_kind_check;

alter table public.activities
  add constraint activities_kind_check check (kind in (
    'call', 'email', 'note', 'meeting',
    -- New marketing kinds:
    'outreach_sent', 'outreach_replied', 'linkedin_engagement',
    'content_engagement', 'tool_use', 'event_capture'
  ));


-- ============================================================
-- File: 0019_marketing_helpers.sql
-- ============================================================

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


-- ============================================================
-- File: 0020_marketing_strategy_seed.sql
-- ============================================================

-- 0020_marketing_strategy_seed.sql
-- Seed Layer 1 strategy data: ICPs, personas, competitors. Idempotent.

do $$
declare
  v_workspace_id uuid;
begin
  for v_workspace_id in select id from public.workspaces loop

    -- Tier 1
    insert into public.icp_profiles (workspace_id, tier, name, description, firmographic_criteria, deal_size_min_usd, deal_size_max_usd, sales_motion)
    select v_workspace_id, 'tier_1', 'Premium Indian D2C',
      'VC-backed Indian D2C brands with $1M+ GMV, proven international demand, Series A or later.',
      jsonb_build_object(
        'revenue_min_usd', 1000000,
        'funding', array['series_a', 'series_b', 'series_c', 'growth'],
        'verticals', array['fashion', 'beauty', 'wellness', 'home', 'electronics', 'food'],
        'signals', array['active_us_canada_orders', 'hiring_intl_ops', 'us_canada_retargeting']
      ),
      200000, 2000000, 'abm_executive'
    where not exists (
      select 1 from public.icp_profiles
      where workspace_id = v_workspace_id and tier = 'tier_1'
    );

    -- Tier 2
    insert into public.icp_profiles (workspace_id, tier, name, description, firmographic_criteria, deal_size_min_usd, deal_size_max_usd, sales_motion)
    select v_workspace_id, 'tier_2', 'Growth-Stage Indian D2C',
      'Bootstrap or seed-stage Indian D2C, $200K-$1M GMV, testing US/Canada market.',
      jsonb_build_object(
        'revenue_min_usd', 200000,
        'revenue_max_usd', 1000000,
        'funding', array['bootstrap', 'seed'],
        'verticals', array['fashion', 'beauty', 'wellness', 'home', 'electronics', 'food'],
        'signals', array['occasional_intl_orders', 'founder_led_ops']
      ),
      30000, 200000, 'outbound_sdr_ae'
    where not exists (
      select 1 from public.icp_profiles
      where workspace_id = v_workspace_id and tier = 'tier_2'
    );

    -- Tier 3
    insert into public.icp_profiles (workspace_id, tier, name, description, firmographic_criteria, deal_size_min_usd, deal_size_max_usd, sales_motion)
    select v_workspace_id, 'tier_3', 'Indian Conglomerates',
      'Heritage Indian companies with export divisions, $5M+ in cross-border revenue.',
      jsonb_build_object(
        'revenue_min_usd', 5000000,
        'verticals', array['multi_vertical'],
        'signals', array['established_brand', 'export_division']
      ),
      2000000, null, 'partner_led_csuite'
    where not exists (
      select 1 from public.icp_profiles
      where workspace_id = v_workspace_id and tier = 'tier_3'
    );

    -- Tier 4
    insert into public.icp_profiles (workspace_id, tier, name, description, firmographic_criteria, deal_size_min_usd, deal_size_max_usd, sales_motion)
    select v_workspace_id, 'tier_4', 'Indian Diaspora Brands',
      'Founded in Canada/US by Indian founders, supply chain in India.',
      jsonb_build_object(
        'revenue_min_usd', 50000,
        'revenue_max_usd', 500000,
        'signals', array['na_founded', 'india_supply_chain']
      ),
      50000, 500000, 'community_referral'
    where not exists (
      select 1 from public.icp_profiles
      where workspace_id = v_workspace_id and tier = 'tier_4'
    );

    -- Tier 5
    insert into public.icp_profiles (workspace_id, tier, name, description, firmographic_criteria, deal_size_min_usd, deal_size_max_usd, sales_motion)
    select v_workspace_id, 'tier_5', 'Bootstrap Exporters',
      'Below $200K GMV, mostly Etsy/Amazon sellers expanding internationally.',
      jsonb_build_object(
        'revenue_max_usd', 200000,
        'signals', array['etsy_seller', 'amazon_seller', 'side_hustle']
      ),
      5000, 30000, 'self_serve_inbound'
    where not exists (
      select 1 from public.icp_profiles
      where workspace_id = v_workspace_id and tier = 'tier_5'
    );

    -- NA Mid-Market
    insert into public.icp_profiles (workspace_id, tier, name, description, firmographic_criteria, deal_size_min_usd, deal_size_max_usd, sales_motion)
    select v_workspace_id, 'na_mid_market', 'NA Mid-Market E-Commerce',
      'Mid-market e-commerce brands ($5M-$100M GMV) needing 4PL with cross-border complexity.',
      jsonb_build_object(
        'revenue_min_usd', 5000000,
        'revenue_max_usd', 100000000,
        'geography', array['us', 'canada']
      ),
      500000, 5000000, 'inbound_abm'
    where not exists (
      select 1 from public.icp_profiles
      where workspace_id = v_workspace_id and tier = 'na_mid_market'
    );

    -- Personas for Tier 1
    insert into public.personas (workspace_id, icp_profile_id, title, role_description, pain_points, hooks, content_recommendations)
    select v_workspace_id, ip.id, 'Founder/CEO',
      'Decision maker on strategic expansion',
      jsonb_build_array('Growth ceiling', 'Risk of NA expansion', 'Operational distraction'),
      jsonb_build_array('Unlock the US market without operational overhead', 'Asset-based 4PL â€” incumbent positioning'),
      jsonb_build_array('founder_thought_leadership', 'strategy_pov', 'case_studies')
    from public.icp_profiles ip
    where ip.workspace_id = v_workspace_id and ip.tier = 'tier_1'
      and not exists (select 1 from public.personas p where p.icp_profile_id = ip.id and p.title = 'Founder/CEO');

    insert into public.personas (workspace_id, icp_profile_id, title, role_description, pain_points, hooks, content_recommendations)
    select v_workspace_id, ip.id, 'COO/VP Ops',
      'Operations leader concerned with reliability and integration',
      jsonb_build_array('Operational reliability', 'SLAs and uptime', 'Integration complexity'),
      jsonb_build_array('Day-of integration, not multi-quarter migration', 'Vector platform â€” full visibility'),
      jsonb_build_array('process_documentation', 'sla_proof', 'integration_guides')
    from public.icp_profiles ip
    where ip.workspace_id = v_workspace_id and ip.tier = 'tier_1'
      and not exists (select 1 from public.personas p where p.icp_profile_id = ip.id and p.title = 'COO/VP Ops');

    insert into public.personas (workspace_id, icp_profile_id, title, role_description, pain_points, hooks, content_recommendations)
    select v_workspace_id, ip.id, 'CFO/Finance Head',
      'Financial decision-maker focused on TCO and unit economics',
      jsonb_build_array('TCO unclear', 'Forex exposure', 'Capital commitment risk'),
      jsonb_build_array('50% cost reduction with predictable per-order pricing'),
      jsonb_build_array('roi_calculator', 'financial_modeling', 'tco_analysis')
    from public.icp_profiles ip
    where ip.workspace_id = v_workspace_id and ip.tier = 'tier_1'
      and not exists (select 1 from public.personas p where p.icp_profile_id = ip.id and p.title = 'CFO/Finance Head');

    insert into public.personas (workspace_id, icp_profile_id, title, role_description, pain_points, hooks, content_recommendations)
    select v_workspace_id, ip.id, 'Supply Chain Head',
      'Technical evaluator of integration and capability',
      jsonb_build_array('API integration', 'WMS compatibility', 'Technical capability'),
      jsonb_build_array('Vector platform â€” Shopify-native, REST API, full observability'),
      jsonb_build_array('technical_docs', 'integration_guides', 'api_reference')
    from public.icp_profiles ip
    where ip.workspace_id = v_workspace_id and ip.tier = 'tier_1'
      and not exists (select 1 from public.personas p where p.icp_profile_id = ip.id and p.title = 'Supply Chain Head');

    insert into public.personas (workspace_id, icp_profile_id, title, role_description, pain_points, hooks, content_recommendations)
    select v_workspace_id, ip.id, 'E-commerce Manager',
      'Owner of customer experience and order operations',
      jsonb_build_array('Order turnaround', 'Returns experience', 'Branded tracking'),
      jsonb_build_array('7-12 day delivery, returns handled, branded tracking'),
      jsonb_build_array('cx_case_studies', 'returns_proof')
    from public.icp_profiles ip
    where ip.workspace_id = v_workspace_id and ip.tier = 'tier_1'
      and not exists (select 1 from public.personas p where p.icp_profile_id = ip.id and p.title = 'E-commerce Manager');

    -- Competitors
    insert into public.competitors (workspace_id, name, website, positioning, profile)
    select v_workspace_id, c.name, c.website, c.positioning, c.profile
    from (values
      ('ShipGlobal', 'https://shipglobal.in', 'India to NA cross-border shipping aggregator. Software-led, no first-party warehousing.',
        '{"asset_based": false, "founded": 2019, "main_lanes": ["india_us", "india_uk"], "weakness": "no_na_warehousing"}'::jsonb),
      ('QuickShip', 'https://quickship.in', 'Indian D2C cross-border with multi-carrier aggregation.',
        '{"asset_based": false, "founded": 2018, "main_lanes": ["india_intl"], "weakness": "no_first_party_assets"}'::jsonb),
      ('Shypmax', 'https://shypmax.com', 'Cross-border parcel delivery for Indian sellers.',
        '{"asset_based": false, "founded": 2018, "weakness": "freight_forwarder_only"}'::jsonb),
      ('Shiprocket X', 'https://shiprocket.in/cross-border', 'Cross-border arm of Shiprocket, India e-commerce shipping platform.',
        '{"asset_based": false, "parent": "shiprocket", "weakness": "platform_play_not_4pl"}'::jsonb),
      ('ShipBob', 'https://shipbob.com', 'NA-focused 3PL with international fulfillment network. Strong in US.',
        '{"asset_based": true, "founded": 2014, "weakness": "no_india_origin_specialty"}'::jsonb),
      ('DHL eCommerce', 'https://dhl.com/global-en/home/ecommerce.html', 'Enterprise carrier, transactional cross-border product.',
        '{"asset_based": true, "incumbent": true, "weakness": "no_4pl_integration_for_d2c"}'::jsonb)
    ) as c(name, website, positioning, profile)
    where not exists (
      select 1 from public.competitors c2
      where c2.workspace_id = v_workspace_id and c2.name = c.name
    );

  end loop;
end$$;


