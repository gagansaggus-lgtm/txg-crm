import { Card, CardContent } from "@/components/ui/card";
import { PrManager } from "@/components/marketing/pr-manager";
import {
  listPrContacts,
  listPressPieces,
  listSpeakingEngagements,
} from "@/lib/supabase/queries/growth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function PrPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const [contacts, pieces, speaking] = await Promise.all([
    listPrContacts(supabase, ctx.workspaceId),
    listPressPieces(supabase, ctx.workspaceId),
    listSpeakingEngagements(supabase, ctx.workspaceId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="brand-eyebrow text-[var(--accent-600)]">Growth · PR &amp; Media</p>
        <h1 className="brand-headline text-3xl text-[var(--ink-950)] mt-2">
          PR &amp; media pipeline
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-700)]">
          Journalist database, press pieces in the pipeline, speaking engagements.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <PrManager
            contacts={contacts}
            pieces={pieces}
            speakingEngagements={speaking}
          />
        </CardContent>
      </Card>
    </div>
  );
}
