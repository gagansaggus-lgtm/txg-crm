"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Customer = { id: string; display_name: string };
type Facility = { id: string; code: string; name: string };

export function FulfillmentOrderForm({
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
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const supabase = createSupabaseBrowserClient();
      const { data: userRes } = await supabase.auth.getUser();

      const payload = {
        workspace_id: workspaceId,
        customer_id: String(formData.get("customer_id") ?? ""),
        facility_id: String(formData.get("facility_id") ?? ""),
        order_number: String(formData.get("order_number") ?? "").trim() || null,
        external_order_id: String(formData.get("external_order_id") ?? "").trim() || null,
        channel: String(formData.get("channel") ?? "manual"),
        required_ship_date: String(formData.get("required_ship_date") ?? "") || null,
        status: "new",
        ship_to_name: String(formData.get("ship_to_name") ?? "").trim() || null,
        ship_to_address_line1: String(formData.get("ship_to_address_line1") ?? "").trim() || null,
        ship_to_city: String(formData.get("ship_to_city") ?? "").trim() || null,
        ship_to_region: String(formData.get("ship_to_region") ?? "").trim() || null,
        ship_to_postal: String(formData.get("ship_to_postal") ?? "").trim() || null,
        ship_to_country: String(formData.get("ship_to_country") ?? "").trim() || null,
        ship_to_phone: String(formData.get("ship_to_phone") ?? "").trim() || null,
        notes: String(formData.get("notes") ?? "").trim() || null,
        created_by: userRes.user?.id ?? null,
      };
      if (!payload.customer_id || !payload.facility_id) {
        setError("Customer and facility are required.");
        return;
      }

      const { data, error: insertError } = await supabase
        .from("fulfillment_orders")
        .insert(payload)
        .select("id")
        .single();
      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.replace(`/app/warehouse/orders/${data.id}`);
      router.refresh();
    });
  }

  return (
    <form action={submit} className="space-y-4">
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
        <Field label="Order number">
          <input name="order_number" className={inputCls} placeholder="SO-2026-001" />
        </Field>
        <Field label="External order ID">
          <input name="external_order_id" className={inputCls} placeholder="Shopify / marketplace" />
        </Field>
        <Field label="Channel">
          <select name="channel" defaultValue="manual" className={inputCls}>
            <option value="manual">Manual</option>
            <option value="shopify">Shopify</option>
            <option value="csv">CSV</option>
            <option value="api">API</option>
          </select>
        </Field>
        <Field label="Required ship date">
          <input name="required_ship_date" type="date" className={inputCls} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ship to name">
          <input name="ship_to_name" className={inputCls} />
        </Field>
        <Field label="Ship to phone">
          <input name="ship_to_phone" className={inputCls} />
        </Field>
        <Field label="Address" className="sm:col-span-2">
          <input name="ship_to_address_line1" className={inputCls} />
        </Field>
        <Field label="City">
          <input name="ship_to_city" className={inputCls} />
        </Field>
        <Field label="Region / State">
          <input name="ship_to_region" className={inputCls} />
        </Field>
        <Field label="Postal">
          <input name="ship_to_postal" className={inputCls} />
        </Field>
        <Field label="Country">
          <input name="ship_to_country" className={inputCls} placeholder="US" />
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
          {isPending ? "Saving..." : "Create order"}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded-2xl border border-[var(--line-soft)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-500)]";

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block space-y-2 ${className ?? ""}`}>
      <span className="text-sm font-medium text-[var(--surface-ink)]">
        {label}{required ? <span className="text-[var(--danger-700)]"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
