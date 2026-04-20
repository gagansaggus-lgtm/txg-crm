-- TXG CRM foundation: profiles, workspaces, workspace_members, RLS helpers.
create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in (
    'admin', 'ops_lead', 'ops_rep', 'warehouse_lead', 'warehouse_staff',
    'driver', 'sales', 'customer_contact'
  )),
  status text not null default 'active' check (status in ('invited', 'active', 'disabled')),
  facility_id uuid,
  joined_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, user_id)
);

create index if not exists idx_workspace_members_user
  on public.workspace_members(user_id, workspace_id);
create index if not exists idx_workspace_members_workspace
  on public.workspace_members(workspace_id, role, status);
create index if not exists idx_workspace_members_facility
  on public.workspace_members(facility_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

-- Helpers reused by every domain table.
create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.status = 'active'
  );
$$;

create or replace function public.workspace_role(target_workspace_id uuid)
returns text
language sql
stable
as $$
  select wm.role from public.workspace_members wm
  where wm.workspace_id = target_workspace_id
    and wm.user_id = auth.uid()
    and wm.status = 'active'
  limit 1;
$$;

create or replace function public.user_facility_id(target_workspace_id uuid)
returns uuid
language sql
stable
as $$
  select wm.facility_id from public.workspace_members wm
  where wm.workspace_id = target_workspace_id
    and wm.user_id = auth.uid()
    and wm.status = 'active'
  limit 1;
$$;

-- Day-1 whitelist. Edit this one function to expand access later (warehouse staff, drivers, portal).
create or replace function public.txg_can_read(target_workspace_id uuid)
returns boolean
language sql
stable
as $$
  select public.workspace_role(target_workspace_id) in ('admin', 'ops_lead');
$$;

create or replace function public.txg_can_write(target_workspace_id uuid)
returns boolean
language sql
stable
as $$
  select public.workspace_role(target_workspace_id) in ('admin', 'ops_lead');
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

drop policy if exists "profiles_select_self_or_workspace" on public.profiles;
create policy "profiles_select_self_or_workspace"
on public.profiles for select to authenticated
using (
  id = auth.uid()
  or exists (
    select 1 from public.workspace_members wm_self
    join public.workspace_members wm_other on wm_other.workspace_id = wm_self.workspace_id
    where wm_self.user_id = auth.uid()
      and wm_self.status = 'active'
      and wm_other.user_id = profiles.id
      and wm_other.status = 'active'
  )
);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "workspaces_select_member" on public.workspaces;
create policy "workspaces_select_member"
on public.workspaces for select to authenticated
using (public.is_workspace_member(id));

drop policy if exists "workspace_members_select_member" on public.workspace_members;
create policy "workspace_members_select_member"
on public.workspace_members for select to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "workspace_members_write_admin" on public.workspace_members;
create policy "workspace_members_write_admin"
on public.workspace_members for all to authenticated
using (public.workspace_role(workspace_id) = 'admin')
with check (public.workspace_role(workspace_id) = 'admin');
