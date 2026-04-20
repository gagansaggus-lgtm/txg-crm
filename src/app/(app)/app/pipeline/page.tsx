import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { StatusPill, customerStatusTone } from "@/components/ui/status-pill";
import { formatDate } from "@/lib/utils";
import { listCustomers } from "@/lib/supabase/queries/customers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

const columns: Array<{ title: string; status: "prospect" | "active" | "churned" }> = [
  { title: "Prospects", status: "prospect" },
  { title: "Active", status: "active" },
  { title: "Churned", status: "churned" },
];

export default async function PipelinePage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const customers = await listCustomers(supabase, ctx.workspaceId);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Sales"
        title="Pipeline"
        subtitle="Customer lifecycle by status. Add a new client in Customers → New."
        actions={[{ label: "New customer", href: "/app/customers/new" }]}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((col) => {
          const rows = customers.filter((c) => c.status === col.status);
          return (
            <Card key={col.status}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[var(--surface-ink)]">{col.title}</p>
                <StatusPill label={`${rows.length}`} tone={customerStatusTone(col.status)} />
              </div>
              {rows.length === 0 ? (
                <p className="mt-3 text-xs text-[var(--ink-500)]">None in this stage.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {rows.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/app/customers/${c.id}`}
                        className="block rounded-xl border border-[var(--line-soft)] bg-white px-3 py-2 text-sm hover:border-[var(--accent-500)]"
                      >
                        <p className="font-medium text-[var(--surface-ink)]">{c.display_name}</p>
                        <p className="text-[11px] text-[var(--ink-500)]">
                          {c.billing_city || c.billing_country || c.legal_name} · {formatDate(c.created_at)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
