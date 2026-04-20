"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Customer = { id: string; display_name: string; currency?: string | null };

export function QuoteForm({
  workspaceId,
  customers,
  defaultCustomerId,
}: {
  workspaceId: string;
  customers: Customer[];
  defaultCustomerId?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const supabase = createSupabaseBrowserClient();
      const { data: userRes } = await supabase.auth.getUser();

      const payload = {
        workspace_id: workspaceId,
        customer_id: String(formData.get("customer_id") ?? ""),
        quote_number: String(formData.get("quote_number") ?? "").trim() || null,
        status: "draft",
        valid_until: String(formData.get("valid_until") ?? "") || null,
        currency: String(formData.get("currency") ?? "USD"),
        total: Number(formData.get("total") ?? 0) || 0,
        notes: String(formData.get("notes") ?? "").trim() || null,
        created_by: userRes.user?.id ?? null,
      };
      if (!payload.customer_id) {
        setError("Pick a customer.");
        return;
      }

      const { data, error: insertError } = await supabase
        .from("quotes")
        .insert(payload)
        .select("id")
        .single();
      if (insertError) {
        setError(insertError.message);
        return;
      }
      router.replace(`/app/quotes/${data.id}`);
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Customer" required>
          <select name="customer_id" required defaultValue={defaultCustomerId ?? ""} className={inputCls}>
            <option value="" disabled>Select customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.display_name}</option>
            ))}
          </select>
        </Field>
        <Field label="Quote number">
          <input name="quote_number" className={inputCls} placeholder="Q-2026-001" />
        </Field>
        <Field label="Valid until">
          <input name="valid_until" type="date" className={inputCls} />
        </Field>
        <Field label="Currency">
          <select name="currency" defaultValue="USD" className={inputCls}>
            <option value="USD">USD</option>
            <option value="CAD">CAD</option>
          </select>
        </Field>
        <Field label="Total">
          <input name="total" type="number" step="0.01" min="0" className={inputCls} defaultValue={0} />
        </Field>
      </div>
      <Field label="Notes">
        <textarea name="notes" rows={3} className={inputCls} />
      </Field>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-full bg-[var(--surface-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Create quote"}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded-2xl border border-[var(--line-soft)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-500)]";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[var(--surface-ink)]">
        {label}{required ? <span className="text-[var(--danger-700)]"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
