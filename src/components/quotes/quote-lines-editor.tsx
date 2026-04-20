"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

type Line = {
  id: string;
  service_type: string;
  description: string;
  qty: number;
  unit: string;
  unit_price: number;
  total: number;
};

type Props = {
  quoteId: string;
  currency: string;
  lines: Line[];
};

const serviceOptions = [
  { value: "warehousing", label: "Warehousing" },
  { value: "fulfillment", label: "Fulfillment" },
  { value: "last_mile", label: "Last-mile" },
  { value: "international_courier", label: "International" },
];

const unitOptions = [
  "per_pallet",
  "per_cbft_month",
  "per_pick",
  "per_shipment",
  "per_mile",
  "flat",
  "hour",
];

export function QuoteLinesEditor({ quoteId, currency, lines }: Props) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const subtotal = lines.reduce((sum, l) => sum + Number(l.total || 0), 0);

  async function syncTotal() {
    const supabase = createSupabaseBrowserClient();
    const { data: current } = await supabase
      .from("quote_lines")
      .select("total")
      .eq("quote_id", quoteId);
    const newTotal = (current ?? []).reduce(
      (sum: number, l: { total: number }) => sum + Number(l.total || 0),
      0,
    );
    await supabase.from("quotes").update({ total: newTotal }).eq("id", quoteId);
  }

  function add(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const qty = Number(formData.get("qty") ?? 0);
      const unit_price = Number(formData.get("unit_price") ?? 0);
      const payload = {
        quote_id: quoteId,
        service_type: String(formData.get("service_type") ?? "warehousing"),
        description: String(formData.get("description") ?? "").trim(),
        qty,
        unit: String(formData.get("unit") ?? "flat"),
        unit_price,
        total: Number((qty * unit_price).toFixed(2)),
      };
      if (!payload.description) {
        setError("Description is required.");
        return;
      }
      const supabase = createSupabaseBrowserClient();
      const { error: insertError } = await supabase.from("quote_lines").insert(payload);
      if (insertError) {
        setError(insertError.message);
        return;
      }
      await syncTotal();
      setAdding(false);
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("quote_lines").delete().eq("id", id);
      await syncTotal();
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {lines.length === 0 ? (
        <p className="text-sm text-[var(--ink-500)]">No line items yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.14em] text-[var(--ink-500)]">
                <th className="py-2">Service</th>
                <th>Description</th>
                <th className="text-right">Qty</th>
                <th>Unit</th>
                <th className="text-right">Rate</th>
                <th className="text-right">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id} className="border-t border-[var(--line-soft)]">
                  <td className="py-2 text-xs">{l.service_type}</td>
                  <td>{l.description}</td>
                  <td className="text-right tabular-nums">{l.qty}</td>
                  <td className="text-xs">{l.unit}</td>
                  <td className="text-right tabular-nums">{formatCurrency(l.unit_price, currency)}</td>
                  <td className="text-right font-semibold tabular-nums">{formatCurrency(l.total, currency)}</td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => remove(l.id)}
                      disabled={isPending}
                      className="text-xs text-[var(--danger-700)]"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="border-t border-[var(--line-strong)]">
                <td colSpan={5} className="py-2 text-right text-xs uppercase tracking-[0.14em] text-[var(--ink-500)]">
                  Subtotal
                </td>
                <td className="py-2 text-right text-base font-semibold">{formatCurrency(subtotal, currency)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {adding ? (
        <form action={add} className="space-y-3 rounded-xl bg-[var(--surface-accent)] p-3">
          <div className="grid gap-3 sm:grid-cols-6">
            <Field label="Service">
              <select name="service_type" defaultValue="warehousing" className={inputCls}>
                {serviceOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <input name="description" required className={inputCls} placeholder="Storage, per pallet / month" />
            </Field>
            <Field label="Qty">
              <input name="qty" type="number" step="0.01" defaultValue={1} className={inputCls} />
            </Field>
            <Field label="Unit">
              <select name="unit" defaultValue="per_pallet" className={inputCls}>
                {unitOptions.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </Field>
            <Field label="Unit price">
              <input name="unit_price" type="number" step="0.01" defaultValue={0} className={inputCls} />
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
              {isPending ? "Saving..." : "Add line"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-xs font-medium text-[var(--accent-600)]"
        >
          + Add line
        </button>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-[var(--line-soft)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent-500)]";

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block space-y-1 ${className ?? ""}`}>
      <span className="text-xs font-medium text-[var(--surface-ink)]">{label}</span>
      {children}
    </label>
  );
}
