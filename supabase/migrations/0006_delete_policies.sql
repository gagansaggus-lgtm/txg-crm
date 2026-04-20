-- DELETE is admin-only across all TXG domain tables. Same pattern as Ekkko's 0004.
create or replace function public.txg_can_delete(target_workspace_id uuid)
returns boolean language sql stable as $$
  select public.workspace_role(target_workspace_id) = 'admin';
$$;

do $$
declare
  tbl text;
  ws_tables text[] := array[
    'customers','customer_contacts','contracts','customer_services',
    'rate_cards','quotes','facilities','facility_zones','skus',
    'inbound_receipts','fulfillment_orders','shipments',
    'tickets','activities','tasks','wms_sync_cursor','wms_integration_log'
  ];
begin
  foreach tbl in array ws_tables loop
    execute format('drop policy if exists "%I_delete_admin" on public.%I;', tbl, tbl);
    execute format(
      'create policy "%I_delete_admin" on public.%I for delete to authenticated using (public.txg_can_delete(workspace_id));',
      tbl, tbl
    );
  end loop;
end$$;

-- Child tables scoped via parent workspace.
drop policy if exists "rate_card_lines_delete_admin" on public.rate_card_lines;
create policy "rate_card_lines_delete_admin" on public.rate_card_lines for delete to authenticated
using (
  exists (select 1 from public.rate_cards rc
    where rc.id = rate_card_lines.rate_card_id and public.txg_can_delete(rc.workspace_id))
);

drop policy if exists "quote_lines_delete_admin" on public.quote_lines;
create policy "quote_lines_delete_admin" on public.quote_lines for delete to authenticated
using (
  exists (select 1 from public.quotes q
    where q.id = quote_lines.quote_id and public.txg_can_delete(q.workspace_id))
);

drop policy if exists "inbound_receipt_lines_delete_admin" on public.inbound_receipt_lines;
create policy "inbound_receipt_lines_delete_admin" on public.inbound_receipt_lines for delete to authenticated
using (
  exists (select 1 from public.inbound_receipts r
    where r.id = inbound_receipt_lines.receipt_id and public.txg_can_delete(r.workspace_id))
);

drop policy if exists "fulfillment_order_lines_delete_admin" on public.fulfillment_order_lines;
create policy "fulfillment_order_lines_delete_admin" on public.fulfillment_order_lines for delete to authenticated
using (
  exists (select 1 from public.fulfillment_orders o
    where o.id = fulfillment_order_lines.order_id and public.txg_can_delete(o.workspace_id))
);

drop policy if exists "shipment_events_delete_admin" on public.shipment_events;
create policy "shipment_events_delete_admin" on public.shipment_events for delete to authenticated
using (
  exists (select 1 from public.shipments s
    where s.id = shipment_events.shipment_id and public.txg_can_delete(s.workspace_id))
);

drop policy if exists "ticket_messages_delete_admin" on public.ticket_messages;
create policy "ticket_messages_delete_admin" on public.ticket_messages for delete to authenticated
using (
  exists (select 1 from public.tickets t
    where t.id = ticket_messages.ticket_id and public.txg_can_delete(t.workspace_id))
);
