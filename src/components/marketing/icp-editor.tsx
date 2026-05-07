"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { IcpProfile } from "@/types/marketing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateIcpAction } from "@/app/actions/strategy";

const TIER_LABELS: Record<string, string> = {
  tier_1: "Tier 1",
  tier_2: "Tier 2",
  tier_3: "Tier 3",
  tier_4: "Tier 4",
  tier_5: "Tier 5",
  na_mid_market: "NA Mid-Market",
  custom: "Custom",
};

export function IcpEditor({ icp }: { icp: IcpProfile }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const criteria = (icp.firmographic_criteria ?? {}) as Record<string, unknown>;
  const [form, setForm] = useState({
    name: icp.name,
    description: icp.description ?? "",
    deal_size_min_usd: icp.deal_size_min_usd?.toString() ?? "",
    deal_size_max_usd: icp.deal_size_max_usd?.toString() ?? "",
    sales_motion: icp.sales_motion ?? "",
    revenue_min: (criteria.revenue_min_usd as number | undefined)?.toString() ?? "",
    revenue_max: (criteria.revenue_max_usd as number | undefined)?.toString() ?? "",
    verticals: Array.isArray(criteria.verticals)
      ? (criteria.verticals as string[]).join(", ")
      : "",
    funding: Array.isArray(criteria.funding)
      ? (criteria.funding as string[]).join(", ")
      : "",
    signals: Array.isArray(criteria.signals)
      ? (criteria.signals as string[]).join(", ")
      : "",
    geography: Array.isArray(criteria.geography)
      ? (criteria.geography as string[]).join(", ")
      : "",
    active: icp.active,
  });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const newCriteria: Record<string, unknown> = { ...criteria };
      if (form.revenue_min) newCriteria.revenue_min_usd = parseInt(form.revenue_min, 10);
      else delete newCriteria.revenue_min_usd;
      if (form.revenue_max) newCriteria.revenue_max_usd = parseInt(form.revenue_max, 10);
      else delete newCriteria.revenue_max_usd;
      newCriteria.verticals = form.verticals
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      newCriteria.funding = form.funding
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      newCriteria.signals = form.signals
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      newCriteria.geography = form.geography
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await updateIcpAction(icp.id, {
        name: form.name,
        description: form.description || null,
        deal_size_min_usd: form.deal_size_min_usd
          ? parseInt(form.deal_size_min_usd, 10)
          : null,
        deal_size_max_usd: form.deal_size_max_usd
          ? parseInt(form.deal_size_max_usd, 10)
          : null,
        sales_motion: form.sales_motion || null,
        firmographic_criteria: newCriteria,
        active: form.active,
      });
      if (!res.ok) {
        toast.error("Update failed", { description: res.error });
      } else {
        toast.success("ICP updated");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="brand-eyebrow text-[var(--accent-600)]">
            {TIER_LABELS[icp.tier] ?? icp.tier}
          </p>
          <h1 className="brand-headline text-2xl text-[var(--ink-950)] mt-1">
            Edit ICP
          </h1>
        </div>
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
      <Field label="Description">
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          className="w-full rounded-lg border border-[var(--input)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent-600)]"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Deal size MIN (USD)">
          <Input
            type="number"
            value={form.deal_size_min_usd}
            onChange={(e) => setForm({ ...form, deal_size_min_usd: e.target.value })}
          />
        </Field>
        <Field label="Deal size MAX (USD)">
          <Input
            type="number"
            value={form.deal_size_max_usd}
            onChange={(e) => setForm({ ...form, deal_size_max_usd: e.target.value })}
          />
        </Field>
      </div>

      <Field label="Sales motion">
        <Input
          value={form.sales_motion}
          onChange={(e) => setForm({ ...form, sales_motion: e.target.value })}
          placeholder="abm_executive, outbound_sdr_ae, inbound_abm, etc."
        />
      </Field>

      <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-soft)] p-4 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)]">
          Firmographic Criteria
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Revenue MIN (USD)">
            <Input
              type="number"
              value={form.revenue_min}
              onChange={(e) => setForm({ ...form, revenue_min: e.target.value })}
            />
          </Field>
          <Field label="Revenue MAX (USD)">
            <Input
              type="number"
              value={form.revenue_max}
              onChange={(e) => setForm({ ...form, revenue_max: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Verticals (comma-separated)">
          <Input
            value={form.verticals}
            onChange={(e) => setForm({ ...form, verticals: e.target.value })}
            placeholder="fashion, beauty, wellness, home, electronics, food"
          />
        </Field>
        <Field label="Funding stages (comma-separated)">
          <Input
            value={form.funding}
            onChange={(e) => setForm({ ...form, funding: e.target.value })}
            placeholder="seed, series_a, series_b"
          />
        </Field>
        <Field label="Geography (comma-separated)">
          <Input
            value={form.geography}
            onChange={(e) => setForm({ ...form, geography: e.target.value })}
            placeholder="us, canada, india"
          />
        </Field>
        <Field label="Buying signals (comma-separated)">
          <Input
            value={form.signals}
            onChange={(e) => setForm({ ...form, signals: e.target.value })}
            placeholder="active_us_canada_orders, hiring_intl_ops, …"
          />
        </Field>
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
