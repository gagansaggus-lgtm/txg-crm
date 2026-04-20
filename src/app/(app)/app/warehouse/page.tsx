import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { FacilityBadge } from "@/components/ui/facility-badge";
import { listFacilities } from "@/lib/supabase/queries/warehouse";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function WarehousePage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;

  const supabase = await createSupabaseServerClient();
  const facilities = await listFacilities(supabase, ctx.workspaceId);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Warehouse"
        title="Operations"
        subtitle="Inbound receipts, fulfillment orders, and outbound shipments."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {facilities.map((f) => (
          <Card key={f.id}>
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-500)]">
                    {f.city}{f.region ? `, ${f.region}` : ""} · {f.country}
                  </p>
                  <p className="text-xl font-semibold text-[var(--surface-ink)]">{f.name}</p>
                </div>
                <FacilityBadge code={f.code} name={f.currency ?? undefined} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <Link className="rounded-xl border border-[var(--line-soft)] bg-white px-3 py-2 text-center" href={`/app/warehouse/inbound?facility=${f.id}`}>
                  Inbound
                </Link>
                <Link className="rounded-xl border border-[var(--line-soft)] bg-white px-3 py-2 text-center" href={`/app/warehouse/orders?facility=${f.id}`}>
                  Orders
                </Link>
                <Link className="rounded-xl border border-[var(--line-soft)] bg-white px-3 py-2 text-center" href={`/app/warehouse/shipments?facility=${f.id}`}>
                  Shipments
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <Link href="/app/warehouse/skus" className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-[var(--surface-ink)]">SKU catalog</p>
              <p className="text-xs text-[var(--ink-500)]">Mirror of WMS-owned inventory master.</p>
            </div>
            <span className="text-[var(--accent-600)]">→</span>
          </Link>
        </Card>
        <Card>
          <Link href="/app/settings/wms" className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-[var(--surface-ink)]">WMS import</p>
              <p className="text-xs text-[var(--ink-500)]">Drop CSVs to sync SKUs, receipts, shipments.</p>
            </div>
            <span className="text-[var(--accent-600)]">→</span>
          </Link>
        </Card>
      </div>
    </div>
  );
}
