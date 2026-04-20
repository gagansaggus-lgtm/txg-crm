-- Tickets, messages, activities, tasks (phase 2 usage, tables live now).

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  subject text not null,
  body text,
  status text not null default 'open' check (status in ('open', 'pending', 'resolved', 'closed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  assigned_to uuid references public.profiles(id) on delete set null,
  related_type text check (related_type in ('shipment', 'order', 'receipt', 'general')),
  related_id uuid,
  due_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_tickets_workspace_status on public.tickets(workspace_id, status);
create index if not exists idx_tickets_customer on public.tickets(customer_id);

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  internal boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_ticket_messages_ticket on public.ticket_messages(ticket_id, created_at);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  kind text not null check (kind in ('call', 'email', 'note', 'meeting')),
  subject text,
  body text,
  occurred_at timestamptz not null default timezone('utc', now()),
  related_type text,
  related_id uuid,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_activities_workspace_time on public.activities(workspace_id, occurred_at desc);
create index if not exists idx_activities_customer on public.activities(customer_id, occurred_at desc);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  body text,
  assigned_to uuid references public.profiles(id) on delete set null,
  due_at timestamptz,
  status text not null default 'open' check (status in ('open', 'done', 'cancelled')),
  related_type text,
  related_id uuid,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_tasks_workspace_status on public.tasks(workspace_id, status, due_at);
create index if not exists idx_tasks_assigned on public.tasks(assigned_to, status);

drop trigger if exists tickets_set_updated_at on public.tickets;
create trigger tickets_set_updated_at before update on public.tickets
for each row execute procedure public.set_updated_at();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks
for each row execute procedure public.set_updated_at();

alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.activities enable row level security;
alter table public.tasks enable row level security;

drop policy if exists "tickets_rw" on public.tickets;
create policy "tickets_rw" on public.tickets for all to authenticated
using (public.txg_can_read(workspace_id))
with check (public.txg_can_write(workspace_id));

drop policy if exists "ticket_messages_rw" on public.ticket_messages;
create policy "ticket_messages_rw" on public.ticket_messages for all to authenticated
using (
  exists (select 1 from public.tickets t
    where t.id = ticket_messages.ticket_id and public.txg_can_read(t.workspace_id))
)
with check (
  exists (select 1 from public.tickets t
    where t.id = ticket_messages.ticket_id and public.txg_can_write(t.workspace_id))
);

drop policy if exists "activities_rw" on public.activities;
create policy "activities_rw" on public.activities for all to authenticated
using (public.txg_can_read(workspace_id))
with check (public.txg_can_write(workspace_id));

drop policy if exists "tasks_rw" on public.tasks;
create policy "tasks_rw" on public.tasks for all to authenticated
using (public.txg_can_read(workspace_id))
with check (public.txg_can_write(workspace_id));
