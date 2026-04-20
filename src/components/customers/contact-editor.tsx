"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { CustomerContact } from "@/types/db";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  workspaceId: string;
  customerId: string;
  contacts: CustomerContact[];
};

export function ContactEditor({ workspaceId, customerId, contacts }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [adding, setAdding] = useState(contacts.length === 0);
  const [error, setError] = useState<string | null>(null);

  function add(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const supabase = createSupabaseBrowserClient();
      const payload = {
        workspace_id: workspaceId,
        customer_id: customerId,
        full_name: String(formData.get("full_name") ?? "").trim(),
        role_title: String(formData.get("role_title") ?? "").trim() || null,
        email: String(formData.get("email") ?? "").trim() || null,
        phone: String(formData.get("phone") ?? "").trim() || null,
        is_primary: formData.get("is_primary") === "on",
      };
      if (!payload.full_name) {
        setError("Full name is required.");
        return;
      }
      if (payload.is_primary) {
        await supabase
          .from("customer_contacts")
          .update({ is_primary: false })
          .eq("customer_id", customerId);
      }
      const { error: insertError } = await supabase.from("customer_contacts").insert(payload);
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
      const { error: deleteError } = await supabase.from("customer_contacts").delete().eq("id", id);
      if (deleteError) setError(deleteError.message);
      router.refresh();
    });
  }

  function makePrimary(id: string) {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("customer_contacts").update({ is_primary: false }).eq("customer_id", customerId);
      await supabase.from("customer_contacts").update({ is_primary: true }).eq("id", id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {contacts.length === 0 && !adding ? (
        <p className="text-sm text-[var(--ink-500)]">No contacts yet.</p>
      ) : (
        <ul className="divide-y divide-[var(--line-soft)]">
          {contacts.map((c) => (
            <li key={c.id} className="flex items-start justify-between gap-3 py-2 text-sm">
              <div>
                <p className="font-medium text-[var(--surface-ink)]">
                  {c.full_name}
                  {c.is_primary ? (
                    <span className="ml-2 text-xs text-[var(--accent-600)]">primary</span>
                  ) : null}
                </p>
                <p className="text-xs text-[var(--ink-500)]">
                  {[c.role_title, c.email, c.phone].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 gap-2 text-xs">
                {!c.is_primary ? (
                  <button
                    type="button"
                    onClick={() => makePrimary(c.id)}
                    disabled={isPending}
                    className="rounded-full border border-[var(--line-soft)] bg-white px-2 py-1 text-[var(--accent-600)]"
                  >
                    Make primary
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  disabled={isPending}
                  className="rounded-full border border-[var(--line-soft)] bg-white px-2 py-1 text-[var(--danger-700)]"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <form action={add} className="space-y-3 rounded-xl bg-[var(--surface-accent)] p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name" required>
              <input name="full_name" required className={inputCls} />
            </Field>
            <Field label="Role">
              <input name="role_title" className={inputCls} placeholder="Ops Manager" />
            </Field>
            <Field label="Email">
              <input name="email" type="email" className={inputCls} />
            </Field>
            <Field label="Phone">
              <input name="phone" className={inputCls} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-xs text-[var(--ink-700)]">
            <input type="checkbox" name="is_primary" /> Make primary contact
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
              {isPending ? "Saving..." : "Save contact"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-xs font-medium text-[var(--accent-600)]"
        >
          + Add contact
        </button>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-[var(--line-soft)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent-500)]";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-[var(--surface-ink)]">
        {label}{required ? <span className="text-[var(--danger-700)]"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
