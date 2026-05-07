"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, ExternalLink, CheckCircle2, X } from "lucide-react";

import type { EngagementTarget } from "@/lib/supabase/queries/distribution";
import { Button } from "@/components/ui/button";
import {
  markEngagementEngagedAction,
  markEngagementSkippedAction,
} from "@/app/actions/distribution";
import { formatDate } from "@/lib/utils";

export function EngagementQueue({ targets }: { targets: EngagementTarget[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function copyComment(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    toast.success("Copied — paste as comment on LinkedIn");
  }

  function markEngaged(id: string) {
    startTransition(async () => {
      const res = await markEngagementEngagedAction(id);
      if (!res.ok) toast.error("Failed", { description: res.error });
      else router.refresh();
    });
  }

  function markSkipped(id: string) {
    startTransition(async () => {
      const res = await markEngagementSkippedAction(id);
      if (!res.ok) toast.error("Failed", { description: res.error });
      else router.refresh();
    });
  }

  if (targets.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-500)]">
        No engagement targets yet. Claude Code will populate this when the agent runs.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {targets.map((t) => (
        <li
          key={t.id}
          className="rounded-lg border border-[var(--line-soft)] bg-[var(--card)] p-4"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-700)]">
                {t.platform}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">
                {t.status}
              </span>
              <span className="text-[10px] text-[var(--ink-500)]">
                {formatDate(t.generated_for_date)}
              </span>
              {t.target_author ? (
                <span className="text-[11px] text-[var(--ink-700)]">
                  by {t.target_author}
                </span>
              ) : null}
            </div>
            <a
              href={t.target_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[var(--accent-600)] hover:underline inline-flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" /> Open
            </a>
          </div>
          {t.draft_comment ? (
            <div className="rounded-lg bg-[var(--surface-soft)] px-3 py-2 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)] mb-1">
                Suggested comment
              </p>
              <p className="text-sm text-[var(--ink-950)]">{t.draft_comment}</p>
            </div>
          ) : null}
          {t.status === "queued" ? (
            <div className="flex flex-wrap gap-2">
              {t.draft_comment ? (
                <Button size="sm" onClick={() => copyComment(t.draft_comment!)}>
                  <Copy className="mr-1 h-3 w-3" /> Copy
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                onClick={() => markEngaged(t.id)}
                disabled={pending}
              >
                <CheckCircle2 className="mr-1 h-3 w-3" /> Engaged
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => markSkipped(t.id)}
                disabled={pending}
              >
                <X className="mr-1 h-3 w-3" /> Skip
              </Button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
