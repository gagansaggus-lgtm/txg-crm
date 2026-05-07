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
