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
  Inbox,
  Megaphone,
  FolderOpen,
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
    heading: "Today",
    items: [
      {
        href: "/app/today",
        label: "Today",
        icon: LayoutDashboard,
        match: (p) => p === "/app" || p.startsWith("/app/today") || p.startsWith("/app/dashboard"),
      },
    ],
  },
  {
    heading: "Pipeline",
    items: [
      { href: "/app/pipeline", label: "Pipeline", icon: KanbanSquare },
      { href: "/app/inbox", label: "Inbox", icon: Inbox },
      { href: "/app/leads", label: "Leads", icon: Users },
      { href: "/app/accounts", label: "Accounts (ABM)", icon: Building2 },
      { href: "/app/customers", label: "Customers", icon: Users },
    ],
  },
  {
    heading: "Content",
    items: [
      { href: "/app/content/calendar", label: "Calendar", icon: KanbanSquare },
      { href: "/app/content/articles", label: "Articles", icon: FileText },
      { href: "/app/content/founder-brand", label: "Founder Brand", icon: UserCog },
      { href: "/app/content/newsletters", label: "Newsletters", icon: Inbox },
      { href: "/app/content/library", label: "Library", icon: FolderOpen },
    ],
  },
  {
    heading: "Distribution",
    items: [
      { href: "/app/distribution/social", label: "Social", icon: Megaphone },
      { href: "/app/distribution/community", label: "Community", icon: Users },
      { href: "/app/distribution/engagement", label: "Engagement", icon: Megaphone },
      { href: "/app/distribution/listening", label: "Listening", icon: RefreshCcw },
    ],
  },
  {
    heading: "Outreach",
    items: [
      { href: "/app/outreach/queue", label: "My Queue", icon: ClipboardList },
      { href: "/app/outreach/sequences", label: "Sequences", icon: KanbanSquare },
      { href: "/app/outreach/replies", label: "Replies", icon: Inbox },
    ],
  },
  {
    heading: "Growth",
    items: [
      { href: "/app/growth/partners", label: "Partners", icon: Users },
      { href: "/app/growth/pr", label: "PR & Media", icon: Megaphone },
      { href: "/app/growth/events", label: "Events", icon: KanbanSquare },
      { href: "/app/growth/influencers", label: "Influencers", icon: UserCog },
    ],
  },
  {
    heading: "Strategy",
    items: [
      { href: "/app/strategy/brand", label: "Brand Book", icon: FolderOpen },
      { href: "/app/strategy/icps", label: "ICPs & Personas", icon: Users },
      { href: "/app/strategy/competitors", label: "Competitors", icon: KanbanSquare },
      { href: "/app/strategy/sales-kit", label: "Sales Kit", icon: FileText },
    ],
  },
  {
    heading: "Operations",
    items: [
      { href: "/app/quotes", label: "Quotes", icon: FileText },
      { href: "/app/contracts", label: "Contracts", icon: FileSignature },
      { href: "/app/tickets", label: "Tickets", icon: LifeBuoy },
      { href: "/app/tasks", label: "Tasks", icon: CheckSquare },
      {
        href: "/app/warehouse",
        label: "Warehouse",
        icon: Warehouse,
        match: (p) => p === "/app/warehouse" || p.startsWith("/app/warehouse/"),
      },
    ],
  },
  {
    heading: "Analytics",
    items: [
      {
        href: "/app/analytics",
        label: "Dashboard",
        icon: KanbanSquare,
        match: (p) => p === "/app/analytics",
      },
      { href: "/app/analytics/funnel", label: "Funnel", icon: KanbanSquare },
      { href: "/app/analytics/attribution", label: "Attribution", icon: KanbanSquare },
    ],
  },
  {
    heading: "Settings",
    items: [
      { href: "/app/settings/team", label: "Team", icon: UserCog },
      { href: "/app/settings/facilities", label: "Facilities", icon: Building2 },
      { href: "/app/settings/rate-cards", label: "Rate cards", icon: ReceiptText },
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
    <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-[var(--line-soft)] bg-[var(--card)] lg:flex">
      <div className="px-5 py-5 border-b border-[var(--line-soft)]">
        <BrandMark />
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-3">
        <div className="space-y-5">
          {sections.map((section) => (
            <div key={section.heading} className="space-y-0.5">
              <p className="px-3 pb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--ink-400)]">
                {section.heading}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(pathname, item);
                  const Icon = item.icon;
                  return (
                    <li key={item.href} className="relative">
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13px] font-medium transition-colors",
                          active
                            ? "bg-[var(--accent-100)] text-[var(--ink-950)] font-semibold"
                            : "text-[var(--ink-700)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink-950)]",
                        )}
                      >
                        {active && (
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--accent-600)]"
                          />
                        )}
                        <Icon
                          className={cn(
                            "h-[15px] w-[15px] shrink-0 transition-colors",
                            active
                              ? "text-[var(--accent-600)]"
                              : "text-[var(--ink-400)] group-hover:text-[var(--ink-700)]",
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
      <div className="border-t border-[var(--line-soft)] p-4">
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-[var(--surface-soft)] transition-colors cursor-default">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--accent-600)] text-[10px] font-bold uppercase text-white shadow-[0_1px_4px_rgba(247,89,40,0.3)]">
            {initials || "TX"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-[var(--ink-950)]">
              {user.fullName || "TXG teammate"}
            </p>
            <p className="truncate text-[11px] text-[var(--ink-500)]">{user.email}</p>
          </div>
        </div>
        <div className="mt-2">
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
