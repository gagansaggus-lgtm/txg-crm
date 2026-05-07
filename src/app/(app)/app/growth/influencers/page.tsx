import { Card, CardContent } from "@/components/ui/card";
import { InfluencersManager } from "@/components/marketing/influencers-manager";
import { listInfluencers } from "@/lib/supabase/queries/growth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function InfluencersPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const influencers = await listInfluencers(supabase, ctx.workspaceId);

  return (
    <div className="space-y-6">
      <div>
        <p className="brand-eyebrow text-[var(--accent-600)]">Growth · Influencers</p>
        <h1 className="brand-headline text-3xl text-[var(--ink-950)] mt-2">
          Influencer collaborations ({influencers.length})
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-700)]">
          Indian business YouTubers, D2C podcasters, supply chain LinkedIn voices.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <InfluencersManager influencers={influencers} />
        </CardContent>
      </Card>
    </div>
  );
}
