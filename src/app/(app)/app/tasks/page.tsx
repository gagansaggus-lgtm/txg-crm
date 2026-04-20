import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function TasksPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;

  const supabase = await createSupabaseServerClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("workspace_id", ctx.workspaceId)
    .eq("status", "open")
    .order("due_at", { ascending: true, nullsFirst: false });

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Ops" title="Tasks" subtitle="Open tasks across the team." />

      {!tasks || tasks.length === 0 ? (
        <EmptyState
          title="No open tasks"
          description="Tasks can be attached to customers, shipments, orders, or receipts."
        />
      ) : (
        <Card>
          <ul className="divide-y divide-[var(--line-soft)]">
            {tasks.map((t) => (
              <li key={t.id} className="py-3">
                <p className="font-semibold text-[var(--surface-ink)]">{t.title}</p>
                <p className="text-xs text-[var(--ink-500)]">
                  Due {formatDateTime(t.due_at)}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
