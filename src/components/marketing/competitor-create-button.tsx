"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upsertCompetitorAction } from "@/app/actions/strategy";

export function CompetitorCreateButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    website: "",
    positioning: "",
  });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name required");
      return;
    }
    startTransition(async () => {
      const res = await upsertCompetitorAction({
        name: form.name,
        website: form.website || null,
        positioning: form.positioning || null,
      });
      if (!res.ok) {
        toast.error("Save failed", { description: res.error });
      } else {
        toast.success("Competitor added");
        setForm({ name: "", website: "", positioning: "" });
        setOpen(false);
        if (res.data?.id) {
          router.push(`/app/strategy/competitors/${res.data.id}`);
        }
      }
    });
  }

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-4 w-4" />
        Add competitor
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
        placeholder="Competitor name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        autoFocus
      />
      <Input
        placeholder="Website (optional)"
        value={form.website}
        onChange={(e) => setForm({ ...form, website: e.target.value })}
      />
      <textarea
        rows={2}
        placeholder="Positioning (optional)"
        value={form.positioning}
        onChange={(e) => setForm({ ...form, positioning: e.target.value })}
        className="rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-600)]"
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Saving…" : "Add"}
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
  );
}
