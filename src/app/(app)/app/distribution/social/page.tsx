import { Card, CardContent } from "@/components/ui/card";
import { SocialPostsManager } from "@/components/marketing/social-posts-manager";
import { listSocialPosts } from "@/lib/supabase/queries/distribution";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function SocialPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const posts = await listSocialPosts(supabase, ctx.workspaceId);

  const counts = posts.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="brand-eyebrow text-[var(--accent-600)]">Distribution · Social</p>
        <h1 className="brand-headline text-3xl text-[var(--ink-950)] mt-2">
          Social posting ({posts.length})
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-700)]">
          Schedule posts for LinkedIn Company, Instagram, YouTube, Facebook. Personal
          LinkedIn (founders) is manual — copy/paste from drafts.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {(["draft", "scheduled", "posted", "failed", "cancelled"] as const).map((s) => (
          <div
            key={s}
            className="rounded-xl border border-[var(--line-soft)] bg-[var(--card)] p-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-500)]">
              {s}
            </p>
            <p className="mt-1 brand-display text-2xl text-[var(--ink-950)]">
              {counts[s] ?? 0}
            </p>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <SocialPostsManager posts={posts} />
        </CardContent>
      </Card>
    </div>
  );
}
