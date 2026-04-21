import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { BrandMark } from "@/components/branding/brand-mark";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type PageProps = { params: Promise<{ token: string }> };

export default async function AcceptInvitePage({ params }: PageProps) {
  const { token } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: invite } = await supabase
    .from("workspace_invites")
    .select("id, workspace_id, email, role, expires_at, accepted_at, revoked_at")
    .eq("token", token)
    .maybeSingle();

  if (!invite) {
    return (
      <InviteShell>
        <h1 className="brand-display text-3xl text-[var(--ink-950)]">Invite not found</h1>
        <p className="text-sm text-[var(--ink-700)]">This link is invalid or has been revoked. Ask your admin to re-send.</p>
      </InviteShell>
    );
  }

  const now = new Date();
  const expired = new Date(invite.expires_at) < now;
  if (invite.revoked_at || expired) {
    return (
      <InviteShell>
        <h1 className="brand-display text-3xl text-[var(--ink-950)]">
          {invite.revoked_at ? "Invite revoked" : "Invite expired"}
        </h1>
        <p className="text-sm text-[var(--ink-700)]">Ask your admin to send a fresh invite.</p>
      </InviteShell>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const nextPath = encodeURIComponent(`/invite/${token}`);
    return (
      <InviteShell>
        <h1 className="brand-display text-3xl text-[var(--ink-950)]">You&apos;re invited to TXG</h1>
        <p className="text-sm text-[var(--ink-700)]">
          Invited as <strong>{invite.email}</strong> · role: <strong>{invite.role.replace(/_/g, " ")}</strong>
        </p>
        <p className="text-xs text-[var(--ink-500)]">
          Sign in or create an account with the email above to accept.
        </p>
        <div className="flex gap-2">
          <Link href={`/login?next=${nextPath}`} className={cn(buttonVariants({ size: "lg" }), "px-4")}>
            Sign in
          </Link>
          <Link href={`/signup?next=${nextPath}`} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-4")}>
            Create account
          </Link>
        </div>
      </InviteShell>
    );
  }

  // Signed in — verify email matches the invite (case-insensitive) then accept.
  if ((user.email ?? "").toLowerCase() !== invite.email.toLowerCase()) {
    return (
      <InviteShell>
        <h1 className="brand-display text-3xl text-[var(--ink-950)]">Wrong account</h1>
        <p className="text-sm text-[var(--ink-700)]">
          This invite is for <strong>{invite.email}</strong>, but you&apos;re signed in as <strong>{user.email}</strong>.
        </p>
        <p className="text-xs text-[var(--ink-500)]">Sign out and sign in with the invited email, or ask for a new invite.</p>
      </InviteShell>
    );
  }

  // Accept: add workspace_member row and mark invite accepted.
  await supabase.from("workspace_members").upsert(
    {
      workspace_id: invite.workspace_id,
      user_id: user.id,
      role: invite.role,
      status: "active",
    },
    { onConflict: "workspace_id,user_id" },
  );
  await supabase.from("workspace_invites").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);

  await supabase.from("crm_activity_log").insert({
    workspace_id: invite.workspace_id,
    actor_id: user.id,
    action: "invite_accepted",
    entity_type: "workspace_member",
    entity_id: user.id,
    summary: `${user.email} accepted invite as ${invite.role}`,
  });

  redirect("/app");
}

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-4 py-10">
        <Card className="w-full">
          <CardContent className="space-y-4 py-8">
            <BrandMark />
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
