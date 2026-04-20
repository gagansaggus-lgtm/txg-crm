import { SignOutButton } from "@/components/auth/sign-out-button";
import { BrandMark } from "@/components/branding/brand-mark";

type MobileHeaderProps = {
  user: { email: string; fullName?: string };
};

export function MobileHeader({ user }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line-soft)] bg-[rgba(244,247,251,0.88)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <BrandMark />
        <div className="flex items-center justify-between gap-4 rounded-[1.25rem] bg-white/80 px-4 py-3 shadow-[var(--shadow-card)]">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--surface-ink)]">
              {user.fullName || "TXG teammate"}
            </p>
            <p className="truncate text-xs text-[var(--ink-500)]">{user.email}</p>
          </div>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
