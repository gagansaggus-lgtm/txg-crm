import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Action = {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
};

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: Action[];
  align?: "default" | "hero";
};

export function PageHeader({ eyebrow, title, subtitle, actions, align = "default" }: PageHeaderProps) {
  const isHero = align === "hero";
  return (
    <header
      className={cn(
        "flex flex-col gap-4",
        isHero
          ? "items-start text-left"
          : "sm:flex-row sm:items-end sm:justify-between",
      )}
    >
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent-600)]">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={cn(
            "brand-display leading-[1.05] tracking-tight text-[var(--ink-950)]",
            isHero ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl",
          )}
        >
          {title}
        </h1>
        {subtitle ? (
          <p className={cn("text-[var(--ink-700)]", isHero ? "max-w-2xl text-base sm:text-lg" : "text-sm")}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions && actions.length ? (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                buttonVariants({
                  variant: action.variant === "secondary" ? "outline" : "default",
                  size: "lg",
                }),
                "px-4",
              )}
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </header>
  );
}
