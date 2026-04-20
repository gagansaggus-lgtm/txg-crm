-- Seed: creates the TXG workspace + both facilities, then wires every existing auth user as admin.
-- Safe to re-run.

insert into public.workspaces (slug, name)
values ('txg', 'Transway Xpress Global')
on conflict (slug) do nothing;

with txg as (select id from public.workspaces where slug = 'txg')
insert into public.facilities (workspace_id, code, name, city, region, country, timezone, currency)
select txg.id, v.code, v.name, v.city, v.region, v.country, v.tz, v.cur
from txg
cross join (values
  ('BUF', 'Buffalo Warehouse', 'Buffalo', 'NY', 'US', 'America/New_York', 'USD'),
  ('ETB', 'Etobicoke Facility', 'Etobicoke', 'ON', 'CA', 'America/Toronto', 'CAD')
) as v(code, name, city, region, country, tz, cur)
on conflict (workspace_id, code) do nothing;

-- Default zones for each facility.
with f as (select id, code from public.facilities where workspace_id = (select id from public.workspaces where slug = 'txg'))
insert into public.facility_zones (workspace_id, facility_id, code, name, zone_type)
select (select id from public.workspaces where slug = 'txg'), f.id, z.code, z.name, z.zone_type
from f
cross join (values
  ('RCV', 'Receiving', 'receiving'),
  ('STG', 'Staging', 'staging'),
  ('STR', 'Storage', 'storage'),
  ('SHP', 'Shipping', 'shipping')
) as z(code, name, zone_type)
on conflict (facility_id, code) do nothing;

-- Wire every existing auth user as an admin of TXG (you + Angad after you both sign up).
insert into public.workspace_members (workspace_id, user_id, role, status)
select (select id from public.workspaces where slug = 'txg'), p.id, 'admin', 'active'
from public.profiles p
on conflict (workspace_id, user_id) do nothing;
