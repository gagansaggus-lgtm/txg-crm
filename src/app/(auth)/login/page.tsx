import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { BrandMark } from "@/components/branding/brand-mark";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  if (!hasSupabaseEnv) {
    return (
      <AuthForm
        mode="login"
        title="Sign in"
        description="Add your Supabase URL and anon key to .env.local before using auth."
      />
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/app");

  return (
    <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="glass-panel hidden rounded-[2rem] p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="space-y-6">
          <BrandMark />
          <div className="max-w-xl space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-[var(--accent-600)]">
              Phase 1 · Warehousing &amp; Fulfillment
            </p>
            <h1 className="text-5xl font-semibold leading-[1.05] text-[var(--surface-ink)]">
              Customers, receipts, orders, shipments — one place for TXG ops.
            </h1>
            <p className="max-w-lg text-lg leading-8 text-[var(--ink-700)]">
              Buffalo and Etobicoke facilities, a client-first CRM, and a CSV bridge to the existing WMS. Last-mile and international courier come next.
            </p>
          </div>
        </div>

        <div className="grid gap-3 text-sm text-[var(--ink-700)] sm:grid-cols-2">
          <div className="card-surface rounded-[1.5rem] p-4">Customer profiles with services, contracts, quotes.</div>
          <div className="card-surface rounded-[1.5rem] p-4">Facility-scoped inbound receipts and outbound shipments.</div>
          <div className="card-surface rounded-[1.5rem] p-4">WMS CSV import keeps SKUs and orders in sync.</div>
          <div className="card-surface rounded-[1.5rem] p-4">Supabase + RLS — admin / ops_lead roles today, warehouse staff next.</div>
        </div>
      </section>

      <AuthForm
        mode="login"
        title="Sign in"
        description="Use your TXG login to access the ops workspace."
      />
    </div>
  );
}
