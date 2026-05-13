import Link from "next/link";
import { ArrowRight, Mail, MessageSquare, ExternalLink, Phone } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { listReplies } from "@/lib/supabase/queries/outreach";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const CHANNEL_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  linkedin_dm: ExternalLink,
  linkedin_connection: ExternalLink,
  whatsapp: MessageSquare,
  voice_note: Phone,
  phone_call: Phone,
  sms: MessageSquare,
};

const CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  linkedin_dm: "LinkedIn DM",
  linkedin_connection: "LinkedIn",
  whatsapp: "WhatsApp",
  voice_note: "Voice note",
  phone_call: "Call",
  sms: "SMS",
};

export default async function RepliesPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const replies = await listReplies(supabase, ctx.workspaceId);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Outreach · Replies"
        title={`Replies (${replies.length})`}
        subtitle="Inbound responses across LinkedIn, email, and WhatsApp — sorted newest first."
      />

      {replies.length === 0 ? (
        <Card>
          <CardContent className="px-6 py-16 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--surface-soft)] mb-4">
              <MessageSquare className="h-5 w-5 text-[var(--ink-500)]" />
            </div>
            <p className="brand-headline text-lg text-[var(--ink-950)]">No replies yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--ink-500)]">
              As you mark sequence messages as sent and prospects respond, their replies land here for you to action.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {replies.map((r) => {
            const Icon = CHANNEL_ICONS[r.channel] ?? Mail;
            return (
              <li
                key={r.id}
                className="group overflow-hidden rounded-xl border border-[var(--line-soft)] bg-[var(--card)] transition-colors hover:border-[var(--line-strong)]"
              >
                {/* Header strip */}
                <div className="flex items-center justify-between gap-3 border-b border-[var(--line-soft)] px-5 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--accent-100)] text-[var(--accent-700)]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={r.lead ? `/app/leads/${r.lead.id}` : "#"}
                        className="brand-headline block truncate text-[15px] text-[var(--ink-950)] hover:text-[var(--accent-600)]"
                      >
                        {r.lead?.display_name ?? "(no lead)"}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--ink-500)]">
                        <span className="font-semibold uppercase tracking-wider text-[var(--accent-700)]">
                          {CHANNEL_LABELS[r.channel] ?? r.channel.replace(/_/g, " ")}
                        </span>
                        {r.replied_at ? (
                          <>
                            <span>·</span>
                            <span>{formatDateTime(r.replied_at)}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  {r.lead ? (
                    <Link
                      href={`/app/leads/${r.lead.id}`}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold",
                        "text-[var(--ink-700)] hover:bg-[var(--surface-soft)] hover:text-[var(--accent-700)]",
                      )}
                    >
                      Open lead
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  ) : null}
                </div>

                {/* Reply body */}
                <div className="px-5 py-4">
                  <p className="whitespace-pre-wrap text-[14px] leading-[1.6] text-[var(--ink-950)]">
                    {r.reply_body ?? "(empty reply body)"}
                  </p>

                  {r.body ? (
                    <details className="mt-3 group/details">
                      <summary className="cursor-pointer list-none text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)] hover:text-[var(--accent-600)] inline-flex items-center gap-1">
                        <span className="transition-transform group-open/details:rotate-90">▸</span>
                        Your original message
                      </summary>
                      <p className="mt-2 whitespace-pre-wrap rounded-lg border-l-2 border-[var(--line-strong)] bg-[var(--surface-soft)] px-3 py-2 text-[12px] leading-[1.55] text-[var(--ink-700)]">
                        {r.body}
                      </p>
                    </details>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
