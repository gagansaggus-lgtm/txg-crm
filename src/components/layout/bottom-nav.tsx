"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Menu, Package, SquareCheck, Warehouse } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app/dashboard", label: "Home", icon: LayoutDashboard, match: (p: string) => p === "/app" || p.startsWith("/app/dashboard") },
  { href: "/app/customers", label: "Customers", icon: Package, match: (p: string) => p.startsWith("/app/customers") },
  { href: "/app/warehouse", label: "Warehouse", icon: Warehouse, match: (p: string) => p.startsWith("/app/warehouse") },
  { href: "/app/tasks", label: "Tasks", icon: SquareCheck, match: (p: string) => p.startsWith("/app/tasks") },
  { href: "/app/settings/wms", label: "More", icon: Menu, match: (p: string) => p.startsWith("/app/settings") || p.startsWith("/app/pipeline") || p.startsWith("/app/tickets") || p.startsWith("/app/quotes") || p.startsWith("/app/contracts") },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 pt-2">
      <div className="glass-panel mx-auto grid max-w-3xl grid-cols-5 rounded-[1.75rem] px-2 py-2">
        {navItems.map(({ href, label, icon: Icon, match }) => {
          const isActive = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition",
                isActive
                  ? "bg-[var(--surface-ink)] text-white"
                  : "text-[var(--ink-500)] hover:bg-white/70 hover:text-[var(--surface-ink)]",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
