import { cn } from "@/lib/utils";

type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-[var(--ink-950)] shadow-[var(--shadow-card)]">
        <span className="brand-display text-base leading-none text-white">TXG</span>
        <span
          aria-hidden
          className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-[var(--accent-600)]"
        />
      </div>
      <div className={cn("space-y-0.5", compact ? "" : "max-w-sm")}>
        <p className="brand-display text-base leading-tight text-[var(--ink-950)]">
          Transway Xpress Global
        </p>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-600)]">
          ePowering fulfillment globally
        </p>
      </div>
    </div>
  );
}
