import { Card, CardContent } from "@/components/ui/card";
import { BrandAssetsManager } from "@/components/marketing/brand-assets-manager";
import { listBrandAssets } from "@/lib/supabase/queries/brand";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function BrandPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const assets = await listBrandAssets(supabase, ctx.workspaceId);

  return (
    <div className="space-y-6">
      <div>
        <p className="brand-eyebrow text-[var(--accent-600)]">Strategy · Brand</p>
        <h1 className="brand-headline text-3xl text-[var(--ink-950)] mt-2">
          Brand book
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-700)]">
          Logo, palette, typography, voice and tone — the source of truth.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <BrandAssetsManager assets={assets} />
        </CardContent>
      </Card>
    </div>
  );
}
