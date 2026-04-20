import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FacilityBadge } from "@/components/ui/facility-badge";
import { StatusPill, receiptStatusTone } from "@/components/ui/status-pill";
import { formatDate } from "@/lib/utils";
import { listInboundReceipts } from "@/lib/supabase/queries/warehouse";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function InboundPage({
  searchParams,
}: {
  searchParams: Promise<{ facility?: string }>;
}) {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const { facility } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const receipts = await listInboundReceipts(supabase, ctx.workspaceId, {
    facilityId: facility ?? null,
  });

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Warehouse"
        title="Inbound receipts"
        subtitle={facility ? "Filtered by facility." : "All facilities."}
        actions={[{ label: "New receipt", href: "/app/warehouse/inbound/new" }]}
      />

      {receipts.length === 0 ? (
        <EmptyState
          title="No receipts yet"
          description="Log an expected inbound receipt to begin receiving product."
          action={{ label: "New receipt", href: "/app/warehouse/inbound/new" }}
        />
      ) : (
        <Card>
          <ul className="divide-y divide-[var(--line-soft)]">
            {receipts.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/app/warehouse/inbound/${r.id}`}
                  className="flex flex-col gap-2 px-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-[var(--surface-ink)]">
                      {r.receipt_number ?? r.id.slice(0, 8)}
                    </p>
                    <p className="truncate text-xs text-[var(--ink-500)]">
                      {r.customer_name ?? "—"} · Expected {formatDate(r.expected_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <FacilityBadge code={r.facility_code} />
                    <StatusPill label={r.status} tone={receiptStatusTone(r.status)} />
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
