"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Mail,
  MessageSquare,
  Phone,
  ExternalLink,
  CheckCircle2,
  Clock,
  Send,
  Copy,
  X,
  Edit2,
  Save,
} from "lucide-react";

import type { SdrQueueItem } from "@/lib/supabase/queries/outreach";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  markMessageSentAction,
  cancelMessageAction,
  updateMessageBodyAction,
} from "@/app/actions/outreach";
import { cn, formatDateTime } from "@/lib/utils";

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

const CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  linkedin_dm: "LinkedIn DM",
  linkedin_connection: "LinkedIn connect",
  whatsapp: "WhatsApp",
  voice_note: "Voice note",
  phone_call: "Phone call",
  sms: "SMS",
  in_person: "In person",
};

export function SdrQueueClient({
  today,
  upcoming,
}: {
  today: SdrQueueItem[];
  upcoming: SdrQueueItem[];
}) {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="brand-headline text-lg text-[var(--ink-950)] mb-3">
          Today&rsquo;s touches ({today.length})
        </h2>
        {today.length === 0 ? (
          <Card>
            <CardContent className="px-6 py-8 text-center text-sm text-[var(--ink-500)]">
              All caught up for today.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {today.map((m) => (
              <QueueRow key={m.id} item={m} />
            ))}
          </ul>
        )}
      </section>

      {upcoming.length > 0 ? (
        <section>
          <h2 className="brand-headline text-lg text-[var(--ink-700)] mb-3">
            Upcoming ({upcoming.length})
          </h2>
          <ul className="space-y-2">
            {upcoming.slice(0, 20).map((m) => (
              <UpcomingRow key={m.id} item={m} />
            ))}
          </ul>
          {upcoming.length > 20 ? (
            <p className="mt-3 text-xs text-[var(--ink-500)]">
              + {upcoming.length - 20} more scheduled
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function QueueRow({ item }: { item: SdrQueueItem }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(item.body);
  const [subject, setSubject] = useState(item.subject ?? "");

  const Icon = CHANNEL_ICONS[item.channel] ?? Send;

  function copyBody() {
    const text = item.subject
      ? `Subject: ${item.subject}\n\n${item.body}`
      : item.body;
    navigator.clipboard.writeText(text).catch(() => {
      toast.error("Couldn't copy to clipboard");
    });
    toast.success("Copied — paste into LinkedIn / email / WhatsApp");
  }

  function markSent() {
    startTransition(async () => {
      const res = await markMessageSentAction(item.id);
      if (!res.ok) {
        toast.error("Failed", { description: res.error });
      } else {
        toast.success("Marked sent");
        router.refresh();
      }
    });
  }

  function cancel() {
    if (!confirm("Cancel this message?")) return;
    startTransition(async () => {
      const res = await cancelMessageAction(item.id);
      if (!res.ok) {
        toast.error("Failed", { description: res.error });
      } else {
        toast.success("Cancelled");
        router.refresh();
      }
    });
  }

  function saveEdit() {
    startTransition(async () => {
      const res = await updateMessageBodyAction(item.id, body, subject || null);
      if (!res.ok) {
        toast.error("Save failed", { description: res.error });
      } else {
        toast.success("Saved");
        setEditing(false);
        router.refresh();
      }
    });
  }

  return (
    <li className="rounded-xl border border-[var(--line-soft)] bg-[var(--card)] p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--accent-100)] text-[var(--accent-700)]">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-700)]">
                {CHANNEL_LABELS[item.channel] ?? item.channel}
              </span>
              {item.step_number ? (
                <span className="text-[10px] text-[var(--ink-500)]">
                  Step {item.step_number}
                </span>
              ) : null}
              {item.scheduled_at ? (
                <span className="text-[10px] text-[var(--ink-500)] flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {formatDateTime(item.scheduled_at)}
                </span>
              ) : null}
            </div>
            {item.lead ? (
              <Link
                href={`/app/leads/${item.lead.id}`}
                className="mt-1 block text-sm font-semibold text-[var(--ink-950)] hover:text-[var(--accent-600)]"
              >
                {item.lead.display_name ?? "(no name)"}
                {item.lead.icp_grade ? (
                  <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800">
                    {item.lead.icp_grade}
                  </span>
                ) : null}
              </Link>
            ) : null}
            {item.lead?.vertical ? (
              <p className="text-xs text-[var(--ink-500)]">{item.lead.vertical}</p>
            ) : null}
          </div>
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          {item.channel === "email" ? (
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="w-full rounded-lg border border-[var(--input)] bg-transparent px-3 py-2 text-sm font-medium outline-none focus:border-[var(--accent-600)]"
            />
          ) : null}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-[var(--input)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent-600)]"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={saveEdit} disabled={pending}>
              <Save className="mr-1 h-3.5 w-3.5" />
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(false);
                setBody(item.body);
                setSubject(item.subject ?? "");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          {item.subject ? (
            <p className="mb-2 text-sm font-semibold text-[var(--ink-950)]">
              Subject: {item.subject}
            </p>
          ) : null}
          <p className="whitespace-pre-wrap rounded-lg bg-[var(--surface-soft)] px-3 py-2.5 text-sm text-[var(--ink-700)]">
            {item.body}
          </p>
        </>
      )}

      {!editing ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={copyBody}>
            <Copy className="mr-1 h-3.5 w-3.5" />
            Copy
          </Button>
          <Button size="sm" variant="outline" onClick={markSent} disabled={pending}>
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            Mark sent
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditing(true)}
            disabled={pending}
          >
            <Edit2 className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={cancel} disabled={pending}>
            <X className="mr-1 h-3.5 w-3.5" />
            Cancel
          </Button>
        </div>
      ) : null}
    </li>
  );
}

function UpcomingRow({ item }: { item: SdrQueueItem }) {
  const Icon = CHANNEL_ICONS[item.channel] ?? Send;
  return (
    <li className="flex items-center gap-3 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3 py-2">
      <Icon className="h-3.5 w-3.5 text-[var(--ink-500)]" />
      <div className="min-w-0 flex-1">
        <Link
          href={item.lead ? `/app/leads/${item.lead.id}` : "#"}
          className="text-sm font-medium text-[var(--ink-950)] hover:text-[var(--accent-600)]"
        >
          {item.lead?.display_name ?? "(no lead)"}
        </Link>
        <p className="text-[11px] text-[var(--ink-500)]">
          {CHANNEL_LABELS[item.channel] ?? item.channel} · Step {item.step_number}
        </p>
      </div>
      <span className="text-[11px] text-[var(--ink-500)]">
        {item.scheduled_at ? formatDateTime(item.scheduled_at) : ""}
      </span>
    </li>
  );
}
