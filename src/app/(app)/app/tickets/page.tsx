import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import {
  ticketPriorityTone,
  ticketStatusTone,
} from "@/components/ui/status-pill-ticket";
import { formatDateTime } from "@/lib/utils";
import { listTickets } from "@/lib/supabase/queries/tickets";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const { status } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const tickets = await listTickets(supabase, ctx.workspaceId, { status });

  const filters: Array<{ label: string; value?: string }> = [
    { label: "All" },
    { label: "Open", value: "open" },
    { label: "Pending", value: "pending" },
    { label: "Resolved", value: "resolved" },
    { label: "Closed", value: "closed" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Service"
        title="Tickets"
        subtitle="Customer-facing issues on shipments, orders, and receipts."
        actions={[{ label: "New ticket", href: "/app/tickets/new" }]}
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const href = f.value ? `/app/tickets?status=${f.value}` : "/app/tickets";
          const active = (f.value ?? "") === (status ?? "");
          return (
            <Link
              key={f.label}
              href={href}
              className={
                "rounded-full border px-3 py-1 text-xs transition " +
                (active
                  ? "border-[var(--accent-600)] bg-[var(--accent-100)] text-[var(--accent-600)]"
                  : "border-[var(--line-soft)] bg-white text-[var(--ink-700)]")
              }
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          title="No tickets"
          description="Raise a ticket when a customer reports an issue or asks for a change."
          action={{ label: "New ticket", href: "/app/tickets/new" }}
        />
      ) : (
        <Card>
          <ul className="divide-y divide-[var(--line-soft)]">
            {tickets.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/app/tickets/${t.id}`}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-[var(--surface-ink)]">{t.subject}</p>
                    <p className="truncate text-xs text-[var(--ink-500)]">
                      {t.customer_name ?? "No customer"} · {formatDateTime(t.created_at)}
                      {t.due_at ? ` · Due ${formatDateTime(t.due_at)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill label={t.priority} tone={ticketPriorityTone(t.priority)} />
                    <StatusPill label={t.status} tone={ticketStatusTone(t.status)} />
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
