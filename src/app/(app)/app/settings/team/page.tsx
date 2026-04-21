import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { InviteForm } from "@/components/team/invite-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function TeamPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();

  const [membersRes, invitesRes] = await Promise.all([
    supabase
      .from("workspace_members")
      .select("id, role, status, joined_at, user_id, profiles(id, email, full_name)")
      .eq("workspace_id", ctx.workspaceId)
      .order("joined_at", { ascending: true }),
    supabase
      .from("workspace_invites")
      .select("id, email, role, expires_at, accepted_at, revoked_at, created_at")
      .eq("workspace_id", ctx.workspaceId)
      .is("accepted_at", null)
      .is("revoked_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const members = ((membersRes.data ?? []) as unknown) as Array<{
    id: string;
    role: string;
    status: string;
    joined_at: string;
    user_id: string;
    profiles: { id: string; email: string; full_name: string | null } | null;
  }>;
  const invites = invitesRes.data ?? [];
  const isAdmin = ctx.role === "admin";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Team"
        subtitle={`${members.length} member${members.length === 1 ? "" : "s"} · ${invites.length} pending invite${invites.length === 1 ? "" : "s"}`}
      />

      {isAdmin ? (
        <Card>
          <CardContent className="space-y-3">
            <p className="brand-eyebrow !text-[var(--ink-500)]">Invite teammate</p>
            <InviteForm />
          </CardContent>
        </Card>
      ) : null}

      <Card className="p-0">
        <div className="border-b border-[var(--border)] px-5 py-3">
          <p className="brand-eyebrow !text-[var(--ink-500)]">Active members</p>
        </div>
        <ul className="divide-y divide-[var(--border)]">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--ink-950)] text-xs font-semibold uppercase text-white">
                  {(m.profiles?.full_name ?? m.profiles?.email ?? "").slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--ink-950)]">
                    {m.profiles?.full_name ?? m.profiles?.email ?? "Unknown"}
                  </p>
                  <p className="text-xs text-[var(--ink-500)]">{m.profiles?.email} · joined {formatDateTime(m.joined_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill label={m.role.replace(/_/g, " ")} tone="info" />
                <StatusPill label={m.status} tone={m.status === "active" ? "success" : "neutral"} />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {invites.length > 0 ? (
        <Card className="p-0">
          <div className="border-b border-[var(--border)] px-5 py-3">
            <p className="brand-eyebrow !text-[var(--ink-500)]">Pending invites</p>
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {invites.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--ink-950)]">{inv.email}</p>
                  <p className="text-xs text-[var(--ink-500)]">
                    Role: {inv.role.replace(/_/g, " ")} · expires {formatDateTime(inv.expires_at)}
                  </p>
                </div>
                <StatusPill label="pending" tone="warn" />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
