"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink } from "lucide-react";

import type { SalesAsset } from "@/lib/supabase/queries/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  upsertSalesAssetAction,
  deleteSalesAssetAction,
} from "@/app/actions/brand";

const TYPES: Array<{ value: SalesAsset["asset_type"]; label: string }> = [
  { value: "pitch_deck", label: "Pitch deck" },
  { value: "case_study_one_pager", label: "Case study one-pager" },
  { value: "integration_doc", label: "Integration doc" },
  { value: "compliance_doc", label: "Compliance doc" },
  { value: "sla_doc", label: "SLA doc" },
  { value: "roi_calculator_internal", label: "ROI calculator (internal)" },
  { value: "objection_handling", label: "Objection handling" },
  { value: "discovery_script", label: "Discovery script" },
  { value: "demo_recording", label: "Demo recording" },
  { value: "other", label: "Other" },
];

export function SalesAssetsManager({ assets }: { assets: SalesAsset[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    asset_type: "pitch_deck" as SalesAsset["asset_type"],
    name: "",
    description: "",
    file_url: "",
    version: "1.0",
  });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name required");
      return;
    }
    startTransition(async () => {
      const res = await upsertSalesAssetAction({
        asset_type: form.asset_type,
        name: form.name,
        description: form.description || null,
        file_url: form.file_url || null,
        version: form.version,
      });
      if (!res.ok) toast.error("Save failed", { description: res.error });
      else {
        toast.success("Asset added");
        setForm({ ...form, name: "", description: "", file_url: "" });
        setAdding(false);
        router.refresh();
      }
    });
  }

  function onDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    startTransition(async () => {
      const res = await deleteSalesAssetAction(id);
      if (!res.ok) toast.error("Delete failed", { description: res.error });
      else {
        toast.success("Deleted");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {assets.length === 0 ? (
        <p className="text-sm text-[var(--ink-500)]">
          No sales assets yet. Add pitch decks, case study one-pagers, integration docs.
        </p>
      ) : (
        <ul className="space-y-2">
          {assets.map((a) => (
            <li
              key={a.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3 py-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-700)]">
                    {a.asset_type.replace(/_/g, " ")}
                  </span>
                  <span className="text-[10px] text-[var(--ink-500)]">v{a.version}</span>
                  {!a.active ? (
                    <span className="text-[10px] uppercase text-[var(--ink-400)]">Inactive</span>
                  ) : null}
                </div>
                <p className="text-sm font-semibold text-[var(--ink-950)]">{a.name}</p>
                {a.description ? (
                  <p className="text-xs text-[var(--ink-700)]">{a.description}</p>
                ) : null}
                {a.file_url ? (
                  <a
                    href={a.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 mt-1 text-xs text-[var(--accent-600)] hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> Open
                  </a>
                ) : null}
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onDelete(a.id, a.name)}
                disabled={pending}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <form
          onSubmit={submit}
          className="space-y-2 rounded-lg border border-[var(--accent-600)]/30 bg-[var(--accent-100)]/40 p-3"
        >
          <div className="grid grid-cols-3 gap-2">
            <select
              value={form.asset_type}
              onChange={(e) =>
                setForm({ ...form, asset_type: e.target.value as SalesAsset["asset_type"] })
              }
              className="h-9 rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 text-sm outline-none focus:border-[var(--accent-600)]"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <Input
              required
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="col-span-2"
            />
          </div>
          <Input
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-3 gap-2">
            <Input
              placeholder="File URL"
              value={form.file_url}
              onChange={(e) => setForm({ ...form, file_url: e.target.value })}
              className="col-span-2"
            />
            <Input
              placeholder="Version"
              value={form.version}
              onChange={(e) => setForm({ ...form, version: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={pending} size="sm">
              {pending ? "Adding…" : "Add"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)} className="w-full" size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Add asset
        </Button>
      )}
    </div>
  );
}
