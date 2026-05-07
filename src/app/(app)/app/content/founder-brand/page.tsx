import { Card, CardContent } from "@/components/ui/card";
import { ContentList } from "@/components/marketing/content-list";
import { listContentPieces } from "@/lib/supabase/queries/content";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function FounderBrandPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const posts = await listContentPieces(supabase, ctx.workspaceId, {
    content_type: "linkedin_post",
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="brand-eyebrow text-[var(--accent-600)]">Content · Founder Brand</p>
        <h1 className="brand-headline text-3xl text-[var(--ink-950)] mt-2">
          Founder Brand OS ({posts.length})
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-700)]">
          Daily LinkedIn post drafts. Personal LinkedIn posting must be done manually
          (LinkedIn TOS) — copy from here, paste into LinkedIn.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <ContentList
            pieces={posts}
            contentType="linkedin_post"
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
