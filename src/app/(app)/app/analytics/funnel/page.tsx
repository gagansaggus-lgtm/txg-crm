import { Card, CardContent } from "@/components/ui/card";
import {
  leadCountsByStage,
  leadCountsByStatus,
} from "@/lib/supabase/queries/leads";
import { queueCounts } from "@/lib/supabase/queries/outreach";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

const STAGES = [
  { key: "leads_total", label: "Total leads imported" },
  { key: "verified", label: "Validated (contact verified)" },
  { key: "contacted", label: "Contacted" },
  { key: "replied", label: "Replied" },
  { key: "call_booked", label: "Calls booked" },
  { key: "qualified", label: "Qualified" },
  { key: "proposal", label: "Proposal sent" },
  { key: "closed_won", label: "Closed won" },
];

export default async function FunnelPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();

  const [stageCounts, statusCounts, msgCounts] = await Promise.all([
    leadCountsByStage(supabase, ctx.workspaceId),
    leadCountsByStatus(supabase, ctx.workspaceId),
    queueCounts(supabase, ctx.workspaceId),
  ]);

  const stc = stageCounts as Record<string, number>;
  const sc = statusCounts as Record<string, number>;
  const mc = msgCounts as Record<string, number>;

  const totalLeads = Object.values(stageCounts).reduce((s, n) => s + n, 0);
  const data = {
    leads_total: totalLeads,
    verified: stc.contact_verified ?? 0,
    contacted: (sc.contacted ?? 0) + (sc.replied ?? 0) + (sc.call_booked ?? 0)
      + (sc.qualified ?? 0) + (sc.proposal ?? 0) + (sc.closed_won ?? 0)
      + (sc.closed_lost ?? 0),
    replied: (sc.replied ?? 0) + (sc.call_booked ?? 0) + (sc.qualified ?? 0)
      + (sc.proposal ?? 0) + (sc.closed_won ?? 0) + (sc.closed_lost ?? 0),
    call_booked: (sc.call_booked ?? 0) + (sc.qualified ?? 0) + (sc.proposal ?? 0)
      + (sc.closed_won ?? 0) + (sc.closed_lost ?? 0),
    qualified: (sc.qualified ?? 0) + (sc.proposal ?? 0) + (sc.closed_won ?? 0)
      + (sc.closed_lost ?? 0),
    proposal: (sc.proposal ?? 0) + (sc.closed_won ?? 0) + (sc.closed_lost ?? 0),
    closed_won: sc.closed_won ?? 0,
  } as Record<string, number>;

  const max = Math.max(...Object.values(data), 1);

  return (
    <div className="space-y-6">
      <div>
        <p className="brand-eyebrow text-[var(--accent-600)]">Analytics · Funnel</p>
        <h1 className="brand-headline text-3xl text-[var(--ink-950)] mt-2">
          Funnel analytics
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-700)]">
          Drop-off at each stage. Where your pipeline leaks.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {STAGES.map((stage, i) => {
              const count = data[stage.key] ?? 0;
              const pct = (count / max) * 100;
              const conversionFromPrevious =
                i > 0 && data[STAGES[i - 1].key]
                  ? (count / data[STAGES[i - 1].key]) * 100
                  : null;
              return (
                <div key={stage.key}>
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <p className="text-sm font-medium text-[var(--ink-950)]">
                      {stage.label}
                    </p>
                    <div className="flex items-center gap-3">
                      {conversionFromPrevious != null ? (
                        <span className="text-[11px] text-[var(--ink-500)]">
                          {conversionFromPrevious.toFixed(1)}% from previous
                        </span>
                      ) : null}
                      <span className="brand-display text-xl text-[var(--ink-950)]">
                        {count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--ink-950)] to-[var(--accent-600)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)] mb-4">
            Outreach channel mix
          </p>
          <p className="text-sm text-[var(--ink-700)]">
            Total messages sent: <strong>{(mc.sent ?? 0).toLocaleString()}</strong> ·
            replied: <strong>{(mc.replied ?? 0).toLocaleString()}</strong> · bounced:{" "}
            <strong>{(mc.bounced ?? 0).toLocaleString()}</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
