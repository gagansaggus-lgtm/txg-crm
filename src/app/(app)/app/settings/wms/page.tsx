import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { WmsImportPanel } from "@/components/warehouse/wms-import-panel";
import { formatDateTime } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function WmsSettingsPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;

  const supabase = await createSupabaseServerClient();
  const { data: runs } = await supabase
    .from("wms_integration_log")
    .select("*")
    .eq("workspace_id", ctx.workspaceId)
    .order("run_started_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Settings"
        title="WMS import"
        subtitle="Drop a CSV export from the WMS. A direct API adapter drops in later without changing this UI."
      />

      <Card>
        <WmsImportPanel />
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-500)]">Recent runs</p>
        {!runs || runs.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--ink-500)]">No imports yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--line-soft)]">
            {runs.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium text-[var(--surface-ink)]">
                    {r.entity} · {r.file_name ?? r.source}
                  </p>
                  <p className="text-xs text-[var(--ink-500)]">{formatDateTime(r.run_started_at)}</p>
                </div>
                <div className="text-right text-xs">
                  <p>
                    <span className="font-semibold text-[var(--success-700)]">{r.rows_ok}</span> /{" "}
                    {r.rows_in}
                  </p>
                  {r.rows_failed > 0 ? (
                    <p className="text-[var(--danger-700)]">{r.rows_failed} failed</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
