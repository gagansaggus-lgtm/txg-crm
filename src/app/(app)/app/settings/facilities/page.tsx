import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { FacilityBadge } from "@/components/ui/facility-badge";
import { listFacilities } from "@/lib/supabase/queries/warehouse";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function FacilitiesSettingsPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const facilities = await listFacilities(supabase, ctx.workspaceId);

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Settings" title="Facilities" subtitle="Buffalo + Etobicoke are seeded. Edit in the DB for now; full CRUD lands in phase 2." />
      <div className="grid gap-3 sm:grid-cols-2">
        {facilities.map((f) => (
          <Card key={f.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-500)]">
                  {f.city}, {f.region} · {f.country}
                </p>
                <p className="text-lg font-semibold text-[var(--surface-ink)]">{f.name}</p>
                <p className="text-xs text-[var(--ink-500)]">{f.timezone} · {f.currency}</p>
              </div>
              <FacilityBadge code={f.code} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
