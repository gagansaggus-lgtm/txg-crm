import Link from "next/link";
import {
  Boxes,
  ClipboardList,
  FileText,
  KanbanSquare,
  LifeBuoy,
  PackagePlus,
  RefreshCcw,
  Truck,
  UserCog,
  Users,
  Warehouse,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { buttonVariants } from "@/components/ui/button";
import { StaggerContainer, StaggerItem, FadeInUp } from "@/components/ui/motion-stagger";
import { cn, formatDateTime } from "@/lib/utils";
import { getDashboardSnapshot } from "@/lib/supabase/queries/dashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

const quickJumps = [
  { href: "/app/warehouse", label: "Warehouse", icon: Warehouse, hint: "Buffalo + Etobicoke" },
  { href: "/app/customers", label: "Customers", icon: Users, hint: "CRM" },
  { href: "/app/quotes", label: "Quotes", icon: FileText, hint: "Sales" },
  { href: "/app/pipeline", label: "Pipeline", icon: KanbanSquare, hint: "Prospect → active" },
  { href: "/app/tickets", label: "Tickets", icon: LifeBuoy, hint: "Support" },
  { href: "/app/settings/team", label: "Team", icon: UserCog, hint: "Admins + roles" },
];

export default async function DashboardPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;

  const supabase = await createSupabaseServerClient();
  const snap = await getDashboardSnapshot(supabase, ctx.workspaceId);

  const firstName = (ctx.user.fullName || ctx.user.email.split("@")[0]).split(" ")[0];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="TXG Operations"
        title={`Welcome back, ${firstName}.`}
        subtitle="Today across Buffalo + Etobicoke — receipts in, orders moving, shipments tracking."
        actions={[
          { label: "New receipt", href: "/app/warehouse/inbound/new", variant: "secondary" },
          { label: "New customer", href: "/app/customers/new" },
        ]}
        align="hero"
      />

      <StaggerContainer className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StaggerItem>
          <StatCard
            label="Open receipts"
            value={snap.receipts.open}
            hint={`${snap.receipts.today} expected today`}
            href="/app/warehouse/inbound"
            tone="accent"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Pending orders"
            value={snap.orders.pending}
            hint={`${snap.orders.today} due today`}
            href="/app/warehouse/orders"
            tone="accent"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Shipped today"
            value={snap.shipments.outToday}
            hint={`${snap.shipments.inTransit} in transit`}
            href="/app/warehouse/shipments"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Exceptions"
            value={snap.shipments.exceptions}
            hint="Shipment issues"
            href="/app/warehouse/shipments"
            tone={snap.shipments.exceptions > 0 ? "danger" : "neutral"}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Open tickets"
            value={snap.tickets.open}
            hint={`${snap.tickets.overdue} overdue`}
            href="/app/tickets"
            tone={snap.tickets.overdue > 0 ? "warn" : "neutral"}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Active customers"
            value={snap.customers.active}
            hint={`${snap.customers.total} total`}
            href="/app/customers"
          />
        </StaggerItem>
      </StaggerContainer>

      <FadeInUp delay={0.3} className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-500)]">
                  WMS sync
                </p>
                <CardTitle className="brand-display text-2xl text-[var(--ink-950)]">
                  {snap.wms.lastRunAt ? `Last run ${formatDateTime(snap.wms.lastRunAt)}` : "No imports yet"}
                </CardTitle>
                <CardDescription>
                  {snap.wms.lastSource
                    ? `Source: ${snap.wms.lastSource}`
                    : "Start with a CSV drop from your WMS — SKUs, receipts, orders, shipments."}
                </CardDescription>
              </div>
              <Link
                href="/app/settings/wms"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "px-3")}
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Import CSV
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3 border-t border-[var(--border)] pt-4">
              <OpsTile icon={PackagePlus} label="Inbound" href="/app/warehouse/inbound" />
              <OpsTile icon={ClipboardList} label="Orders" href="/app/warehouse/orders" />
              <OpsTile icon={Truck} label="Shipments" href="/app/warehouse/shipments" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-500)]">
              Quick jumps
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickJumps.map((jump) => {
                const Icon = jump.icon;
                return (
                  <Link
                    key={jump.href}
                    href={jump.href}
                    className="group flex flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 transition hover:border-[var(--accent-600)]/40 hover:bg-[var(--secondary)]"
                  >
                    <Icon
                      className="h-4 w-4 text-[var(--ink-500)] transition group-hover:text-[var(--accent-600)]"
                      strokeWidth={1.8}
                    />
                    <span className="text-sm font-semibold text-[var(--ink-950)]">{jump.label}</span>
                    <span className="text-[11px] text-[var(--ink-500)]">{jump.hint}</span>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </FadeInUp>
    </div>
  );
}

function OpsTile({
  icon: Icon,
  label,
  href,
}: {
  icon: typeof Boxes;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 transition hover:border-[var(--accent-600)]/40"
    >
      <Icon
        className="h-4 w-4 text-[var(--ink-500)] transition group-hover:text-[var(--accent-600)]"
        strokeWidth={1.8}
      />
      <span className="text-xs font-medium text-[var(--ink-950)]">{label}</span>
    </Link>
  );
}
