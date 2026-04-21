import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/sonner";

type AppShellProps = {
  children: React.ReactNode;
  user: { email: string; fullName?: string };
};

export function AppShell({ children, user }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[var(--app-bg)]">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col pb-24 lg:pb-0">
        <MobileHeader user={user} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-8 pt-6 sm:px-6 lg:px-10 lg:pt-10">
          {children}
        </main>
      </div>
      <BottomNav />
      <Toaster richColors position="top-right" />
    </div>
  );
}
