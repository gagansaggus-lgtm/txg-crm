import Link from "next/link";

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
    <div className="space-y-5">
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
        />
      ) : (
        <Card>
          <ul className="divide-y divide-[var(--line-soft)]">
            {customers.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/app/customers/${c.id}`}
                  className="flex flex-col gap-2 px-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-[var(--surface-ink)]">
                      {c.display_name}
                    </p>
                    <p className="truncate text-xs text-[var(--ink-500)]">
                      {[c.billing_city, c.billing_region, c.billing_country].filter(Boolean).join(", ") || c.legal_name}
                    </p>
                  </div>
                  <StatusPill label={c.status} tone={customerStatusTone(c.status)} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
