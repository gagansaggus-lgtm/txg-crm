import { Toaster } from "@/components/ui/sonner";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--app-bg)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[45vh] bg-gradient-to-b from-[var(--accent-100)] via-transparent to-transparent"
      />
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        {children}
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
