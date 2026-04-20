-- WMS integration tracking tables.

create table if not exists public.wms_sync_cursor (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source text not null check (source in ('csv', 'api')),
  entity text not null check (entity in ('skus', 'receipts', 'orders', 'shipments')),
  last_cursor text,
  last_run_at timestamptz,
  unique (workspace_id, source, entity)
);

create table if not exists public.wms_integration_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source text not null check (source in ('csv', 'api')),
  entity text not null,
  run_started_at timestamptz not null default timezone('utc', now()),
  run_ended_at timestamptz,
  rows_in integer not null default 0,
  rows_ok integer not null default 0,
  rows_failed integer not null default 0,
  error text,
  file_name text,
  created_by uuid references public.profiles(id) on delete set null
);
create index if not exists idx_wms_log_workspace_time
  on public.wms_integration_log(workspace_id, run_started_at desc);

alter table public.wms_sync_cursor enable row level security;
alter table public.wms_integration_log enable row level security;

drop policy if exists "wms_sync_cursor_rw" on public.wms_sync_cursor;
create policy "wms_sync_cursor_rw" on public.wms_sync_cursor for all to authenticated
using (public.txg_can_read(workspace_id))
with check (public.txg_can_write(workspace_id));

drop policy if exists "wms_integration_log_rw" on public.wms_integration_log;
create policy "wms_integration_log_rw" on public.wms_integration_log for all to authenticated
using (public.txg_can_read(workspace_id))
with check (public.txg_can_write(workspace_id));
