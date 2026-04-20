import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { ShipmentForm } from "@/components/warehouse/shipment-form";
import { listCustomers } from "@/lib/supabase/queries/customers";
import { listFacilities } from "@/lib/supabase/queries/warehouse";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function NewShipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string; order?: string }>;
}) {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const { customer, order: orderId } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const [customers, facilities] = await Promise.all([
    listCustomers(supabase, ctx.workspaceId),
    listFacilities(supabase, ctx.workspaceId),
  ]);

  let linkedOrder: {
    id: string;
    customer_id: string;
    facility_id: string | null;
    order_number: string | null;
  } | undefined;
  if (orderId) {
    const { data } = await supabase
      .from("fulfillment_orders")
      .select("id, customer_id, facility_id, order_number")
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", orderId)
      .maybeSingle();
    if (data) {
      linkedOrder = {
        id: data.id as string,
        customer_id: data.customer_id as string,
        facility_id: (data.facility_id as string | null) ?? null,
        order_number: (data.order_number as string | null) ?? null,
      };
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Warehouse"
        title="New shipment"
        subtitle="Log an outbound shipment manually. Mark shipped on the detail page to update dashboards."
      />
      <Card>
        {customers.length === 0 ? (
          <p className="text-sm text-[var(--ink-500)]">Add a customer first.</p>
        ) : (
          <ShipmentForm
            workspaceId={ctx.workspaceId}
            customers={customers.map((c) => ({ id: c.id, display_name: c.display_name }))}
            facilities={facilities.map((f) => ({ id: f.id, code: f.code, name: f.name }))}
            defaultCustomerId={customer}
            linkedOrder={linkedOrder}
          />
        )}
      </Card>
    </div>
  );
}
