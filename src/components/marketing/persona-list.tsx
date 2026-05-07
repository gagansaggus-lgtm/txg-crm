"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Edit2, Trash2 } from "lucide-react";

import type { Persona } from "@/types/marketing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upsertPersonaAction, deletePersonaAction } from "@/app/actions/strategy";

export function PersonaList({
  icpId,
  personas,
}: {
  icpId: string;
  personas: Persona[];
}) {
  const [editing, setEditing] = useState<string | "new" | null>(null);

  return (
    <div className="space-y-3">
      {personas.length === 0 && editing !== "new" ? (
        <p className="text-sm text-[var(--ink-500)]">
          No personas yet. Add the buyer personas for this ICP — Founder, COO, CFO,
          etc. Each gets distinct messaging.
        </p>
      ) : null}

      {personas.map((p) =>
        editing === p.id ? (
          <PersonaEditor
            key={p.id}
            persona={p}
            icpId={icpId}
            onCancel={() => setEditing(null)}
            onSave={() => setEditing(null)}
          />
        ) : (
          <PersonaCard
            key={p.id}
            persona={p}
            onEdit={() => setEditing(p.id)}
          />
        ),
      )}

      {editing === "new" ? (
        <PersonaEditor
          icpId={icpId}
          onCancel={() => setEditing(null)}
          onSave={() => setEditing(null)}
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setEditing("new")}
          className="w-full"
        >
          <Plus className="mr-1 h-4 w-4" />
          Add persona
        </Button>
      )}
    </div>
  );
}

function PersonaCard({
  persona,
  onEdit,
}: {
  persona: Persona;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!confirm(`Delete persona "${persona.title}"?`)) return;
    startTransition(async () => {
      const res = await deletePersonaAction(persona.id);
      if (!res.ok) {
        toast.error("Delete failed", { description: res.error });
      } else {
        toast.success("Persona deleted");
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--card)] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="brand-headline text-base text-[var(--ink-950)]">
            {persona.title}
          </h4>
          {persona.role_description ? (
            <p className="mt-1 text-sm text-[var(--ink-700)]">
              {persona.role_description}
            </p>
          ) : null}
        </div>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onEdit}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={pending}
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {persona.pain_points?.length ? (
        <div className="mt-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
            Pain points
          </p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-[var(--ink-700)]">
            {persona.pain_points.map((pp, i) => (
              <li key={i}>{pp}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {persona.hooks?.length ? (
        <div className="mt-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
            Hooks
          </p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-[var(--ink-700)]">
            {persona.hooks.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function PersonaEditor({
  icpId,
  persona,
  onCancel,
  onSave,
}: {
  icpId: string;
  persona?: Persona;
  onCancel: () => void;
  onSave: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: persona?.title ?? "",
    role_description: persona?.role_description ?? "",
    pain_points: (persona?.pain_points ?? []).join("\n"),
    hooks: (persona?.hooks ?? []).join("\n"),
    content_recommendations: (persona?.content_recommendations ?? []).join("\n"),
  });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title required");
      return;
    }
    startTransition(async () => {
      const res = await upsertPersonaAction({
        id: persona?.id,
        icp_profile_id: icpId,
        title: form.title,
        role_description: form.role_description || null,
        pain_points: form.pain_points
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        hooks: form.hooks
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        content_recommendations: form.content_recommendations
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      if (!res.ok) {
        toast.error("Save failed", { description: res.error });
      } else {
        toast.success("Persona saved");
        router.refresh();
        onSave();
      }
    });
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-lg border border-[var(--accent-600)]/30 bg-[var(--accent-100)]/40 p-4"
    >
      <Input
        required
        placeholder="Persona title (e.g. Founder/CEO)"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <Input
        placeholder="Role description"
        value={form.role_description}
        onChange={(e) => setForm({ ...form, role_description: e.target.value })}
      />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)] mb-1">
          Pain points (one per line)
        </p>
        <textarea
          rows={3}
          value={form.pain_points}
          onChange={(e) => setForm({ ...form, pain_points: e.target.value })}
          className="w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-600)]"
        />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)] mb-1">
          Hooks / value props (one per line)
        </p>
        <textarea
          rows={3}
          value={form.hooks}
          onChange={(e) => setForm({ ...form, hooks: e.target.value })}
          className="w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-600)]"
        />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)] mb-1">
          Content recommendations (one per line)
        </p>
        <textarea
          rows={2}
          value={form.content_recommendations}
          onChange={(e) =>
            setForm({ ...form, content_recommendations: e.target.value })
          }
          className="w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-600)]"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Saving…" : "Save persona"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
