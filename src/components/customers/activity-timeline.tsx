"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/utils";

type Activity = {
  id: string;
  kind: "call" | "email" | "note" | "meeting";
  subject: string | null;
  body: string | null;
  occurred_at: string;
  author_name: string | null;
};

const kinds: Array<{ value: Activity["kind"]; label: string }> = [
  { value: "note", label: "Note" },
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
];

export function ActivityTimeline({
  workspaceId,
  customerId,
  activities,
}: {
  workspaceId: string;
  customerId: string;
  activities: Activity[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(activities.length === 0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function add(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const supabase = createSupabaseBrowserClient();
      const { data: userRes } = await supabase.auth.getUser();
      const payload = {
        workspace_id: workspaceId,
        customer_id: customerId,
        kind: String(formData.get("kind") ?? "note"),
        subject: String(formData.get("subject") ?? "").trim() || null,
        body: String(formData.get("body") ?? "").trim() || null,
        author_id: userRes.user?.id ?? null,
      };
      if (!payload.body && !payload.subject) {
        setError("Add a subject or body.");
        return;
      }
      const { error: insertError } = await supabase.from("activities").insert(payload);
      if (insertError) {
        setError(insertError.message);
        return;
      }
      setAdding(false);
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("activities").delete().eq("id", id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {adding ? (
        <form action={add} className="space-y-3 rounded-xl bg-[var(--surface-accent)] p-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-[var(--surface-ink)]">Kind</span>
              <select name="kind" defaultValue="note" className={inputCls}>
                {kinds.map((k) => (
                  <option key={k.value} value={k.value}>{k.label}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-[var(--surface-ink)]">Subject</span>
              <input name="subject" className={inputCls} />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-[var(--surface-ink)]">Body</span>
            <textarea name="body" rows={3} className={inputCls} />
          </label>
          {error ? <p className="text-xs text-red-700">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-full border border-[var(--line-soft)] bg-white px-4 py-1.5 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-[var(--surface-ink)] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {isPending ? "Saving..." : "Log activity"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-xs font-medium text-[var(--accent-600)]"
        >
          + Log activity
        </button>
      )}

      {activities.length === 0 ? (
        <p className="text-sm text-[var(--ink-500)]">No activity yet.</p>
      ) : (
        <ol className="space-y-3">
          {activities.map((a) => (
            <li key={a.id} className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-[var(--accent-500)]" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[var(--surface-ink)]">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--accent-600)]">{a.kind}</span>
                    {a.subject ? <> · {a.subject}</> : null}
                  </p>
                  <button
                    type="button"
                    onClick={() => remove(a.id)}
                    disabled={isPending}
                    className="text-xs text-[var(--danger-700)]"
                  >
                    Remove
                  </button>
                </div>
                <p className="text-xs text-[var(--ink-500)]">
                  {formatDateTime(a.occurred_at)}
                  {a.author_name ? ` · ${a.author_name}` : ""}
                </p>
                {a.body ? (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--ink-700)]">{a.body}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-[var(--line-soft)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent-500)]";
