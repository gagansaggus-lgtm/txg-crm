import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function AttributionPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();

  const { data: leadSources } = await supabase
    .from("leads")
    .select("source, status")
    .eq("workspace_id", ctx.workspaceId);

  const { data: touches } = await supabase
    .from("attribution_touches")
    .select("channel, touch_type")
    .eq("workspace_id", ctx.workspaceId);

  // Group leads by source × status
  const sourceStats: Record<string, { total: number; closed: number }> = {};
  for (const row of leadSources ?? []) {
    const r = row as { source: string; status: string };
    if (!sourceStats[r.source]) sourceStats[r.source] = { total: 0, closed: 0 };
    sourceStats[r.source].total++;
    if (r.status === "closed_won") sourceStats[r.source].closed++;
  }

  // Group touches by channel
  const channelStats: Record<string, number> = {};
  for (const row of touches ?? []) {
    const r = row as { channel: string | null };
    if (r.channel) channelStats[r.channel] = (channelStats[r.channel] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="brand-eyebrow text-[var(--accent-600)]">Analytics · Attribution</p>
        <h1 className="brand-headline text-3xl text-[var(--ink-950)] mt-2">
          Attribution
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-700)]">
          Which sources and channels drive closed deals.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)] mb-4">
            Leads by source ({(leadSources ?? []).length} total)
          </p>
          {Object.keys(sourceStats).length === 0 ? (
            <p className="text-sm text-[var(--ink-500)]">
              No leads yet. Attribution will populate as leads are created from each source.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--line-soft)]">
                  <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
                    Source
                  </th>
                  <th className="px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
                    Leads
                  </th>
                  <th className="px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
                    Closed won
                  </th>
                  <th className="px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
                    Conversion
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(sourceStats)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([source, stats]) => (
                    <tr key={source} className="border-b border-[var(--line-soft)]">
                      <td className="px-2 py-2 font-medium capitalize">
                        {source.replace(/_/g, " ")}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        {stats.total.toLocaleString()}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums font-semibold text-emerald-700">
                        {stats.closed.toLocaleString()}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        {stats.total > 0
                          ? `${((stats.closed / stats.total) * 100).toFixed(1)}%`
                          : "0%"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)] mb-4">
            Touch points by channel ({(touches ?? []).length} total)
          </p>
          {Object.keys(channelStats).length === 0 ? (
            <p className="text-sm text-[var(--ink-500)]">
              No touch points logged yet. Tracking will populate as outreach,
              site visits, content engagements occur.
            </p>
          ) : (
            <ul className="space-y-2">
              {Object.entries(channelStats)
                .sort((a, b) => b[1] - a[1])
                .map(([channel, count]) => (
                  <li
                    key={channel}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm capitalize text-[var(--ink-700)]">
                      {channel.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm tabular-nums font-semibold">
                      {count.toLocaleString()}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
