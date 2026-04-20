"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Status = "open" | "pending" | "resolved" | "closed";

const statuses: Status[] = ["open", "pending", "resolved", "closed"];

export function TicketStatusEditor({
  ticketId,
  currentStatus,
}: {
  ticketId: string;
  currentStatus: Status;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function update(status: Status) {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("tickets").update({ status }).eq("id", ticketId);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((s) => {
        const active = s === currentStatus;
        return (
          <button
            key={s}
            type="button"
            onClick={() => update(s)}
            disabled={isPending || active}
            className={
              "rounded-full border px-3 py-1 text-xs transition " +
              (active
                ? "border-[var(--accent-600)] bg-[var(--accent-100)] text-[var(--accent-600)]"
                : "border-[var(--line-soft)] bg-white text-[var(--ink-700)] hover:text-[var(--accent-600)]")
            }
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}
