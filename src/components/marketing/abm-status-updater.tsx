"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateAbmAccountAction } from "@/app/actions/abm";
import type { AbmAccount } from "@/lib/supabase/queries/abm";

const STATUSES: Array<{ value: AbmAccount["status"]; label: string }> = [
  { value: "cold", label: "Cold" },
  { value: "aware", label: "Aware" },
  { value: "engaged", label: "Engaged" },
  { value: "active", label: "Active" },
  { value: "opportunity", label: "Opportunity" },
  { value: "closed_won", label: "Closed won" },
  { value: "closed_lost", label: "Closed lost" },
  { value: "paused", label: "Paused" },
];

export function AbmAccountStatusUpdater({
  accountId,
  currentStatus,
}: {
  accountId: string;
  currentStatus: AbmAccount["status"];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);

  function onChange(s: AbmAccount["status"]) {
    setStatus(s);
    startTransition(async () => {
      const res = await updateAbmAccountAction(accountId, { status: s });
      if (!res.ok) {
        toast.error("Failed", { description: res.error });
        setStatus(currentStatus);
      } else {
        toast.success(`Status: ${s.replace(/_/g, " ")}`);
        router.refresh();
      }
    });
  }

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => onChange(e.target.value as AbmAccount["status"])}
      className="h-8 w-full rounded-lg border border-[var(--input)] bg-transparent px-2 text-xs outline-none focus:border-[var(--accent-600)]"
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
