import { cn } from "@/lib/utils";

type FacilityBadgeProps = {
  code?: string | null;
  name?: string | null;
  className?: string;
};

export function FacilityBadge({ code, name, className }: FacilityBadgeProps) {
  if (!code && !name) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-white px-3 py-1 text-xs font-medium text-[var(--ink-700)]",
        className,
      )}
    >
      <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--accent-100)] text-[10px] font-bold text-[var(--accent-600)]">
        {code ?? "·"}
      </span>
      <span>{name ?? code}</span>
    </span>
  );
}
