import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
import { listSkus } from "@/lib/supabase/queries/warehouse";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function SkusPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;

  const supabase = await createSupabaseServerClient();
  const skus = await listSkus(supabase, ctx.workspaceId);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Warehouse"
        title="SKU catalog"
        subtitle="Read-only mirror of the WMS. Import via CSV to refresh."
      />

      {skus.length === 0 ? (
        <EmptyState
          title="No SKUs yet"
          description="Drop a SKU CSV export from your WMS to populate this list."
          action={{ label: "Import SKUs", href: "/app/settings/wms" }}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.14em] text-[var(--ink-500)]">
                  <th className="py-2">Customer</th>
                  <th>SKU</th>
                  <th>Description</th>
                  <th>UOM</th>
                  <th>kg</th>
                  <th>Synced</th>
                </tr>
              </thead>
              <tbody>
                {skus.map((s) => (
                  <tr key={s.id} className="border-t border-[var(--line-soft)]">
                    <td className="py-2">{s.customer_name ?? "—"}</td>
                    <td className="font-mono text-xs text-[var(--ink-950)]">{s.sku_code}</td>
                    <td>{s.description ?? ""}</td>
                    <td>{s.uom ?? ""}</td>
                    <td>{s.weight_kg ?? ""}</td>
                    <td className="text-xs text-[var(--ink-500)]">{formatDateTime(s.wms_last_synced_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
