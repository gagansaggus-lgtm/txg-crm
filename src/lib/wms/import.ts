import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  WmsEntity,
  WmsOrderRow,
  WmsReceiptRow,
  WmsRow,
  WmsShipmentRow,
  WmsSkuRow,
} from "./adapter";

export type ImportResult = {
  rowsIn: number;
  rowsOk: number;
  rowsFailed: number;
  errors: string[];
};

type Maps = {
  customersByName: Map<string, string>;
  facilitiesByCode: Map<string, string>;
};

async function loadMaps(supabase: SupabaseClient, workspaceId: string): Promise<Maps> {
  const [custRes, facRes] = await Promise.all([
    supabase.from("customers").select("id, display_name").eq("workspace_id", workspaceId),
    supabase.from("facilities").select("id, code").eq("workspace_id", workspaceId),
  ]);
  const customersByName = new Map<string, string>();
  (custRes.data ?? []).forEach((c: { id: string; display_name: string }) =>
    customersByName.set(c.display_name.toLowerCase(), c.id),
  );
  const facilitiesByCode = new Map<string, string>();
  (facRes.data ?? []).forEach((f: { id: string; code: string }) =>
    facilitiesByCode.set(f.code.toUpperCase(), f.id),
  );
  return { customersByName, facilitiesByCode };
}

export async function runImport(
  supabase: SupabaseClient,
  workspaceId: string,
  entity: WmsEntity,
  rows: WmsRow[],
): Promise<ImportResult> {
  const result: ImportResult = { rowsIn: rows.length, rowsOk: 0, rowsFailed: 0, errors: [] };
  if (!rows.length) return result;

  const { customersByName, facilitiesByCode } = await loadMaps(supabase, workspaceId);

  if (entity === "skus") {
    const upserts: Array<Record<string, unknown>> = [];
    (rows as WmsSkuRow[]).forEach((r, idx) => {
      const customerId = r.customer_display_name
        ? customersByName.get(r.customer_display_name.toLowerCase())
        : undefined;
      if (!customerId) {
        result.rowsFailed++;
        result.errors.push(`Row ${idx + 2}: unknown customer "${r.customer_display_name ?? "(blank)"}"`);
        return;
      }
      if (!r.sku_code) {
        result.rowsFailed++;
        result.errors.push(`Row ${idx + 2}: missing sku_code`);
        return;
      }
      upserts.push({
        workspace_id: workspaceId,
        customer_id: customerId,
        sku_code: r.sku_code,
        description: r.description ?? null,
        uom: r.uom ?? "each",
        length_cm: r.length_cm ?? null,
        width_cm: r.width_cm ?? null,
        height_cm: r.height_cm ?? null,
        weight_kg: r.weight_kg ?? null,
        hazmat: r.hazmat ?? false,
        wms_external_id: r.wms_external_id ?? null,
        wms_last_synced_at: new Date().toISOString(),
      });
    });
    if (upserts.length) {
      const { error } = await supabase
        .from("skus")
        .upsert(upserts, { onConflict: "customer_id,sku_code" });
      if (error) {
        result.rowsFailed += upserts.length;
        result.errors.push(`Upsert error: ${error.message}`);
      } else {
        result.rowsOk += upserts.length;
      }
    }
    return result;
  }

  if (entity === "receipts") {
    const upserts: Array<Record<string, unknown>> = [];
    (rows as WmsReceiptRow[]).forEach((r, idx) => {
      const customerId = r.customer_display_name
        ? customersByName.get(r.customer_display_name.toLowerCase())
        : undefined;
      const facilityId = r.facility_code
        ? facilitiesByCode.get(r.facility_code.toUpperCase())
        : undefined;
      if (!customerId || !facilityId) {
        result.rowsFailed++;
        result.errors.push(
          `Row ${idx + 2}: customer="${r.customer_display_name ?? ""}" / facility="${r.facility_code ?? ""}" unresolved`,
        );
        return;
      }
      upserts.push({
        workspace_id: workspaceId,
        customer_id: customerId,
        facility_id: facilityId,
        receipt_number: r.receipt_number ?? null,
        expected_at: r.expected_at ?? null,
        received_at: r.received_at ?? null,
        status: r.status ?? "expected",
        carrier: r.carrier ?? null,
        bol_number: r.bol_number ?? null,
        wms_external_id: r.wms_external_id ?? null,
      });
    });
    for (const row of upserts) {
      const { error } = row.wms_external_id
        ? await supabase.from("inbound_receipts").upsert(row, { onConflict: "wms_external_id" })
        : await supabase.from("inbound_receipts").insert(row);
      if (error) {
        result.rowsFailed++;
        result.errors.push(`Upsert error: ${error.message}`);
      } else {
        result.rowsOk++;
      }
    }
    return result;
  }

  if (entity === "orders") {
    const upserts: Array<Record<string, unknown>> = [];
    (rows as WmsOrderRow[]).forEach((r, idx) => {
      const customerId = r.customer_display_name
        ? customersByName.get(r.customer_display_name.toLowerCase())
        : undefined;
      const facilityId = r.facility_code
        ? facilitiesByCode.get(r.facility_code.toUpperCase())
        : undefined;
      if (!customerId || !facilityId) {
        result.rowsFailed++;
        result.errors.push(
          `Row ${idx + 2}: customer="${r.customer_display_name ?? ""}" / facility="${r.facility_code ?? ""}" unresolved`,
        );
        return;
      }
      upserts.push({
        workspace_id: workspaceId,
        customer_id: customerId,
        facility_id: facilityId,
        order_number: r.order_number ?? null,
        required_ship_date: r.required_ship_date ?? null,
        status: r.status ?? "new",
        channel: "csv",
        ship_to_name: r.ship_to_name ?? null,
        ship_to_city: r.ship_to_city ?? null,
        ship_to_region: r.ship_to_region ?? null,
        ship_to_country: r.ship_to_country ?? null,
        wms_external_id: r.wms_external_id ?? null,
      });
    });
    for (const row of upserts) {
      const { error } = row.wms_external_id
        ? await supabase.from("fulfillment_orders").upsert(row, { onConflict: "wms_external_id" })
        : await supabase.from("fulfillment_orders").insert(row);
      if (error) {
        result.rowsFailed++;
        result.errors.push(`Upsert error: ${error.message}`);
      } else {
        result.rowsOk++;
      }
    }
    return result;
  }

  // shipments
  const upserts: Array<Record<string, unknown>> = [];
  (rows as WmsShipmentRow[]).forEach((r, idx) => {
    const customerId = r.customer_display_name
      ? customersByName.get(r.customer_display_name.toLowerCase())
      : undefined;
    const facilityId = r.facility_code
      ? facilitiesByCode.get(r.facility_code.toUpperCase())
      : undefined;
    if (!customerId) {
      result.rowsFailed++;
      result.errors.push(`Row ${idx + 2}: unknown customer "${r.customer_display_name ?? ""}"`);
      return;
    }
    upserts.push({
      workspace_id: workspaceId,
      customer_id: customerId,
      facility_id: facilityId ?? null,
      shipment_number: r.shipment_number ?? null,
      tracking_number: r.tracking_number ?? null,
      carrier: r.carrier ?? null,
      service_level: r.service_level ?? null,
      status: r.status ?? "pending",
      shipped_at: r.shipped_at ?? null,
      delivered_at: r.delivered_at ?? null,
      weight_kg: r.weight_kg ?? null,
      wms_external_id: r.wms_external_id ?? null,
      type: "outbound_fulfillment",
    });
  });
  for (const row of upserts) {
    const { error } = row.wms_external_id
      ? await supabase.from("shipments").upsert(row, { onConflict: "wms_external_id" })
      : await supabase.from("shipments").insert(row);
    if (error) {
      result.rowsFailed++;
      result.errors.push(`Upsert error: ${error.message}`);
    } else {
      result.rowsOk++;
    }
  }
  return result;
}
