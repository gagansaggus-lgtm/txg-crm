import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { CompetitorEditor } from "@/components/marketing/competitor-editor";
import { CompetitorSignalsList } from "@/components/marketing/competitor-signals-list";
import { getCompetitorDetail } from "@/lib/supabase/queries/strategy";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function CompetitorDetailPage({
  params,
}: {
  params: Promise<{ competitorId: string }>;
}) {
  const { competitorId } = await params;
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const detail = await getCompetitorDetail(supabase, ctx.workspaceId, competitorId);
  if (!detail) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/app/strategy/competitors"
        className="text-xs text-[var(--ink-500)] hover:text-[var(--accent-600)]"
      >
        ← All competitors
      </Link>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardContent className="p-6">
            <CompetitorEditor competitor={detail.competitor} />
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardContent className="p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)] mb-3">
                Signal feed ({detail.signals.length})
              </p>
              <CompetitorSignalsList
                competitorId={detail.competitor.id}
                signals={detail.signals}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
