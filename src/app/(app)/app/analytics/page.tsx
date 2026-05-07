import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import {
  leadCountsByStage,
  leadCountsByStatus,
} from "@/lib/supabase/queries/leads";
import { queueCounts } from "@/lib/supabase/queries/outreach";
import { listSocialPosts } from "@/lib/supabase/queries/distribution";
import { listContentPieces } from "@/lib/supabase/queries/content";
import { listPartners } from "@/lib/supabase/queries/growth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function AnalyticsPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();

  const [stageCounts, statusCounts, msgCounts, socialPosts, content, partners] =
    await Promise.all([
      leadCountsByStage(supabase, ctx.workspaceId),
      leadCountsByStatus(supabase, ctx.workspaceId),
      queueCounts(supabase, ctx.workspaceId),
      listSocialPosts(supabase, ctx.workspaceId),
      listContentPieces(supabase, ctx.workspaceId, { limit: 500 }),
      listPartners(supabase, ctx.workspaceId),
    ]);

  const sc = statusCounts as Record<string, number>;
  const stc = stageCounts as Record<string, number>;
  const mc = msgCounts as Record<string, number>;

  const totalLeads = Object.values(stageCounts).reduce((s, n) => s + n, 0);
  const closed = sc.closed_won ?? 0;
  const totalAttempts = (mc.sent ?? 0) + (mc.replied ?? 0) + (mc.bounced ?? 0);
  const replyRate =
    totalAttempts > 0 ? ((mc.replied ?? 0) / totalAttempts) * 100 : 0;
  const closeRate = totalLeads > 0 ? (closed / totalLeads) * 100 : 0;

  const publishedContent = content.filter((c) => c.status === "published").length;
  const postedSocial = socialPosts.filter((p) => p.status === "posted").length;
  const activePartners = partners.filter(
    (p) => p.agreement_status === "signed" || p.agreement_status === "active",
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="brand-eyebrow text-[var(--accent-600)]">Analytics</p>
        <h1 className="brand-headline text-3xl text-[var(--ink-950)] mt-2">
          Performance dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-700)]">
          Top-line numbers across pipeline, content, distribution, and growth.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatLink
          label="Total leads"
          value={totalLeads.toLocaleString()}
          href="/app/leads"
        />
        <StatLink
          label="Reply rate"
          value={`${replyRate.toFixed(1)}%`}
          href="/app/outreach/replies"
          accent
        />
        <StatLink
          label="Close rate"
          value={`${closeRate.toFixed(1)}%`}
          href="/app/leads?status=closed_won"
        />
        <StatLink
          label="Closed won"
          value={closed.toLocaleString()}
          href="/app/leads?status=closed_won"
          accent
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)] mb-4">
            Outreach activity
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <BareStat label="Drafted" value={mc.drafted ?? 0} />
            <BareStat label="Queued" value={mc.queued ?? 0} />
            <BareStat label="Sent" value={mc.sent ?? 0} />
            <BareStat label="Replied" value={mc.replied ?? 0} />
            <BareStat label="Bounced" value={mc.bounced ?? 0} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)] mb-4">
              Pipeline by status
            </p>
            <ul className="space-y-2">
              {[
                "new",
                "researching",
                "contacted",
                "replied",
                "call_booked",
                "qualified",
                "proposal",
                "closed_won",
                "closed_lost",
              ].map((s) => {
                const n = sc[s] ?? 0;
                const pct = totalLeads > 0 ? (n / totalLeads) * 100 : 0;
                return (
                  <li key={s}>
                    <div className="flex items-center gap-3">
                      <span className="w-28 text-sm text-[var(--ink-700)] capitalize">
                        {s.replace(/_/g, " ")}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[var(--ink-950)] to-[var(--accent-600)]"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-sm tabular-nums font-semibold">
                        {n}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)] mb-4">
              Validation funnel
            </p>
            <ul className="space-y-2">
              {[
                { key: "raw", label: "Raw" },
                { key: "pre_filtered", label: "Pre-filtered" },
                { key: "web_verified", label: "Web verified" },
                { key: "signal_checked", label: "Signal checked" },
                { key: "icp_scored", label: "ICP scored" },
                { key: "contact_verified", label: "Contact verified" },
              ].map((s) => {
                const n = stc[s.key] ?? 0;
                return (
                  <li
                    key={s.key}
                    className="flex items-center justify-between gap-3 py-1"
                  >
                    <span className="text-sm text-[var(--ink-700)]">{s.label}</span>
                    <span className="text-sm tabular-nums font-semibold text-[var(--ink-950)]">
                      {n.toLocaleString()}
                    </span>
                  </li>
                );
              })}
              <li className="flex items-center justify-between gap-3 py-1 border-t border-[var(--line-soft)] mt-2 pt-3">
                <span className="text-sm text-red-700">Rejected</span>
                <span className="text-sm tabular-nums font-semibold text-red-700">
                  {(stc.rejected ?? 0).toLocaleString()}
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatLink
          label="Articles published"
          value={publishedContent.toString()}
          href="/app/content/articles"
        />
        <StatLink
          label="Social posts published"
          value={postedSocial.toString()}
          href="/app/distribution/social"
        />
        <StatLink
          label="Active partnerships"
          value={activePartners.toString()}
          href="/app/growth/partners"
        />
        <StatLink
          label="Content in flight"
          value={(content.length - publishedContent).toString()}
          href="/app/content/calendar"
        />
      </div>

      <div className="flex gap-3">
        <Link
          href="/app/analytics/funnel"
          className="rounded-lg border border-[var(--line-soft)] bg-[var(--card)] px-4 py-2 text-sm font-medium hover:border-[var(--accent-600)]/40"
        >
          Funnel analytics →
        </Link>
        <Link
          href="/app/analytics/attribution"
          className="rounded-lg border border-[var(--line-soft)] bg-[var(--card)] px-4 py-2 text-sm font-medium hover:border-[var(--accent-600)]/40"
        >
          Attribution →
        </Link>
      </div>
    </div>
  );
}

function StatLink({
  label,
  value,
  href,
  accent,
}: {
  label: string;
  value: string;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-xl border p-4 transition-colors ${
        accent
          ? "border-[var(--accent-600)]/40 bg-[var(--accent-100)] hover:border-[var(--accent-600)]"
          : "border-[var(--line-soft)] bg-[var(--card)] hover:border-[var(--accent-600)]/40"
      }`}
    >
      <p
        className={`text-[10px] font-bold uppercase tracking-[0.18em] ${
          accent ? "text-[var(--accent-700)]" : "text-[var(--ink-500)]"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-1 brand-display text-3xl ${
          accent ? "text-[var(--accent-700)]" : "text-[var(--ink-950)]"
        }`}
      >
        {value}
      </p>
    </Link>
  );
}

function BareStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-500)]">
        {label}
      </p>
      <p className="mt-1 brand-display text-2xl text-[var(--ink-950)]">
        {value.toLocaleString()}
      </p>
    </div>
  );
}
