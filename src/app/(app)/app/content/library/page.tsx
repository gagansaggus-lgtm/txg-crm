import { Card, CardContent } from "@/components/ui/card";
import { LeadMagnetsManager } from "@/components/marketing/lead-magnets-manager";
import { listLeadMagnets } from "@/lib/supabase/queries/content";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function LibraryPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const magnets = await listLeadMagnets(supabase, ctx.workspaceId);

  return (
    <div className="space-y-6">
      <div>
        <p className="brand-eyebrow text-[var(--accent-600)]">Content · Library</p>
        <h1 className="brand-headline text-3xl text-[var(--ink-950)] mt-2">
          Lead magnet library ({magnets.length})
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-700)]">
          Gated PDFs, guides, playbooks, case studies. Marketing site forms hand off
          downloads here.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <LeadMagnetsManager magnets={magnets} />
        </CardContent>
      </Card>
    </div>
  );
}
