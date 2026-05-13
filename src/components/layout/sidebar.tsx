"use client";

import { useState, useEffect, useRef } from "react";
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
  Target,
  Send,
  Sparkles,
  TrendingUp,
  Star,
  Briefcase,
  Headphones,
  ChevronDown,
  Check,
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

type WorkspaceMode = "marketing" | "operations" | "support";

const MODE_STORAGE_KEY = "txg-vector-mode";

const MARKETING_SECTIONS: NavSection[] = [
  {
    heading: "Today",
    items: [
      {
        href: "/app/today",
        label: "Dashboard",
        icon: LayoutDashboard,
        match: (p) => p === "/app" || p.startsWith("/app/today"),
      },
    ],
  },
  {
    heading: "Pipeline",
    items: [
      { href: "/app/leads", label: "Leads", icon: Users },
      { href: "/app/accounts", label: "Accounts (ABM)", icon: Target },
      { href: "/app/pipeline", label: "Deal pipeline", icon: KanbanSquare },
    ],
  },
  {
    heading: "Outreach",
    items: [
      { href: "/app/outreach/queue", label: "My queue", icon: Send },
      { href: "/app/outreach/sequences", label: "Sequences", icon: KanbanSquare },
      { href: "/app/outreach/replies", label: "Replies", icon: Inbox },
    ],
  },
  {
    heading: "Content",
    items: [
      { href: "/app/content/calendar", label: "Calendar", icon: KanbanSquare },
      { href: "/app/content/articles", label: "Articles", icon: FileText },
      { href: "/app/content/founder-brand", label: "Founder brand", icon: Star },
      { href: "/app/content/newsletters", label: "Newsletters", icon: Inbox },
      { href: "/app/content/library", label: "Lead magnets", icon: FolderOpen },
    ],
  },
  {
    heading: "Distribution",
    items: [
      { href: "/app/distribution/social", label: "Social posts", icon: Megaphone },
      { href: "/app/distribution/community", label: "Community", icon: Users },
      { href: "/app/distribution/engagement", label: "Engagement", icon: Sparkles },
      { href: "/app/distribution/listening", label: "Listening", icon: RefreshCcw },
    ],
  },
  {
    heading: "Growth",
    items: [
      { href: "/app/growth/partners", label: "Partners", icon: Users },
      { href: "/app/growth/pr", label: "PR & media", icon: Megaphone },
      { href: "/app/growth/events", label: "Events", icon: KanbanSquare },
      { href: "/app/growth/influencers", label: "Influencers", icon: Star },
    ],
  },
  {
    heading: "Strategy",
    items: [
      { href: "/app/strategy/brand", label: "Brand book", icon: FolderOpen },
      { href: "/app/strategy/icps", label: "ICPs & personas", icon: Target },
      { href: "/app/strategy/competitors", label: "Competitors", icon: TrendingUp },
      { href: "/app/strategy/sales-kit", label: "Sales kit", icon: Briefcase },
    ],
  },
  {
    heading: "Analytics",
    items: [
      {
        href: "/app/analytics",
        label: "Performance",
        icon: TrendingUp,
        match: (p) => p === "/app/analytics",
      },
      { href: "/app/analytics/funnel", label: "Funnel", icon: KanbanSquare },
      { href: "/app/analytics/attribution", label: "Attribution", icon: TrendingUp },
    ],
  },
];

const OPERATIONS_SECTIONS: NavSection[] = [
  {
    heading: "Today",
    items: [
      {
        href: "/app/today",
        label: "Dashboard",
        icon: LayoutDashboard,
        match: (p) => p === "/app" || p.startsWith("/app/today"),
      },
    ],
  },
  {
    heading: "CRM",
    items: [
      { href: "/app/customers", label: "Customers", icon: Users },
      { href: "/app/quotes", label: "Quotes", icon: FileText },
      { href: "/app/contracts", label: "Contracts", icon: FileSignature },
      { href: "/app/pipeline", label: "Pipeline", icon: KanbanSquare },
    ],
  },
  {
    heading: "Warehouse",
    items: [
      {
        href: "/app/warehouse",
        label: "Overview",
        icon: Warehouse,
        match: (p) => p === "/app/warehouse",
      },
      { href: "/app/warehouse/inbound", label: "Inbound receipts", icon: PackagePlus },
      { href: "/app/warehouse/orders", label: "Fulfillment orders", icon: ClipboardList },
      { href: "/app/warehouse/shipments", label: "Shipments", icon: Truck },
      { href: "/app/warehouse/skus", label: "SKUs", icon: Boxes },
    ],
  },
  {
    heading: "Tasks",
    items: [{ href: "/app/tasks", label: "All tasks", icon: CheckSquare }],
  },
];

const SUPPORT_SECTIONS: NavSection[] = [
  {
    heading: "Today",
    items: [
      {
        href: "/app/today",
        label: "Dashboard",
        icon: LayoutDashboard,
        match: (p) => p === "/app" || p.startsWith("/app/today"),
      },
    ],
  },
  {
    heading: "Support",
    items: [
      { href: "/app/inbox", label: "Shared inbox", icon: Inbox },
      { href: "/app/tickets", label: "Tickets", icon: LifeBuoy },
      { href: "/app/tasks", label: "Tasks", icon: CheckSquare },
    ],
  },
  {
    heading: "Resources",
    items: [
      { href: "/app/resources", label: "Resource hub", icon: FolderOpen },
      { href: "/app/campaigns", label: "Campaigns", icon: Megaphone },
    ],
  },
];

const SETTINGS_SECTION: NavSection = {
  heading: "Settings",
  items: [
    { href: "/app/settings/team", label: "Team", icon: UserCog },
    { href: "/app/settings/facilities", label: "Facilities", icon: Building2 },
    { href: "/app/settings/rate-cards", label: "Rate cards", icon: ReceiptText },
    { href: "/app/settings/wms", label: "WMS sync", icon: RefreshCcw },
    {
      href: "/app/settings",
      label: "All settings",
      icon: Settings,
      match: (p) => p === "/app/settings",
    },
  ],
};

type Mode = { value: WorkspaceMode; label: string; description: string; icon: LucideIcon };

const MODES: Mode[] = [
  {
    value: "marketing",
    label: "Marketing & Sales",
    description: "Leads, outreach, content, analytics",
    icon: Target,
  },
  {
    value: "operations",
    label: "Operations",
    description: "Customers, warehouse, fulfillment",
    icon: Briefcase,
  },
  {
    value: "support",
    label: "Support",
    description: "Tickets, inbox, resources",
    icon: Headphones,
  },
];

function detectModeFromPath(pathname: string): WorkspaceMode | null {
  if (
    pathname.startsWith("/app/leads") ||
    pathname.startsWith("/app/accounts") ||
    pathname.startsWith("/app/outreach") ||
    pathname.startsWith("/app/content") ||
    pathname.startsWith("/app/distribution") ||
    pathname.startsWith("/app/growth") ||
    pathname.startsWith("/app/strategy") ||
    pathname.startsWith("/app/analytics")
  ) {
    return "marketing";
  }
  if (
    pathname.startsWith("/app/customers") ||
    pathname.startsWith("/app/quotes") ||
    pathname.startsWith("/app/contracts") ||
    pathname.startsWith("/app/warehouse")
  ) {
    return "operations";
  }
  if (
    pathname.startsWith("/app/inbox") ||
    pathname.startsWith("/app/tickets") ||
    pathname.startsWith("/app/resources") ||
    pathname.startsWith("/app/campaigns")
  ) {
    return "support";
  }
  return null;
}

function getSectionsForMode(mode: WorkspaceMode): NavSection[] {
  switch (mode) {
    case "marketing":
      return MARKETING_SECTIONS;
    case "operations":
      return OPERATIONS_SECTIONS;
    case "support":
      return SUPPORT_SECTIONS;
  }
}

function isActive(pathname: string, item: NavItem) {
  if (item.match) return item.match(pathname);
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

type SidebarProps = {
  user: { email: string; fullName?: string };
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [mode, setMode] = useState<WorkspaceMode>("marketing");
  const [hydrated, setHydrated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(MODE_STORAGE_KEY) as WorkspaceMode | null;
    const detected = detectModeFromPath(pathname);
    setMode(detected ?? stored ?? "marketing");
    setHydrated(true);
  }, [pathname]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(MODE_STORAGE_KEY, mode);
  }, [mode, hydrated]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", onClickOutside);
      return () => document.removeEventListener("mousedown", onClickOutside);
    }
  }, [menuOpen]);

  const currentMode = MODES.find((m) => m.value === mode)!;
  const ModeIcon = currentMode.icon;
  const sections = getSectionsForMode(mode);

  const initials = (user.fullName || user.email)
    .split(/[\s.@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <aside className="sticky top-0 hidden h-screen w-[272px] shrink-0 flex-col border-r border-[var(--line-soft)] bg-[var(--card)] lg:flex">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-[var(--line-soft)]">
        <BrandMark />
      </div>

      {/* Workspace mode switcher — single clickable element with dropdown */}
      <div className="relative px-3 py-3 border-b border-[var(--line-soft)]" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className={cn(
            "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
            "border border-[var(--line-soft)] bg-[var(--surface-soft)] hover:border-[var(--line-strong)]",
            menuOpen && "border-[var(--accent-600)] bg-[var(--accent-100)]",
          )}
        >
          <span
            className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-md transition-colors",
              menuOpen
                ? "bg-[var(--accent-600)] text-white"
                : "bg-[var(--card)] text-[var(--accent-600)] border border-[var(--line-soft)]",
            )}
          >
            <ModeIcon className="h-4 w-4" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-500)]">
              Workspace
            </p>
            <p className="text-[13px] font-semibold text-[var(--ink-950)] truncate">
              {currentMode.label}
            </p>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-[var(--ink-500)] transition-transform shrink-0",
              menuOpen && "rotate-180",
            )}
          />
        </button>

        {menuOpen && (
          <div className="absolute left-3 right-3 top-[calc(100%-4px)] z-30 mt-2 overflow-hidden rounded-lg border border-[var(--line-strong)] bg-[var(--card)] shadow-lg">
            {MODES.map((m) => {
              const Icon = m.icon;
              const active = m.value === mode;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => {
                    setMode(m.value);
                    setMenuOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors",
                    active ? "bg-[var(--accent-100)]" : "hover:bg-[var(--surface-soft)]",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-md mt-0.5",
                      active
                        ? "bg-[var(--accent-600)] text-white"
                        : "bg-[var(--surface-soft)] text-[var(--ink-700)]",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-[13px] font-semibold",
                        active ? "text-[var(--ink-950)]" : "text-[var(--ink-700)]",
                      )}
                    >
                      {m.label}
                    </p>
                    <p className="text-[11px] text-[var(--ink-500)] line-clamp-1">
                      {m.description}
                    </p>
                  </div>
                  {active && (
                    <Check className="h-4 w-4 text-[var(--accent-600)] shrink-0 mt-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-3">
        <div className="space-y-5">
          {sections.map((section) => (
            <div key={section.heading} className="space-y-0.5">
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-400)]">
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

          <div className="space-y-0.5 pt-3 border-t border-[var(--line-soft)]">
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-400)]">
              {SETTINGS_SECTION.heading}
            </p>
            <ul className="space-y-0.5">
              {SETTINGS_SECTION.items.map((item) => {
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
        </div>
      </nav>

      {/* User block */}
      <div className="border-t border-[var(--line-soft)] p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--accent-600)] text-[11px] font-bold uppercase text-white shadow-[0_2px_6px_rgba(247,89,40,0.35)]">
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
