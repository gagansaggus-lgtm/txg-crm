import { Card, CardContent } from "@/components/ui/card";
import { EngagementQueue } from "@/components/marketing/engagement-queue";
import { listEngagementTargets } from "@/lib/supabase/queries/distribution";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function EngagementPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const targets = await listEngagementTargets(supabase, ctx.workspaceId, ctx.user.id);

  const today = new Date().toISOString().slice(0, 10);
  const todayTargets = targets.filter(
    (t) => t.generated_for_date === today && t.status === "queued",
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="brand-eyebrow text-[var(--accent-600)]">Distribution · Engagement</p>
        <h1 className="brand-headline text-3xl text-[var(--ink-950)] mt-2">
          Daily engagement queue ({todayTargets.length})
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-700)]">
          Curated LinkedIn posts to comment on. Claude Code drafts comments overnight;
          you post them manually to keep LinkedIn TOS-compliant.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <EngagementQueue targets={targets} />
        </CardContent>
      </Card>
    </div>
  );
}
