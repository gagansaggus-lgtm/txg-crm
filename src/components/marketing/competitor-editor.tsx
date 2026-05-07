"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { Competitor } from "@/types/marketing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upsertCompetitorAction } from "@/app/actions/strategy";

export function CompetitorEditor({ competitor }: { competitor: Competitor }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const profile = (competitor.profile ?? {}) as Record<string, unknown>;
  const [form, setForm] = useState({
    name: competitor.name,
    website: competitor.website ?? "",
    positioning: competitor.positioning ?? "",
    pricing_notes: competitor.pricing_notes ?? "",
    asset_based: profile.asset_based as boolean | undefined,
    incumbent: (profile.incumbent as boolean | undefined) ?? false,
    weakness: (profile.weakness as string | undefined) ?? "",
    founded: (profile.founded as number | undefined)?.toString() ?? "",
    main_lanes: Array.isArray(profile.main_lanes)
      ? (profile.main_lanes as string[]).join(", ")
      : "",
    active: competitor.active,
  });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name required");
      return;
    }
    startTransition(async () => {
      const newProfile: Record<string, unknown> = { ...profile };
      if (form.asset_based !== undefined) newProfile.asset_based = form.asset_based;
      newProfile.incumbent = form.incumbent;
      if (form.weakness) newProfile.weakness = form.weakness;
      else delete newProfile.weakness;
      if (form.founded) newProfile.founded = parseInt(form.founded, 10);
      else delete newProfile.founded;
      const lanes = form.main_lanes.split(",").map((s) => s.trim()).filter(Boolean);
      if (lanes.length) newProfile.main_lanes = lanes;
      else delete newProfile.main_lanes;

      const res = await upsertCompetitorAction({
        id: competitor.id,
        name: form.name,
        website: form.website || null,
        positioning: form.positioning || null,
        pricing_notes: form.pricing_notes || null,
        profile: newProfile,
        active: form.active,
      });
      if (!res.ok) {
        toast.error("Update failed", { description: res.error });
      } else {
        toast.success("Updated");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-start justify-between">
        <h1 className="brand-headline text-2xl text-[var(--ink-950)]">
          Competitor
        </h1>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          Active
        </label>
      </div>

      <Field label="Name">
        <Input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </Field>
      <Field label="Website">
        <Input
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
        />
      </Field>
      <Field label="Positioning">
        <textarea
          value={form.positioning}
          onChange={(e) => setForm({ ...form, positioning: e.target.value })}
          rows={3}
          className="w-full rounded-lg border border-[var(--input)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent-600)]"
        />
      </Field>
      <Field label="Pricing notes (internal)">
        <textarea
          value={form.pricing_notes}
          onChange={(e) => setForm({ ...form, pricing_notes: e.target.value })}
          rows={2}
          className="w-full rounded-lg border border-[var(--input)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent-600)]"
        />
      </Field>

      <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-soft)] p-4 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)]">
          Profile attributes
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Founded">
            <Input
              type="number"
              value={form.founded}
              onChange={(e) => setForm({ ...form, founded: e.target.value })}
              placeholder="2018"
            />
          </Field>
          <Field label="Main lanes (comma)">
            <Input
              value={form.main_lanes}
              onChange={(e) => setForm({ ...form, main_lanes: e.target.value })}
              placeholder="india_us, india_uk"
            />
          </Field>
        </div>
        <Field label="Key weakness">
          <Input
            value={form.weakness}
            onChange={(e) => setForm({ ...form, weakness: e.target.value })}
            placeholder="no_na_warehousing"
          />
        </Field>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.asset_based === true}
              onChange={(e) =>
                setForm({ ...form, asset_based: e.target.checked ? true : false })
              }
            />
            Asset-based (owns warehouses)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.incumbent}
              onChange={(e) => setForm({ ...form, incumbent: e.target.checked })}
            />
            Incumbent
          </label>
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-500)] mb-1.5">
        {label}
      </p>
      {children}
    </div>
  );
}
