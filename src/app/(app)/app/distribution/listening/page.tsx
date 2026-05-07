import { Card, CardContent } from "@/components/ui/card";
import { ListeningFeed } from "@/components/marketing/listening-feed";
import { listSocialMentions } from "@/lib/supabase/queries/distribution";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function ListeningPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const mentions = await listSocialMentions(supabase, ctx.workspaceId);
  const unreviewed = mentions.filter((m) => !m.reviewed).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="brand-eyebrow text-[var(--accent-600)]">Distribution · Listening</p>
        <h1 className="brand-headline text-3xl text-[var(--ink-950)] mt-2">
          Social listening ({unreviewed} new)
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-700)]">
          Mentions of TXG, competitors, and target accounts. Claude Code surfaces
          buying signals.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <ListeningFeed mentions={mentions} />
        </CardContent>
      </Card>
    </div>
  );
}
