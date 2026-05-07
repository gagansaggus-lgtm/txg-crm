"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, ExternalLink, FileText, Edit2 } from "lucide-react";

import type { LeadMagnet } from "@/lib/supabase/queries/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upsertLeadMagnetAction } from "@/app/actions/content";

export function LeadMagnetsManager({ magnets }: { magnets: LeadMagnet[] }) {
  const [editing, setEditing] = useState<string | "new" | null>(null);

  return (
    <div className="space-y-3">
      {magnets.length === 0 && editing !== "new" ? (
        <p className="text-sm text-[var(--ink-500)]">
          No lead magnets yet. Create gated PDFs to capture emails on the marketing site.
        </p>
      ) : null}

      <ul className="space-y-2">
        {magnets.map((m) =>
          editing === m.id ? (
            <MagnetEditor
              key={m.id}
              magnet={m}
              onCancel={() => setEditing(null)}
              onSaved={() => setEditing(null)}
            />
          ) : (
            <li
              key={m.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-[var(--line-soft)] bg-[var(--card)] p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-3.5 w-3.5 text-[var(--ink-500)]" />
                  <code className="text-[10px] text-[var(--ink-500)]">/{m.slug}</code>
                  {!m.active ? (
                    <span className="text-[10px] uppercase text-[var(--ink-400)]">Inactive</span>
                  ) : null}
                </div>
                <p className="text-sm font-semibold text-[var(--ink-950)]">{m.title}</p>
                {m.description ? (
                  <p className="text-xs text-[var(--ink-700)]">{m.description}</p>
                ) : null}
                <div className="mt-1 flex gap-3 text-[11px] text-[var(--ink-500)]">
                  {m.page_count ? <span>{m.page_count} pages</span> : null}
                  <span>{m.download_count.toLocaleString()} downloads</span>
                </div>
                {m.file_url ? (
                  <a
                    href={m.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 mt-1 text-xs text-[var(--accent-600)] hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open file
                  </a>
                ) : null}
              </div>
              <Button variant="ghost" size="icon-xs" onClick={() => setEditing(m.id)}>
                <Edit2 className="h-3 w-3" />
              </Button>
            </li>
          ),
        )}
      </ul>

      {editing === "new" ? (
        <MagnetEditor
          onCancel={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      ) : (
        <Button variant="outline" onClick={() => setEditing("new")} className="w-full">
          <Plus className="mr-1 h-4 w-4" />
          New lead magnet
        </Button>
      )}
    </div>
  );
}

function MagnetEditor({
  magnet,
  onCancel,
  onSaved,
}: {
  magnet?: LeadMagnet;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: magnet?.title ?? "",
    slug: magnet?.slug ?? "",
    description: magnet?.description ?? "",
    file_url: magnet?.file_url ?? "",
    page_count: magnet?.page_count?.toString() ?? "",
    active: magnet?.active ?? true,
  });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.title.trim() || !form.slug.trim()) {
      toast.error("Title and slug required");
      return;
    }
    startTransition(async () => {
      const res = await upsertLeadMagnetAction({
        id: magnet?.id,
        title: form.title,
        slug: form.slug
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-")
          .replace(/^-+|-+$/g, ""),
        description: form.description || null,
        file_url: form.file_url || null,
        page_count: form.page_count ? parseInt(form.page_count, 10) : null,
        active: form.active,
      });
      if (!res.ok) toast.error("Save failed", { description: res.error });
      else {
        toast.success("Saved");
        router.refresh();
        onSaved();
      }
    });
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-2 rounded-lg border border-[var(--accent-600)]/30 bg-[var(--accent-100)]/30 p-4"
    >
      <Input
        required
        placeholder="Title (e.g. The India → NA Cross-Border Playbook)"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <div className="grid grid-cols-3 gap-2">
        <Input
          required
          placeholder="URL slug (no spaces)"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          className="col-span-2"
        />
        <Input
          type="number"
          placeholder="Pages"
          value={form.page_count}
          onChange={(e) => setForm({ ...form, page_count: e.target.value })}
        />
      </div>
      <Input
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <Input
        placeholder="File URL (Supabase Storage or external)"
        value={form.file_url}
        onChange={(e) => setForm({ ...form, file_url: e.target.value })}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm({ ...form, active: e.target.checked })}
        />
        Active (downloadable from marketing site)
      </label>
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
