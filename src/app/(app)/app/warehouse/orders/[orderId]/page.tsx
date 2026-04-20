import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { FacilityBadge } from "@/components/ui/facility-badge";
import { StatusPill, orderStatusTone } from "@/components/ui/status-pill";
import { OrderLinesEditor } from "@/components/warehouse/order-lines-editor";
import { formatDate } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;

  const supabase = await createSupabaseServerClient();
  const { data: order, error } = await supabase
    .from("fulfillment_orders")
    .select("*, customers(id, display_name), facilities(id, code, name)")
    .eq("workspace_id", ctx.workspaceId)
    .eq("id", orderId)
    .maybeSingle();
  if (error || !order) notFound();

  const customer = (order as Record<string, unknown>).customers as { id: string; display_name: string } | null;
  const facility = (order as Record<string, unknown>).facilities as { code: string; name: string } | null;
  const customerId = (order.customer_id as string) || customer?.id || "";

  const [linesRes, skusRes] = await Promise.all([
    supabase
      .from("fulfillment_order_lines")
      .select("*")
      .eq("order_id", orderId)
      .order("id"),
    supabase
      .from("skus")
      .select("id, sku_code, description")
      .eq("workspace_id", ctx.workspaceId)
      .eq("customer_id", customerId)
      .order("sku_code"),
  ]);

  const lines = (linesRes.data ?? []).map((l) => ({
    id: l.id as string,
    sku_code: (l.sku_code as string | null) ?? null,
    description: (l.description as string | null) ?? null,
    qty: Number(l.qty),
    picked_qty: Number(l.picked_qty),
    notes: (l.notes as string | null) ?? null,
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Order"
        title={(order.order_number as string | null) ?? `Order ${String(orderId).slice(0, 8)}`}
        subtitle={customer?.display_name}
        actions={[
          {
            label: "Create shipment",
            href: `/app/warehouse/shipments/new?order=${orderId}`,
          },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusPill label={order.status as string} tone={orderStatusTone(order.status as string)} />
        {facility ? <FacilityBadge code={facility.code} name={facility.name} /> : null}
        <StatusPill label={`Channel: ${order.channel as string}`} tone="neutral" />
      </div>

      <Card>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <InfoRow label="Required ship date" value={formatDate(order.required_ship_date as string | null)} />
          <InfoRow label="Ship to" value={order.ship_to_name as string | null} />
          <InfoRow label="City" value={order.ship_to_city as string | null} />
          <InfoRow label="Country" value={order.ship_to_country as string | null} />
        </dl>
      </Card>

      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-500)]">Lines</p>
            <span className="text-xs text-[var(--ink-500)]">{lines.length}</span>
          </div>
          <OrderLinesEditor
            orderId={orderId}
            lines={lines}
            skus={(skusRes.data ?? []).map((s) => ({
              id: s.id as string,
              sku_code: s.sku_code as string,
              description: (s.description as string | null) ?? null,
            }))}
            status={order.status as string}
          />
        </div>
      </Card>

      {customer ? (
        <Link href={`/app/customers/${customer.id}`} className="text-sm text-[var(--accent-600)]">
          ← Back to {customer.display_name}
        </Link>
      ) : null}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.16em] text-[var(--ink-500)]">{label}</dt>
      <dd className="text-sm text-[var(--surface-ink)]">{value || "—"}</dd>
    </div>
  );
}
