# Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the database schema, AI job queue, Claude Code agent runtime, and Vector UI shell required by every subsequent marketing module plan.

**Architecture:** Three-layer system — Next.js (TXG Vector UI) reads/writes Supabase (single source of truth) and enqueues AI work into the `ai_jobs` queue; Claude Code runs as a scheduled agent (via Windows Task Scheduler), authenticated through the user's Max plan, polling the queue and writing results back. No external AI API keys.

**Tech Stack:** Next.js 16.2.1 App Router, React 19, Supabase Postgres + RLS, Anthropic SDK 0.90 (already installed), Tailwind v4, shadcn/ui, base-ui, Claude Code CLI for batch AI jobs.

**Companion specs:**
- `docs/superpowers/specs/2026-05-07-txg-marketing-platform-design.md`
- `docs/superpowers/specs/2026-05-07-txg-marketing-website-design.md`

**Note on testing:** This codebase has no test framework today. To match existing patterns and ship fast, this plan uses **manual verification steps** (run a query, hit an endpoint, observe a UI state) rather than introducing a test suite. A separate plan will add Vitest + Playwright before Phase 1 hardening.

---

## Pre-flight Checklist

- [ ] **P1.** Open the worktree at `C:\Users\Jatin\Desktop\TXG Vector\.claude\worktrees\crazy-yalow-84340b` (or the active branch). All work happens here.
- [ ] **P2.** Confirm Supabase credentials in `.env.local` — `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] **P3.** Confirm Claude Code CLI is installed and logged in: run `claude --version` in PowerShell. If not logged in, run `claude` interactively to authenticate.
- [ ] **P4.** Run `npm install` to ensure all deps resolved.
- [ ] **P5.** Run `npm run dev` once to confirm the app boots without errors. Visit `http://localhost:3000`. Stop the server.

---

## Section A — Database Migrations

### Task 1: AI Job Queue Tables (Migration 0010)

**Files:**
- Create: `supabase/migrations/0010_marketing_ai_jobs.sql`

- [ ] **Step 1: Create the migration file**

```sql
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
```

- [ ] **Step 2: Apply the migration**

```powershell
npx supabase db push
```

Expected: Migration applied successfully, no errors.

- [ ] **Step 3: Verify schema**

Run in Supabase SQL editor:

```sql
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('ai_jobs', 'ai_job_results')
order by table_name, ordinal_position;
```

Expected: Both tables present with all columns from the migration.

- [ ] **Step 4: Commit**

```powershell
git add supabase/migrations/0010_marketing_ai_jobs.sql
git commit -m "feat(db): add ai_jobs queue and ai_job_results tables for Claude Code agent runtime"
```

---

### Task 2: Strategy & Brand Tables (Migration 0011)

**Files:**
- Create: `supabase/migrations/0011_marketing_strategy.sql`

- [ ] **Step 1: Create the migration file**

```sql
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
```

- [ ] **Step 2: Apply the migration**

```powershell
npx supabase db push
```

- [ ] **Step 3: Verify schema**

```sql
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('brand_assets','icp_profiles','personas','competitors','competitor_signals');
```

Expected: All 5 tables listed.

- [ ] **Step 4: Commit**

```powershell
git add supabase/migrations/0011_marketing_strategy.sql
git commit -m "feat(db): add Layer 1 strategy tables — brand_assets, icp_profiles, personas, competitors"
```

---

### Task 3: Content Production Tables (Migration 0012)

**Files:**
- Create: `supabase/migrations/0012_marketing_content.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- 0012_marketing_content.sql
-- Layer 3 — Content Production Engine tables.

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
```

- [ ] **Step 2: Apply migration and verify**

```powershell
npx supabase db push
```

```sql
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('content_pieces','seo_keywords','newsletters','newsletter_subscribers','lead_magnets','lead_magnet_downloads');
```

Expected: All 6 tables listed.

- [ ] **Step 3: Commit**

```powershell
git add supabase/migrations/0012_marketing_content.sql
git commit -m "feat(db): add Layer 3 content tables — pieces, keywords, newsletters, lead magnets"
```

---

### Task 4: Social Distribution & Listening Tables (Migration 0013)

**Files:**
- Create: `supabase/migrations/0013_marketing_social.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- 0013_marketing_social.sql
-- Layer 4 — Social Media & Distribution tables.

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
  for select using (public.is_workspace_member(
    (select workspace_id from public.engagement_targets et where et.id = engagement_targets.id)
  ) or for_user_id = auth.uid());
drop policy if exists engagement_targets_write on public.engagement_targets;
create policy engagement_targets_write on public.engagement_targets for all
  using (public.txg_can_write(workspace_id))
  with check (public.txg_can_write(workspace_id));
```

- [ ] **Step 2: Apply and verify**

```powershell
npx supabase db push
```

- [ ] **Step 3: Commit**

```powershell
git add supabase/migrations/0013_marketing_social.sql
git commit -m "feat(db): add Layer 4 social tables — social_posts, community, mentions, engagement_targets"
```

---

### Task 5: Lead & Outreach Tables (Migration 0014)

**Files:**
- Create: `supabase/migrations/0014_marketing_leads_outreach.sql`

- [ ] **Step 1: Create the migration file**

```sql
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
  active boolean not null default true,
  unique (lead_id, active) deferrable initially deferred
);

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
```

- [ ] **Step 2: Apply and verify**

```powershell
npx supabase db push
```

```sql
select count(*) from information_schema.tables
where table_schema = 'public'
  and table_name in ('leads','lead_contacts','outreach_sequences','outreach_messages',
                     'sdr_assignments','abm_accounts','account_intelligence_signals');
```

Expected: count = 7.

- [ ] **Step 3: Commit**

```powershell
git add supabase/migrations/0014_marketing_leads_outreach.sql
git commit -m "feat(db): add Layer 5 lead and outreach tables — leads, contacts, sequences, messages, ABM"
```

---

### Task 6: Partnerships, PR, Events, Community Tables (Migration 0015)

**Files:**
- Create: `supabase/migrations/0015_marketing_partnerships_pr_events.sql`

- [ ] **Step 1: Create the migration file**

```sql
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
```

- [ ] **Step 2: Apply and verify**

```powershell
npx supabase db push
```

- [ ] **Step 3: Commit**

```powershell
git add supabase/migrations/0015_marketing_partnerships_pr_events.sql
git commit -m "feat(db): add Layers 7-8 tables — partners, PR, press, speaking, events, influencers"
```

---

### Task 7: Sales Enablement Tables (Migration 0016)

**Files:**
- Create: `supabase/migrations/0016_marketing_sales_enablement.sql`

- [ ] **Step 1: Create the migration file**

```sql
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
```

- [ ] **Step 2: Apply and verify**

```powershell
npx supabase db push
```

- [ ] **Step 3: Commit**

```powershell
git add supabase/migrations/0016_marketing_sales_enablement.sql
git commit -m "feat(db): add Layer 9 sales enablement — sales_assets, battle_cards, proposals"
```

---

### Task 8: Marketing Ops & Analytics Tables (Migration 0017)

**Files:**
- Create: `supabase/migrations/0017_marketing_ops_analytics.sql`

- [ ] **Step 1: Create the migration file**

```sql
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
```

- [ ] **Step 2: Apply and verify**

```powershell
npx supabase db push
```

- [ ] **Step 3: Commit**

```powershell
git add supabase/migrations/0017_marketing_ops_analytics.sql
git commit -m "feat(db): add Layer 10 ops/analytics — attribution, KPIs, SLA, tool_uses"
```

---

### Task 9: Role Enum Extension and Existing Table Updates (Migration 0018)

**Files:**
- Create: `supabase/migrations/0018_marketing_role_extension.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- 0018_marketing_role_extension.sql
-- Extend role enum and link existing customers to leads.

-- Drop and recreate the role check on workspace_members.
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
```

- [ ] **Step 2: Apply and verify**

```powershell
npx supabase db push
```

```sql
-- Verify role enum extended
select unnest(string_to_array(
  trim(both '()' from substring(check_clause from 'in \(([^)]*)\)')),
  ','
)) as role
from information_schema.check_constraints
where constraint_name = 'workspace_members_role_check'
limit 20;
```

Expected: includes 'owner', 'public_face', 'ae', 'sdr', 'marketing_admin'.

- [ ] **Step 3: Commit**

```powershell
git add supabase/migrations/0018_marketing_role_extension.sql
git commit -m "feat(db): extend roles for marketing platform; link customers to lead origin"
```

---

### Task 10: Cross-Cutting Indexes and Helpers (Migration 0019)

**Files:**
- Create: `supabase/migrations/0019_marketing_helpers.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- 0019_marketing_helpers.sql
-- Helper functions and additional indexes for marketing modules.

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

-- Helper: enqueue an AI job from server code with consistent shape.
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

-- Helper: claim the next pending AI job (used by Claude Code processor).
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

-- Helper: fail an AI job, with retry logic.
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
```

- [ ] **Step 2: Apply and verify**

```powershell
npx supabase db push
```

```sql
select proname from pg_proc where proname in (
  'assign_lead_round_robin', 'enqueue_ai_job',
  'claim_next_ai_job', 'complete_ai_job', 'fail_ai_job'
);
```

Expected: 5 functions listed.

- [ ] **Step 3: Commit**

```powershell
git add supabase/migrations/0019_marketing_helpers.sql
git commit -m "feat(db): add helper functions — round-robin SDR, AI job enqueue/claim/complete/fail"
```

---

## Section B — Claude Code Agent Runtime

### Task 11: Agent Directory Structure

**Files:**
- Create: `agents/README.md`
- Create: `agents/jobs/_template.md`
- Create: `agents/run-jobs.ps1`

- [ ] **Step 1: Create agents/README.md**

```markdown
# TXG Marketing Platform — Claude Code Agent Runtime

This directory holds the Claude Code agent that processes the `ai_jobs` queue.

## How it works

1. Windows Task Scheduler runs `agents/run-jobs.ps1` on a schedule
2. The script invokes `claude -p` with the contents of a job dispatcher prompt
3. Claude Code claims pending jobs from Supabase (`claim_next_ai_job`)
4. For each job kind, it loads the matching prompt template from `agents/jobs/<kind>.md`
5. It executes the work, writes results back via `complete_ai_job` or `fail_ai_job`

## Authentication

Runs under the user's Claude Max plan. The workstation must remain logged in.
No Anthropic API key is used or required.

## Job Kinds

See spec Section 8.1 for the full job catalog. Each kind has a corresponding
markdown file in `agents/jobs/<kind>.md` with the prompt and expected output schema.

## Environment

Required env vars (read from `.env.local` at repo root):
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Manual run

```powershell
pwsh agents/run-jobs.ps1
```

## Schedule

Default: every 15 minutes. See `agents/scheduler/task-template.xml` for Windows Task Scheduler import.
```

- [ ] **Step 2: Create agents/jobs/_template.md (job prompt template)**

```markdown
# Job Kind: <KIND_NAME>

## Description
<one-sentence description of what this job does>

## Inputs
Read from `params` jsonb on the ai_jobs row:
- `<field>`: <type> — <purpose>

## Outputs
Write to `ai_job_results.output` jsonb:
- `<field>`: <type> — <meaning>

## Side effects
List the rows this job creates or updates.

## Algorithm
Step-by-step instructions for Claude Code to execute when claiming this job kind.

## Failure conditions
List the inputs or runtime states that should fail the job (call fail_ai_job).
```

- [ ] **Step 3: Create agents/run-jobs.ps1**

```powershell
# agents/run-jobs.ps1
# Entry point for scheduled Claude Code job processing.

param(
  [int]$MaxJobsPerRun = 5,
  [string]$LogPath = "$PSScriptRoot/logs"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $LogPath)) {
  New-Item -ItemType Directory -Path $LogPath -Force | Out-Null
}

$timestamp = (Get-Date).ToString("yyyyMMdd-HHmmss")
$logFile = Join-Path $LogPath "run-$timestamp.log"

$repoRoot = Split-Path -Parent $PSScriptRoot

Push-Location $repoRoot
try {
  $prompt = @"
You are running the TXG marketing job processor.

For each iteration up to $MaxJobsPerRun:
1. Call the Supabase RPC \`claim_next_ai_job\` to atomically claim the next pending job.
2. If no job is returned, exit.
3. Load the prompt for the job kind from \`agents/jobs/<kind>.md\`.
4. Read params from the job row.
5. Execute the work as described in that prompt file.
6. On success: call \`complete_ai_job(job_id, output_jsonb, tokens_in, tokens_out, model, duration_ms)\`.
7. On failure: call \`fail_ai_job(job_id, error_message)\`.
8. Log a one-line status to stdout: "[{timestamp}] {kind} {job_id} {status}".

Use the env vars NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
Do not modify or skip jobs you don't recognize — call fail_ai_job with "unknown kind: <kind>".
Be conservative: do not commit DB writes outside the documented job algorithm.
"@

  Write-Host "[$(Get-Date -Format 'HH:mm:ss')] starting job runner, max=$MaxJobsPerRun" | Tee-Object -FilePath $logFile

  & claude -p $prompt 2>&1 | Tee-Object -FilePath $logFile -Append
  $exitCode = $LASTEXITCODE

  Write-Host "[$(Get-Date -Format 'HH:mm:ss')] runner exit=$exitCode" | Tee-Object -FilePath $logFile -Append
  exit $exitCode
}
finally {
  Pop-Location
}
```

- [ ] **Step 4: Verify the script syntax**

```powershell
pwsh -NoProfile -Command "Get-Content agents/run-jobs.ps1 | Out-Null; if (\$?) { 'OK' } else { 'syntax error' }"
```

Expected: `OK`

- [ ] **Step 5: Commit**

```powershell
git add agents/
git commit -m "feat(agents): scaffold Claude Code agent runtime — README, job template, runner script"
```

---

### Task 12: First Two Job Prompt Templates (smoke test, lead validation)

**Files:**
- Create: `agents/jobs/smoke_test.md`
- Create: `agents/jobs/validate_leads_batch.md`

- [ ] **Step 1: Create agents/jobs/smoke_test.md**

```markdown
# Job Kind: smoke_test

## Description
Smoke test job that confirms the agent runtime is working end-to-end.

## Inputs (params)
- `message`: string — message to echo back

## Outputs (ai_job_results.output)
- `echo`: string — the same message
- `processed_at`: ISO timestamp string
- `worker`: "claude_code"

## Side effects
None.

## Algorithm
1. Read params.message.
2. Construct output JSON: { "echo": params.message, "processed_at": "<now>", "worker": "claude_code" }.
3. Call complete_ai_job with the output.

## Failure conditions
- params.message missing or not a string → call fail_ai_job("missing or invalid message").
```

- [ ] **Step 2: Create agents/jobs/validate_leads_batch.md**

```markdown
# Job Kind: validate_leads_batch

## Description
Run validation pipeline stages 1–3 on a batch of leads (no AI required for these stages).

## Inputs (params)
- `batch_size`: integer — how many leads to validate (default 100, max 500)
- `target_stage`: string — `pre_filtered` | `web_verified` | `signal_checked` (which stage to advance to)

## Outputs (ai_job_results.output)
- `processed`: integer — count of leads processed
- `advanced`: integer — count moved to target_stage
- `rejected`: integer — count moved to validation_stage='rejected'
- `errors`: array — any per-lead errors
- `next_action`: string — what to do next

## Side effects
- Updates `leads.validation_stage`
- Updates `leads.rejection_reason` when rejecting
- Updates `leads.last_enriched_at`

## Algorithm

For target_stage='pre_filtered':
1. Select up to batch_size leads where validation_stage='raw' for this workspace.
2. For each lead:
   - If website is null/empty/malformed → set validation_stage='rejected', rejection_reason='no_website'.
   - If display_name is null/empty → set rejection_reason='no_name'.
   - Else set validation_stage='pre_filtered'.

For target_stage='web_verified':
1. Select up to batch_size leads where validation_stage='pre_filtered'.
2. For each lead, attempt HTTP HEAD on the website (5s timeout).
   - If response 2xx or 3xx → set validation_stage='web_verified'.
   - If 4xx, 5xx, timeout, DNS fail → set validation_stage='rejected', rejection_reason='website_dead'.
3. Update last_enriched_at.

For target_stage='signal_checked':
1. Select up to batch_size leads where validation_stage='web_verified'.
2. For each lead, fetch the homepage HTML and check for:
   - presence of product page links (e.g. /products, /shop, /collections)
   - social handle in footer (Instagram, Facebook)
   - last-updated meta or visible recent activity
3. If at least 2 of 3 signals → set validation_stage='signal_checked'.
   Else → set validation_stage='rejected', rejection_reason='inactive_signals'.

## Failure conditions
- target_stage not in the allowed set → fail_ai_job("invalid target_stage: <value>").
- batch_size > 500 → cap silently to 500 and continue.
- Per-lead errors are collected in output.errors but do NOT fail the entire job.
```

- [ ] **Step 3: Verify smoke test plumbing**

Run in Supabase SQL editor (use a real workspace_id — find one with `select id from workspaces limit 1;`):

```sql
-- Replace <WS> with your workspace id
select public.enqueue_ai_job(
  '<WS>'::uuid,
  'smoke_test',
  '{"message": "hello from txg"}'::jsonb
);
```

Expected: returns a uuid (the job id).

- [ ] **Step 4: Run the agent manually**

```powershell
pwsh agents/run-jobs.ps1 -MaxJobsPerRun 1
```

Expected: log shows `smoke_test {job_id} completed`.

- [ ] **Step 5: Verify result**

```sql
select status, output, error from public.ai_jobs j
left join public.ai_job_results r on r.ai_job_id = j.id
where j.kind = 'smoke_test'
order by j.created_at desc limit 1;
```

Expected: status=`completed`, output has `echo: "hello from txg"`, error null.

- [ ] **Step 6: Commit**

```powershell
git add agents/jobs/
git commit -m "feat(agents): add smoke_test and validate_leads_batch job prompts"
```

---

### Task 13: Windows Task Scheduler Setup

**Files:**
- Create: `agents/scheduler/task-template.xml`
- Create: `agents/scheduler/install.ps1`

- [ ] **Step 1: Create agents/scheduler/task-template.xml**

```xml
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>TXG Marketing Platform — Claude Code job processor. Runs every 15 minutes.</Description>
  </RegistrationInfo>
  <Triggers>
    <CalendarTrigger>
      <Repetition>
        <Interval>PT15M</Interval>
        <StopAtDurationEnd>false</StopAtDurationEnd>
      </Repetition>
      <StartBoundary>2026-05-07T00:00:00</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByDay>
        <DaysInterval>1</DaysInterval>
      </ScheduleByDay>
    </CalendarTrigger>
  </Triggers>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>true</RunOnlyIfNetworkAvailable>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT30M</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions>
    <Exec>
      <Command>pwsh</Command>
      <Arguments>-NoProfile -ExecutionPolicy Bypass -File "%TXG_AGENTS_RUNNER%"</Arguments>
      <WorkingDirectory>%TXG_REPO_ROOT%</WorkingDirectory>
    </Exec>
  </Actions>
</Task>
```

- [ ] **Step 2: Create agents/scheduler/install.ps1**

```powershell
# agents/scheduler/install.ps1
# Installs the Windows Task Scheduler entry for the TXG agent runner.

param(
  [Parameter(Mandatory=$true)][string]$RepoRoot,
  [string]$TaskName = "TXG Marketing Agent"
)

$ErrorActionPreference = "Stop"

$runner = Join-Path $RepoRoot "agents/run-jobs.ps1"
if (-not (Test-Path $runner)) {
  throw "Runner not found at $runner"
}

$templatePath = Join-Path $PSScriptRoot "task-template.xml"
$xml = Get-Content $templatePath -Raw
$xml = $xml.Replace("%TXG_AGENTS_RUNNER%", $runner)
$xml = $xml.Replace("%TXG_REPO_ROOT%", $RepoRoot)

$tempXml = [System.IO.Path]::GetTempFileName() + ".xml"
$xml | Out-File -FilePath $tempXml -Encoding Unicode

try {
  $existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  if ($existing) {
    Write-Host "Task '$TaskName' already exists. Unregistering first."
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
  }

  Register-ScheduledTask -Xml (Get-Content $tempXml -Raw) -TaskName $TaskName | Out-Null
  Write-Host "Installed scheduled task: $TaskName"
  Write-Host "It will run every 15 minutes."
}
finally {
  if (Test-Path $tempXml) { Remove-Item $tempXml -Force }
}
```

- [ ] **Step 3: Install the task (optional — can be deferred to manual ops)**

This is a one-time setup. Run as administrator:

```powershell
pwsh agents/scheduler/install.ps1 -RepoRoot "C:\Users\Jatin\Desktop\TXG Vector"
```

Expected: `Installed scheduled task: TXG Marketing Agent`.

For Phase 0 development, manual runs of `agents/run-jobs.ps1` are sufficient. Schedule registration can wait until before live operation.

- [ ] **Step 4: Commit**

```powershell
git add agents/scheduler/
git commit -m "feat(agents): add Windows Task Scheduler templates for the runner"
```

---

## Section C — AI Chat Refactor (OpenRouter → ai_jobs queue)

### Task 14: Replace OpenRouter Chat Backend with Job Queue

**Files:**
- Modify: `src/app/api/ai/chat/route.ts`
- Create: `src/app/api/ai/chat/poll/route.ts`
- Create: `agents/jobs/chat_message.md`
- Modify: `src/components/ai/ai-widget.tsx` (search-and-replace pattern below)

- [ ] **Step 1: Create the chat_message job prompt**

Create `agents/jobs/chat_message.md`:

```markdown
# Job Kind: chat_message

## Description
Process a single user message in an ai_conversation, write the assistant reply to ai_messages.

## Inputs (params)
- `conversation_id`: uuid
- `user_message_id`: uuid (the user message just inserted)
- `workspace_id`: uuid
- `route`: string (model intent route — passed through for logging only)

## Outputs (ai_job_results.output)
- `assistant_message_id`: uuid (the new ai_messages row)
- `tokens_in`: integer
- `tokens_out`: integer
- `model`: string

## Side effects
- Inserts a new row into `ai_messages` with role='assistant'
- Updates `ai_conversations.last_message_at`

## Algorithm
1. Load conversation and the last 12 messages from ai_messages.
2. Load STATIC_PRIMER and dynamic context using the same logic as src/lib/ai/system-prompt.ts.
3. Call the CRM tool execution loop using src/lib/ai/tools.ts (these run in-process via Claude Code with direct DB access).
4. Stream the assistant text into ai_messages incrementally as it generates.
5. When complete, return the assistant_message_id and token counts.

## Failure conditions
- conversation_id does not exist → fail_ai_job("conversation not found")
- workspace_id mismatch → fail_ai_job("workspace mismatch")
```

- [ ] **Step 2: Replace src/app/api/ai/chat/route.ts**

The existing route makes streaming OpenRouter calls. Replace with a queue-and-redirect-to-poller pattern.

```typescript
// src/app/api/ai/chat/route.ts
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";
import { pickModel } from "@/lib/ai/model-router";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatRequestBody = {
  conversationId?: string;
  message: string;
  pageContext?: { route?: string; entity?: { type: string; id: string } };
};

export async function POST(req: Request) {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as ChatRequestBody;
  if (!body.message?.trim()) return NextResponse.json({ error: "empty message" }, { status: 400 });

  const supabase = await createSupabaseServerClient();

  let conversationId = body.conversationId;
  if (!conversationId) {
    const { data: conv, error } = await supabase
      .from("ai_conversations")
      .insert({
        workspace_id: ctx.workspaceId,
        user_id: ctx.user.id,
        title: body.message.slice(0, 80),
      })
      .select("id")
      .single();
    if (error || !conv) {
      return NextResponse.json({ error: error?.message ?? "conv create failed" }, { status: 500 });
    }
    conversationId = conv.id;
  }

  const { data: userMsg, error: userMsgErr } = await supabase
    .from("ai_messages")
    .insert({
      conversation_id: conversationId,
      role: "user",
      content: body.message,
    })
    .select("id")
    .single();

  if (userMsgErr || !userMsg) {
    return NextResponse.json({ error: userMsgErr?.message ?? "message persist failed" }, { status: 500 });
  }

  const route = pickModel(body.message);

  const { data: jobId, error: enqueueErr } = await supabase.rpc("enqueue_ai_job", {
    p_workspace_id: ctx.workspaceId,
    p_kind: "chat_message",
    p_params: {
      conversation_id: conversationId,
      user_message_id: userMsg.id,
      workspace_id: ctx.workspaceId,
      route: route.model,
      page_context: body.pageContext ?? null,
    },
    p_priority: 50,
    p_scheduled_for: null,
    p_requested_by: ctx.user.id,
  });

  if (enqueueErr) {
    return NextResponse.json({ error: enqueueErr.message }, { status: 500 });
  }

  return NextResponse.json({
    conversationId,
    jobId,
    pollUrl: `/api/ai/chat/poll?jobId=${jobId}&conversationId=${conversationId}`,
  });
}
```

- [ ] **Step 3: Create the poll endpoint**

Create `src/app/api/ai/chat/poll/route.ts`:

```typescript
// src/app/api/ai/chat/poll/route.ts
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const jobId = url.searchParams.get("jobId");
  const conversationId = url.searchParams.get("conversationId");

  if (!jobId || !conversationId) {
    return NextResponse.json({ error: "missing jobId or conversationId" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: job, error: jobErr } = await supabase
    .from("ai_jobs")
    .select("id, status, started_at, completed_at, retry_count")
    .eq("id", jobId)
    .single();

  if (jobErr || !job) {
    return NextResponse.json({ error: jobErr?.message ?? "job not found" }, { status: 404 });
  }

  const { data: messages } = await supabase
    .from("ai_messages")
    .select("id, role, content, created_at, metadata")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    job: {
      id: job.id,
      status: job.status,
      startedAt: job.started_at,
      completedAt: job.completed_at,
    },
    messages: messages ?? [],
  });
}
```

- [ ] **Step 4: Update the AI widget client**

Open `src/components/ai/ai-widget.tsx`. Find the existing fetch to `/api/ai/chat` that consumes a `text/event-stream`. Replace the streaming-consumption block with a poll loop.

Locate the section that fetches `/api/ai/chat` (search for `eventsource`, `text/event-stream`, or `ReadableStream`). Replace the post-response handling with:

```typescript
// After successful POST to /api/ai/chat
const { conversationId, jobId, pollUrl } = await postResponse.json();

// Poll until job completes
const startedAt = Date.now();
const POLL_TIMEOUT_MS = 60_000;
let lastMessageCount = 0;

while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
  await new Promise((r) => setTimeout(r, 1500));
  const pollResp = await fetch(pollUrl);
  if (!pollResp.ok) continue;
  const { job, messages } = await pollResp.json();

  if (messages.length !== lastMessageCount) {
    setMessages(messages);
    lastMessageCount = messages.length;
  }

  if (job.status === "completed" || job.status === "failed") {
    if (job.status === "failed") {
      toast.error("AI job failed", { description: "Check the agent runner logs." });
    }
    return;
  }
}

toast.warning("AI job is taking longer than expected", {
  description: "It will complete in the background. Refresh to see the result.",
});
```

(The existing imports of `OpenAI` and OpenRouter are no longer needed in this client-side file; remove them.)

- [ ] **Step 5: Smoke test the new chat flow**

Run dev server:

```powershell
npm run dev
```

In the browser: open the AI widget, type "hello", send. Expected: the message appears, a polling response starts, and within ~5–10 seconds (assuming the agent runner is running) the assistant reply appears.

- [ ] **Step 6: Commit**

```powershell
git add agents/jobs/chat_message.md src/app/api/ai/chat/route.ts src/app/api/ai/chat/poll/route.ts src/components/ai/ai-widget.tsx
git commit -m "refactor(ai): chat backend swapped from OpenRouter to ai_jobs queue (no API keys)"
```

---

### Task 15: Remove OpenRouter Dependency

**Files:**
- Modify: `package.json` (remove `openai` if no other usages)
- Delete: `src/lib/ai/openai-tools.ts` (replace with claude-tools)
- Modify: `src/lib/ai/tools.ts` if it imports OpenRouter helpers
- Modify: `.env.example` (remove `OPENROUTER_API_KEY`)

- [ ] **Step 1: Search for remaining OpenRouter references**

```powershell
grep -rn "openrouter" src/ --include="*.ts" --include="*.tsx"
grep -rn "OPENROUTER_API_KEY" .
```

Expected: results only in files we'll edit below.

- [ ] **Step 2: Remove `openai` package usage**

The `openai` package was used as the SDK client pointed at OpenRouter. We no longer need it for chat. If no other code uses it:

```powershell
grep -rn "from \"openai\"" src/
```

If results are empty:

```powershell
npm uninstall openai
```

If results show usages elsewhere, leave the package and only remove the OpenRouter wiring.

- [ ] **Step 3: Replace openai-tools.ts with claude-tools.ts**

The tool definitions (CRM_TOOLS) were exported in OpenAI's function-calling shape. Replace with Anthropic's tool-use shape, used by Claude Code agents.

Read the file first:

```powershell
cat src/lib/ai/openai-tools.ts
```

Then rewrite as `src/lib/ai/claude-tools.ts` with the same tool list but in Anthropic's format. Each tool becomes:

```typescript
// src/lib/ai/claude-tools.ts
export type ClaudeToolDef = {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
};

// (Map every entry from CRM_TOOLS_OPENAI to this shape; keep the same names and parameter schemas.)
export const CRM_TOOLS: ClaudeToolDef[] = [
  // Example shape:
  // {
  //   name: "search_customers",
  //   description: "Search the customers table by name or email.",
  //   input_schema: {
  //     type: "object",
  //     properties: { query: { type: "string", description: "search term" } },
  //     required: ["query"],
  //   },
  // },
  // ...
];
```

Copy each tool from `openai-tools.ts` and convert. The `parameters` field becomes `input_schema`; everything else is the same.

- [ ] **Step 4: Remove the old openai-tools file and OPENROUTER_API_KEY from env**

```powershell
git rm src/lib/ai/openai-tools.ts
```

If `.env.example` has `OPENROUTER_API_KEY=` line, remove it. If `.env.local` has it, leave it (it's gitignored, removal is optional).

- [ ] **Step 5: Verify dev build succeeds**

```powershell
npm run build
```

Expected: build completes without errors.

If build fails on imports of `openai-tools` or `OPENROUTER_API_KEY`, search and fix references:

```powershell
grep -rn "openai-tools\|OPENROUTER_API_KEY" src/
```

- [ ] **Step 6: Commit**

```powershell
git add -A
git commit -m "chore(ai): remove OpenRouter; tools migrated to Anthropic format for Claude Code"
```

---

## Section D — Vector UI Shell Updates

### Task 16: New Sidebar Navigation Structure

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Read the existing sidebar to confirm structure**

```powershell
cat src/components/layout/sidebar.tsx | head -100
```

The current sidebar has sections: Overview, CRM, Communication, Warehouse, Settings. Per the platform spec Section 9.2, the new IA is:

```
Today · Pipeline · Content · Distribution · Outreach · Growth · Strategy · Operations · Analytics · Settings
```

The existing sub-items (Customers, Quotes, Contracts, Tickets, Inbox, etc.) move under appropriate top-level groups. Operations preserves Warehouse/Quotes/Contracts/Tickets.

- [ ] **Step 2: Replace the `sections` array in `src/components/layout/sidebar.tsx`**

Replace the existing `const sections: NavSection[] = [...]` block with:

```typescript
const sections: NavSection[] = [
  {
    heading: "Today",
    items: [
      {
        href: "/app/today",
        label: "Today",
        icon: LayoutDashboard,
        match: (p) => p === "/app" || p.startsWith("/app/today") || p.startsWith("/app/dashboard"),
      },
    ],
  },
  {
    heading: "Pipeline",
    items: [
      { href: "/app/pipeline", label: "Pipeline", icon: KanbanSquare },
      { href: "/app/inbox", label: "Inbox", icon: Inbox },
      { href: "/app/leads", label: "Leads", icon: Users },
      { href: "/app/accounts", label: "Accounts (ABM)", icon: Building2 },
      { href: "/app/customers", label: "Customers", icon: Users },
    ],
  },
  {
    heading: "Content",
    items: [
      { href: "/app/content/calendar", label: "Calendar", icon: KanbanSquare },
      { href: "/app/content/articles", label: "Articles", icon: FileText },
      { href: "/app/content/founder-brand", label: "Founder Brand", icon: UserCog },
      { href: "/app/content/newsletters", label: "Newsletters", icon: Inbox },
      { href: "/app/content/library", label: "Library", icon: FolderOpen },
    ],
  },
  {
    heading: "Distribution",
    items: [
      { href: "/app/distribution/social", label: "Social", icon: Megaphone },
      { href: "/app/distribution/community", label: "Community", icon: Users },
      { href: "/app/distribution/engagement", label: "Engagement", icon: Megaphone },
      { href: "/app/distribution/listening", label: "Listening", icon: RefreshCcw },
    ],
  },
  {
    heading: "Outreach",
    items: [
      { href: "/app/outreach/queue", label: "My Queue", icon: ClipboardList },
      { href: "/app/outreach/sequences", label: "Sequences", icon: KanbanSquare },
      { href: "/app/outreach/replies", label: "Replies", icon: Inbox },
    ],
  },
  {
    heading: "Growth",
    items: [
      { href: "/app/growth/partners", label: "Partners", icon: Users },
      { href: "/app/growth/pr", label: "PR & Media", icon: Megaphone },
      { href: "/app/growth/events", label: "Events", icon: KanbanSquare },
      { href: "/app/growth/influencers", label: "Influencers", icon: UserCog },
    ],
  },
  {
    heading: "Strategy",
    items: [
      { href: "/app/strategy/brand", label: "Brand Book", icon: FolderOpen },
      { href: "/app/strategy/icps", label: "ICPs & Personas", icon: Users },
      { href: "/app/strategy/competitors", label: "Competitors", icon: KanbanSquare },
      { href: "/app/strategy/sales-kit", label: "Sales Kit", icon: FileText },
    ],
  },
  {
    heading: "Operations",
    items: [
      { href: "/app/quotes", label: "Quotes", icon: FileText },
      { href: "/app/contracts", label: "Contracts", icon: FileSignature },
      { href: "/app/tickets", label: "Tickets", icon: LifeBuoy },
      { href: "/app/tasks", label: "Tasks", icon: CheckSquare },
      { href: "/app/warehouse", label: "Warehouse", icon: Warehouse, match: (p) => p === "/app/warehouse" || p.startsWith("/app/warehouse/") },
    ],
  },
  {
    heading: "Analytics",
    items: [
      { href: "/app/analytics", label: "Dashboard", icon: KanbanSquare, match: (p) => p === "/app/analytics" },
      { href: "/app/analytics/funnel", label: "Funnel", icon: KanbanSquare },
      { href: "/app/analytics/attribution", label: "Attribution", icon: KanbanSquare },
    ],
  },
  {
    heading: "Settings",
    items: [
      { href: "/app/settings/team", label: "Team", icon: UserCog },
      { href: "/app/settings/facilities", label: "Facilities", icon: Building2 },
      { href: "/app/settings/rate-cards", label: "Rate cards", icon: ReceiptText },
      { href: "/app/settings/wms", label: "WMS sync", icon: RefreshCcw },
      { href: "/app/settings", label: "All settings", icon: Settings, match: (p) => p === "/app/settings" },
    ],
  },
];
```

(The icon imports at the top of the file already include all needed icons.)

- [ ] **Step 3: Verify sidebar renders without errors**

```powershell
npm run dev
```

Visit `http://localhost:3000/app`. Expected: sidebar renders all 10 sections, no console errors. Most links 404 (those pages don't exist yet — that's the next task).

- [ ] **Step 4: Commit**

```powershell
git add src/components/layout/sidebar.tsx
git commit -m "feat(ui): restructure sidebar to 10-section IA — Today, Pipeline, Content, Distribution, Outreach, Growth, Strategy, Operations, Analytics, Settings"
```

---

### Task 17: Placeholder Pages for New Marketing Routes

**Files:**
- Create: many `src/app/(app)/app/<route>/page.tsx` files (placeholder)
- Create: `src/components/layout/placeholder-page.tsx` (shared component)

- [ ] **Step 1: Create the placeholder component**

```typescript
// src/components/layout/placeholder-page.tsx
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

type PlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  comingNext: string;
};

export function PlaceholderPage({ eyebrow, title, description, comingNext }: PlaceholderProps) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} subtitle={description} />
      <Card>
        <CardContent className="px-6 py-10">
          <p className="text-sm text-[var(--ink-700)]">
            This module is part of the marketing platform build. The schema and
            agent runtime are in place; UI implementation arrives in a follow-up plan.
          </p>
          <p className="mt-3 text-sm text-[var(--ink-500)]">
            Coming next: <span className="text-[var(--ink-950)] font-medium">{comingNext}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Create the placeholder pages**

For each new route, create a `page.tsx` file. The text differs but the structure is identical. Use this shape:

```typescript
// Example: src/app/(app)/app/today/page.tsx
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function TodayPage() {
  return (
    <PlaceholderPage
      eyebrow="Today"
      title="Your day at a glance"
      description="Role-aware home: queues, alerts, and the actions that matter today."
      comingNext="Today view per role (SDR, AE, Founder, Owner)"
    />
  );
}
```

Create the following files (each with appropriate text — examples below):

```
src/app/(app)/app/today/page.tsx
src/app/(app)/app/leads/page.tsx
src/app/(app)/app/accounts/page.tsx
src/app/(app)/app/content/calendar/page.tsx
src/app/(app)/app/content/articles/page.tsx
src/app/(app)/app/content/founder-brand/page.tsx
src/app/(app)/app/content/newsletters/page.tsx
src/app/(app)/app/content/library/page.tsx
src/app/(app)/app/distribution/social/page.tsx
src/app/(app)/app/distribution/community/page.tsx
src/app/(app)/app/distribution/engagement/page.tsx
src/app/(app)/app/distribution/listening/page.tsx
src/app/(app)/app/outreach/queue/page.tsx
src/app/(app)/app/outreach/sequences/page.tsx
src/app/(app)/app/outreach/replies/page.tsx
src/app/(app)/app/growth/partners/page.tsx
src/app/(app)/app/growth/pr/page.tsx
src/app/(app)/app/growth/events/page.tsx
src/app/(app)/app/growth/influencers/page.tsx
src/app/(app)/app/strategy/brand/page.tsx
src/app/(app)/app/strategy/icps/page.tsx
src/app/(app)/app/strategy/competitors/page.tsx
src/app/(app)/app/strategy/sales-kit/page.tsx
src/app/(app)/app/analytics/page.tsx
src/app/(app)/app/analytics/funnel/page.tsx
src/app/(app)/app/analytics/attribution/page.tsx
```

Use the appropriate eyebrow/title/description for each. Examples:

```typescript
// src/app/(app)/app/leads/page.tsx
import { PlaceholderPage } from "@/components/layout/placeholder-page";
export default function LeadsPage() {
  return (
    <PlaceholderPage
      eyebrow="Pipeline · Leads"
      title="Validated leads database"
      description="Indian D2C brands scored, segmented, and ready for outreach."
      comingNext="Lead Validation & Enrichment Pipeline (Plan 3)"
    />
  );
}

// src/app/(app)/app/strategy/icps/page.tsx
import { PlaceholderPage } from "@/components/layout/placeholder-page";
export default function IcpsPage() {
  return (
    <PlaceholderPage
      eyebrow="Strategy · ICPs"
      title="Ideal Customer Profiles & Personas"
      description="The five ICP tiers and persona maps that drive every outreach decision."
      comingNext="ICP & Persona Workspace (Plan 2)"
    />
  );
}
```

Repeat for all listed routes.

- [ ] **Step 3: Verify all routes render**

```powershell
npm run dev
```

Visit a sample of routes:
- http://localhost:3000/app/today
- http://localhost:3000/app/leads
- http://localhost:3000/app/strategy/icps
- http://localhost:3000/app/content/calendar
- http://localhost:3000/app/outreach/queue

Expected: each renders the placeholder with appropriate text, no 404s, no console errors.

- [ ] **Step 4: Commit**

```powershell
git add src/components/layout/placeholder-page.tsx "src/app/(app)/app/today" "src/app/(app)/app/leads" "src/app/(app)/app/accounts" "src/app/(app)/app/content" "src/app/(app)/app/distribution" "src/app/(app)/app/outreach" "src/app/(app)/app/growth" "src/app/(app)/app/strategy" "src/app/(app)/app/analytics"
git commit -m "feat(ui): add placeholder pages for all new marketing platform routes"
```

---

### Task 18: Redirect /app and /app/dashboard to /app/today

**Files:**
- Modify: `src/app/(app)/app/page.tsx`
- Modify: `src/app/(app)/app/dashboard/page.tsx`

- [ ] **Step 1: Read the existing app/page.tsx and app/dashboard/page.tsx**

```powershell
cat src/app/(app)/app/page.tsx
cat src/app/(app)/app/dashboard/page.tsx
```

The existing dashboard page renders a comprehensive stat dashboard. We are NOT removing it — we are reframing it. Instead, /app/dashboard becomes one role's "Today" view, and the new /app/today is the role-aware shell.

For Foundation, simplest: keep dashboard fully functional, point /app to redirect to /app/today.

- [ ] **Step 2: Update src/app/(app)/app/page.tsx to redirect to /app/today**

```typescript
// src/app/(app)/app/page.tsx
import { redirect } from "next/navigation";

export default function AppRootPage() {
  redirect("/app/today");
}
```

(Replace the entire file contents with the above.)

- [ ] **Step 3: Verify redirect**

```powershell
npm run dev
```

Visit http://localhost:3000/app — expected: redirects to /app/today.

- [ ] **Step 4: Commit**

```powershell
git add "src/app/(app)/app/page.tsx"
git commit -m "feat(ui): redirect /app to /app/today (role-aware home)"
```

---

## Section E — Strategy Seed Data

### Task 19: Seed ICP Profiles, Personas, and Competitors (Migration 0020)

**Files:**
- Create: `supabase/migrations/0020_marketing_strategy_seed.sql`

This populates the database with the 5 Indian D2C ICP tiers, persona maps, and the top 6 competitors — directly from the design spec. Provides immediate working state for downstream plans.

- [ ] **Step 1: Create the migration file**

```sql
-- 0020_marketing_strategy_seed.sql
-- Seed Layer 1 strategy data: ICPs, personas, competitors. Idempotent.

-- Helper: insert if no record exists yet for this workspace.
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
      jsonb_build_array('Unlock the US market without operational overhead', 'Asset-based 4PL — incumbent positioning'),
      jsonb_build_array('founder_thought_leadership', 'strategy_pov', 'case_studies')
    from public.icp_profiles ip
    where ip.workspace_id = v_workspace_id and ip.tier = 'tier_1'
      and not exists (select 1 from public.personas p where p.icp_profile_id = ip.id and p.title = 'Founder/CEO');

    insert into public.personas (workspace_id, icp_profile_id, title, role_description, pain_points, hooks, content_recommendations)
    select v_workspace_id, ip.id, 'COO/VP Ops',
      'Operations leader concerned with reliability and integration',
      jsonb_build_array('Operational reliability', 'SLAs and uptime', 'Integration complexity'),
      jsonb_build_array('Day-of integration, not multi-quarter migration', 'Vector platform — full visibility'),
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
      jsonb_build_array('Vector platform — Shopify-native, REST API, full observability'),
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
```

- [ ] **Step 2: Apply and verify**

```powershell
npx supabase db push
```

```sql
select tier, name from public.icp_profiles where workspace_id = (select id from public.workspaces limit 1);
select count(*) from public.personas where workspace_id = (select id from public.workspaces limit 1);
select name from public.competitors where workspace_id = (select id from public.workspaces limit 1);
```

Expected:
- 6 ICP profiles (tier_1 through tier_5 + na_mid_market)
- 5 personas (all attached to tier_1)
- 6 competitors

- [ ] **Step 3: Commit**

```powershell
git add supabase/migrations/0020_marketing_strategy_seed.sql
git commit -m "feat(db): seed ICPs, personas, and competitors per design spec"
```

---

## Final — Verification Sweep

### Task 20: End-to-End Foundation Smoke Test

- [ ] **Step 1: Confirm all migrations applied**

```sql
select count(*) from supabase_migrations.schema_migrations
where version like '0010%' or version like '0011%' or version like '0012%' or
      version like '0013%' or version like '0014%' or version like '0015%' or
      version like '0016%' or version like '0017%' or version like '0018%' or
      version like '0019%' or version like '0020%';
```

Expected: 11 migrations.

- [ ] **Step 2: Confirm role enum extension worked**

```sql
-- Insert a workspace_member with new role to confirm
insert into public.workspace_members (workspace_id, user_id, role, status)
select w.id, p.id, 'sdr', 'active'
from public.workspaces w, public.profiles p
where p.email = (select email from auth.users limit 1)
limit 1
on conflict (workspace_id, user_id) do update set role = 'sdr';

-- Cleanup (revert to existing role)
-- (do this manually if you want — leaving it harmless)
```

Expected: insert succeeds without check-constraint violation.

- [ ] **Step 3: Confirm AI job queue end-to-end**

```sql
-- Enqueue a smoke test
select public.enqueue_ai_job(
  (select id from public.workspaces limit 1),
  'smoke_test',
  '{"message": "foundation complete"}'::jsonb
) as job_id;
```

Run agent:

```powershell
pwsh agents/run-jobs.ps1 -MaxJobsPerRun 1
```

Verify:

```sql
select kind, status, output, error
from public.ai_jobs j
left join public.ai_job_results r on r.ai_job_id = j.id
order by j.created_at desc limit 3;
```

Expected: most recent smoke_test row has status='completed' and output containing `echo: "foundation complete"`.

- [ ] **Step 4: Confirm UI shell**

```powershell
npm run dev
```

In a browser:
- Visit http://localhost:3000/app — redirects to /app/today, placeholder visible
- Visit /app/leads — placeholder visible
- Visit /app/strategy/icps — placeholder visible
- Visit /app/outreach/queue — placeholder visible
- Visit /app/customers — existing customer module still functional
- Visit /app/warehouse — existing warehouse module still functional

Expected: all pages render, no 404s, no console errors. Existing modules continue to work.

- [ ] **Step 5: Confirm AI chat refactor works (if Claude Code agent is running)**

In a browser, open the AI widget. Send a message like "what customers do we have." Within ~5–15 seconds, an assistant reply should appear.

If the agent runner is not active, the UI will show a "taking longer than expected" toast — this is expected. Run the agent manually:

```powershell
pwsh agents/run-jobs.ps1
```

The pending chat_message job will process, and the reply will appear on the next poll.

- [ ] **Step 6: Final commit (if any pending changes)**

```powershell
git status
```

If clean: nothing to commit.

If anything is modified during smoke testing, commit it:

```powershell
git add -A
git commit -m "chore: foundation smoke test fixes"
```

- [ ] **Step 7: Tag the foundation milestone**

```powershell
git tag -a foundation-complete -m "Foundation plan complete: schema, agent runtime, UI shell"
```

---

## Self-Review Checklist (run before declaring complete)

- [ ] All 11 migrations applied without errors
- [ ] RLS policies verified for at least 3 tables (`leads`, `outreach_messages`, `ai_jobs`)
- [ ] `enqueue_ai_job`, `claim_next_ai_job`, `complete_ai_job`, `fail_ai_job` callable from authenticated users
- [ ] AI job queue processes a smoke test end-to-end
- [ ] Sidebar shows new IA, all top-level sections clickable
- [ ] All placeholder pages render
- [ ] AI chat refactored — no OpenRouter usage anywhere in src/
- [ ] `OPENROUTER_API_KEY` removed from `.env.example`
- [ ] No new TypeScript errors introduced (`npm run build` succeeds)
- [ ] Existing modules (customers, quotes, contracts, tickets, warehouse) still functional

---

## What This Plan Delivers

After completion of this plan, the system has:

- **Complete database schema** for all 32 marketing modules (ready for data, ready for code)
- **Working AI job queue** processed by Claude Code via the user's Max plan, no API keys
- **Helper functions** for the most common operations (round-robin SDR assignment, job lifecycle)
- **Strategy data seeded** (ICPs, personas, competitors) so subsequent plans can build against real data
- **New navigation IA** in TXG Vector matching the spec
- **Placeholder pages** for every new module so the IA is navigable
- **AI chat preserved** but rewired through the queue — no external AI vendor

Subsequent plans (Plans 2–12) build module functionality on top of this foundation. Each plan can proceed independently because the schema, agent runtime, and UI shell are in place.

---

## Estimated Effort

- Section A (database): ~2 days for an experienced engineer (mechanical, mostly SQL)
- Section B (agent runtime): ~1 day
- Section C (AI chat refactor): ~0.5 day
- Section D (UI shell): ~0.5 day
- Section E (seed data): ~0.5 day
- Smoke testing and fixes: ~0.5 day

**Total: ~5 working days for a single engineer, or ~3 days with two engineers in parallel** (one on backend/migrations, one on UI shell).
