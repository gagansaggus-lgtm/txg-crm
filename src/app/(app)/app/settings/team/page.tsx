import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function TeamPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();

  const { data: members } = await supabase
    .from("workspace_members")
    .select("*, profiles(full_name, email)")
    .eq("workspace_id", ctx.workspaceId)
    .order("role");

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Settings"
        title="Team"
        subtitle="Day-1 roles: admin and ops_lead. Warehouse staff, drivers, and portal roles come in phase 2+."
      />
      <Card>
        <ul className="divide-y divide-[var(--line-soft)]">
          {(members ?? []).map((m) => {
            const profile = (m as Record<string, unknown>).profiles as { full_name?: string; email?: string } | null;
            return (
              <li key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-semibold text-[var(--surface-ink)]">
                    {profile?.full_name || profile?.email || "—"}
                  </p>
                  <p className="text-xs text-[var(--ink-500)]">{profile?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill label={m.role as string} tone="info" />
                  <StatusPill label={m.status as string} tone={m.status === "active" ? "success" : "neutral"} />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
