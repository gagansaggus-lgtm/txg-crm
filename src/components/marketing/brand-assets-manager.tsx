"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink } from "lucide-react";

import type { BrandAsset } from "@/lib/supabase/queries/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  upsertBrandAssetAction,
  deleteBrandAssetAction,
} from "@/app/actions/brand";

const ASSET_TYPES: Array<{ value: BrandAsset["asset_type"]; label: string }> = [
  { value: "logo", label: "Logo" },
  { value: "palette", label: "Color palette" },
  { value: "typography", label: "Typography" },
  { value: "photography", label: "Photography" },
  { value: "template", label: "Template" },
  { value: "voice_tone", label: "Voice & tone" },
  { value: "other", label: "Other" },
];

export function BrandAssetsManager({ assets }: { assets: BrandAsset[] }) {
  const [adding, setAdding] = useState(false);

  // Group by type
  const grouped = ASSET_TYPES.map((t) => ({
    ...t,
    items: assets.filter((a) => a.asset_type === t.value),
  }));

  return (
    <div className="space-y-5">
      {grouped.map((g) => (
        <div key={g.value}>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)] mb-2">
            {g.label} ({g.items.length})
          </p>
          {g.items.length === 0 ? (
            <p className="text-sm text-[var(--ink-500)]">No {g.label.toLowerCase()} added yet.</p>
          ) : (
            <ul className="space-y-2">
              {g.items.map((item) => (
                <AssetRow key={item.id} asset={item} />
              ))}
            </ul>
          )}
        </div>
      ))}

      {adding ? (
        <NewAssetForm onCancel={() => setAdding(false)} onSaved={() => setAdding(false)} />
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)} className="w-full">
          <Plus className="mr-1 h-4 w-4" />
          Add brand asset
        </Button>
      )}
    </div>
  );
}

function AssetRow({ asset }: { asset: BrandAsset }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!confirm(`Delete "${asset.name}"?`)) return;
    startTransition(async () => {
      const res = await deleteBrandAssetAction(asset.id);
      if (!res.ok) toast.error("Delete failed", { description: res.error });
      else {
        toast.success("Deleted");
        router.refresh();
      }
    });
  }

  return (
    <li className="flex items-start justify-between gap-3 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--ink-950)]">{asset.name}</p>
        {asset.description ? (
          <p className="text-xs text-[var(--ink-700)]">{asset.description}</p>
        ) : null}
        {asset.file_url ? (
          <a
            href={asset.file_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 mt-1 text-xs text-[var(--accent-600)] hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Open
          </a>
        ) : null}
      </div>
      <Button variant="ghost" size="icon-xs" onClick={onDelete} disabled={pending}>
        <Trash2 className="h-3 w-3" />
      </Button>
    </li>
  );
}

function NewAssetForm({
  onCancel,
  onSaved,
}: {
  onCancel: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    asset_type: "logo" as BrandAsset["asset_type"],
    name: "",
    description: "",
    file_url: "",
  });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name required");
      return;
    }
    startTransition(async () => {
      const res = await upsertBrandAssetAction({
        asset_type: form.asset_type,
        name: form.name,
        description: form.description || null,
        file_url: form.file_url || null,
      });
      if (!res.ok) toast.error("Save failed", { description: res.error });
      else {
        toast.success("Asset added");
        onSaved();
        router.refresh();
      }
    });
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-2 rounded-lg border border-[var(--accent-600)]/30 bg-[var(--accent-100)]/40 p-3"
    >
      <div className="grid grid-cols-2 gap-2">
        <select
          value={form.asset_type}
          onChange={(e) =>
            setForm({ ...form, asset_type: e.target.value as BrandAsset["asset_type"] })
          }
          className="h-9 rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 text-sm outline-none focus:border-[var(--accent-600)]"
        >
          {ASSET_TYPES.map((t) => (
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
        />
      </div>
      <Input
        placeholder="Description (optional)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <Input
        placeholder="File URL (optional)"
        value={form.file_url}
        onChange={(e) => setForm({ ...form, file_url: e.target.value })}
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Adding…" : "Add"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
