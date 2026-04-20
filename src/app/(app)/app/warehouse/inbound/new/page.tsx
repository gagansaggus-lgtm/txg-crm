import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { InboundReceiptForm } from "@/components/warehouse/inbound-receipt-form";
import { listCustomers } from "@/lib/supabase/queries/customers";
import { listFacilities } from "@/lib/supabase/queries/warehouse";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function NewInboundReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>;
}) {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const { customer } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const [customers, facilities] = await Promise.all([
    listCustomers(supabase, ctx.workspaceId),
    listFacilities(supabase, ctx.workspaceId),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Warehouse"
        title="New inbound receipt"
        subtitle="Log expected inbound product. Add line items once it arrives."
      />
      <Card>
        {customers.length === 0 ? (
          <p className="text-sm text-[var(--ink-500)]">Add a customer first.</p>
        ) : facilities.length === 0 ? (
          <p className="text-sm text-[var(--ink-500)]">Seed facilities are missing. Run 0007_seed.sql.</p>
        ) : (
          <InboundReceiptForm
            workspaceId={ctx.workspaceId}
            customers={customers.map((c) => ({ id: c.id, display_name: c.display_name }))}
            facilities={facilities.map((f) => ({ id: f.id, code: f.code, name: f.name }))}
            defaultCustomerId={customer}
          />
        )}
      </Card>
    </div>
  );
}
