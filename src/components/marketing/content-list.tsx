"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit2, Trash2, ChevronUp, ChevronDown } from "lucide-react";

import type { ContentPiece, ContentStatus, ContentType } from "@/types/marketing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  upsertContentAction,
  updateContentStatusAction,
  deleteContentAction,
} from "@/app/actions/content";
import { cn, formatDateTime } from "@/lib/utils";

const STATUSES: ContentStatus[] = [
  "draft",
  "in_review",
  "approved",
  "scheduled",
  "published",
  "archived",
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  in_review: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  scheduled: "bg-purple-100 text-purple-800",
  published: "bg-emerald-100 text-emerald-800",
  archived: "bg-slate-50 text-slate-500",
};

export function ContentList({
  pieces,
  contentType,
  pillarOptions,
}: {
  pieces: ContentPiece[];
  contentType: ContentType;
  pillarOptions?: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onUpdateStatus(id: string, status: ContentStatus) {
    startTransition(async () => {
      const res = await updateContentStatusAction(id, status);
      if (!res.ok) toast.error("Failed", { description: res.error });
      else {
        toast.success(`Status: ${status.replace(/_/g, " ")}`);
        router.refresh();
      }
    });
  }

  function onDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    startTransition(async () => {
      const res = await deleteContentAction(id);
      if (!res.ok) toast.error("Failed", { description: res.error });
      else {
        toast.success("Deleted");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {pieces.length === 0 && !adding ? (
        <p className="text-sm text-[var(--ink-500)] italic">
          No items yet. Click "New" to create one, or wait for Claude Code to draft.
        </p>
      ) : null}

      <ul className="space-y-2">
        {pieces.map((p) => {
          const isExpanded = expanded.has(p.id);
          const isEditing = editing === p.id;
          return (
            <li
              key={p.id}
              className="rounded-lg border border-[var(--line-soft)] bg-[var(--card)]"
            >
              {isEditing ? (
                <ContentEditor
                  piece={p}
                  contentType={contentType}
                  pillarOptions={pillarOptions}
                  onCancel={() => setEditing(null)}
                  onSaved={() => setEditing(null)}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3 p-3">
                    <button
                      onClick={() => toggleExpand(p.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                            STATUS_COLORS[p.status],
                          )}
                        >
                          {p.status.replace(/_/g, " ")}
                        </span>
                        {p.pillar ? (
                          <span className="rounded-md bg-[var(--surface-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--ink-700)]">
                            {p.pillar.replace(/_/g, " ")}
                          </span>
                        ) : null}
                        {p.scheduled_at ? (
                          <span className="text-[10px] text-[var(--ink-500)]">
                            {formatDateTime(p.scheduled_at)}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm font-semibold text-[var(--ink-950)]">
                        {p.title}
                      </p>
                      {p.target_keyword ? (
                        <p className="text-[11px] text-[var(--ink-500)]">
                          Target: <code>{p.target_keyword}</code>
                        </p>
                      ) : null}
                    </button>
                    <div className="flex items-center gap-1">
                      <select
                        value={p.status}
                        disabled={pending}
                        onChange={(e) => onUpdateStatus(p.id, e.target.value as ContentStatus)}
                        className="h-7 rounded-md border border-[var(--input)] bg-transparent px-2 text-xs outline-none"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                      <Button variant="ghost" size="icon-xs" onClick={() => setEditing(p.id)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onDelete(p.id, p.title)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => toggleExpand(p.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {isExpanded && p.body ? (
                    <div className="border-t border-[var(--line-soft)] p-3 bg-[var(--surface-soft)]">
                      <p className="whitespace-pre-wrap text-xs text-[var(--ink-700)]">
                        {p.body}
                      </p>
                    </div>
                  ) : null}
                </>
              )}
            </li>
          );
        })}
      </ul>

      {adding ? (
        <ContentEditor
          contentType={contentType}
          pillarOptions={pillarOptions}
          onCancel={() => setAdding(false)}
          onSaved={() => setAdding(false)}
        />
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)} className="w-full">
          New {contentType.replace(/_/g, " ")}
        </Button>
      )}
    </div>
  );
}

function ContentEditor({
  piece,
  contentType,
  pillarOptions,
  onCancel,
  onSaved,
}: {
  piece?: ContentPiece;
  contentType: ContentType;
  pillarOptions?: string[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: piece?.title ?? "",
    body: piece?.body ?? "",
    excerpt: piece?.excerpt ?? "",
    pillar: piece?.pillar ?? "",
    target_keyword: piece?.target_keyword ?? "",
    seo_title: piece?.seo_title ?? "",
    seo_description: piece?.seo_description ?? "",
    scheduled_at: piece?.scheduled_at?.slice(0, 16) ?? "",
  });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title required");
      return;
    }
    startTransition(async () => {
      const res = await upsertContentAction({
        id: piece?.id,
        content_type: contentType,
        title: form.title,
        body: form.body || null,
        excerpt: form.excerpt || null,
        pillar: (form.pillar as ContentPiece["pillar"]) || null,
        target_keyword: form.target_keyword || null,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        scheduled_at: form.scheduled_at
          ? new Date(form.scheduled_at).toISOString()
          : null,
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
      className="space-y-3 rounded-lg border border-[var(--accent-600)]/30 bg-[var(--accent-100)]/30 p-4"
    >
      <Input
        required
        placeholder="Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <textarea
        placeholder="Body / draft"
        value={form.body}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
        rows={6}
        className="w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-600)]"
      />
      <div className="grid grid-cols-2 gap-2">
        {pillarOptions ? (
          <select
            value={form.pillar}
            onChange={(e) => setForm({ ...form, pillar: e.target.value })}
            className="h-9 rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 text-sm outline-none focus:border-[var(--accent-600)]"
          >
            <option value="">— pillar —</option>
            {pillarOptions.map((p) => (
              <option key={p} value={p}>
                {p.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        ) : null}
        <Input
          placeholder="Target keyword (SEO)"
          value={form.target_keyword}
          onChange={(e) => setForm({ ...form, target_keyword: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="SEO title"
          value={form.seo_title}
          onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
        />
        <Input
          type="datetime-local"
          value={form.scheduled_at}
          onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
        />
      </div>
      <Input
        placeholder="SEO description"
        value={form.seo_description}
        onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Saving…" : piece ? "Save" : "Create"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
