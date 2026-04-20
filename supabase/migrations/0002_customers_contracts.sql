-- Customers, contacts, services, contracts, rate cards, quotes.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'txg_service_type') then
    create type public.txg_service_type as enum (
      'last_mile', 'warehousing', 'fulfillment', 'international_courier'
    );
  end if;
end$$;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  legal_name text not null,
  display_name text not null,
  status text not null default 'prospect' check (status in ('prospect', 'active', 'churned')),
  billing_email text,
  billing_phone text,
  billing_address_line1 text,
  billing_address_line2 text,
  billing_city text,
  billing_region text,
  billing_postal text,
  billing_country text,
  payment_terms text,
  currency text default 'USD',
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_customers_workspace_status on public.customers(workspace_id, status);
create index if not exists idx_customers_workspace_name on public.customers(workspace_id, display_name);

create table if not exists public.customer_contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  full_name text not null,
  role_title text,
  email text,
  phone text,
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_customer_contacts_customer on public.customer_contacts(customer_id);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'expired', 'terminated')),
  effective_date date,
  end_date date,
  terms_url text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_contracts_customer on public.contracts(customer_id, status);

create table if not exists public.customer_services (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  service_type public.txg_service_type not null,
  contract_id uuid references public.contracts(id) on delete set null,
  active boolean not null default true,
  started_at date,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (customer_id, service_type)
);
create index if not exists idx_customer_services_customer on public.customer_services(customer_id);

create table if not exists public.rate_cards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  service_type public.txg_service_type not null,
  name text not null,
  currency text not null default 'USD',
  effective_date date,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_rate_cards_scope on public.rate_cards(customer_id, service_type);

create table if not exists public.rate_card_lines (
  id uuid primary key default gen_random_uuid(),
  rate_card_id uuid not null references public.rate_cards(id) on delete cascade,
  code text,
  description text not null,
  unit text not null,
  price numeric(12, 4) not null,
  min_qty numeric(12, 2),
  tier_max numeric(12, 2),
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_rate_card_lines_card on public.rate_card_lines(rate_card_id);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  quote_number text,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  valid_until date,
  currency text not null default 'USD',
  total numeric(12, 2) not null default 0,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_quotes_customer on public.quotes(customer_id, status);

create table if not exists public.quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  service_type public.txg_service_type not null,
  description text not null,
  qty numeric(12, 2) not null default 1,
  unit text not null,
  unit_price numeric(12, 4) not null default 0,
  total numeric(12, 2) not null default 0
);
create index if not exists idx_quote_lines_quote on public.quote_lines(quote_id);

-- updated_at triggers
drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at before update on public.customers
for each row execute procedure public.set_updated_at();

drop trigger if exists customer_contacts_set_updated_at on public.customer_contacts;
create trigger customer_contacts_set_updated_at before update on public.customer_contacts
for each row execute procedure public.set_updated_at();

drop trigger if exists contracts_set_updated_at on public.contracts;
create trigger contracts_set_updated_at before update on public.contracts
for each row execute procedure public.set_updated_at();

drop trigger if exists rate_cards_set_updated_at on public.rate_cards;
create trigger rate_cards_set_updated_at before update on public.rate_cards
for each row execute procedure public.set_updated_at();

drop trigger if exists quotes_set_updated_at on public.quotes;
create trigger quotes_set_updated_at before update on public.quotes
for each row execute procedure public.set_updated_at();

-- RLS
alter table public.customers enable row level security;
alter table public.customer_contacts enable row level security;
alter table public.contracts enable row level security;
alter table public.customer_services enable row level security;
alter table public.rate_cards enable row level security;
alter table public.rate_card_lines enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_lines enable row level security;

-- Read and write gates use the txg_can_read / txg_can_write helpers so role expansion is a one-line edit.
drop policy if exists "customers_rw" on public.customers;
create policy "customers_rw" on public.customers for all to authenticated
using (public.txg_can_read(workspace_id))
with check (public.txg_can_write(workspace_id));

drop policy if exists "customer_contacts_rw" on public.customer_contacts;
create policy "customer_contacts_rw" on public.customer_contacts for all to authenticated
using (public.txg_can_read(workspace_id))
with check (public.txg_can_write(workspace_id));

drop policy if exists "contracts_rw" on public.contracts;
create policy "contracts_rw" on public.contracts for all to authenticated
using (public.txg_can_read(workspace_id))
with check (public.txg_can_write(workspace_id));

drop policy if exists "customer_services_rw" on public.customer_services;
create policy "customer_services_rw" on public.customer_services for all to authenticated
using (public.txg_can_read(workspace_id))
with check (public.txg_can_write(workspace_id));

drop policy if exists "rate_cards_rw" on public.rate_cards;
create policy "rate_cards_rw" on public.rate_cards for all to authenticated
using (public.txg_can_read(workspace_id))
with check (public.txg_can_write(workspace_id));

drop policy if exists "rate_card_lines_rw" on public.rate_card_lines;
create policy "rate_card_lines_rw" on public.rate_card_lines for all to authenticated
using (
  exists (select 1 from public.rate_cards rc
    where rc.id = rate_card_lines.rate_card_id and public.txg_can_read(rc.workspace_id))
)
with check (
  exists (select 1 from public.rate_cards rc
    where rc.id = rate_card_lines.rate_card_id and public.txg_can_write(rc.workspace_id))
);

drop policy if exists "quotes_rw" on public.quotes;
create policy "quotes_rw" on public.quotes for all to authenticated
using (public.txg_can_read(workspace_id))
with check (public.txg_can_write(workspace_id));

drop policy if exists "quote_lines_rw" on public.quote_lines;
create policy "quote_lines_rw" on public.quote_lines for all to authenticated
using (
  exists (select 1 from public.quotes q
    where q.id = quote_lines.quote_id and public.txg_can_read(q.workspace_id))
)
with check (
  exists (select 1 from public.quotes q
    where q.id = quote_lines.quote_id and public.txg_can_write(q.workspace_id))
);
