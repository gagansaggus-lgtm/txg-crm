import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FacilityBadge } from "@/components/ui/facility-badge";
import { StatusPill, shipmentStatusTone } from "@/components/ui/status-pill";
import { formatDate } from "@/lib/utils";
import { listShipments } from "@/lib/supabase/queries/warehouse";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function ShipmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ facility?: string; status?: string }>;
}) {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const { facility, status } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const shipments = await listShipments(supabase, ctx.workspaceId, {
    facilityId: facility ?? null,
    status,
  });

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Warehouse"
        title="Shipments"
        subtitle="Outbound fulfillment, last-mile, and international."
      />

      {shipments.length === 0 ? (
        <EmptyState
          title="No shipments yet"
          description="Shipments will appear here after orders are packed or imported from the WMS."
          action={{ label: "Import from WMS", href: "/app/settings/wms" }}
        />
      ) : (
        <Card>
          <ul className="divide-y divide-[var(--line-soft)]">
            {shipments.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/app/warehouse/shipments/${s.id}`}
                  className="flex flex-col gap-2 px-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-[var(--surface-ink)]">
                      {s.shipment_number ?? s.tracking_number ?? s.id.slice(0, 8)}
                    </p>
                    <p className="truncate text-xs text-[var(--ink-500)]">
                      {s.customer_name ?? "—"} · {s.carrier ?? "—"} · Shipped {formatDate(s.shipped_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <FacilityBadge code={s.facility_code} />
                    <StatusPill label={s.status} tone={shipmentStatusTone(s.status)} />
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
