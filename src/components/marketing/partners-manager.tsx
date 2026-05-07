"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, ExternalLink } from "lucide-react";

import type { Partner } from "@/lib/supabase/queries/growth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upsertPartnerAction, deletePartnerAction } from "@/app/actions/growth";
import { cn } from "@/lib/utils";

const TYPES = [
  { value: "strategic", label: "Strategic" },
  { value: "channel", label: "Channel" },
  { value: "tech", label: "Technology" },
  { value: "reseller", label: "Reseller" },
  { value: "other", label: "Other" },
];

const STATUSES: Array<{ value: Partner["agreement_status"]; label: string }> = [
  { value: "prospect", label: "Prospect" },
  { value: "negotiating", label: "Negotiating" },
  { value: "signed", label: "Signed" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "terminated", label: "Terminated" },
];

const STATUS_COLORS: Record<string, string> = {
  prospect: "bg-slate-100 text-slate-700",
  negotiating: "bg-amber-100 text-amber-800",
  signed: "bg-blue-100 text-blue-800",
  active: "bg-emerald-100 text-emerald-800",
  paused: "bg-orange-100 text-orange-800",
  terminated: "bg-red-100 text-red-800",
};

export function PartnersManager({ partners }: { partners: Partner[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<string | "new" | null>(null);

  function onDelete(id: string, name: string) {
    if (!confirm(`Delete partner "${name}"?`)) return;
    startTransition(async () => {
      const res = await deletePartnerAction(id);
      if (!res.ok) toast.error("Failed", { description: res.error });
      else {
        toast.success("Deleted");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {partners.length === 0 && editing !== "new" ? (
        <p className="text-sm text-[var(--ink-500)]">
          No partners yet. Add Razorpay, Cashfree, Sequoia Surge, Antler, etc.
        </p>
      ) : null}

      <ul className="space-y-2">
        {partners.map((p) =>
          editing === p.id ? (
            <PartnerEditor
              key={p.id}
              partner={p}
              onCancel={() => setEditing(null)}
              onSaved={() => setEditing(null)}
            />
          ) : (
            <li
              key={p.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-[var(--line-soft)] bg-[var(--card)] p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      STATUS_COLORS[p.agreement_status],
                    )}
                  >
                    {p.agreement_status}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">
                    {p.partner_type}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[var(--ink-950)]">{p.name}</p>
                {p.website ? (
                  <a
                    href={p.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[var(--accent-600)] hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {p.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </a>
                ) : null}
                {p.primary_contact_name ? (
                  <p className="text-xs text-[var(--ink-700)]">
                    {p.primary_contact_name}
                    {p.primary_contact_email ? ` · ${p.primary_contact_email}` : ""}
                  </p>
                ) : null}
                {p.referral_pipeline_value_usd > 0 || p.referrals_received > 0 ? (
                  <p className="text-[11px] text-[var(--ink-500)] mt-1">
                    {p.referrals_received} referrals · pipeline $
                    {(p.referral_pipeline_value_usd / 1000).toFixed(0)}K
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-xs" onClick={() => setEditing(p.id)}>
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onDelete(p.id, p.name)}
                  disabled={pending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </li>
          ),
        )}
      </ul>

      {editing === "new" ? (
        <PartnerEditor
          onCancel={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      ) : (
        <Button variant="outline" onClick={() => setEditing("new")} className="w-full">
          <Plus className="mr-1 h-4 w-4" />
          Add partner
        </Button>
      )}
    </div>
  );
}

function PartnerEditor({
  partner,
  onCancel,
  onSaved,
}: {
  partner?: Partner;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<{
    name: string;
    partner_type: Partner["partner_type"];
    website: string;
    primary_contact_name: string;
    primary_contact_email: string;
    primary_contact_phone: string;
    agreement_status: Partner["agreement_status"];
    referral_pipeline_value_usd: string;
    notes: string;
  }>({
    name: partner?.name ?? "",
    partner_type: partner?.partner_type ?? "strategic",
    website: partner?.website ?? "",
    primary_contact_name: partner?.primary_contact_name ?? "",
    primary_contact_email: partner?.primary_contact_email ?? "",
    primary_contact_phone: partner?.primary_contact_phone ?? "",
    agreement_status: partner?.agreement_status ?? "prospect",
    referral_pipeline_value_usd:
      partner?.referral_pipeline_value_usd?.toString() ?? "0",
    notes: partner?.notes ?? "",
  });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name required");
      return;
    }
    startTransition(async () => {
      const res = await upsertPartnerAction({
        id: partner?.id,
        name: form.name,
        partner_type: form.partner_type,
        website: form.website || null,
        primary_contact_name: form.primary_contact_name || null,
        primary_contact_email: form.primary_contact_email || null,
        primary_contact_phone: form.primary_contact_phone || null,
        agreement_status: form.agreement_status,
        referral_pipeline_value_usd:
          parseInt(form.referral_pipeline_value_usd, 10) || 0,
        notes: form.notes || null,
      });
      if (!res.ok) toast.error("Save failed", { description: res.error });
      else {
        toast.success("Saved");
        onSaved();
        router.refresh();
      }
    });
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-2 rounded-lg border border-[var(--accent-600)]/30 bg-[var(--accent-100)]/30 p-4"
    >
      <div className="grid grid-cols-3 gap-2">
        <Input
          required
          placeholder="Partner name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="col-span-2"
        />
        <select
          value={form.partner_type}
          onChange={(e) =>
            setForm({ ...form, partner_type: e.target.value as Partner["partner_type"] })
          }
          className="h-9 rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 text-sm outline-none focus:border-[var(--accent-600)]"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <Input
        placeholder="Website"
        value={form.website}
        onChange={(e) => setForm({ ...form, website: e.target.value })}
      />
      <div className="grid grid-cols-3 gap-2">
        <Input
          placeholder="Primary contact name"
          value={form.primary_contact_name}
          onChange={(e) => setForm({ ...form, primary_contact_name: e.target.value })}
        />
        <Input
          placeholder="Email"
          type="email"
          value={form.primary_contact_email}
          onChange={(e) => setForm({ ...form, primary_contact_email: e.target.value })}
        />
        <Input
          placeholder="Phone"
          value={form.primary_contact_phone}
          onChange={(e) => setForm({ ...form, primary_contact_phone: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select
          value={form.agreement_status}
          onChange={(e) =>
            setForm({ ...form, agreement_status: e.target.value as Partner["agreement_status"] })
          }
          className="h-9 rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 text-sm outline-none focus:border-[var(--accent-600)]"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <Input
          type="number"
          placeholder="Pipeline value (USD)"
          value={form.referral_pipeline_value_usd}
          onChange={(e) =>
            setForm({ ...form, referral_pipeline_value_usd: e.target.value })
          }
        />
      </div>
      <textarea
        placeholder="Notes"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
        rows={2}
        className="w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-600)]"
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
