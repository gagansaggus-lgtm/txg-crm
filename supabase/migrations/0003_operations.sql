-- Facilities, SKUs, inbound receipts, fulfillment orders, shipments, shipment events.

create table if not exists public.facilities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  code text not null,
  name text not null,
  address_line1 text,
  address_line2 text,
  city text,
  region text,
  postal text,
  country text,
  timezone text default 'America/New_York',
  currency text default 'USD',
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, code)
);

create table if not exists public.facility_zones (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  code text not null,
  name text not null,
  zone_type text not null check (zone_type in ('receiving', 'storage', 'staging', 'shipping')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (facility_id, code)
);

create table if not exists public.skus (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  sku_code text not null,
  description text,
  uom text default 'each',
  length_cm numeric(10, 2),
  width_cm numeric(10, 2),
  height_cm numeric(10, 2),
  weight_kg numeric(10, 3),
  hazmat boolean not null default false,
  wms_external_id text,
  wms_last_synced_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (customer_id, sku_code)
);
create index if not exists idx_skus_workspace_customer on public.skus(workspace_id, customer_id);
create index if not exists idx_skus_wms_external on public.skus(wms_external_id);

create table if not exists public.inbound_receipts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete restrict,
  receipt_number text,
  expected_at timestamptz,
  received_at timestamptz,
  status text not null default 'expected' check (status in ('expected', 'arrived', 'receiving', 'received', 'closed')),
  carrier text,
  bol_number text,
  notes text,
  wms_external_id text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_receipts_customer_status on public.inbound_receipts(customer_id, status);
create index if not exists idx_receipts_facility on public.inbound_receipts(facility_id, expected_at);

create table if not exists public.inbound_receipt_lines (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.inbound_receipts(id) on delete cascade,
  sku_id uuid references public.skus(id) on delete set null,
  sku_code text,
  description text,
  expected_qty numeric(12, 2) not null default 0,
  received_qty numeric(12, 2) not null default 0,
  uom text default 'each',
  lot_code text,
  condition text default 'good'
);
create index if not exists idx_receipt_lines_receipt on public.inbound_receipt_lines(receipt_id);

create table if not exists public.fulfillment_orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete restrict,
  order_number text,
  external_order_id text,
  channel text not null default 'manual' check (channel in ('manual', 'shopify', 'csv', 'api')),
  status text not null default 'new' check (status in ('new', 'allocated', 'picking', 'packed', 'shipped', 'cancelled')),
  required_ship_date date,
  ship_to_name text,
  ship_to_address_line1 text,
  ship_to_address_line2 text,
  ship_to_city text,
  ship_to_region text,
  ship_to_postal text,
  ship_to_country text,
  ship_to_phone text,
  notes text,
  wms_external_id text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_orders_customer_status on public.fulfillment_orders(customer_id, status, required_ship_date);
create index if not exists idx_orders_facility_status on public.fulfillment_orders(facility_id, status);

create table if not exists public.fulfillment_order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.fulfillment_orders(id) on delete cascade,
  sku_id uuid references public.skus(id) on delete set null,
  sku_code text,
  description text,
  qty numeric(12, 2) not null default 0,
  picked_qty numeric(12, 2) not null default 0,
  notes text
);
create index if not exists idx_order_lines_order on public.fulfillment_order_lines(order_id);

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete set null,
  fulfillment_order_id uuid references public.fulfillment_orders(id) on delete set null,
  shipment_number text,
  type text not null default 'outbound_fulfillment' check (type in ('outbound_fulfillment', 'last_mile', 'international')),
  carrier text,
  service_level text,
  tracking_number text,
  status text not null default 'pending' check (status in ('pending', 'label_created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'exception')),
  shipped_at timestamptz,
  delivered_at timestamptz,
  weight_kg numeric(10, 3),
  length_cm numeric(10, 2),
  width_cm numeric(10, 2),
  height_cm numeric(10, 2),
  cost numeric(12, 2),
  charge numeric(12, 2),
  notes text,
  wms_external_id text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_shipments_customer_status on public.shipments(customer_id, status);
create index if not exists idx_shipments_tracking on public.shipments(tracking_number);
create index if not exists idx_shipments_facility on public.shipments(facility_id, shipped_at);

create table if not exists public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  event_code text not null,
  event_at timestamptz not null default timezone('utc', now()),
  location text,
  notes text,
  source text not null default 'manual' check (source in ('carrier', 'scan', 'manual'))
);
create index if not exists idx_shipment_events_shipment on public.shipment_events(shipment_id, event_at);

-- updated_at triggers
drop trigger if exists skus_set_updated_at on public.skus;
create trigger skus_set_updated_at before update on public.skus
for each row execute procedure public.set_updated_at();

drop trigger if exists receipts_set_updated_at on public.inbound_receipts;
create trigger receipts_set_updated_at before update on public.inbound_receipts
for each row execute procedure public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.fulfillment_orders;
create trigger orders_set_updated_at before update on public.fulfillment_orders
for each row execute procedure public.set_updated_at();

drop trigger if exists shipments_set_updated_at on public.shipments;
create trigger shipments_set_updated_at before update on public.shipments
for each row execute procedure public.set_updated_at();

-- RLS
alter table public.facilities enable row level security;
alter table public.facility_zones enable row level security;
alter table public.skus enable row level security;
alter table public.inbound_receipts enable row level security;
alter table public.inbound_receipt_lines enable row level security;
alter table public.fulfillment_orders enable row level security;
alter table public.fulfillment_order_lines enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_events enable row level security;

drop policy if exists "facilities_rw" on public.facilities;
create policy "facilities_rw" on public.facilities for all to authenticated
using (public.txg_can_read(workspace_id))
with check (public.txg_can_write(workspace_id));

drop policy if exists "facility_zones_rw" on public.facility_zones;
create policy "facility_zones_rw" on public.facility_zones for all to authenticated
using (public.txg_can_read(workspace_id))
with check (public.txg_can_write(workspace_id));

drop policy if exists "skus_rw" on public.skus;
create policy "skus_rw" on public.skus for all to authenticated
using (public.txg_can_read(workspace_id))
with check (public.txg_can_write(workspace_id));

drop policy if exists "inbound_receipts_rw" on public.inbound_receipts;
create policy "inbound_receipts_rw" on public.inbound_receipts for all to authenticated
using (public.txg_can_read(workspace_id))
with check (public.txg_can_write(workspace_id));

drop policy if exists "inbound_receipt_lines_rw" on public.inbound_receipt_lines;
create policy "inbound_receipt_lines_rw" on public.inbound_receipt_lines for all to authenticated
using (
  exists (select 1 from public.inbound_receipts r
    where r.id = inbound_receipt_lines.receipt_id and public.txg_can_read(r.workspace_id))
)
with check (
  exists (select 1 from public.inbound_receipts r
    where r.id = inbound_receipt_lines.receipt_id and public.txg_can_write(r.workspace_id))
);

drop policy if exists "fulfillment_orders_rw" on public.fulfillment_orders;
create policy "fulfillment_orders_rw" on public.fulfillment_orders for all to authenticated
using (public.txg_can_read(workspace_id))
with check (public.txg_can_write(workspace_id));

drop policy if exists "fulfillment_order_lines_rw" on public.fulfillment_order_lines;
create policy "fulfillment_order_lines_rw" on public.fulfillment_order_lines for all to authenticated
using (
  exists (select 1 from public.fulfillment_orders o
    where o.id = fulfillment_order_lines.order_id and public.txg_can_read(o.workspace_id))
)
with check (
  exists (select 1 from public.fulfillment_orders o
    where o.id = fulfillment_order_lines.order_id and public.txg_can_write(o.workspace_id))
);

drop policy if exists "shipments_rw" on public.shipments;
create policy "shipments_rw" on public.shipments for all to authenticated
using (public.txg_can_read(workspace_id))
with check (public.txg_can_write(workspace_id));

drop policy if exists "shipment_events_rw" on public.shipment_events;
create policy "shipment_events_rw" on public.shipment_events for all to authenticated
using (
  exists (select 1 from public.shipments s
    where s.id = shipment_events.shipment_id and public.txg_can_read(s.workspace_id))
)
with check (
  exists (select 1 from public.shipments s
    where s.id = shipment_events.shipment_id and public.txg_can_write(s.workspace_id))
);

-- Guard workspace_members.facility_id against dangling refs.
alter table public.workspace_members
  drop constraint if exists workspace_members_facility_id_fkey,
  add constraint workspace_members_facility_id_fkey
    foreign key (facility_id) references public.facilities(id) on delete set null;
