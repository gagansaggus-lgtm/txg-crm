import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function RateCardsPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const { data: cards } = await supabase
    .from("rate_cards")
    .select("*, customers(display_name)")
    .eq("workspace_id", ctx.workspaceId)
    .order("service_type");

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Settings"
        title="Rate cards"
        subtitle="Pricing per service line. Customer-level cards override the default."
      />
      {!cards || cards.length === 0 ? (
        <EmptyState title="No rate cards yet" description="Rate cards are added in the DB for phase 1. Full UI coming with quote line items." />
      ) : (
        <Card>
          <ul className="divide-y divide-[var(--line-soft)]">
            {cards.map((c) => {
              const customer = (c as Record<string, unknown>).customers as { display_name?: string } | null;
              return (
                <li key={c.id} className="py-3">
                  <p className="font-semibold text-[var(--surface-ink)]">{c.name}</p>
                  <p className="text-xs text-[var(--ink-500)]">
                    {c.service_type} · {c.currency} · {customer?.display_name ?? "Default"} · {formatDate(c.effective_date)}
                  </p>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
