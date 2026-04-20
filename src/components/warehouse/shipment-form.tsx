"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Customer = { id: string; display_name: string };
type Facility = { id: string; code: string; name: string };
type OrderSummary = { id: string; customer_id: string; facility_id: string | null; order_number: string | null };

export function ShipmentForm({
  workspaceId,
  customers,
  facilities,
  defaultCustomerId,
  linkedOrder,
}: {
  workspaceId: string;
  customers: Customer[];
  facilities: Facility[];
  defaultCustomerId?: string;
  linkedOrder?: OrderSummary;
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
        facility_id: String(formData.get("facility_id") ?? "") || null,
        fulfillment_order_id: linkedOrder?.id ?? null,
        shipment_number: String(formData.get("shipment_number") ?? "").trim() || null,
        type: String(formData.get("type") ?? "outbound_fulfillment"),
        carrier: String(formData.get("carrier") ?? "").trim() || null,
        service_level: String(formData.get("service_level") ?? "").trim() || null,
        tracking_number: String(formData.get("tracking_number") ?? "").trim() || null,
        weight_kg: Number(formData.get("weight_kg") ?? 0) || null,
        cost: Number(formData.get("cost") ?? 0) || null,
        charge: Number(formData.get("charge") ?? 0) || null,
        status: "pending",
        created_by: userRes.user?.id ?? null,
      };
      if (!payload.customer_id) {
        setError("Customer is required.");
        return;
      }

      const { data, error: insertError } = await supabase
        .from("shipments")
        .insert(payload)
        .select("id")
        .single();
      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.replace(`/app/warehouse/shipments/${data.id}`);
      router.refresh();
    });
  }

  return (
    <form action={submit} className="space-y-4">
      {linkedOrder ? (
        <div className="rounded-2xl bg-[var(--surface-accent)] px-4 py-3 text-sm text-[var(--ink-700)]">
          Linking to order {linkedOrder.order_number ?? linkedOrder.id.slice(0, 8)}.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Customer" required>
          <select
            name="customer_id"
            required
            defaultValue={defaultCustomerId ?? linkedOrder?.customer_id ?? ""}
            className={inputCls}
          >
            <option value="" disabled>Select customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.display_name}</option>
            ))}
          </select>
        </Field>
        <Field label="Facility">
          <select
            name="facility_id"
            className={inputCls}
            defaultValue={linkedOrder?.facility_id ?? facilities[0]?.id ?? ""}
          >
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>{f.code} — {f.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Shipment number">
          <input name="shipment_number" className={inputCls} placeholder="SHP-2026-001" />
        </Field>
        <Field label="Type">
          <select name="type" defaultValue="outbound_fulfillment" className={inputCls}>
            <option value="outbound_fulfillment">Outbound fulfillment</option>
            <option value="last_mile">Last-mile</option>
            <option value="international">International</option>
          </select>
        </Field>
        <Field label="Carrier">
          <input name="carrier" className={inputCls} placeholder="UPS / FedEx / Canpar" />
        </Field>
        <Field label="Service level">
          <input name="service_level" className={inputCls} placeholder="Ground / Express" />
        </Field>
        <Field label="Tracking number">
          <input name="tracking_number" className={inputCls} />
        </Field>
        <Field label="Weight (kg)">
          <input name="weight_kg" type="number" step="0.01" className={inputCls} />
        </Field>
        <Field label="Cost">
          <input name="cost" type="number" step="0.01" className={inputCls} />
        </Field>
        <Field label="Charge to customer">
          <input name="charge" type="number" step="0.01" className={inputCls} />
        </Field>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-full bg-[var(--surface-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Create shipment"}
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
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[var(--surface-ink)]">
        {label}{required ? <span className="text-[var(--danger-700)]"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
