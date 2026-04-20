"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Customer = { id: string; display_name: string };
type Facility = { id: string; code: string; name: string };

export function InboundReceiptForm({
  workspaceId,
  customers,
  facilities,
  defaultCustomerId,
}: {
  workspaceId: string;
  customers: Customer[];
  facilities: Facility[];
  defaultCustomerId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const supabase = createSupabaseBrowserClient();
      const { data: userRes } = await supabase.auth.getUser();

      const payload = {
        workspace_id: workspaceId,
        customer_id: String(formData.get("customer_id") ?? ""),
        facility_id: String(formData.get("facility_id") ?? ""),
        receipt_number: String(formData.get("receipt_number") ?? "").trim() || null,
        expected_at: String(formData.get("expected_at") ?? "") || null,
        carrier: String(formData.get("carrier") ?? "").trim() || null,
        bol_number: String(formData.get("bol_number") ?? "").trim() || null,
        notes: String(formData.get("notes") ?? "").trim() || null,
        status: "expected",
        created_by: userRes.user?.id ?? null,
      };

      if (!payload.customer_id || !payload.facility_id) {
        setError("Customer and facility are required.");
        return;
      }

      const { data, error: insertError } = await supabase
        .from("inbound_receipts")
        .insert(payload)
        .select("id")
        .single();
      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.replace(`/app/warehouse/inbound/${data.id}`);
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
        <Field label="Facility" required>
          <select name="facility_id" required className={inputCls} defaultValue={facilities[0]?.id ?? ""}>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>{f.code} — {f.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Receipt number">
          <input name="receipt_number" className={inputCls} placeholder="RCV-2026-001" />
        </Field>
        <Field label="Expected arrival">
          <input name="expected_at" type="datetime-local" className={inputCls} />
        </Field>
        <Field label="Carrier">
          <input name="carrier" className={inputCls} placeholder="Canpar / UPS / LTL" />
        </Field>
        <Field label="BOL number">
          <input name="bol_number" className={inputCls} />
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
          {isPending ? "Saving..." : "Create receipt"}
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
