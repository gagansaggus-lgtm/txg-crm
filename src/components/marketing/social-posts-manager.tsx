"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Copy, CheckCircle2, ExternalLink, Trash2 } from "lucide-react";

import type { SocialPostRow } from "@/lib/supabase/queries/distribution";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  upsertSocialPostAction,
  markSocialPostPostedAction,
  deleteSocialPostAction,
} from "@/app/actions/distribution";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { value: "linkedin_company", label: "LinkedIn Company" },
  { value: "linkedin_personal", label: "LinkedIn Personal" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "youtube_shorts", label: "YouTube Shorts" },
  { value: "twitter", label: "Twitter / X" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "threads", label: "Threads" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  scheduled: "bg-purple-100 text-purple-800",
  posted: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-slate-50 text-slate-500",
};

export function SocialPostsManager({ posts }: { posts: SocialPostRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    platform: "linkedin_company",
    body: "",
    scheduled_at: "",
  });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.body.trim()) {
      toast.error("Body required");
      return;
    }
    startTransition(async () => {
      const res = await upsertSocialPostAction({
        platform: form.platform,
        body: form.body,
        scheduled_at: form.scheduled_at
          ? new Date(form.scheduled_at).toISOString()
          : null,
        status: form.scheduled_at ? "scheduled" : "draft",
      });
      if (!res.ok) toast.error("Save failed", { description: res.error });
      else {
        toast.success("Saved");
        setForm({ platform: form.platform, body: "", scheduled_at: "" });
        setAdding(false);
        router.refresh();
      }
    });
  }

  function copyBody(body: string) {
    navigator.clipboard.writeText(body).catch(() => {});
    toast.success("Copied");
  }

  function markPosted(id: string) {
    startTransition(async () => {
      const res = await markSocialPostPostedAction(id);
      if (!res.ok) toast.error("Failed", { description: res.error });
      else {
        toast.success("Marked posted");
        router.refresh();
      }
    });
  }

  function onDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    startTransition(async () => {
      const res = await deleteSocialPostAction(id);
      if (!res.ok) toast.error("Failed", { description: res.error });
      else {
        toast.success("Deleted");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {posts.length === 0 && !adding ? (
        <p className="text-sm text-[var(--ink-500)]">No social posts yet.</p>
      ) : null}

      <ul className="space-y-2">
        {posts.map((p) => (
          <li
            key={p.id}
            className="rounded-lg border border-[var(--line-soft)] bg-[var(--card)] p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    STATUS_COLORS[p.status],
                  )}
                >
                  {p.status}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">
                  {p.platform.replace(/_/g, " ")}
                </span>
                {p.scheduled_at ? (
                  <span className="text-[10px] text-[var(--ink-500)]">
                    {formatDateTime(p.scheduled_at)}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => copyBody(p.body ?? "")}
                  disabled={!p.body}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                {p.status !== "posted" ? (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => markPosted(p.id)}
                    disabled={pending}
                    title="Mark posted"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                  </Button>
                ) : null}
                {p.external_post_url ? (
                  <a
                    href={p.external_post_url}
                    target="_blank"
                    rel="noreferrer"
                    className="grid h-6 w-6 place-items-center rounded-md text-[var(--ink-500)] hover:bg-[var(--surface-soft)]"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onDelete(p.id)}
                  disabled={pending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <p className="whitespace-pre-wrap text-sm text-[var(--ink-700)]">{p.body}</p>
          </li>
        ))}
      </ul>

      {adding ? (
        <form
          onSubmit={submit}
          className="space-y-2 rounded-lg border border-[var(--accent-600)]/30 bg-[var(--accent-100)]/30 p-4"
        >
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value })}
              className="h-9 rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 text-sm outline-none focus:border-[var(--accent-600)]"
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <Input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
              placeholder="Schedule (optional)"
            />
          </div>
          <textarea
            placeholder="Post body"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            rows={5}
            className="w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-600)]"
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={pending} size="sm">
              {pending ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)} className="w-full">
          <Plus className="mr-1 h-4 w-4" />
          New post
        </Button>
      )}
    </div>
  );
}
