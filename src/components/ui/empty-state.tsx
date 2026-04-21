import Link from "next/link";
import { Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  icon?: LucideIcon;
};

export function EmptyState({ title, description, action, icon: Icon = Inbox }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] px-8 py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--accent-100)] text-[var(--accent-600)]">
        <Icon className="h-6 w-6" strokeWidth={1.6} />
      </div>
      <div className="space-y-1.5">
        <p className="brand-display text-2xl text-[var(--ink-950)]">{title}</p>
        {description ? (
          <p className="mx-auto max-w-md text-sm leading-6 text-[var(--ink-500)]">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className={cn(buttonVariants({ size: "lg" }), "px-4")}
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
