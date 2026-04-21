"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  FileSignature,
  KanbanSquare,
  Warehouse,
  PackagePlus,
  ClipboardList,
  Truck,
  Boxes,
  CheckSquare,
  LifeBuoy,
  Settings,
  Building2,
  ReceiptText,
  UserCog,
  RefreshCcw,
  type LucideIcon,
} from "lucide-react";

import { BrandMark } from "@/components/branding/brand-mark";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
};

type NavSection = {
  heading: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    heading: "Overview",
    items: [
      {
        href: "/app/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        match: (p) => p === "/app" || p.startsWith("/app/dashboard"),
      },
      { href: "/app/pipeline", label: "Pipeline", icon: KanbanSquare },
      { href: "/app/tasks", label: "Tasks", icon: CheckSquare },
    ],
  },
  {
    heading: "CRM",
    items: [
      { href: "/app/customers", label: "Customers", icon: Users },
      { href: "/app/quotes", label: "Quotes", icon: FileText },
      { href: "/app/contracts", label: "Contracts", icon: FileSignature },
      { href: "/app/tickets", label: "Tickets", icon: LifeBuoy },
    ],
  },
  {
    heading: "Warehouse",
    items: [
      { href: "/app/warehouse", label: "Overview", icon: Warehouse, match: (p) => p === "/app/warehouse" },
      { href: "/app/warehouse/inbound", label: "Inbound receipts", icon: PackagePlus },
      { href: "/app/warehouse/orders", label: "Fulfillment orders", icon: ClipboardList },
      { href: "/app/warehouse/shipments", label: "Shipments", icon: Truck },
      { href: "/app/warehouse/skus", label: "SKUs", icon: Boxes },
    ],
  },
  {
    heading: "Settings",
    items: [
      { href: "/app/settings/facilities", label: "Facilities", icon: Building2 },
      { href: "/app/settings/rate-cards", label: "Rate cards", icon: ReceiptText },
      { href: "/app/settings/team", label: "Team", icon: UserCog },
      { href: "/app/settings/wms", label: "WMS sync", icon: RefreshCcw },
      { href: "/app/settings", label: "All settings", icon: Settings, match: (p) => p === "/app/settings" },
    ],
  },
];

function isActive(pathname: string, item: NavItem) {
  if (item.match) return item.match(pathname);
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

type SidebarProps = {
  user: { email: string; fullName?: string };
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const initials = (user.fullName || user.email)
    .split(/[\s.@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--card)] lg:flex">
      <div className="px-5 py-6">
        <BrandMark />
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.heading} className="space-y-1">
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--ink-500)]">
                {section.heading}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(pathname, item);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                          active
                            ? "bg-[var(--accent-100)] text-[var(--accent-700)]"
                            : "text-[var(--ink-700)] hover:bg-[var(--secondary)] hover:text-[var(--ink-950)]",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition",
                            active
                              ? "text-[var(--accent-600)]"
                              : "text-[var(--ink-500)] group-hover:text-[var(--ink-950)]",
                          )}
                          strokeWidth={1.8}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>
      <div className="border-t border-[var(--border)] p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--ink-950)] text-xs font-semibold uppercase text-white">
            {initials || "TX"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--ink-950)]">
              {user.fullName || "TXG teammate"}
            </p>
            <p className="truncate text-xs text-[var(--ink-500)]">{user.email}</p>
          </div>
        </div>
        <div className="mt-3">
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
