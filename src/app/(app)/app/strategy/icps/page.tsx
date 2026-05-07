import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { listIcps, listPersonas } from "@/lib/supabase/queries/strategy";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

const TIER_LABELS: Record<string, string> = {
  tier_1: "Tier 1",
  tier_2: "Tier 2",
  tier_3: "Tier 3",
  tier_4: "Tier 4",
  tier_5: "Tier 5",
  na_mid_market: "NA Mid-Market",
  custom: "Custom",
};

export default async function IcpsPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const [icps, personas] = await Promise.all([
    listIcps(supabase, ctx.workspaceId),
    listPersonas(supabase, ctx.workspaceId),
  ]);

  const personasByIcp = new Map<string, number>();
  for (const p of personas) {
    if (p.icp_profile_id)
      personasByIcp.set(p.icp_profile_id, (personasByIcp.get(p.icp_profile_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Strategy · ICPs &amp; Personas"
        title="Ideal Customer Profiles"
        subtitle="The five ICP tiers and persona maps that drive every outreach decision and content recommendation."
      />

      {icps.length === 0 ? (
        <Card>
          <CardContent className="px-6 py-12 text-center text-sm text-[var(--ink-500)]">
            No ICPs found. Apply migration 0020 (seed data) to populate the default
            five tiers + NA mid-market.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {icps.map((icp) => {
            const personaCount = personasByIcp.get(icp.id) ?? 0;
            const criteria = (icp.firmographic_criteria ?? {}) as Record<string, unknown>;
            return (
              <Link
                key={icp.id}
                href={`/app/strategy/icps/${icp.id}`}
                className="block rounded-xl border border-[var(--line-soft)] bg-[var(--card)] p-5 transition-colors hover:border-[var(--accent-600)]/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="brand-eyebrow text-[var(--accent-600)]">
                      {TIER_LABELS[icp.tier] ?? icp.tier}
                    </p>
                    <h3 className="mt-1 brand-headline text-lg text-[var(--ink-950)]">
                      {icp.name}
                    </h3>
                  </div>
                  {!icp.active ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-400)]">
                      Inactive
                    </span>
                  ) : null}
                </div>
                {icp.description ? (
                  <p className="mt-2 text-sm text-[var(--ink-700)] line-clamp-2">
                    {icp.description}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--ink-500)]">
                  <span>
                    <strong className="text-[var(--ink-950)]">{personaCount}</strong>{" "}
                    persona{personaCount === 1 ? "" : "s"}
                  </span>
                  {icp.deal_size_min_usd ? (
                    <span>
                      Deal size{" "}
                      <strong className="text-[var(--ink-950)]">
                        ${(icp.deal_size_min_usd / 1000).toFixed(0)}K
                        {icp.deal_size_max_usd
                          ? ` – $${(icp.deal_size_max_usd / 1000).toFixed(0)}K`
                          : "+"}
                      </strong>
                    </span>
                  ) : null}
                  {icp.sales_motion ? (
                    <span>
                      Motion{" "}
                      <strong className="text-[var(--ink-950)]">
                        {icp.sales_motion.replace(/_/g, " ")}
                      </strong>
                    </span>
                  ) : null}
                </div>
                {Array.isArray(criteria.verticals) && criteria.verticals.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(criteria.verticals as string[]).slice(0, 6).map((v) => (
                      <span
                        key={v}
                        className="rounded-md bg-[var(--surface-soft)] px-2 py-0.5 text-[11px] text-[var(--ink-700)]"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
