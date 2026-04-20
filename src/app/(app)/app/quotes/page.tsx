import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { formatDate } from "@/lib/utils";
import { listQuotes } from "@/lib/supabase/queries/quotes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function QuotesPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;

  const supabase = await createSupabaseServerClient();
  const quotes = await listQuotes(supabase, ctx.workspaceId);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="CRM"
        title="Quotes"
        subtitle="Send and track quotes across service lines."
        actions={[{ label: "New quote", href: "/app/quotes/new" }]}
      />

      {quotes.length === 0 ? (
        <EmptyState
          title="No quotes yet"
          description="Pick a customer to draft their first quote."
          action={{ label: "New quote", href: "/app/quotes/new" }}
        />
      ) : (
        <Card>
          <ul className="divide-y divide-[var(--line-soft)]">
            {quotes.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/app/quotes/${q.id}`}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="font-semibold text-[var(--surface-ink)]">{q.quote_number ?? q.id.slice(0, 8)}</p>
                    <p className="text-xs text-[var(--ink-500)]">
                      {q.customer_name ?? "—"} · {formatDate(q.created_at)} · {q.currency} {q.total}
                    </p>
                  </div>
                  <StatusPill
                    label={q.status}
                    tone={q.status === "accepted" ? "success" : q.status === "rejected" || q.status === "expired" ? "danger" : "info"}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
