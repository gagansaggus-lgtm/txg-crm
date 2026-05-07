import { Card, CardContent } from "@/components/ui/card";
import { NewsletterManager } from "@/components/marketing/newsletter-manager";
import { listNewsletters } from "@/lib/supabase/queries/content";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function NewslettersPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const newsletters = await listNewsletters(supabase, ctx.workspaceId);

  // Subscriber counts
  const { data: subData } = await supabase
    .from("newsletter_subscribers")
    .select("list_type, status")
    .eq("workspace_id", ctx.workspaceId);

  const subCounts = (subData ?? []).reduce(
    (acc, row) => {
      const r = row as { list_type: string; status: string };
      if (r.status === "active") {
        acc[r.list_type] = (acc[r.list_type] ?? 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="brand-eyebrow text-[var(--accent-600)]">Content · Newsletters</p>
        <h1 className="brand-headline text-3xl text-[var(--ink-950)] mt-2">
          Newsletter system
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-700)]">
          Drafts, scheduled, sent. Sends via Zoho ZeptoMail when wired in Plan 6.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(["prospect", "internal", "partner", "investor"] as const).map((listType) => (
          <div
            key={listType}
            className="rounded-xl border border-[var(--line-soft)] bg-[var(--card)] p-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-500)]">
              {listType} list
            </p>
            <p className="mt-1 brand-display text-3xl text-[var(--ink-950)]">
              {(subCounts[listType] ?? 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-[var(--ink-500)]">subscribers</p>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <NewsletterManager newsletters={newsletters} />
        </CardContent>
      </Card>
    </div>
  );
}
