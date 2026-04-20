import { PageHeader } from "@/components/layout/page-header";
import { TaskEditor } from "@/components/tasks/task-editor";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function TasksPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;

  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("tasks")
    .select("id, title, body, due_at, status")
    .eq("workspace_id", ctx.workspaceId)
    .neq("status", "cancelled")
    .order("due_at", { ascending: true, nullsFirst: false });

  const tasks = (rows ?? []).map((t) => ({
    id: t.id as string,
    title: t.title as string,
    body: (t.body as string | null) ?? null,
    due_at: (t.due_at as string | null) ?? null,
    status: t.status as "open" | "done" | "cancelled",
  }));

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Ops" title="Tasks" subtitle="Personal + team to-dos." />
      <Card>
        <TaskEditor workspaceId={ctx.workspaceId} tasks={tasks} />
      </Card>
    </div>
  );
}
