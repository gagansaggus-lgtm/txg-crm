"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/utils";

type Task = {
  id: string;
  title: string;
  body: string | null;
  due_at: string | null;
  status: "open" | "done" | "cancelled";
};

export function TaskEditor({
  workspaceId,
  tasks,
}: {
  workspaceId: string;
  tasks: Task[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function create(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const supabase = createSupabaseBrowserClient();
      const { data: userRes } = await supabase.auth.getUser();
      const payload = {
        workspace_id: workspaceId,
        title: String(formData.get("title") ?? "").trim(),
        body: String(formData.get("body") ?? "").trim() || null,
        due_at: String(formData.get("due_at") ?? "") || null,
        status: "open",
        assigned_to: userRes.user?.id ?? null,
        created_by: userRes.user?.id ?? null,
      };
      if (!payload.title) {
        setError("Title is required.");
        return;
      }
      const { error: insertError } = await supabase.from("tasks").insert(payload);
      if (insertError) {
        setError(insertError.message);
        return;
      }
      setAdding(false);
      router.refresh();
    });
  }

  function toggle(id: string, next: "open" | "done") {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("tasks").update({ status: next }).eq("id", id);
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("tasks").delete().eq("id", id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {adding ? (
        <form action={create} className="space-y-3 rounded-xl bg-[var(--surface-accent)] p-3">
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
            <Field label="Title" required>
              <input name="title" required className={inputCls} placeholder="Follow up with Angad on Buffalo receipts" />
            </Field>
            <Field label="Due">
              <input name="due_at" type="datetime-local" className={inputCls} />
            </Field>
          </div>
          <Field label="Details">
            <textarea name="body" rows={2} className={inputCls} />
          </Field>
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
              {isPending ? "Saving..." : "Add task"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-full bg-[var(--surface-ink)] px-4 py-2 text-xs font-semibold text-white"
        >
          + New task
        </button>
      )}

      {tasks.length === 0 ? (
        <p className="text-sm text-[var(--ink-500)]">No tasks yet.</p>
      ) : (
        <ul className="divide-y divide-[var(--line-soft)]">
          {tasks.map((t) => (
            <li key={t.id} className="flex items-start justify-between gap-3 py-3">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={t.status === "done"}
                  onChange={() => toggle(t.id, t.status === "done" ? "open" : "done")}
                  disabled={isPending}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  <span
                    className={
                      "block font-medium text-[var(--surface-ink)] " +
                      (t.status === "done" ? "line-through opacity-60" : "")
                    }
                  >
                    {t.title}
                  </span>
                  {t.due_at ? (
                    <span className="text-xs text-[var(--ink-500)]">Due {formatDateTime(t.due_at)}</span>
                  ) : null}
                  {t.body ? <span className="block text-xs text-[var(--ink-700)]">{t.body}</span> : null}
                </span>
              </label>
              <button
                type="button"
                onClick={() => remove(t.id)}
                disabled={isPending}
                className="text-xs text-[var(--danger-700)]"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-[var(--line-soft)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent-500)]";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-[var(--surface-ink)]">
        {label}{required ? <span className="text-[var(--danger-700)]"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
