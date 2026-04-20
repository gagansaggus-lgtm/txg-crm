"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Line = {
  id: string;
  sku_code: string | null;
  description: string | null;
  expected_qty: number;
  received_qty: number;
  uom: string | null;
  lot_code: string | null;
  condition: string | null;
};

type Sku = { id: string; sku_code: string; description: string | null; uom: string | null };

export function ReceiptLinesEditor({
  receiptId,
  customerId,
  lines,
  skus,
  status,
  receivedAt,
}: {
  receiptId: string;
  customerId: string;
  lines: Line[];
  skus: Sku[];
  status: string;
  receivedAt: string | null;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  void customerId; // reserved for future SKU autocomplete filter

  function addLine(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const skuId = String(formData.get("sku_id") ?? "") || null;
      const sku = skuId ? skus.find((s) => s.id === skuId) : null;
      const payload = {
        receipt_id: receiptId,
        sku_id: skuId,
        sku_code: sku?.sku_code ?? (String(formData.get("sku_code") ?? "").trim() || null),
        description: sku?.description ?? (String(formData.get("description") ?? "").trim() || null),
        expected_qty: Number(formData.get("expected_qty") ?? 0),
        received_qty: Number(formData.get("received_qty") ?? 0),
        uom: sku?.uom ?? String(formData.get("uom") ?? "each"),
        lot_code: String(formData.get("lot_code") ?? "").trim() || null,
        condition: String(formData.get("condition") ?? "good"),
      };
      if (!payload.sku_code) {
        setError("Pick a SKU or type a code.");
        return;
      }
      const supabase = createSupabaseBrowserClient();
      const { error: insertError } = await supabase.from("inbound_receipt_lines").insert(payload);
      if (insertError) {
        setError(insertError.message);
        return;
      }
      setAdding(false);
      router.refresh();
    });
  }

  function updateReceived(id: string, qty: number) {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("inbound_receipt_lines").update({ received_qty: qty }).eq("id", id);
      router.refresh();
    });
  }

  function removeLine(id: string) {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("inbound_receipt_lines").delete().eq("id", id);
      router.refresh();
    });
  }

  function setStatus(next: "expected" | "arrived" | "receiving" | "received" | "closed") {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const patch: Record<string, unknown> = { status: next };
      if (next === "received" && !receivedAt) patch.received_at = new Date().toISOString();
      await supabase.from("inbound_receipts").update(patch).eq("id", receiptId);
      router.refresh();
    });
  }

  const allStatuses = ["expected", "arrived", "receiving", "received", "closed"] as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
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
              {s}
            </button>
          );
        })}
      </div>

      {lines.length === 0 ? (
        <p className="text-sm text-[var(--ink-500)]">No lines yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.14em] text-[var(--ink-500)]">
                <th className="py-2">SKU</th>
                <th>Description</th>
                <th className="text-right">Expected</th>
                <th className="text-right">Received</th>
                <th>UOM</th>
                <th>Lot</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id} className="border-t border-[var(--line-soft)]">
                  <td className="py-2 font-mono text-xs">{l.sku_code ?? "—"}</td>
                  <td>{l.description ?? ""}</td>
                  <td className="text-right tabular-nums">{l.expected_qty}</td>
                  <td className="text-right">
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={l.received_qty}
                      onBlur={(e) => {
                        const next = Number(e.target.value);
                        if (next !== Number(l.received_qty)) updateReceived(l.id, next);
                      }}
                      className="w-20 rounded-lg border border-[var(--line-soft)] bg-white px-2 py-1 text-right text-sm tabular-nums"
                    />
                  </td>
                  <td className="text-xs">{l.uom ?? ""}</td>
                  <td className="text-xs">{l.lot_code ?? ""}</td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => removeLine(l.id)}
                      disabled={isPending}
                      className="text-xs text-[var(--danger-700)]"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adding ? (
        <form action={addLine} className="space-y-3 rounded-xl bg-[var(--surface-accent)] p-3">
          <div className="grid gap-3 sm:grid-cols-6">
            <Field label="SKU" className="sm:col-span-2">
              <select name="sku_id" className={inputCls} defaultValue="">
                <option value="">Custom (type below)</option>
                {skus.map((s) => (
                  <option key={s.id} value={s.id}>{s.sku_code} — {s.description ?? ""}</option>
                ))}
              </select>
            </Field>
            <Field label="SKU code (if custom)">
              <input name="sku_code" className={inputCls} />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <input name="description" className={inputCls} />
            </Field>
            <Field label="UOM">
              <input name="uom" defaultValue="each" className={inputCls} />
            </Field>
            <Field label="Expected">
              <input name="expected_qty" type="number" step="0.01" defaultValue={0} className={inputCls} />
            </Field>
            <Field label="Received">
              <input name="received_qty" type="number" step="0.01" defaultValue={0} className={inputCls} />
            </Field>
            <Field label="Lot / batch">
              <input name="lot_code" className={inputCls} />
            </Field>
            <Field label="Condition">
              <select name="condition" defaultValue="good" className={inputCls}>
                <option value="good">Good</option>
                <option value="damaged">Damaged</option>
                <option value="short">Short</option>
                <option value="over">Over</option>
              </select>
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
