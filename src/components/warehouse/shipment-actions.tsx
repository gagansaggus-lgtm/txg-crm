"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const allStatuses = [
  "pending",
  "label_created",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "exception",
] as const;

type Status = typeof allStatuses[number];

export function ShipmentActions({
  shipmentId,
  fulfillmentOrderId,
  status,
  shippedAt,
  deliveredAt,
}: {
  shipmentId: string;
  fulfillmentOrderId: string | null;
  status: Status;
  shippedAt: string | null;
  deliveredAt: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  function setStatus(next: Status) {
    startTransition(async () => {
      setError(null);
      const supabase = createSupabaseBrowserClient();
      const patch: Record<string, unknown> = { status: next };
      if (next === "picked_up" || next === "in_transit") {
        if (!shippedAt) patch.shipped_at = new Date().toISOString();
      }
      if (next === "delivered" && !deliveredAt) {
        patch.delivered_at = new Date().toISOString();
      }
      const { error: updErr } = await supabase.from("shipments").update(patch).eq("id", shipmentId);
      if (updErr) {
        setError(updErr.message);
        return;
      }
      await supabase.from("shipment_events").insert({
        shipment_id: shipmentId,
        event_code: next,
        source: "manual",
      });
      if (next === "delivered" && fulfillmentOrderId) {
        await supabase.from("fulfillment_orders").update({ status: "shipped" }).eq("id", fulfillmentOrderId);
      }
      router.refresh();
    });
  }

  function addEvent(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const event_code = String(formData.get("event_code") ?? "").trim();
      if (!event_code) {
        setError("Event code is required.");
        return;
      }
      const supabase = createSupabaseBrowserClient();
      const { error: insertError } = await supabase.from("shipment_events").insert({
        shipment_id: shipmentId,
        event_code,
        location: String(formData.get("location") ?? "").trim() || null,
        notes: String(formData.get("notes") ?? "").trim() || null,
        source: "manual",
      });
      if (insertError) {
        setError(insertError.message);
        return;
      }
      setAdding(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-500)]">Status</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {allStatuses.map((s) => {
            const active = s === status;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                disabled={isPending || active}
                className={
                  "rounded-full border px-3 py-1 text-xs transition " +
                  (active
                    ? "border-[var(--accent-600)] bg-[var(--accent-100)] text-[var(--accent-600)]"
                    : "border-[var(--line-soft)] bg-white text-[var(--ink-700)] hover:text-[var(--accent-600)]")
                }
              >
                {s.replace(/_/g, " ")}
              </button>
            );
          })}
        </div>
      </div>

      {adding ? (
        <form action={addEvent} className="space-y-3 rounded-xl bg-[var(--surface-accent)] p-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Event code" required>
              <input name="event_code" required className={inputCls} placeholder="arrived_hub / delayed / delivered" />
            </Field>
            <Field label="Location">
              <input name="location" className={inputCls} placeholder="Buffalo, NY" />
            </Field>
            <Field label="Notes">
              <input name="notes" className={inputCls} />
            </Field>
          </div>
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
              {isPending ? "Saving..." : "Log event"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-xs font-medium text-[var(--accent-600)]"
        >
          + Log custom event
        </button>
      )}

      {error && !adding ? <p className="text-xs text-red-700">{error}</p> : null}
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
