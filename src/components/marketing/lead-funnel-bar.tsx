import Link from "next/link";

import { cn } from "@/lib/utils";

const STAGE_ORDER = [
  { key: "raw", label: "Raw" },
  { key: "pre_filtered", label: "Pre-filtered" },
  { key: "web_verified", label: "Web ✓" },
  { key: "signal_checked", label: "Signals ✓" },
  { key: "icp_scored", label: "ICP scored" },
  { key: "contact_verified", label: "Contact ✓" },
];

export function LeadFunnelBar({ counts }: { counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const rejected = counts.rejected ?? 0;
  const active = total - rejected;

  return (
    <div className="rounded-xl border border-[var(--line-soft)] bg-[var(--card)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)]">
          Validation Funnel
        </p>
        <p className="text-xs text-[var(--ink-500)]">
          <span className="font-semibold text-[var(--ink-950)]">
            {active.toLocaleString()}
          </span>{" "}
          active · {rejected.toLocaleString()} rejected
        </p>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {STAGE_ORDER.map((stage) => {
          const count = counts[stage.key] ?? 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <Link
              key={stage.key}
              href={`/app/leads?stage=${stage.key}`}
              className="group block rounded-lg border border-[var(--line-soft)] bg-[var(--surface-soft)] p-3 transition-colors hover:border-[var(--accent-600)]/40"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-500)] group-hover:text-[var(--accent-700)]">
                {stage.label}
              </p>
              <p className="mt-1 brand-display text-2xl text-[var(--ink-950)]">
                {count.toLocaleString()}
              </p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--line-soft)]">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    "bg-gradient-to-r from-[var(--ink-950)] to-[var(--accent-600)]",
                  )}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
