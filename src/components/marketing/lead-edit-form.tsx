"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { Lead } from "@/types/marketing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateLeadAction } from "@/app/actions/leads";

export function LeadEditForm({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    display_name: lead.display_name ?? "",
    legal_name: lead.legal_name ?? "",
    website: lead.website ?? "",
    vertical: lead.vertical ?? "",
    country: lead.country ?? "",
    city: lead.city ?? "",
    estimated_gmv_usd: lead.estimated_gmv_usd?.toString() ?? "",
    funding_stage: lead.funding_stage ?? "",
    notes: lead.notes ?? "",
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateLeadAction(lead.id, {
        display_name: form.display_name || null,
        legal_name: form.legal_name || null,
        website: form.website || null,
        vertical: form.vertical || null,
        country: form.country || null,
        city: form.city || null,
        estimated_gmv_usd: form.estimated_gmv_usd
          ? parseInt(form.estimated_gmv_usd, 10)
          : null,
        funding_stage: form.funding_stage || null,
        notes: form.notes || null,
      });
      if (res.error) {
        toast.error("Update failed", { description: res.error });
      } else {
        toast.success("Lead updated");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field
        label="Display name"
        value={form.display_name}
        onChange={(v) => setForm({ ...form, display_name: v })}
      />
      <Field
        label="Legal name"
        value={form.legal_name}
        onChange={(v) => setForm({ ...form, legal_name: v })}
      />
      <Field
        label="Website"
        value={form.website}
        onChange={(v) => setForm({ ...form, website: v })}
      />
      <Field
        label="Vertical"
        value={form.vertical}
        onChange={(v) => setForm({ ...form, vertical: v })}
        placeholder="fashion, beauty, food, …"
      />
      <div className="grid grid-cols-2 gap-2">
        <Field
          label="Country"
          value={form.country}
          onChange={(v) => setForm({ ...form, country: v })}
          placeholder="US / CA / IN"
        />
        <Field
          label="City"
          value={form.city}
          onChange={(v) => setForm({ ...form, city: v })}
        />
      </div>
      <Field
        label="Est. GMV (USD)"
        value={form.estimated_gmv_usd}
        onChange={(v) => setForm({ ...form, estimated_gmv_usd: v })}
        placeholder="500000"
      />
      <Field
        label="Funding stage"
        value={form.funding_stage}
        onChange={(v) => setForm({ ...form, funding_stage: v })}
        placeholder="bootstrap / seed / series_a"
      />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-500)] mb-1.5">
          Notes
        </p>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          className="w-full rounded-lg border border-[var(--input)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent-600)]"
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-500)] mb-1.5">
        {label}
      </p>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
