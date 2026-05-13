"use client";

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

/**
 * Page header — minimal, no animations, consistent spacing.
 * eyebrow → small uppercase label (orange)
 * title → large weighted headline
 * subtitle → muted supporting text
 * actions → right-aligned buttons (primary = orange CTA, secondary = outline)
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  align = "default",
}: PageHeaderProps) {
  const isHero = align === "hero";
  return (
    <header
      className={cn(
        "flex flex-col gap-4 pb-1",
        isHero ? "items-start text-left" : "sm:flex-row sm:items-end sm:justify-between sm:gap-6",
      )}
    >
      <div className="min-w-0 space-y-1.5">
        {eyebrow ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent-600)]">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={cn(
            "brand-headline text-[var(--ink-950)] tracking-[-0.025em]",
            isHero
              ? "brand-display text-[40px] sm:text-[48px] leading-[1.05]"
              : "text-[26px] sm:text-[30px] leading-[1.15]",
          )}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            className={cn(
              "text-[var(--ink-700)] max-w-2xl",
              isHero ? "text-base sm:text-lg leading-[1.55]" : "text-[14px] leading-[1.55]",
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions && actions.length ? (
        <div className="flex flex-wrap gap-2 shrink-0">
          {actions.map((action) =>
            action.variant === "secondary" ? (
              <Link
                key={action.href}
                href={action.href}
                className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4 text-sm font-semibold")}
              >
                {action.label}
              </Link>
            ) : (
              <Link
                key={action.href}
                href={action.href}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--accent-600)] px-4 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(247,89,40,0.3)] transition-colors hover:bg-[var(--accent-700)]"
              >
                {action.label}
              </Link>
            ),
          )}
        </div>
      ) : null}
    </header>
  );
}
