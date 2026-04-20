import { cn } from "@/lib/utils";

type Tone = "neutral" | "info" | "success" | "warn" | "danger";

const toneStyles: Record<Tone, string> = {
  neutral: "bg-[var(--surface-accent)] text-[var(--ink-700)]",
  info: "bg-[var(--accent-100)] text-[var(--accent-600)]",
  success: "bg-[var(--success-100)] text-[var(--success-700)]",
  warn: "bg-[var(--warning-100)] text-[var(--warning-700)]",
  danger: "bg-[var(--danger-100)] text-[var(--danger-700)]",
};

type StatusPillProps = {
  label: string;
  tone?: Tone;
  className?: string;
};

export function StatusPill({ label, tone = "neutral", className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        toneStyles[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}

// Status -> tone maps are colocated here so UI stays consistent across list/detail.
export function receiptStatusTone(status: string): Tone {
  switch (status) {
    case "expected": return "neutral";
    case "arrived":
    case "receiving": return "info";
    case "received": return "success";
    case "closed": return "neutral";
    default: return "neutral";
  }
}

export function orderStatusTone(status: string): Tone {
  switch (status) {
    case "new": return "neutral";
    case "allocated":
    case "picking":
    case "packed": return "info";
    case "shipped": return "success";
    case "cancelled": return "danger";
    default: return "neutral";
  }
}

export function shipmentStatusTone(status: string): Tone {
  switch (status) {
    case "pending":
    case "label_created": return "neutral";
    case "picked_up":
    case "in_transit":
    case "out_for_delivery": return "info";
    case "delivered": return "success";
    case "exception": return "danger";
    default: return "neutral";
  }
}

export function customerStatusTone(status: string): Tone {
  switch (status) {
    case "prospect": return "info";
    case "active": return "success";
    case "churned": return "neutral";
    default: return "neutral";
  }
}
