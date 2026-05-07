import Link from "next/link";
import { ArrowRight, Inbox, Send, Users, MessageSquare } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  listMyQueue,
  queueCounts,
  listReplies,
} from "@/lib/supabase/queries/outreach";
import {
  leadCountsByStage,
  leadCountsByStatus,
} from "@/lib/supabase/queries/leads";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function TodayPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();

  const [myQueue, myCounts, allCounts, stageCounts, statusCounts, replies] =
    await Promise.all([
      listMyQueue(supabase, ctx.workspaceId, ctx.user.id),
      queueCounts(supabase, ctx.workspaceId, ctx.user.id),
      queueCounts(supabase, ctx.workspaceId),
      leadCountsByStage(supabase, ctx.workspaceId),
      leadCountsByStatus(supabase, ctx.workspaceId),
      listReplies(supabase, ctx.workspaceId),
    ]);

  const todayCount = myQueue.filter((m) => {
    if (!m.scheduled_at) return true;
    return new Date(m.scheduled_at) <= new Date();
  }).length;

  const stageCountsAny = stageCounts as Record<string, number>;
  const statusCountsAny = statusCounts as Record<string, number>;
  const totalLeads = Object.values(stageCounts).reduce((s, n) => s + n, 0);
  const activeLeads = totalLeads - (stageCountsAny.rejected ?? 0);
  const inPipeline =
    (statusCountsAny.contacted ?? 0) +
    (statusCountsAny.replied ?? 0) +
    (statusCountsAny.call_booked ?? 0) +
    (statusCountsAny.qualified ?? 0) +
    (statusCountsAny.proposal ?? 0);

  const greeting = getGreeting();
  const firstName = (ctx.user.fullName || ctx.user.email).split(/[\s.@]+/)[0];

  return (
    <div className="space-y-8">
      <div>
        <p className="brand-eyebrow text-[var(--accent-600)]">Today</p>
        <h1 className="brand-headline text-4xl text-[var(--ink-950)] mt-2 capitalize">
          {greeting}, {firstName}.
        </h1>
        <p className="mt-2 text-base text-[var(--ink-700)]">
          Here&rsquo;s what needs your attention.
        </p>
      </div>

      {/* Hero metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ActionCard
          href="/app/outreach/queue"
          icon={Send}
          label="Your queue"
          value={todayCount}
          subtitle={`${myCounts.drafted ?? 0} drafted · ${myCounts.queued ?? 0} queued`}
          accent
        />
        <ActionCard
          href="/app/outreach/replies"
          icon={MessageSquare}
          label="Replies waiting"
          value={replies.length}
          subtitle="Inbound responses to action"
        />
        <ActionCard
          href="/app/leads?status=qualified"
          icon={Users}
          label="In pipeline"
          value={inPipeline}
          subtitle="Contacted → qualified → proposal"
        />
        <ActionCard
          href="/app/leads"
          icon={Inbox}
          label="Active leads"
          value={activeLeads}
          subtitle={`${totalLeads.toLocaleString()} total · ${stageCountsAny.rejected ?? 0} rejected`}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Pipeline by status */}
        <Card>
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)] mb-4">
              Pipeline by status
            </p>
            <ul className="space-y-2">
              {[
                { key: "new", label: "New" },
                { key: "researching", label: "Researching" },
                { key: "contacted", label: "Contacted" },
                { key: "replied", label: "Replied" },
                { key: "call_booked", label: "Call booked" },
                { key: "qualified", label: "Qualified" },
                { key: "proposal", label: "Proposal" },
                { key: "closed_won", label: "Closed won" },
                { key: "closed_lost", label: "Closed lost" },
              ].map((s) => {
                const n = (statusCounts as Record<string, number>)[s.key] ?? 0;
                const pct = totalLeads > 0 ? (n / totalLeads) * 100 : 0;
                return (
                  <li key={s.key}>
                    <Link
                      href={`/app/leads?status=${s.key}`}
                      className="group flex items-center gap-3 rounded-lg p-2 hover:bg-[var(--surface-soft)] transition-colors"
                    >
                      <span className="w-28 text-sm text-[var(--ink-700)] group-hover:text-[var(--ink-950)]">
                        {s.label}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[var(--ink-950)] to-[var(--accent-600)]"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-sm tabular-nums font-semibold text-[var(--ink-950)]">
                        {n.toLocaleString()}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        {/* Quick links */}
        <Card>
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)] mb-4">
              Quick actions
            </p>
            <div className="space-y-2">
              <QuickLink
                href="/app/leads/import"
                title="Import leads"
                hint="Upload StoreLeads or NA Shopify CSV"
              />
              <QuickLink
                href="/app/leads/new"
                title="Add lead manually"
                hint="Single brand or referral"
              />
              <QuickLink
                href="/app/outreach/sequences"
                title="Manage sequences"
                hint="Create or edit outbound cadences"
              />
              <QuickLink
                href="/app/strategy/icps"
                title="Tune ICPs"
                hint="Refine firmographic targeting"
              />
              <QuickLink
                href="/app/strategy/competitors"
                title="Log competitor signal"
                hint="Track pricing changes, hires, news"
              />
              <QuickLink
                href="/app/pipeline"
                title="Open pipeline"
                hint="Kanban view of all customers + deals"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation funnel */}
      <Card>
        <CardContent className="p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)] mb-4">
            Validation funnel
          </p>
          <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
            {[
              { key: "raw", label: "Raw" },
              { key: "pre_filtered", label: "Pre-filtered" },
              { key: "web_verified", label: "Web ✓" },
              { key: "signal_checked", label: "Signals ✓" },
              { key: "icp_scored", label: "ICP scored" },
              { key: "contact_verified", label: "Contact ✓" },
            ].map((s) => (
              <Link
                key={s.key}
                href={`/app/leads?stage=${s.key}`}
                className="block rounded-lg border border-[var(--line-soft)] p-3 hover:border-[var(--accent-600)]/40 transition-colors"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
                  {s.label}
                </p>
                <p className="mt-1 brand-display text-2xl text-[var(--ink-950)]">
                  {(
                    (stageCounts as Record<string, number>)[s.key] ?? 0
                  ).toLocaleString()}
                </p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ActionCard({
  href,
  icon: Icon,
  label,
  value,
  subtitle,
  accent,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  subtitle: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group block rounded-2xl border p-5 transition-colors ${
        accent
          ? "border-[var(--accent-600)]/40 bg-[var(--accent-100)] hover:border-[var(--accent-600)]"
          : "border-[var(--line-soft)] bg-[var(--card)] hover:border-[var(--accent-600)]/40"
      }`}
    >
      <div className="flex items-start justify-between">
        <Icon
          className={`h-5 w-5 ${
            accent ? "text-[var(--accent-700)]" : "text-[var(--ink-500)]"
          }`}
        />
        <ArrowRight className="h-4 w-4 text-[var(--ink-400)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--accent-600)]" />
      </div>
      <p
        className={`mt-3 text-[10px] font-bold uppercase tracking-[0.18em] ${
          accent ? "text-[var(--accent-700)]" : "text-[var(--ink-500)]"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-1 brand-display text-4xl ${
          accent ? "text-[var(--accent-700)]" : "text-[var(--ink-950)]"
        }`}
      >
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-[var(--ink-500)]">{subtitle}</p>
    </Link>
  );
}

function QuickLink({
  href,
  title,
  hint,
}: {
  href: string;
  title: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-lg p-2 hover:bg-[var(--surface-soft)] transition-colors"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--ink-950)] group-hover:text-[var(--accent-600)]">
          {title}
        </p>
        <p className="text-xs text-[var(--ink-500)]">{hint}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-[var(--ink-400)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--accent-600)]" />
    </Link>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
