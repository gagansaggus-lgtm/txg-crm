"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { toast } from "sonner";
import { Upload, ChevronRight, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { importLeadsAction } from "@/app/actions/leads";
import type { LeadInsertInput } from "@/lib/supabase/queries/leads";
import type { LeadSource } from "@/types/marketing";

type Step = "upload" | "map" | "preview" | "done";

type ColumnMap = {
  display_name: string | null;
  legal_name: string | null;
  website: string | null;
  vertical: string | null;
  country: string | null;
  city: string | null;
  estimated_gmv_usd: string | null;
  funding_stage: string | null;
  source_external_id: string | null;
};

const TARGET_FIELDS: Array<{
  key: keyof ColumnMap;
  label: string;
  required?: boolean;
  hint?: string;
}> = [
  { key: "display_name", label: "Display name (brand)", required: true },
  { key: "website", label: "Website" },
  { key: "legal_name", label: "Legal name" },
  { key: "vertical", label: "Vertical / category" },
  { key: "country", label: "Country" },
  { key: "city", label: "City" },
  { key: "estimated_gmv_usd", label: "Estimated GMV (USD)", hint: "Numeric" },
  { key: "funding_stage", label: "Funding stage" },
  { key: "source_external_id", label: "Source ID (de-dup key)", hint: "StoreLeads ID, etc." },
];

const SOURCES: Array<{ value: LeadSource; label: string }> = [
  { value: "storeleads", label: "StoreLeads (India D2C)" },
  { value: "manual", label: "Manual / Other CSV" },
  { value: "referral", label: "Referral list" },
  { value: "partner", label: "Partner-provided list" },
  { value: "event", label: "Event capture" },
  { value: "other", label: "Other" },
];

export function LeadImportClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [pending, startTransition] = useTransition();

  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [source, setSource] = useState<LeadSource>("storeleads");
  const [fileName, setFileName] = useState("");

  const [mapping, setMapping] = useState<ColumnMap>({
    display_name: null,
    legal_name: null,
    website: null,
    vertical: null,
    country: null,
    city: null,
    estimated_gmv_usd: null,
    funding_stage: null,
    source_external_id: null,
  });

  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(
    null,
  );

  function onFile(file: File) {
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      preview: 0,
      complete: (results) => {
        const data = results.data ?? [];
        if (!data.length) {
          toast.error("No rows detected in this CSV");
          return;
        }
        const cols = Object.keys(data[0] ?? {});
        if (!cols.length) {
          toast.error("No columns detected — is the first row your headers?");
          return;
        }
        setRows(data);
        setColumns(cols);
        autoMap(cols);
        setStep("map");
        toast.success(`Parsed ${data.length.toLocaleString()} rows`);
      },
      error: (err) => {
        toast.error("Parse failed", { description: err.message });
      },
    });
  }

  function autoMap(cols: string[]) {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const next: ColumnMap = { ...mapping };
    for (const col of cols) {
      const n = norm(col);
      if (!next.display_name && /(^|_)(name|brand|company|store|shop|merchant|title)/.test(n))
        next.display_name = col;
      if (!next.website && /(website|url|domain|site|homepage)/.test(n))
        next.website = col;
      if (!next.vertical && /(vertical|category|industry|niche)/.test(n))
        next.vertical = col;
      if (!next.country && /(^country|country$|location)/.test(n))
        next.country = col;
      if (!next.city && /city|town/.test(n)) next.city = col;
      if (
        !next.estimated_gmv_usd &&
        /(gmv|revenue|sales|estimate|monthlyvisits|traffic)/.test(n)
      )
        next.estimated_gmv_usd = col;
      if (!next.funding_stage && /(funding|stage|round|investor)/.test(n))
        next.funding_stage = col;
      if (
        !next.source_external_id &&
        /(^id$|storeleadsid|externalid|source_id|leadid)/.test(n)
      )
        next.source_external_id = col;
      if (!next.legal_name && /(legal|business)/.test(n)) next.legal_name = col;
    }
    setMapping(next);
  }

  function buildLeads(): LeadInsertInput[] {
    if (!mapping.display_name) return [];
    return rows
      .map((r) => {
        const get = (key: keyof ColumnMap) => {
          const col = mapping[key];
          if (!col) return null;
          const v = r[col];
          if (v == null || v === "") return null;
          return v.toString().trim();
        };
        const display = get("display_name");
        if (!display) return null;
        const gmvStr = get("estimated_gmv_usd");
        const gmv = gmvStr ? parseFloat(gmvStr.replace(/[$,]/g, "")) : null;
        return {
          source,
          source_external_id: get("source_external_id"),
          display_name: display,
          legal_name: get("legal_name"),
          website: get("website"),
          vertical: get("vertical"),
          country: get("country")?.slice(0, 2)?.toUpperCase() ?? null,
          city: get("city"),
          estimated_gmv_usd: Number.isFinite(gmv) ? Math.round(gmv as number) : null,
          funding_stage: get("funding_stage"),
        } as LeadInsertInput;
      })
      .filter((x): x is LeadInsertInput => x !== null);
  }

  function doImport() {
    const leads = buildLeads();
    if (!leads.length) {
      toast.error("No valid rows after mapping");
      return;
    }
    if (leads.length > 5000) {
      toast.error("Max 5,000 rows per import. Split your CSV and try again.");
      return;
    }
    startTransition(async () => {
      const res = await importLeadsAction(leads);
      if ("error" in res) {
        toast.error("Import failed", { description: res.error });
      } else {
        setResult(res.data ?? { inserted: 0, skipped: 0 });
        setStep("done");
        toast.success(`Imported ${res.data?.inserted ?? 0} leads`);
      }
    });
  }

  if (step === "upload") {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-500)] mb-2">
            Lead source
          </p>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as LeadSource)}
            className="h-10 w-full rounded-lg border border-[var(--input)] bg-transparent px-3 text-sm outline-none focus:border-[var(--accent-600)]"
          >
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[var(--line-strong)] bg-[var(--surface-soft)] px-6 py-12 hover:border-[var(--accent-600)] hover:bg-[var(--accent-100)] transition-colors">
          <Upload className="h-8 w-8 text-[var(--ink-500)]" />
          <p className="brand-headline text-lg text-[var(--ink-950)]">
            Upload CSV file
          </p>
          <p className="text-xs text-[var(--ink-500)]">
            Up to 5,000 rows · first row must be headers
          </p>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
        </label>
      </div>
    );
  }

  if (step === "map") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--ink-700)]">
              <span className="font-semibold text-[var(--ink-950)]">{fileName}</span>{" "}
              · {rows.length.toLocaleString()} rows · {columns.length} columns
            </p>
            <p className="text-xs text-[var(--ink-500)]">
              Map your CSV columns to TXG fields. Display name is required.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setStep("upload");
              setRows([]);
              setColumns([]);
            }}
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Re-upload
          </Button>
        </div>

        <div className="space-y-2 rounded-lg border border-[var(--line-soft)] p-4">
          {TARGET_FIELDS.map((field) => (
            <div key={field.key} className="grid grid-cols-2 items-center gap-3">
              <div>
                <p className="text-sm font-medium text-[var(--ink-950)]">
                  {field.label}
                  {field.required ? (
                    <span className="ml-1 text-[var(--accent-600)]">*</span>
                  ) : null}
                </p>
                {field.hint ? (
                  <p className="text-[11px] text-[var(--ink-500)]">{field.hint}</p>
                ) : null}
              </div>
              <select
                value={mapping[field.key] ?? ""}
                onChange={(e) =>
                  setMapping({ ...mapping, [field.key]: e.target.value || null })
                }
                className="h-9 rounded-lg border border-[var(--input)] bg-transparent px-3 text-sm outline-none focus:border-[var(--accent-600)]"
              >
                <option value="">— skip —</option>
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <Button
          type="button"
          onClick={() => setStep("preview")}
          disabled={!mapping.display_name}
          className="w-full"
        >
          Preview {rows.length.toLocaleString()} rows
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (step === "preview") {
    const sample = buildLeads().slice(0, 10);
    const total = buildLeads().length;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--ink-700)]">
              Ready to import{" "}
              <span className="font-semibold text-[var(--ink-950)]">
                {total.toLocaleString()}
              </span>{" "}
              leads
            </p>
            <p className="text-xs text-[var(--ink-500)]">
              Duplicates (matching source ID) are skipped automatically.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStep("map")}
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[var(--line-soft)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--line-soft)] bg-[var(--surface-soft)]">
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
                  Name
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
                  Website
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
                  Vertical
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
                  Country
                </th>
                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
                  GMV
                </th>
              </tr>
            </thead>
            <tbody>
              {sample.map((r, i) => (
                <tr key={i} className="border-b border-[var(--line-soft)]">
                  <td className="px-3 py-2 text-sm font-medium">
                    {r.display_name}
                  </td>
                  <td className="px-3 py-2 text-xs text-[var(--ink-700)]">
                    {r.website ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">{r.vertical ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">{r.country ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-xs">
                    {r.estimated_gmv_usd
                      ? `$${(r.estimated_gmv_usd / 1000).toFixed(0)}K`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-[var(--ink-500)]">
          Showing first 10 of {total.toLocaleString()} rows.
        </p>

        <Button
          type="button"
          onClick={doImport}
          disabled={pending}
          className="w-full"
        >
          {pending ? "Importing…" : `Import ${total.toLocaleString()} leads`}
        </Button>
      </div>
    );
  }

  // step === "done"
  return (
    <div className="space-y-4 text-center py-8">
      <p className="brand-display text-3xl text-[var(--ink-950)]">Imported</p>
      <p className="text-sm text-[var(--ink-700)]">
        <span className="text-[var(--accent-600)] font-bold">{result?.inserted ?? 0}</span>{" "}
        new leads inserted ·{" "}
        <span className="font-semibold">{result?.skipped ?? 0}</span> duplicates skipped
      </p>
      <p className="text-xs text-[var(--ink-500)] max-w-md mx-auto">
        Run the Claude Code agent to validate and score these leads. They'll appear
        in the Leads list immediately with status "raw" — validation moves them through
        the pipeline.
      </p>
      <div className="flex justify-center gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setStep("upload");
            setRows([]);
            setColumns([]);
            setResult(null);
          }}
        >
          Import another file
        </Button>
        <Button
          type="button"
          onClick={() => router.push("/app/leads")}
        >
          View leads
        </Button>
      </div>
    </div>
  );
}
