import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FacilityBadge } from "@/components/ui/facility-badge";
import { StatusPill, orderStatusTone } from "@/components/ui/status-pill";
import { formatDate } from "@/lib/utils";
import { listFulfillmentOrders } from "@/lib/supabase/queries/warehouse";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ facility?: string; status?: string }>;
}) {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const { facility, status } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const orders = await listFulfillmentOrders(supabase, ctx.workspaceId, {
    facilityId: facility ?? null,
    status,
  });

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Warehouse"
        title="Fulfillment orders"
        subtitle="Orders in the queue awaiting pick, pack, and ship."
      />

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Orders arrive via CSV import from the WMS or can be entered manually."
          action={{ label: "Import from WMS", href: "/app/settings/wms" }}
        />
      ) : (
        <Card>
          <ul className="divide-y divide-[var(--line-soft)]">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/app/warehouse/orders/${o.id}`}
                  className="flex flex-col gap-2 px-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-[var(--surface-ink)]">
                      {o.order_number ?? o.id.slice(0, 8)}
                    </p>
                    <p className="truncate text-xs text-[var(--ink-500)]">
                      {o.customer_name ?? "—"} · Ship {formatDate(o.required_ship_date)} · to {o.ship_to_name ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <FacilityBadge code={o.facility_code} />
                    <StatusPill label={o.status} tone={orderStatusTone(o.status)} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
