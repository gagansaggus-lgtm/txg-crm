import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill, customerStatusTone } from "@/components/ui/status-pill";
import { listCustomers } from "@/lib/supabase/queries/customers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function CustomersPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;

  const supabase = await createSupabaseServerClient();
  const customers = await listCustomers(supabase, ctx.workspaceId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CRM"
        title="Customers"
        subtitle={`${customers.length} client${customers.length === 1 ? "" : "s"} across TXG service lines.`}
        actions={[{ label: "Add customer", href: "/app/customers/new" }]}
      />

      {customers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="Add your first client to start tracking services, contracts, and shipments."
          action={{ label: "Add customer", href: "/app/customers/new" }}
          icon={Users}
        />
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-[var(--border)]">
            {customers.map((c) => {
              const loc = [c.billing_city, c.billing_region, c.billing_country].filter(Boolean).join(", ");
              return (
                <li key={c.id}>
                  <Link
                    href={`/app/customers/${c.id}`}
                    className="group flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-[var(--secondary)]"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--ink-950)] text-xs font-semibold uppercase text-white">
                        {c.display_name.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--ink-950)]">
                          {c.display_name}
                        </p>
                        <p className="truncate text-xs text-[var(--ink-500)]">{loc || c.legal_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill label={c.status} tone={customerStatusTone(c.status)} />
                      <ChevronRight className="h-4 w-4 text-[var(--ink-400)] transition group-hover:text-[var(--ink-950)]" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
