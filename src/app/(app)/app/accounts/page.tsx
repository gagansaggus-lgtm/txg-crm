import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { AbmAccountStatusUpdater } from "@/components/marketing/abm-status-updater";
import { listAbmAccounts } from "@/lib/supabase/queries/abm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  cold: "bg-slate-100 text-slate-700",
  aware: "bg-blue-50 text-blue-700",
  engaged: "bg-amber-100 text-amber-800",
  active: "bg-purple-100 text-purple-800",
  opportunity: "bg-orange-100 text-orange-800",
  closed_won: "bg-emerald-100 text-emerald-800",
  closed_lost: "bg-red-100 text-red-800",
  paused: "bg-slate-50 text-slate-500",
};

export default async function AccountsPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const accounts = await listAbmAccounts(supabase, ctx.workspaceId);

  // Group by tier
  const byTier = [1, 2, 3].map((tier) => ({
    tier,
    accounts: accounts.filter((a) => a.tier_priority === tier),
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="brand-eyebrow text-[var(--accent-600)]">Pipeline · Accounts (ABM)</p>
        <h1 className="brand-headline text-3xl text-[var(--ink-950)] mt-2">
          Named accounts ({accounts.length})
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-700)]">
          The top NA fulfillment targets that get fully personalized treatment.
          Multi-stakeholder mapping, account-specific one-pagers, executive sponsorship.
        </p>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="px-6 py-12 text-center">
            <p className="brand-display text-2xl text-[var(--ink-950)]">
              No ABM accounts yet.
            </p>
            <p className="mt-2 text-sm text-[var(--ink-500)]">
              Promote your highest-fit leads (grade A or top B) to ABM. From any{" "}
              <Link href="/app/leads" className="text-[var(--accent-600)] hover:underline">
                lead detail page
              </Link>
              , click "Promote to ABM."
            </p>
          </CardContent>
        </Card>
      ) : (
        byTier.map(
          (group) =>
            group.accounts.length > 0 && (
              <div key={group.tier}>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)] mb-3">
                  Tier {group.tier} priority ({group.accounts.length})
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {group.accounts.map((a) => {
                    const intel = a.account_intel as Record<string, unknown>;
                    return (
                      <div
                        key={a.id}
                        className="rounded-xl border border-[var(--line-soft)] bg-[var(--card)] p-5"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <Link
                              href={a.lead ? `/app/leads/${a.lead.id}` : "#"}
                              className="brand-headline text-base text-[var(--ink-950)] hover:text-[var(--accent-600)]"
                            >
                              {a.lead?.display_name ?? "(no lead)"}
                            </Link>
                            {a.lead?.website ? (
                              <p className="text-xs text-[var(--accent-600)]">
                                {a.lead.website
                                  .replace(/^https?:\/\//, "")
                                  .replace(/\/$/, "")}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={cn(
                                "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                STATUS_COLORS[a.status],
                              )}
                            >
                              {a.status.replace(/_/g, " ")}
                            </span>
                            {a.lead?.icp_grade ? (
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800">
                                {a.lead.icp_grade}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-[var(--ink-500)] mb-3">
                          {a.lead?.vertical ? <span>{a.lead.vertical}</span> : null}
                          {a.lead?.estimated_gmv_usd ? (
                            <span>
                              ${(a.lead.estimated_gmv_usd / 1000).toFixed(0)}K GMV
                            </span>
                          ) : null}
                          <span>
                            {a.stakeholders?.length ?? 0} stakeholders mapped
                          </span>
                        </div>
                        <AbmAccountStatusUpdater
                          accountId={a.id}
                          currentStatus={a.status}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ),
        )
      )}
    </div>
  );
}
