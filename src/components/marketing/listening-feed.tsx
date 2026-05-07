"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, CheckCircle2 } from "lucide-react";

import type { SocialMention } from "@/lib/supabase/queries/distribution";
import { Button } from "@/components/ui/button";
import { markMentionReviewedAction } from "@/app/actions/distribution";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "bg-emerald-100 text-emerald-800",
  neutral: "bg-slate-100 text-slate-700",
  negative: "bg-red-100 text-red-800",
  mixed: "bg-amber-100 text-amber-800",
  unknown: "bg-slate-50 text-slate-500",
};

export function ListeningFeed({ mentions }: { mentions: SocialMention[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function markReviewed(id: string) {
    startTransition(async () => {
      const res = await markMentionReviewedAction(id);
      if (!res.ok) toast.error("Failed", { description: res.error });
      else router.refresh();
    });
  }

  if (mentions.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-500)]">
        No mentions yet. Claude Code populates this when the listening agent runs.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {mentions.map((m) => (
        <li
          key={m.id}
          className={cn(
            "rounded-lg border bg-[var(--card)] p-4",
            m.reviewed
              ? "border-[var(--line-soft)] opacity-60"
              : "border-[var(--accent-600)]/30",
          )}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-700)]">
                {m.source_platform}
              </span>
              {m.sentiment ? (
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    SENTIMENT_COLORS[m.sentiment] ?? "bg-slate-100 text-slate-700",
                  )}
                >
                  {m.sentiment}
                </span>
              ) : null}
              {m.intent_signal ? (
                <span className="rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-800">
                  ⚡ {m.intent_signal}
                </span>
              ) : null}
              {m.author_handle ? (
                <span className="text-[11px] text-[var(--ink-700)]">
                  @{m.author_handle}
                </span>
              ) : null}
              <span className="text-[10px] text-[var(--ink-500)]">
                {formatDateTime(m.observed_at)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {m.source_url ? (
                <a
                  href={m.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="grid h-6 w-6 place-items-center rounded-md text-[var(--ink-500)] hover:bg-[var(--surface-soft)]"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
              {!m.reviewed ? (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => markReviewed(m.id)}
                  disabled={pending}
                  title="Mark reviewed"
                >
                  <CheckCircle2 className="h-3 w-3" />
                </Button>
              ) : null}
            </div>
          </div>
          <p className="text-sm text-[var(--ink-700)]">{m.mention_text}</p>
        </li>
      ))}
    </ul>
  );
}
