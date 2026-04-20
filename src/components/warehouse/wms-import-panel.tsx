"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

type Entity = "skus" | "receipts" | "orders" | "shipments";

const entities: Array<{ value: Entity; label: string; hint: string }> = [
  { value: "skus", label: "SKUs", hint: "Columns: customer, sku_code, description, uom, weight_kg, wms_external_id" },
  { value: "receipts", label: "Receipts", hint: "Columns: customer, facility_code, receipt_number, expected_at, status, carrier, bol_number, wms_external_id" },
  { value: "orders", label: "Orders", hint: "Columns: customer, facility_code, order_number, required_ship_date, status, ship_to_name, ship_to_city, ship_to_country, wms_external_id" },
  { value: "shipments", label: "Shipments", hint: "Columns: customer, facility_code, shipment_number, tracking_number, carrier, service_level, status, shipped_at, delivered_at, weight_kg, wms_external_id" },
];

type Result = { ok: boolean; rowsIn?: number; rowsOk?: number; rowsFailed?: number; errors?: string[]; error?: string };

export function WmsImportPanel() {
  const router = useRouter();
  const [entity, setEntity] = useState<Entity>("skus");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);

  function submit() {
    if (!file) return;
    startTransition(async () => {
      setResult(null);
      const body = new FormData();
      body.append("entity", entity);
      body.append("file", file);
      const res = await fetch("/api/wms/import", { method: "POST", body });
      const json = (await res.json()) as Result & { errors?: string[] };
      setResult(json);
      if (res.ok) {
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      }
    });
  }

  const active = entities.find((e) => e.value === entity)!;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {entities.map((e) => (
          <button
            key={e.value}
            type="button"
            onClick={() => setEntity(e.value)}
            className={
              "rounded-full border px-4 py-2 text-sm transition " +
              (entity === e.value
                ? "border-[var(--accent-600)] bg-[var(--accent-100)] text-[var(--accent-600)]"
                : "border-[var(--line-soft)] bg-white text-[var(--ink-700)]")
            }
          >
            {e.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-[var(--ink-500)]">{active.hint}</p>

      <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-[1.25rem] border-2 border-dashed border-[var(--line-strong)] bg-white text-center text-sm text-[var(--ink-500)] transition hover:border-[var(--accent-500)]">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <span className="font-medium text-[var(--surface-ink)]">{file.name}</span>
        ) : (
          <>
            <span className="font-medium text-[var(--surface-ink)]">Drop a CSV or click to pick</span>
            <span className="text-xs text-[var(--ink-500)]">UTF-8, first row is the header.</span>
          </>
        )}
      </label>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!file || isPending}
          onClick={submit}
          className="inline-flex items-center rounded-full bg-[var(--surface-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Importing..." : `Import ${active.label.toLowerCase()}`}
        </button>
      </div>

      {result ? (
        result.ok ? (
          <div className="rounded-2xl border border-[var(--success-100)] bg-[var(--success-100)] px-4 py-3 text-sm text-[var(--success-700)]">
            Imported {result.rowsOk}/{result.rowsIn} rows. {result.rowsFailed ? `${result.rowsFailed} failed.` : ""}
            {result.errors && result.errors.length ? (
              <ul className="mt-2 list-disc pl-5 text-xs">
                {result.errors.slice(0, 5).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {result.error ?? "Import failed."}
          </div>
        )
      ) : null}
    </div>
  );
}
