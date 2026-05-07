import {
  Mail,
  MessageSquare,
  Phone,
  ExternalLink,
  CheckCircle2,
  Send,
  Clock,
} from "lucide-react";

import type { OutreachMessage } from "@/types/marketing";
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
  in_person: CheckCircle2,
};

const STATUS_DOT: Record<string, string> = {
  drafted: "bg-slate-300",
  queued: "bg-amber-400",
  sent: "bg-blue-500",
  delivered: "bg-blue-600",
  opened: "bg-purple-500",
  replied: "bg-emerald-500",
  bounced: "bg-red-500",
  cancelled: "bg-slate-400",
  failed: "bg-red-600",
};

export function LeadOutreachTimeline({
  messages,
}: {
  messages: Array<Partial<OutreachMessage> & {
    id: string;
    channel: string;
    status: string;
    body: string;
    created_at: string;
    sent_at?: string | null;
    subject?: string | null;
  }>;
}) {
  if (!messages.length) {
    return (
      <p className="text-sm text-[var(--ink-500)]">
        No outreach messages yet. Sequences will populate this when they run.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {messages.map((msg) => {
        const Icon = CHANNEL_ICONS[msg.channel] ?? Send;
        const dot = STATUS_DOT[msg.status] ?? "bg-slate-300";
        return (
          <li
            key={msg.id}
            className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3 py-2.5"
          >
            <div className="flex items-start gap-2">
              <span className={cn("mt-1.5 h-2 w-2 rounded-full", dot)} />
              <Icon className="mt-0.5 h-3.5 w-3.5 text-[var(--ink-500)]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-700)]">
                    {msg.channel.replace(/_/g, " ")} ·{" "}
                    <span className="text-[var(--accent-700)]">{msg.status}</span>
                  </p>
                  <p className="text-[10px] text-[var(--ink-500)] flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDateTime(msg.sent_at ?? msg.created_at)}
                  </p>
                </div>
                {msg.subject ? (
                  <p className="mt-1 text-sm font-medium text-[var(--ink-950)]">
                    {msg.subject}
                  </p>
                ) : null}
                <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-[var(--ink-700)]">
                  {msg.body}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
