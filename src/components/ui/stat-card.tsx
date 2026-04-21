import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  tone?: "neutral" | "accent" | "warn" | "danger";
};

const toneStyles = {
  neutral: "text-[var(--ink-950)]",
  accent: "text-[var(--accent-600)]",
  warn: "text-[var(--warning-700)]",
  danger: "text-[var(--danger-700)]",
};

const toneDotStyles = {
  neutral: "bg-[var(--ink-950)]",
  accent: "bg-[var(--accent-600)]",
  warn: "bg-[var(--warning-700)]",
  danger: "bg-[var(--danger-700)]",
};

export function StatCard({ label, value, hint, href, tone = "neutral" }: StatCardProps) {
  const content = (
    <div className="group relative flex h-full flex-col justify-between gap-5 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent-600)]/40 hover:shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("h-1.5 w-1.5 rounded-full", toneDotStyles[tone])} />
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-500)]">
            {label}
          </p>
        </div>
        {href ? (
          <ArrowUpRight className="h-4 w-4 text-[var(--ink-400)] transition group-hover:text-[var(--accent-600)]" />
        ) : null}
      </div>
      <div className="space-y-1">
        <p className={cn("brand-display text-4xl leading-none tabular-nums sm:text-5xl", toneStyles[tone])}>
          {value}
        </p>
        {hint ? <p className="text-xs text-[var(--ink-500)]">{hint}</p> : null}
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  ) : (
    content
  );
}

// Keep KpiTile export for backwards compat with existing imports.
export { StatCard as KpiTile };
