"use client";

import Link from "next/link";
import { motion } from "framer-motion";

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
        "flex flex-col gap-5",
        isHero ? "items-start text-left" : "sm:flex-row sm:items-end sm:justify-between",
      )}
    >
      <div className="space-y-3">
        {eyebrow ? (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
            className="brand-eyebrow"
          >
            {eyebrow}
          </motion.p>
        ) : null}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.2, 0.7, 0.2, 1] }}
          className={cn(
            "text-[var(--ink-950)]",
            isHero ? "brand-display text-5xl sm:text-6xl" : "brand-headline text-3xl sm:text-4xl",
          )}
        >
          {title}
        </motion.h1>
        {subtitle ? (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.14, ease: [0.2, 0.7, 0.2, 1] }}
            className={cn("text-[var(--ink-700)]", isHero ? "max-w-2xl text-base sm:text-lg" : "text-sm")}
          >
            {subtitle}
          </motion.p>
        ) : null}
      </div>
      {actions && actions.length ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
          className="flex flex-wrap gap-2"
        >
          {actions.map((action) =>
            action.variant === "secondary" ? (
              <Link
                key={action.href}
                href={action.href}
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-5")}
              >
                {action.label}
              </Link>
            ) : (
              <Link
                key={action.href}
                href={action.href}
                className="cta-primary inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold"
              >
                {action.label}
              </Link>
            ),
          )}
        </motion.div>
      ) : null}
    </header>
  );
}
