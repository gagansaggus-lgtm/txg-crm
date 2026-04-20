import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { QuoteLinesEditor } from "@/components/quotes/quote-lines-editor";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;

  const supabase = await createSupabaseServerClient();
  const { data: quote, error } = await supabase
    .from("quotes")
    .select("*, customers(id, display_name)")
    .eq("workspace_id", ctx.workspaceId)
    .eq("id", quoteId)
    .maybeSingle();
  if (error || !quote) notFound();

  const { data: lines } = await supabase
    .from("quote_lines")
    .select("*")
    .eq("quote_id", quoteId)
    .order("id");

  const customer = (quote as Record<string, unknown>).customers as { id: string; display_name: string } | null;
  const currency = (quote.currency as string) || "USD";

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Quote"
        title={(quote.quote_number as string | null) ?? `Quote ${String(quoteId).slice(0, 8)}`}
        subtitle={customer?.display_name}
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusPill
          label={quote.status as string}
          tone={quote.status === "accepted" ? "success" : quote.status === "rejected" || quote.status === "expired" ? "danger" : "info"}
        />
        <span className="text-sm text-[var(--ink-700)]">Valid until {formatDate(quote.valid_until as string | null)}</span>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-500)]">Total</p>
          <p className="text-2xl font-semibold text-[var(--surface-ink)]">
            {formatCurrency(quote.total as number, currency)}
          </p>
        </div>
        {quote.notes ? (
          <p className="mt-4 whitespace-pre-wrap rounded-xl bg-[var(--surface-accent)] p-4 text-sm text-[var(--ink-700)]">
            {quote.notes as string}
          </p>
        ) : null}
      </Card>

      <Card>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-500)]">Line items</p>
          <QuoteLinesEditor
            quoteId={quoteId}
            currency={currency}
            lines={(lines ?? []).map((l) => ({
              id: l.id as string,
              service_type: l.service_type as string,
              description: l.description as string,
              qty: Number(l.qty),
              unit: l.unit as string,
              unit_price: Number(l.unit_price),
              total: Number(l.total),
            }))}
          />
        </div>
      </Card>

      {customer ? (
        <Link href={`/app/customers/${customer.id}`} className="text-sm text-[var(--accent-600)]">
          ← Back to {customer.display_name}
        </Link>
      ) : null}
    </div>
  );
}
