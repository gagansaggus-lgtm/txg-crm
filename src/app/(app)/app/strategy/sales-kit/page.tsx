import { Card, CardContent } from "@/components/ui/card";
import { SalesAssetsManager } from "@/components/marketing/sales-assets-manager";
import { BattleCardsManager } from "@/components/marketing/battle-cards-manager";
import {
  listSalesAssets,
  listBattleCards,
  listProposals,
} from "@/lib/supabase/queries/brand";
import { listCompetitors } from "@/lib/supabase/queries/strategy";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function SalesKitPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();

  const [salesAssets, battleCards, competitors, proposals] = await Promise.all([
    listSalesAssets(supabase, ctx.workspaceId),
    listBattleCards(supabase, ctx.workspaceId),
    listCompetitors(supabase, ctx.workspaceId),
    listProposals(supabase, ctx.workspaceId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="brand-eyebrow text-[var(--accent-600)]">Strategy · Sales Kit</p>
        <h1 className="brand-headline text-3xl text-[var(--ink-950)] mt-2">
          Sales enablement
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-700)]">
          Pitch decks, battle cards, ROI calculators, proposals.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)] mb-3">
            Pitch Assets ({salesAssets.length})
          </p>
          <SalesAssetsManager assets={salesAssets} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)] mb-3">
            Battle Cards ({battleCards.length})
          </p>
          <BattleCardsManager cards={battleCards} competitors={competitors} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)] mb-3">
            Recent Proposals ({proposals.length})
          </p>
          {proposals.length === 0 ? (
            <p className="text-sm text-[var(--ink-500)]">
              No proposals yet. Generate from a lead detail page when ready.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--line-soft)]">
                  <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
                    Service
                  </th>
                  <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
                    Status
                  </th>
                  <th className="px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
                    Value
                  </th>
                  <th className="px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
                    Volume
                  </th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--line-soft)]">
                    <td className="px-2 py-2">{p.service_tier ?? "—"}</td>
                    <td className="px-2 py-2 capitalize">{p.status.replace(/_/g, " ")}</td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {p.total_value_usd
                        ? `$${(p.total_value_usd / 1000).toFixed(0)}K`
                        : "—"}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {p.projected_monthly_volume?.toLocaleString() ?? "—"}/mo
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
