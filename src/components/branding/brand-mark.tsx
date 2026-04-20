import { cn } from "@/lib/utils";

type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--surface-ink)] text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[var(--shadow-card)]">
        TXG
      </div>
      <div className={cn("space-y-1", compact ? "" : "max-w-sm")}>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-600)]">
          Transway Xpress Global
        </p>
        <p className="text-sm text-[var(--ink-700)]">
          Warehousing · Fulfillment · Last-mile · International courier
        </p>
      </div>
    </div>
  );
}
