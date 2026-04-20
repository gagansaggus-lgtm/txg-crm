import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { KpiTile } from "@/components/ui/kpi-tile";
import { formatDateTime } from "@/lib/utils";
import { getDashboardSnapshot } from "@/lib/supabase/queries/dashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function DashboardPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;

  const supabase = await createSupabaseServerClient();
  const snap = await getDashboardSnapshot(supabase, ctx.workspaceId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="TXG Operations"
        title={`Good to see you, ${ctx.user.fullName || ctx.user.email.split("@")[0]}.`}
        subtitle="Today at a glance across Buffalo + Etobicoke."
        actions={[
          { label: "New receipt", href: "/app/warehouse/inbound/new" },
          { label: "New customer", href: "/app/customers/new" },
        ]}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiTile
          label="Open receipts"
          value={snap.receipts.open}
          hint={`${snap.receipts.today} expected today`}
          href="/app/warehouse/inbound"
          tone="accent"
        />
        <KpiTile
          label="Pending orders"
          value={snap.orders.pending}
          hint={`${snap.orders.today} due today`}
          href="/app/warehouse/orders"
          tone="accent"
        />
        <KpiTile
          label="Shipped today"
          value={snap.shipments.outToday}
          hint={`${snap.shipments.inTransit} in transit`}
          href="/app/warehouse/shipments"
        />
        <KpiTile
          label="Exceptions"
          value={snap.shipments.exceptions}
          hint="Shipment issues"
          href="/app/warehouse/shipments"
          tone={snap.shipments.exceptions > 0 ? "danger" : "neutral"}
        />
        <KpiTile
          label="Open tickets"
          value={snap.tickets.open}
          hint={`${snap.tickets.overdue} overdue`}
          href="/app/tickets"
          tone={snap.tickets.overdue > 0 ? "warn" : "neutral"}
        />
        <KpiTile
          label="Active customers"
          value={snap.customers.active}
          hint={`${snap.customers.total} total`}
          href="/app/customers"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-500)]">WMS sync</p>
                <p className="text-lg font-semibold text-[var(--surface-ink)]">
                  {snap.wms.lastRunAt ? `Last run ${formatDateTime(snap.wms.lastRunAt)}` : "No imports yet"}
                </p>
                <p className="text-xs text-[var(--ink-500)]">
                  {snap.wms.lastSource ? `Source: ${snap.wms.lastSource}` : "Start with a CSV drop from your WMS."}
                </p>
              </div>
              <Link
                href="/app/settings/wms"
                className="rounded-full border border-[var(--line-strong)] bg-white px-4 py-2 text-sm font-medium"
              >
                Import CSV
              </Link>
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-500)]">Quick jumps</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Link className="rounded-xl border border-[var(--line-soft)] bg-white px-3 py-2" href="/app/warehouse">Warehouse</Link>
              <Link className="rounded-xl border border-[var(--line-soft)] bg-white px-3 py-2" href="/app/customers">Customers</Link>
              <Link className="rounded-xl border border-[var(--line-soft)] bg-white px-3 py-2" href="/app/quotes">Quotes</Link>
              <Link className="rounded-xl border border-[var(--line-soft)] bg-white px-3 py-2" href="/app/contracts">Contracts</Link>
              <Link className="rounded-xl border border-[var(--line-soft)] bg-white px-3 py-2" href="/app/tasks">Tasks</Link>
              <Link className="rounded-xl border border-[var(--line-soft)] bg-white px-3 py-2" href="/app/settings/team">Team</Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
