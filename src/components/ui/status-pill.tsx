import { cn } from "@/lib/utils";

type Tone = "neutral" | "info" | "success" | "warn" | "danger";

const toneStyles: Record<Tone, { chip: string; dot: string }> = {
  neutral: {
    chip: "border-[var(--border)] bg-[var(--secondary)] text-[var(--ink-700)]",
    dot: "bg-[var(--ink-500)]",
  },
  info: {
    chip: "border-[var(--accent-600)]/20 bg-[var(--accent-100)] text-[var(--accent-700)]",
    dot: "bg-[var(--accent-600)]",
  },
  success: {
    chip: "border-[var(--success-100)] bg-[var(--success-100)] text-[var(--success-700)]",
    dot: "bg-[var(--success-700)]",
  },
  warn: {
    chip: "border-[var(--warning-100)] bg-[var(--warning-100)] text-[var(--warning-700)]",
    dot: "bg-[var(--warning-700)]",
  },
  danger: {
    chip: "border-[var(--danger-100)] bg-[var(--danger-100)] text-[var(--danger-700)]",
    dot: "bg-[var(--danger-700)]",
  },
};

type StatusPillProps = {
  label: string;
  tone?: Tone;
  className?: string;
};

export function StatusPill({ label, tone = "neutral", className }: StatusPillProps) {
  const styles = toneStyles[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        styles.chip,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
      {label.replace(/_/g, " ")}
    </span>
  );
}

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
