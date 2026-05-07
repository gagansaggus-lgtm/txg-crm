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
  for select using (public.txg_can_read(workspace_id) or for_user_id = auth.uid());
drop policy if exists engagement_targets_write on public.engagement_targets;
create policy engagement_targets_write on public.engagement_targets for all
  using (public.txg_can_write(workspace_id))
  with check (public.txg_can_write(workspace_id));
