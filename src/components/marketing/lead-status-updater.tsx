"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { LeadStatus } from "@/types/marketing";
import { updateLeadStatusAction } from "@/app/actions/leads";

const STATUSES: Array<{ value: LeadStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "researching", label: "Researching" },
  { value: "contacted", label: "Contacted" },
  { value: "replied", label: "Replied" },
  { value: "call_booked", label: "Call booked" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "closed_won", label: "Closed won" },
  { value: "closed_lost", label: "Closed lost" },
  { value: "nurture", label: "Nurture" },
  { value: "do_not_contact", label: "Do not contact" },
];

export function LeadStatusUpdater({
  leadId,
  currentStatus,
}: {
  leadId: string;
  currentStatus: LeadStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<LeadStatus>(currentStatus);

  function onChange(newStatus: LeadStatus) {
    setStatus(newStatus);
    startTransition(async () => {
      const res = await updateLeadStatusAction(leadId, newStatus);
      if (res.error) {
        toast.error("Failed to update", { description: res.error });
        setStatus(currentStatus);
      } else {
        toast.success(`Status: ${newStatus.replace(/_/g, " ")}`);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs uppercase tracking-wider text-[var(--ink-500)]">
        Status
      </span>
      <select
        value={status}
        disabled={pending}
        onChange={(e) => onChange(e.target.value as LeadStatus)}
        className="h-9 rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 text-sm font-medium outline-none focus:border-[var(--accent-600)]"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
