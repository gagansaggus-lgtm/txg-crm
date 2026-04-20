export type ServiceType =
  | "last_mile"
  | "warehousing"
  | "fulfillment"
  | "international_courier";

export type CustomerStatus = "prospect" | "active" | "churned";

export type ReceiptStatus =
  | "expected"
  | "arrived"
  | "receiving"
  | "received"
  | "closed";

export type OrderStatus =
  | "new"
  | "allocated"
  | "picking"
  | "packed"
  | "shipped"
  | "cancelled";

export type ShipmentStatus =
  | "pending"
  | "label_created"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "exception";

export type ShipmentType = "outbound_fulfillment" | "last_mile" | "international";

export type Facility = {
  id: string;
  workspace_id: string;
  code: string;
  name: string;
  city: string | null;
  region: string | null;
  country: string | null;
  timezone: string | null;
  currency: string | null;
  active: boolean;
};

export type Customer = {
  id: string;
  workspace_id: string;
  legal_name: string;
  display_name: string;
  status: CustomerStatus;
  billing_email: string | null;
  billing_phone: string | null;
  billing_city: string | null;
  billing_region: string | null;
  billing_country: string | null;
  payment_terms: string | null;
  currency: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomerContact = {
  id: string;
  workspace_id: string;
  customer_id: string;
  full_name: string;
  role_title: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
};

export type CustomerService = {
  id: string;
  customer_id: string;
  service_type: ServiceType;
  contract_id: string | null;
  active: boolean;
  started_at: string | null;
};

export type Contract = {
  id: string;
  customer_id: string;
  name: string;
  status: "draft" | "active" | "expired" | "terminated";
  effective_date: string | null;
  end_date: string | null;
};

export type Quote = {
  id: string;
  customer_id: string;
  quote_number: string | null;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  valid_until: string | null;
  currency: string;
  total: number;
  created_at: string;
};

export type InboundReceipt = {
  id: string;
  workspace_id: string;
  customer_id: string;
  facility_id: string;
  receipt_number: string | null;
  expected_at: string | null;
  received_at: string | null;
  status: ReceiptStatus;
  carrier: string | null;
  bol_number: string | null;
  notes: string | null;
  created_at: string;
};

export type FulfillmentOrder = {
  id: string;
  workspace_id: string;
  customer_id: string;
  facility_id: string;
  order_number: string | null;
  status: OrderStatus;
  channel: string;
  required_ship_date: string | null;
  ship_to_name: string | null;
  ship_to_city: string | null;
  ship_to_region: string | null;
  ship_to_country: string | null;
  created_at: string;
};

export type Shipment = {
  id: string;
  workspace_id: string;
  customer_id: string;
  facility_id: string | null;
  fulfillment_order_id: string | null;
  shipment_number: string | null;
  type: ShipmentType;
  carrier: string | null;
  service_level: string | null;
  tracking_number: string | null;
  status: ShipmentStatus;
  shipped_at: string | null;
  delivered_at: string | null;
  cost: number | null;
  charge: number | null;
  created_at: string;
};

export type Sku = {
  id: string;
  customer_id: string;
  sku_code: string;
  description: string | null;
  uom: string | null;
  weight_kg: number | null;
  wms_external_id: string | null;
  wms_last_synced_at: string | null;
};

export type WorkspaceMember = {
  id: string;
  workspace_id: string;
  user_id: string;
  role:
    | "admin"
    | "ops_lead"
    | "ops_rep"
    | "warehouse_lead"
    | "warehouse_staff"
    | "driver"
    | "sales"
    | "customer_contact";
  status: "invited" | "active" | "disabled";
  facility_id: string | null;
};
