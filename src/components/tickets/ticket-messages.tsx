"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/utils";

type Message = {
  id: string;
  body: string;
  internal: boolean;
  created_at: string;
  author_name: string | null;
};

export function TicketMessages({
  ticketId,
  messages,
}: {
  ticketId: string;
  messages: Message[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function post(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const body = String(formData.get("body") ?? "").trim();
      if (!body) {
        setError("Write something first.");
        return;
      }
      const supabase = createSupabaseBrowserClient();
      const { data: userRes } = await supabase.auth.getUser();
      const { error: insertError } = await supabase.from("ticket_messages").insert({
        ticket_id: ticketId,
        body,
        internal: formData.get("internal") === "on",
        author_id: userRes.user?.id ?? null,
      });
      if (insertError) {
        setError(insertError.message);
        return;
      }
      router.refresh();
      const form = document.getElementById(`ticket-reply-${ticketId}`) as HTMLFormElement | null;
      form?.reset();
    });
  }

  return (
    <div className="space-y-4">
      {messages.length === 0 ? (
        <p className="text-sm text-[var(--ink-500)]">No messages yet. Add the first update.</p>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li
              key={m.id}
              className={
                "rounded-2xl border p-3 " +
                (m.internal
                  ? "border-[var(--warning-100)] bg-[var(--warning-100)]"
                  : "border-[var(--line-soft)] bg-white")
              }
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[var(--surface-ink)]">
                  {m.author_name ?? "TXG teammate"}
                  {m.internal ? (
                    <span className="ml-2 text-[10px] uppercase tracking-[0.14em] text-[var(--warning-700)]">
                      internal
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-[var(--ink-500)]">{formatDateTime(m.created_at)}</p>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--ink-700)]">{m.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form id={`ticket-reply-${ticketId}`} action={post} className="space-y-2">
        <textarea
          name="body"
          rows={3}
          placeholder="Write an update…"
          className="w-full rounded-2xl border border-[var(--line-soft)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent-500)]"
        />
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs text-[var(--ink-700)]">
            <input type="checkbox" name="internal" /> Internal note (not visible to customers later)
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-[var(--surface-ink)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Posting..." : "Post"}
          </button>
        </div>
        {error ? <p className="text-xs text-red-700">{error}</p> : null}
      </form>
    </div>
  );
}
