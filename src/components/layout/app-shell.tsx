import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Toaster } from "@/components/ui/sonner";

type AppShellProps = {
  children: React.ReactNode;
  user: { email: string; fullName?: string };
};

export function AppShell({ children, user }: AppShellProps) {
  return (
    <div className="min-h-screen pb-24">
      <MobileHeader user={user} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pb-6 pt-4 sm:px-6">
        {children}
      </main>
      <BottomNav />
      <Toaster richColors position="top-right" />
    </div>
  );
}
