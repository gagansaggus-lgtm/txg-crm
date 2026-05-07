"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Edit2 } from "lucide-react";

import type { NewsletterRow } from "@/lib/supabase/queries/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upsertNewsletterAction } from "@/app/actions/content";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  scheduled: "bg-purple-100 text-purple-800",
  sending: "bg-amber-100 text-amber-800",
  sent: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
};

export function NewsletterManager({
  newsletters,
}: {
  newsletters: NewsletterRow[];
}) {
  const [editing, setEditing] = useState<string | "new" | null>(null);

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)]">
        Issues ({newsletters.length})
      </p>

      {newsletters.length === 0 && editing !== "new" ? (
        <p className="text-sm text-[var(--ink-500)]">No newsletter issues yet.</p>
      ) : null}

      <ul className="space-y-2">
        {newsletters.map((n) =>
          editing === n.id ? (
            <NewsletterEditor
              key={n.id}
              newsletter={n}
              onCancel={() => setEditing(null)}
              onSaved={() => setEditing(null)}
            />
          ) : (
            <li
              key={n.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-[var(--line-soft)] bg-[var(--card)] px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      STATUS_COLORS[n.status],
                    )}
                  >
                    {n.status}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">
                    {n.list_type}
                  </span>
                  {n.issue_number ? (
                    <span className="text-[10px] text-[var(--ink-500)]">
                      #{n.issue_number}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm font-semibold text-[var(--ink-950)]">{n.subject}</p>
                {n.preheader ? (
                  <p className="text-xs text-[var(--ink-500)]">{n.preheader}</p>
                ) : null}
                <div className="mt-1 flex gap-3 text-[11px] text-[var(--ink-500)]">
                  {n.sent_at ? <span>Sent {formatDateTime(n.sent_at)}</span> : null}
                  {n.recipient_count ? <span>{n.recipient_count} recipients</span> : null}
                  {n.open_count != null ? <span>{n.open_count} opens</span> : null}
                </div>
              </div>
              <Button variant="ghost" size="icon-xs" onClick={() => setEditing(n.id)}>
                <Edit2 className="h-3 w-3" />
              </Button>
            </li>
          ),
        )}
      </ul>

      {editing === "new" ? (
        <NewsletterEditor
          onCancel={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      ) : (
        <Button variant="outline" onClick={() => setEditing("new")} className="w-full">
          <Plus className="mr-1 h-4 w-4" />
          New newsletter issue
        </Button>
      )}
    </div>
  );
}

function NewsletterEditor({
  newsletter,
  onCancel,
  onSaved,
}: {
  newsletter?: NewsletterRow;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    subject: newsletter?.subject ?? "",
    preheader: newsletter?.preheader ?? "",
    body: newsletter?.body ?? "",
    list_type: newsletter?.list_type ?? "prospect",
    scheduled_at: newsletter?.scheduled_at?.slice(0, 16) ?? "",
  });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.subject.trim()) {
      toast.error("Subject required");
      return;
    }
    startTransition(async () => {
      const res = await upsertNewsletterAction({
        id: newsletter?.id,
        subject: form.subject,
        preheader: form.preheader || null,
        body: form.body || null,
        list_type: form.list_type,
        scheduled_at: form.scheduled_at
          ? new Date(form.scheduled_at).toISOString()
          : null,
      });
      if (!res.ok) toast.error("Save failed", { description: res.error });
      else {
        toast.success("Saved");
        router.refresh();
        onSaved();
      }
    });
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-2 rounded-lg border border-[var(--accent-600)]/30 bg-[var(--accent-100)]/30 p-4"
    >
      <div className="grid grid-cols-3 gap-2">
        <select
          value={form.list_type}
          onChange={(e) =>
            setForm({ ...form, list_type: e.target.value as typeof form.list_type })
          }
          className="h-9 rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 text-sm outline-none focus:border-[var(--accent-600)]"
        >
          <option value="prospect">Prospect list</option>
          <option value="internal">Internal</option>
          <option value="partner">Partner</option>
          <option value="investor">Investor</option>
        </select>
        <Input
          required
          placeholder="Subject"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="col-span-2"
        />
      </div>
      <Input
        placeholder="Preheader (optional)"
        value={form.preheader}
        onChange={(e) => setForm({ ...form, preheader: e.target.value })}
      />
      <textarea
        placeholder="Body (HTML or plain text)"
        value={form.body}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
        rows={6}
        className="w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-600)]"
      />
      <Input
        type="datetime-local"
        value={form.scheduled_at}
        onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
