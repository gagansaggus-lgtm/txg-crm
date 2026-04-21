import { Mail, Plug } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { formatDateTime } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function InboxPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();

  const { data: accounts } = await supabase
    .from("email_accounts")
    .select("id, team, email, display_name, status, last_sync_at, last_error")
    .eq("workspace_id", ctx.workspaceId)
    .order("team");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Communication Hub"
        title="Shared inbox"
        subtitle="Sales, support, and ops inboxes in one place. Emails auto-link to customers once the OAuth sync is connected."
      />

      <Card className="border-[var(--accent-100)] bg-[var(--accent-100)]/40">
        <CardContent className="flex items-start gap-3 py-4">
          <Plug className="h-5 w-5 shrink-0 text-[var(--accent-600)]" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-[var(--ink-950)]">Inbox sync not connected yet</p>
            <p className="text-xs text-[var(--ink-700)]">
              Connecting Gmail / Outlook requires one-time OAuth setup on your side (register a client in Google Cloud
              or Microsoft Entra, approve scopes, paste the client ID / secret). Once that&apos;s done, the sync worker
              pulls all messages into this inbox, threads them, and auto-links to customers by sender address.
            </p>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-3">
        {(accounts ?? []).map((a) => (
          <Card key={a.id}>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--ink-950)] text-white">
                  <Mail className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <StatusPill
                  label={a.status.replace(/_/g, " ")}
                  tone={a.status === "connected" ? "success" : a.status === "error" ? "danger" : "neutral"}
                />
              </div>
              <div>
                <p className="brand-headline text-base text-[var(--ink-950)] capitalize">{a.team}</p>
                <p className="text-xs text-[var(--ink-500)]">{a.email}</p>
              </div>
              {a.last_sync_at ? (
                <p className="text-[11px] text-[var(--ink-500)]">Last sync {formatDateTime(a.last_sync_at)}</p>
              ) : (
                <p className="text-[11px] text-[var(--ink-500)]">Not synced yet</p>
              )}
              {a.last_error ? (
                <p className="line-clamp-2 text-[11px] text-[var(--danger-700)]">{a.last_error}</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
