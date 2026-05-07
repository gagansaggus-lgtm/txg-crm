"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import type { CompetitorSignal } from "@/types/marketing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logCompetitorSignalAction } from "@/app/actions/strategy";
import { formatDate } from "@/lib/utils";

const SIGNAL_TYPES: Array<{ value: CompetitorSignal["signal_type"]; label: string }> = [
  { value: "pricing_change", label: "Pricing change" },
  { value: "new_messaging", label: "New messaging" },
  { value: "hire", label: "Hire" },
  { value: "product_launch", label: "Product launch" },
  { value: "press", label: "Press mention" },
  { value: "social", label: "Social activity" },
  { value: "other", label: "Other" },
];

export function CompetitorSignalsList({
  competitorId,
  signals,
}: {
  competitorId: string;
  signals: CompetitorSignal[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    signal_type: "other" as CompetitorSignal["signal_type"],
    content: "",
    source_url: "",
  });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.content.trim()) {
      toast.error("Content required");
      return;
    }
    startTransition(async () => {
      const res = await logCompetitorSignalAction({
        competitor_id: competitorId,
        signal_type: form.signal_type,
        content: form.content,
        source_url: form.source_url || null,
      });
      if (!res.ok) {
        toast.error("Save failed", { description: res.error });
      } else {
        toast.success("Signal logged");
        setForm({ signal_type: "other", content: "", source_url: "" });
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {signals.length === 0 && !open ? (
        <p className="text-sm text-[var(--ink-500)]">
          No signals logged yet. Track pricing changes, new messaging, hires, press
          mentions over time.
        </p>
      ) : null}

      {signals.map((s) => (
        <div
          key={s.id}
          className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3 py-2"
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-700)]">
              {s.signal_type.replace(/_/g, " ")}
            </span>
            <span className="text-[10px] text-[var(--ink-500)]">
              {formatDate(s.observed_at)}
            </span>
          </div>
          {s.content ? (
            <p className="text-xs text-[var(--ink-700)]">{s.content}</p>
          ) : null}
          {s.source_url ? (
            <a
              href={s.source_url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block text-[11px] text-[var(--accent-600)] hover:underline truncate"
            >
              {s.source_url}
            </a>
          ) : null}
        </div>
      ))}

      {open ? (
        <form
          onSubmit={submit}
          className="space-y-2 rounded-lg border border-[var(--accent-600)]/30 bg-[var(--accent-100)]/40 p-3"
        >
          <select
            value={form.signal_type}
            onChange={(e) =>
              setForm({
                ...form,
                signal_type: e.target.value as CompetitorSignal["signal_type"],
              })
            }
            className="h-9 w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 text-sm outline-none focus:border-[var(--accent-600)]"
          >
            {SIGNAL_TYPES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <textarea
            placeholder="What did they do? (e.g. Raised price by 20%, hired VP of Sales, …)"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-600)]"
          />
          <Input
            placeholder="Source URL (optional)"
            value={form.source_url}
            onChange={(e) => setForm({ ...form, source_url: e.target.value })}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={pending} size="sm">
              {pending ? "Logging…" : "Log signal"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="w-full"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Log signal
        </Button>
      )}
    </div>
  );
}
