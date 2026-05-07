"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createLeadAction } from "@/app/actions/leads";
import type { LeadSource } from "@/types/marketing";

const SOURCES: Array<{ value: LeadSource; label: string }> = [
  { value: "manual", label: "Manual entry" },
  { value: "referral", label: "Referral" },
  { value: "partner", label: "Partner" },
  { value: "event", label: "Event" },
  { value: "inbound_dm", label: "Inbound DM" },
  { value: "cold_research", label: "Cold research" },
  { value: "other", label: "Other" },
];

export function LeadNewForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    display_name: "",
    legal_name: "",
    website: "",
    vertical: "",
    country: "",
    city: "",
    estimated_gmv_usd: "",
    funding_stage: "",
    notes: "",
    source: "manual" as LeadSource,
  });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.display_name.trim()) {
      toast.error("Display name is required");
      return;
    }
    startTransition(async () => {
      const res = await createLeadAction({
        source: form.source,
        display_name: form.display_name,
        legal_name: form.legal_name || null,
        website: form.website || null,
        vertical: form.vertical || null,
        country: form.country?.slice(0, 2).toUpperCase() || null,
        city: form.city || null,
        estimated_gmv_usd: form.estimated_gmv_usd
          ? parseInt(form.estimated_gmv_usd, 10)
          : null,
        funding_stage: form.funding_stage || null,
        notes: form.notes || null,
      });
      if ("error" in res) {
        toast.error("Create failed", { description: res.error });
      } else {
        toast.success("Lead created");
        if (res.data?.id) {
          router.push(`/app/leads/${res.data.id}`);
        }
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-xl">
      <Field label="Display name (required)">
        <Input
          required
          value={form.display_name}
          onChange={(e) => setForm({ ...form, display_name: e.target.value })}
          placeholder="Acme Co."
        />
      </Field>
      <Field label="Source">
        <select
          value={form.source}
          onChange={(e) => setForm({ ...form, source: e.target.value as LeadSource })}
          className="h-9 w-full rounded-lg border border-[var(--input)] bg-transparent px-3 text-sm outline-none focus:border-[var(--accent-600)]"
        >
          {SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Website">
          <Input
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="https://acme.com"
          />
        </Field>
        <Field label="Legal name">
          <Input
            value={form.legal_name}
            onChange={(e) => setForm({ ...form, legal_name: e.target.value })}
          />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Vertical">
          <Input
            value={form.vertical}
            onChange={(e) => setForm({ ...form, vertical: e.target.value })}
            placeholder="fashion"
          />
        </Field>
        <Field label="Country">
          <Input
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            placeholder="US"
          />
        </Field>
        <Field label="City">
          <Input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Est. GMV (USD)">
          <Input
            type="number"
            value={form.estimated_gmv_usd}
            onChange={(e) =>
              setForm({ ...form, estimated_gmv_usd: e.target.value })
            }
            placeholder="500000"
          />
        </Field>
        <Field label="Funding stage">
          <Input
            value={form.funding_stage}
            onChange={(e) => setForm({ ...form, funding_stage: e.target.value })}
            placeholder="bootstrap / seed / series_a"
          />
        </Field>
      </div>
      <Field label="Notes">
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          className="w-full rounded-lg border border-[var(--input)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent-600)]"
        />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create lead"}
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
