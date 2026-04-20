import Link from "next/link";

import { cn } from "@/lib/utils";

type KpiTileProps = {
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

export function KpiTile({ label, value, hint, href, tone = "neutral" }: KpiTileProps) {
  const content = (
    <div className="card-surface flex h-full flex-col justify-between gap-3 rounded-[1.25rem] p-5 transition hover:shadow-[var(--shadow-soft)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-500)]">
        {label}
      </p>
      <p className={cn("text-3xl font-semibold tabular-nums", toneStyles[tone])}>{value}</p>
      {hint ? <p className="text-xs text-[var(--ink-500)]">{hint}</p> : null}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
