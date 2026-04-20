"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ContractForm({
  workspaceId,
  customerId,
}: {
  workspaceId: string;
  customerId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const supabase = createSupabaseBrowserClient();
      const { data: userRes } = await supabase.auth.getUser();
      const payload = {
        workspace_id: workspaceId,
        customer_id: customerId,
        name: String(formData.get("name") ?? "").trim(),
        status: String(formData.get("status") ?? "draft"),
        effective_date: String(formData.get("effective_date") ?? "") || null,
        end_date: String(formData.get("end_date") ?? "") || null,
        terms_url: String(formData.get("terms_url") ?? "").trim() || null,
        notes: String(formData.get("notes") ?? "").trim() || null,
        created_by: userRes.user?.id ?? null,
      };
      if (!payload.name) {
        setError("Contract name is required.");
        return;
      }
      const { error: insertError } = await supabase.from("contracts").insert(payload);
      if (insertError) {
        setError(insertError.message);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-[var(--accent-600)]"
      >
        + New contract
      </button>
    );
  }

  return (
    <form action={submit} className="space-y-3 rounded-xl bg-[var(--surface-accent)] p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" required>
          <input name="name" required className={inputCls} placeholder="MSA / SOW / Rate Agreement" />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue="draft" className={inputCls}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="terminated">Terminated</option>
          </select>
        </Field>
        <Field label="Effective date">
          <input name="effective_date" type="date" className={inputCls} />
        </Field>
        <Field label="End date">
          <input name="end_date" type="date" className={inputCls} />
        </Field>
        <Field label="Document URL">
          <input name="terms_url" type="url" className={inputCls} placeholder="https://drive.google.com/..." />
        </Field>
      </div>
      <Field label="Notes">
        <textarea name="notes" rows={2} className={inputCls} />
      </Field>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-[var(--line-soft)] bg-white px-4 py-1.5 text-xs"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-[var(--surface-ink)] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save contract"}
        </button>
      </div>
    </form>
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
