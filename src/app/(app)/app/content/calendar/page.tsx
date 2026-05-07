import { Card, CardContent } from "@/components/ui/card";
import { ContentList } from "@/components/marketing/content-list";
import { listContentPieces } from "@/lib/supabase/queries/content";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function ContentCalendarPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const pieces = await listContentPieces(supabase, ctx.workspaceId);

  // Group by status
  const byStatus = {
    draft: pieces.filter((p) => p.status === "draft"),
    in_review: pieces.filter((p) => p.status === "in_review"),
    approved: pieces.filter((p) => p.status === "approved"),
    scheduled: pieces.filter((p) => p.status === "scheduled"),
    published: pieces.filter((p) => p.status === "published"),
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="brand-eyebrow text-[var(--accent-600)]">Content · Calendar</p>
        <h1 className="brand-headline text-3xl text-[var(--ink-950)] mt-2">
          Content calendar
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-700)]">
          {pieces.length} pieces in flight — {byStatus.draft.length} drafted,{" "}
          {byStatus.in_review.length} in review,{" "}
          {byStatus.scheduled.length} scheduled, {byStatus.published.length} published.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <ContentList
            pieces={pieces}
            contentType="seo_article"
            pillarOptions={[
              "education",
              "authority",
              "pain_solution",
              "proof",
              "behind_scenes",
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
