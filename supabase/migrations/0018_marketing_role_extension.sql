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
