import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!hasSupabaseEnv) {
    return (
      <div className="soft-grid min-h-screen grid place-items-center px-4 py-6">
        <div className="card-surface max-w-xl space-y-3 rounded-[1.5rem] p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-600)]">Setup needed</p>
          <h1 className="text-2xl font-semibold text-[var(--surface-ink)]">Supabase not configured</h1>
          <p className="text-sm text-[var(--ink-700)]">
            Add <code className="font-mono text-[var(--ink-950)]">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="font-mono text-[var(--ink-950)]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
            <code className="font-mono text-[var(--ink-950)]">.env.local</code>, run the SQL migrations, then restart the dev server.
          </p>
          <Link href="/login" className="inline-flex items-center rounded-full border border-[var(--line-strong)] bg-white px-4 py-2 text-sm font-medium">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ctx = await loadWorkspaceContext();
  if (!ctx) {
    return (
      <div className="soft-grid min-h-screen grid place-items-center px-4 py-6">
        <div className="card-surface max-w-xl space-y-3 rounded-[1.5rem] p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--warning-700)]">Not invited yet</p>
          <h1 className="text-2xl font-semibold text-[var(--surface-ink)]">You&apos;re signed in, but not in the TXG workspace.</h1>
          <p className="text-sm text-[var(--ink-700)]">
            An admin needs to run <code className="font-mono">0007_seed.sql</code> (or add you via <code className="font-mono">workspace_members</code>) to give you access. Signed in as <strong>{user.email}</strong>.
          </p>
          <Link href="/login" className="inline-flex items-center rounded-full border border-[var(--line-strong)] bg-white px-4 py-2 text-sm font-medium">
            Sign in as another user
          </Link>
        </div>
      </div>
    );
  }

  return <AppShell user={{ email: ctx.user.email, fullName: ctx.user.fullName }}>{children}</AppShell>;
}
