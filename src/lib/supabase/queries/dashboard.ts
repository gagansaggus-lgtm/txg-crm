import type { SupabaseClient } from "@supabase/supabase-js";

export type DashboardSnapshot = {
  customers: { total: number; active: number };
  receipts: { open: number; today: number };
  orders: { pending: number; today: number };
  shipments: { outToday: number; inTransit: number; exceptions: number };
  tickets: { open: number; overdue: number };
  wms: { lastRunAt: string | null; lastSource: string | null };
};

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfTodayIso() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

async function countRows(
  supabase: SupabaseClient,
  table: string,
  filters: Array<[string, unknown]> = [],
  range?: { column: string; gte?: string; lte?: string; not?: string },
) {
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  for (const [col, val] of filters) {
    if (Array.isArray(val)) query = query.in(col, val as unknown[]);
    else query = query.eq(col, val as string);
  }
  if (range?.gte) query = query.gte(range.column, range.gte);
  if (range?.lte) query = query.lte(range.column, range.lte);
  if (range?.not) query = query.not(range.column, "is", range.not);
  const { count } = await query;
  return count ?? 0;
}

export async function getDashboardSnapshot(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<DashboardSnapshot> {
  const today = { gte: startOfTodayIso(), lte: endOfTodayIso() };

  const [
    customersTotal,
    customersActive,
    receiptsOpen,
    receiptsToday,
    ordersPending,
    ordersToday,
    shipmentsOutToday,
    shipmentsInTransit,
    shipmentsExceptions,
    ticketsOpen,
    ticketsOverdue,
    wmsLast,
  ] = await Promise.all([
    countRows(supabase, "customers", [["workspace_id", workspaceId]]),
    countRows(supabase, "customers", [
      ["workspace_id", workspaceId],
      ["status", "active"],
    ]),
    countRows(supabase, "inbound_receipts", [
      ["workspace_id", workspaceId],
      ["status", ["expected", "arrived", "receiving"]],
    ]),
    countRows(
      supabase,
      "inbound_receipts",
      [["workspace_id", workspaceId]],
      { column: "expected_at", gte: today.gte, lte: today.lte },
    ),
    countRows(supabase, "fulfillment_orders", [
      ["workspace_id", workspaceId],
      ["status", ["new", "allocated", "picking", "packed"]],
    ]),
    countRows(
      supabase,
      "fulfillment_orders",
      [["workspace_id", workspaceId]],
      { column: "required_ship_date", gte: today.gte.slice(0, 10), lte: today.lte.slice(0, 10) },
    ),
    countRows(
      supabase,
      "shipments",
      [["workspace_id", workspaceId]],
      { column: "shipped_at", gte: today.gte, lte: today.lte },
    ),
    countRows(supabase, "shipments", [
      ["workspace_id", workspaceId],
      ["status", ["picked_up", "in_transit", "out_for_delivery"]],
    ]),
    countRows(supabase, "shipments", [
      ["workspace_id", workspaceId],
      ["status", "exception"],
    ]),
    countRows(supabase, "tickets", [
      ["workspace_id", workspaceId],
      ["status", ["open", "pending"]],
    ]),
    countRows(
      supabase,
      "tickets",
      [["workspace_id", workspaceId]],
      { column: "due_at", lte: new Date().toISOString() },
    ),
    supabase
      .from("wms_integration_log")
      .select("run_started_at, source")
      .eq("workspace_id", workspaceId)
      .order("run_started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    customers: { total: customersTotal, active: customersActive },
    receipts: { open: receiptsOpen, today: receiptsToday },
    orders: { pending: ordersPending, today: ordersToday },
    shipments: { outToday: shipmentsOutToday, inTransit: shipmentsInTransit, exceptions: shipmentsExceptions },
    tickets: { open: ticketsOpen, overdue: ticketsOverdue },
    wms: {
      lastRunAt: (wmsLast.data?.run_started_at as string | null) ?? null,
      lastSource: (wmsLast.data?.source as string | null) ?? null,
    },
  };
}
