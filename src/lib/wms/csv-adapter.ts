import Papa from "papaparse";

import type {
  WmsAdapter,
  WmsEntity,
  WmsOrderRow,
  WmsReceiptRow,
  WmsRow,
  WmsShipmentRow,
  WmsSkuRow,
} from "./adapter";

// CSV header names are normalized to snake_case, so headers like "SKU Code" or "sku-code" map to sku_code.
function normalizeHeader(h: string) {
  return h
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function toNum(v: unknown): number | undefined {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function toBool(v: unknown): boolean | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const s = String(v).trim().toLowerCase();
  if (["true", "yes", "y", "1"].includes(s)) return true;
  if (["false", "no", "n", "0"].includes(s)) return false;
  return undefined;
}

function toIso(v: unknown): string | undefined {
  if (!v) return undefined;
  const s = String(v).trim();
  if (!s) return undefined;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export class CsvWmsAdapter implements WmsAdapter {
  async parseCsv(entity: WmsEntity, csv: string): Promise<WmsRow[]> {
    const parsed = Papa.parse<Record<string, string>>(csv, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeHeader,
    });
    if (parsed.errors?.length) {
      const first = parsed.errors[0];
      throw new Error(`CSV parse error at row ${first.row}: ${first.message}`);
    }

    const rows = parsed.data ?? [];

    switch (entity) {
      case "skus":
        return rows.map((r): WmsSkuRow => ({
          customer_external_id: r.customer_external_id || r.customer_id || undefined,
          customer_display_name: r.customer || r.customer_name || r.customer_display_name || undefined,
          sku_code: r.sku_code || r.sku || "",
          description: r.description,
          uom: r.uom || r.unit || undefined,
          length_cm: toNum(r.length_cm ?? r.length),
          width_cm: toNum(r.width_cm ?? r.width),
          height_cm: toNum(r.height_cm ?? r.height),
          weight_kg: toNum(r.weight_kg ?? r.weight),
          hazmat: toBool(r.hazmat),
          wms_external_id: r.wms_external_id || r.external_id || undefined,
        }));
      case "receipts":
        return rows.map((r): WmsReceiptRow => ({
          wms_external_id: r.wms_external_id || r.external_id || undefined,
          receipt_number: r.receipt_number || r.receipt || undefined,
          customer_display_name: r.customer || r.customer_name || undefined,
          facility_code: r.facility_code || r.facility || undefined,
          expected_at: toIso(r.expected_at ?? r.expected),
          received_at: toIso(r.received_at ?? r.received),
          status: r.status,
          carrier: r.carrier,
          bol_number: r.bol_number || r.bol || undefined,
        }));
      case "orders":
        return rows.map((r): WmsOrderRow => ({
          wms_external_id: r.wms_external_id || r.external_id || undefined,
          order_number: r.order_number || r.order || undefined,
          customer_display_name: r.customer || r.customer_name || undefined,
          facility_code: r.facility_code || r.facility || undefined,
          required_ship_date: r.required_ship_date || r.ship_date || undefined,
          status: r.status,
          ship_to_name: r.ship_to_name || r.ship_to,
          ship_to_city: r.ship_to_city || r.city,
          ship_to_region: r.ship_to_region || r.region || r.state,
          ship_to_country: r.ship_to_country || r.country,
        }));
      case "shipments":
        return rows.map((r): WmsShipmentRow => ({
          wms_external_id: r.wms_external_id || r.external_id || undefined,
          shipment_number: r.shipment_number || r.shipment || undefined,
          tracking_number: r.tracking_number || r.tracking,
          customer_display_name: r.customer || r.customer_name || undefined,
          facility_code: r.facility_code || r.facility || undefined,
          carrier: r.carrier,
          service_level: r.service_level || r.service || undefined,
          status: r.status,
          shipped_at: toIso(r.shipped_at ?? r.shipped),
          delivered_at: toIso(r.delivered_at ?? r.delivered),
          weight_kg: toNum(r.weight_kg ?? r.weight),
        }));
    }
  }
}
