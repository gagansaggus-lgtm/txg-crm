"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Menu, Users, CheckSquare, Warehouse } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/app/dashboard",
    label: "Home",
    icon: LayoutDashboard,
    match: (p: string) => p === "/app" || p.startsWith("/app/dashboard"),
  },
  {
    href: "/app/customers",
    label: "Customers",
    icon: Users,
    match: (p: string) =>
      p.startsWith("/app/customers") || p.startsWith("/app/quotes") || p.startsWith("/app/contracts"),
  },
  {
    href: "/app/warehouse",
    label: "Warehouse",
    icon: Warehouse,
    match: (p: string) => p.startsWith("/app/warehouse"),
  },
  {
    href: "/app/tasks",
    label: "Tasks",
    icon: CheckSquare,
    match: (p: string) => p.startsWith("/app/tasks") || p.startsWith("/app/tickets"),
  },
  {
    href: "/app/settings",
    label: "More",
    icon: Menu,
    match: (p: string) => p.startsWith("/app/settings") || p.startsWith("/app/pipeline"),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 pt-2 lg:hidden">
      <div className="mx-auto grid max-w-3xl grid-cols-5 rounded-2xl border border-[var(--border)] bg-white/95 px-2 py-2 shadow-[var(--shadow-soft)] backdrop-blur-xl">
        {navItems.map(({ href, label, icon: Icon, match }) => {
          const isActive = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium transition",
                isActive
                  ? "bg-[var(--accent-600)] text-white"
                  : "text-[var(--ink-500)] hover:text-[var(--ink-950)]",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
