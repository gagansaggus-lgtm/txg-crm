import { SignOutButton } from "@/components/auth/sign-out-button";
import { BrandMark } from "@/components/branding/brand-mark";

type MobileHeaderProps = {
  user: { email: string; fullName?: string };
};

export function MobileHeader({ user }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/90 backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <BrandMark compact />
        <div className="flex items-center gap-2">
          <div className="hidden min-w-0 text-right sm:block">
            <p className="truncate text-xs font-semibold text-[var(--ink-950)]">
              {user.fullName || "TXG teammate"}
            </p>
            <p className="truncate text-[10px] text-[var(--ink-500)]">{user.email}</p>
          </div>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
