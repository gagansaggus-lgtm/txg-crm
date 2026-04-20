"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ServiceType = "warehousing" | "fulfillment" | "last_mile" | "international_courier";

const serviceOptions: Array<{ value: ServiceType; label: string }> = [
  { value: "warehousing", label: "Warehousing" },
  { value: "fulfillment", label: "Fulfillment" },
  { value: "last_mile", label: "Last-mile" },
  { value: "international_courier", label: "International courier" },
];

export function CustomerForm({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [services, setServices] = useState<Set<ServiceType>>(new Set(["warehousing"]));

  function toggle(service: ServiceType) {
    setServices((prev) => {
      const next = new Set(prev);
      if (next.has(service)) next.delete(service);
      else next.add(service);
      return next;
    });
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const supabase = createSupabaseBrowserClient();
      const { data: userRes } = await supabase.auth.getUser();

      const payload = {
        workspace_id: workspaceId,
        legal_name: String(formData.get("legal_name") ?? "").trim(),
        display_name: String(formData.get("display_name") ?? "").trim(),
        status: String(formData.get("status") ?? "prospect"),
        billing_email: String(formData.get("billing_email") ?? "").trim() || null,
        billing_phone: String(formData.get("billing_phone") ?? "").trim() || null,
        billing_city: String(formData.get("billing_city") ?? "").trim() || null,
        billing_region: String(formData.get("billing_region") ?? "").trim() || null,
        billing_country: String(formData.get("billing_country") ?? "").trim() || null,
        payment_terms: String(formData.get("payment_terms") ?? "").trim() || null,
        currency: String(formData.get("currency") ?? "USD"),
        notes: String(formData.get("notes") ?? "").trim() || null,
        created_by: userRes.user?.id ?? null,
      };

      if (!payload.legal_name || !payload.display_name) {
        setError("Legal name and display name are required.");
        return;
      }

      const { data, error: insertError } = await supabase
        .from("customers")
        .insert(payload)
        .select("id")
        .single();
      if (insertError) {
        setError(insertError.message);
        return;
      }

      if (services.size) {
        const rows = Array.from(services).map((service_type) => ({
          workspace_id: workspaceId,
          customer_id: data.id,
          service_type,
          active: true,
        }));
        const { error: svcErr } = await supabase.from("customer_services").insert(rows);
        if (svcErr) {
          setError(`Customer saved, but services failed: ${svcErr.message}`);
          return;
        }
      }

      router.replace(`/app/customers/${data.id}`);
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Legal name" required>
          <input name="legal_name" required className={inputCls} placeholder="Acme Logistics Inc." />
        </Field>
        <Field label="Display name" required>
          <input name="display_name" required className={inputCls} placeholder="Acme" />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue="prospect" className={inputCls}>
            <option value="prospect">Prospect</option>
            <option value="active">Active</option>
            <option value="churned">Churned</option>
          </select>
        </Field>
        <Field label="Currency">
          <select name="currency" defaultValue="USD" className={inputCls}>
            <option value="USD">USD</option>
            <option value="CAD">CAD</option>
          </select>
        </Field>
        <Field label="Billing email">
          <input name="billing_email" type="email" className={inputCls} placeholder="billing@acme.com" />
        </Field>
        <Field label="Billing phone">
          <input name="billing_phone" className={inputCls} placeholder="+1 716 555 0100" />
        </Field>
        <Field label="City">
          <input name="billing_city" className={inputCls} />
        </Field>
        <Field label="Region / State">
          <input name="billing_region" className={inputCls} />
        </Field>
        <Field label="Country">
          <input name="billing_country" className={inputCls} placeholder="US" />
        </Field>
        <Field label="Payment terms">
          <input name="payment_terms" className={inputCls} placeholder="Net 30" />
        </Field>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--surface-ink)]">Services</p>
        <div className="flex flex-wrap gap-2">
          {serviceOptions.map((option) => {
            const active = services.has(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggle(option.value)}
                className={
                  "rounded-full border px-4 py-2 text-sm transition " +
                  (active
                    ? "border-[var(--accent-600)] bg-[var(--accent-100)] text-[var(--accent-600)]"
                    : "border-[var(--line-soft)] bg-white text-[var(--ink-700)]")
                }
              >
                {option.label}
              </button>
            );
          })}
        </div>
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
          {isPending ? "Saving..." : "Save customer"}
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
        {label}
        {required ? <span className="text-[var(--danger-700)]"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
