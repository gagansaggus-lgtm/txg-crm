"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSequenceAction } from "@/app/actions/outreach";

export function SequenceCreateButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name required");
      return;
    }
    startTransition(async () => {
      const res = await createSequenceAction({
        name: form.name,
        description: form.description || null,
      });
      if (!res.ok) {
        toast.error("Save failed", { description: res.error });
      } else {
        toast.success("Sequence created with default 9-touch template");
        setForm({ name: "", description: "" });
        setOpen(false);
        if (res.data?.id) router.push(`/app/outreach/sequences/${res.data.id}`);
      }
    });
  }

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-4 w-4" />
        New sequence
      </Button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 rounded-lg border border-[var(--accent-600)]/30 bg-[var(--accent-100)]/40 p-3 w-80"
    >
      <Input
        required
        autoFocus
        placeholder="Sequence name (e.g. NA D2C Cold Outreach)"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <textarea
        rows={2}
        placeholder="Description (optional)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-600)]"
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Creating…" : "Create"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
