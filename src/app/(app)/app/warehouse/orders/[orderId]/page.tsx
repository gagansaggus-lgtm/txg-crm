import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { FacilityBadge } from "@/components/ui/facility-badge";
import { StatusPill, orderStatusTone } from "@/components/ui/status-pill";
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

  const { data: lines } = await supabase
    .from("fulfillment_order_lines")
    .select("*")
    .eq("order_id", orderId);

  const customer = (order as Record<string, unknown>).customers as { id: string; display_name: string } | null;
  const facility = (order as Record<string, unknown>).facilities as { code: string; name: string } | null;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Order"
        title={(order.order_number as string | null) ?? `Order ${String(orderId).slice(0, 8)}`}
        subtitle={customer?.display_name}
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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-500)]">Lines</p>
            <span className="text-xs text-[var(--ink-500)]">{lines?.length ?? 0}</span>
          </div>
          {!lines || lines.length === 0 ? (
            <p className="text-sm text-[var(--ink-500)]">No lines on this order yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--line-soft)] text-sm">
              {lines.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-[var(--surface-ink)]">{l.sku_code ?? "—"}</p>
                    <p className="text-xs text-[var(--ink-500)]">{l.description ?? ""}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p>Qty <span className="font-semibold text-[var(--surface-ink)]">{l.qty}</span></p>
                    <p>Picked <span className="font-semibold text-[var(--surface-ink)]">{l.picked_qty}</span></p>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
