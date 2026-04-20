// Pluggable WMS adapter. Day 1: CSV. Next: direct API once the vendor is confirmed.

export type WmsEntity = "skus" | "receipts" | "orders" | "shipments";

export type WmsSkuRow = {
  customer_external_id?: string;
  customer_display_name?: string;
  sku_code: string;
  description?: string;
  uom?: string;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  weight_kg?: number;
  hazmat?: boolean;
  wms_external_id?: string;
};

export type WmsReceiptRow = {
  wms_external_id?: string;
  receipt_number?: string;
  customer_display_name?: string;
  facility_code?: string;
  expected_at?: string;
  received_at?: string;
  status?: string;
  carrier?: string;
  bol_number?: string;
};

export type WmsOrderRow = {
  wms_external_id?: string;
  order_number?: string;
  customer_display_name?: string;
  facility_code?: string;
  required_ship_date?: string;
  status?: string;
  ship_to_name?: string;
  ship_to_city?: string;
  ship_to_region?: string;
  ship_to_country?: string;
};

export type WmsShipmentRow = {
  wms_external_id?: string;
  shipment_number?: string;
  tracking_number?: string;
  customer_display_name?: string;
  facility_code?: string;
  carrier?: string;
  service_level?: string;
  status?: string;
  shipped_at?: string;
  delivered_at?: string;
  weight_kg?: number;
};

export type WmsRow =
  | WmsSkuRow
  | WmsReceiptRow
  | WmsOrderRow
  | WmsShipmentRow;

export interface WmsAdapter {
  parseCsv(entity: WmsEntity, csv: string): Promise<WmsRow[]>;
}
