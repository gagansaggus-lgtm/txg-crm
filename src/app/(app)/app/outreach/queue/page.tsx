import { SdrQueueClient } from "@/components/marketing/sdr-queue-client";
import { Card, CardContent } from "@/components/ui/card";
import { listMyQueue, queueCounts } from "@/lib/supabase/queries/outreach";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function MyQueuePage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const [items, counts] = await Promise.all([
    listMyQueue(supabase, ctx.workspaceId, ctx.user.id),
    queueCounts(supabase, ctx.workspaceId, ctx.user.id),
  ]);

  const today = items.filter((m) => {
    if (!m.scheduled_at) return true;
    return new Date(m.scheduled_at) <= new Date();
  });

  const upcoming = items.filter((m) => {
    if (!m.scheduled_at) return false;
    return new Date(m.scheduled_at) > new Date();
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="brand-eyebrow text-[var(--accent-600)]">Outreach · My Queue</p>
        <h1 className="brand-headline text-3xl text-[var(--ink-950)] mt-2">
          Today&rsquo;s outreach queue
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-700)]">
          {today.length} message{today.length === 1 ? "" : "s"} ready to review and send.
          {upcoming.length > 0 ? ` ${upcoming.length} scheduled later.` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Drafted" value={counts.drafted ?? 0} />
        <StatCard label="Queued" value={counts.queued ?? 0} />
        <StatCard label="Sent" value={counts.sent ?? 0} />
        <StatCard label="Replied" value={counts.replied ?? 0} accent />
      </div>

      {today.length === 0 && upcoming.length === 0 ? (
        <Card>
          <CardContent className="px-6 py-12 text-center text-sm text-[var(--ink-500)]">
            <p className="brand-display text-2xl text-[var(--ink-950)]">
              Queue is empty.
            </p>
            <p className="mt-2">
              Assign leads to a sequence to populate your daily queue.
            </p>
            <p className="mt-1 text-xs">
              Go to a lead → click &ldquo;Assign sequence&rdquo; → today&rsquo;s touches appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <SdrQueueClient today={today} upcoming={upcoming} />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--line-soft)] bg-[var(--card)] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-500)]">
        {label}
      </p>
      <p
        className={`mt-1 brand-display text-3xl ${
          accent ? "text-[var(--accent-600)]" : "text-[var(--ink-950)]"
        }`}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}
