"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send } from "lucide-react";

import type { OutreachSequence } from "@/types/marketing";
import { Button } from "@/components/ui/button";
import { assignLeadToSequenceAction } from "@/app/actions/outreach";

export function AssignSequenceButton({
  leadId,
  sequences,
}: {
  leadId: string;
  sequences: Pick<OutreachSequence, "id" | "name" | "active">[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string>(
    sequences.find((s) => s.active)?.id ?? "",
  );

  useEffect(() => {
    if (!selected && sequences.length) {
      setSelected(sequences[0].id);
    }
  }, [sequences, selected]);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) {
      toast.error("Pick a sequence");
      return;
    }
    startTransition(async () => {
      const res = await assignLeadToSequenceAction(leadId, selected);
      if (!res.ok) {
        toast.error("Failed", { description: res.error });
      } else {
        toast.success(
          `${res.data?.messages_drafted ?? 0} messages drafted in your queue`,
        );
        setOpen(false);
        router.refresh();
      }
    });
  }

  if (!sequences.length) {
    return (
      <Button variant="outline" disabled>
        <Send className="mr-1 h-4 w-4" />
        No sequences yet
      </Button>
    );
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Send className="mr-1 h-4 w-4" />
        Assign sequence
      </Button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 rounded-lg border border-[var(--accent-600)]/30 bg-[var(--accent-100)]/40 p-3 w-72"
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
        Choose sequence
      </p>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="h-9 rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 text-sm outline-none focus:border-[var(--accent-600)]"
      >
        {sequences.map((s) => (
          <option key={s.id} value={s.id} disabled={!s.active}>
            {s.name}
            {!s.active ? " (inactive)" : ""}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Drafting…" : "Assign & draft"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
