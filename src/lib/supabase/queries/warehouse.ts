import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Facility,
  FulfillmentOrder,
  InboundReceipt,
  Shipment,
  Sku,
} from "@/types/db";

export async function listFacilities(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<Facility[]> {
  const { data, error } = await supabase
    .from("facilities")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("active", true)
    .order("code");
  if (error) throw error;
  return (data ?? []) as Facility[];
}

export async function listInboundReceipts(
  supabase: SupabaseClient,
  workspaceId: string,
  filters: { facilityId?: string | null; customerId?: string | null } = {},
): Promise<Array<InboundReceipt & { customer_name: string | null; facility_code: string | null }>> {
  let query = supabase
    .from("inbound_receipts")
    .select(
      "*, customers(display_name), facilities(code)",
    )
    .eq("workspace_id", workspaceId)
    .order("expected_at", { ascending: false, nullsFirst: false });
  if (filters.facilityId) query = query.eq("facility_id", filters.facilityId);
  if (filters.customerId) query = query.eq("customer_id", filters.customerId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...(row as unknown as InboundReceipt),
    customer_name:
      ((row as { customers?: { display_name?: string } }).customers?.display_name) ?? null,
    facility_code:
      ((row as { facilities?: { code?: string } }).facilities?.code) ?? null,
  }));
}

export async function listFulfillmentOrders(
  supabase: SupabaseClient,
  workspaceId: string,
  filters: { facilityId?: string | null; status?: string } = {},
): Promise<Array<FulfillmentOrder & { customer_name: string | null; facility_code: string | null }>> {
  let query = supabase
    .from("fulfillment_orders")
    .select("*, customers(display_name), facilities(code)")
    .eq("workspace_id", workspaceId)
    .order("required_ship_date", { ascending: true, nullsFirst: false });
  if (filters.facilityId) query = query.eq("facility_id", filters.facilityId);
  if (filters.status) query = query.eq("status", filters.status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...(row as unknown as FulfillmentOrder),
    customer_name: ((row as { customers?: { display_name?: string } }).customers?.display_name) ?? null,
    facility_code: ((row as { facilities?: { code?: string } }).facilities?.code) ?? null,
  }));
}

export async function listShipments(
  supabase: SupabaseClient,
  workspaceId: string,
  filters: { facilityId?: string | null; status?: string } = {},
): Promise<Array<Shipment & { customer_name: string | null; facility_code: string | null }>> {
  let query = supabase
    .from("shipments")
    .select("*, customers(display_name), facilities(code)")
    .eq("workspace_id", workspaceId)
    .order("shipped_at", { ascending: false, nullsFirst: false });
  if (filters.facilityId) query = query.eq("facility_id", filters.facilityId);
  if (filters.status) query = query.eq("status", filters.status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...(row as unknown as Shipment),
    customer_name: ((row as { customers?: { display_name?: string } }).customers?.display_name) ?? null,
    facility_code: ((row as { facilities?: { code?: string } }).facilities?.code) ?? null,
  }));
}

export async function listSkus(
  supabase: SupabaseClient,
  workspaceId: string,
  customerId?: string,
): Promise<Array<Sku & { customer_name: string | null }>> {
  let query = supabase
    .from("skus")
    .select("*, customers(display_name)")
    .eq("workspace_id", workspaceId)
    .order("sku_code");
  if (customerId) query = query.eq("customer_id", customerId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...(row as unknown as Sku),
    customer_name: ((row as { customers?: { display_name?: string } }).customers?.display_name) ?? null,
  }));
}
