import Link from "next/link";
import { Megaphone } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { formatDateTime } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

const toneFor = (status: string): "neutral" | "info" | "success" | "warn" | "danger" => {
  switch (status) {
    case "draft": return "neutral";
    case "scheduled": return "info";
    case "sending": return "warn";
    case "sent": return "success";
    case "failed": return "danger";
    default: return "neutral";
  }
};

export default async function CampaignsPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, subject, status, scheduled_at, sent_at, total_recipients, total_opens, total_clicks, created_at")
    .eq("workspace_id", ctx.workspaceId)
    .order("created_at", { ascending: false })
    .limit(50);

  const hasResend = !!process.env.RESEND_API_KEY;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketing"
        title="Campaigns"
        subtitle="Compose and send email campaigns to segments of your customer list."
        actions={[{ label: "New campaign", href: "/app/campaigns/new" }]}
      />

      {!hasResend ? (
        <Card className="border-[var(--warning-100)] bg-[var(--warning-100)]/40">
          <div className="px-5 py-4 text-sm">
            <p className="font-semibold text-[var(--warning-700)]">Resend not configured</p>
            <p className="mt-1 text-xs text-[var(--ink-700)]">
              Campaigns save to draft but won&apos;t send until you set <code>RESEND_API_KEY</code> in Vercel env vars
              and verify your domain in Cloudflare. Once configured, campaigns send from <code>RESEND_FROM</code>.
            </p>
          </div>
        </Card>
      ) : null}

      {(campaigns ?? []).length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description="Compose your first campaign — pick a segment, write the subject + body, and schedule it."
          action={{ label: "New campaign", href: "/app/campaigns/new" }}
          icon={Megaphone}
        />
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-[var(--border)]">
            {campaigns!.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/app/campaigns/${c.id}`}
                  className="flex items-center justify-between px-5 py-4 transition hover:bg-[var(--secondary)]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--ink-950)]">{c.name}</p>
                    <p className="truncate text-xs text-[var(--ink-500)]">
                      {c.subject || "(no subject)"} · {c.total_recipients ?? 0} recipients
                      {c.sent_at ? ` · sent ${formatDateTime(c.sent_at)}` : ""}
                    </p>
                  </div>
                  <StatusPill label={c.status} tone={toneFor(c.status)} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
