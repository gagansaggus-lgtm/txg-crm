import { Card, CardContent } from "@/components/ui/card";
import { ContentList } from "@/components/marketing/content-list";
import {
  listContentPieces,
  listSeoKeywords,
} from "@/lib/supabase/queries/content";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function ArticlesPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const [articles, keywords] = await Promise.all([
    listContentPieces(supabase, ctx.workspaceId, { content_type: "seo_article" }),
    listSeoKeywords(supabase, ctx.workspaceId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="brand-eyebrow text-[var(--accent-600)]">Content · SEO Articles</p>
        <h1 className="brand-headline text-3xl text-[var(--ink-950)] mt-2">
          SEO articles ({articles.length})
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-700)]">
          Long-form articles. Claude Code drafts them on a weekly cadence; you review and approve.
        </p>
      </div>

      {keywords.length > 0 ? (
        <Card>
          <CardContent className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)] mb-3">
              Tracked keywords ({keywords.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {keywords.slice(0, 30).map((k) => (
                <span
                  key={k.id}
                  className="rounded-md bg-[var(--surface-soft)] px-2 py-1 text-[11px] text-[var(--ink-700)]"
                >
                  {k.keyword}
                  {k.search_volume ? (
                    <span className="ml-1 text-[var(--ink-500)]">
                      · {k.search_volume.toLocaleString()}/mo
                    </span>
                  ) : null}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-6">
          <ContentList
            pieces={articles}
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
