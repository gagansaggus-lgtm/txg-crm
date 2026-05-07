import { Card, CardContent } from "@/components/ui/card";
import { CommunityManager } from "@/components/marketing/community-manager";
import { listCommunityMembers } from "@/lib/supabase/queries/distribution";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function CommunityPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const members = await listCommunityMembers(supabase, ctx.workspaceId);

  const byChannel = members.reduce(
    (acc, m) => {
      if (m.status === "active") acc[m.channel] = (acc[m.channel] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="brand-eyebrow text-[var(--accent-600)]">Distribution · Community</p>
        <h1 className="brand-headline text-3xl text-[var(--ink-950)] mt-2">
          Community ({members.filter((m) => m.status === "active").length} active)
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-700)]">
          WhatsApp Business broadcast lists, Telegram channel, LinkedIn group members.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {Object.entries(byChannel).map(([channel, count]) => (
          <div
            key={channel}
            className="rounded-xl border border-[var(--line-soft)] bg-[var(--card)] p-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-500)]">
              {channel.replace(/_/g, " ")}
            </p>
            <p className="mt-1 brand-display text-3xl text-[var(--ink-950)]">
              {count.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <CommunityManager members={members} />
        </CardContent>
      </Card>
    </div>
  );
}
