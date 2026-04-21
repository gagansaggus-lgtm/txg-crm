import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthHero } from "@/components/auth/auth-hero";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  if (hasSupabaseEnv) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect("/app");
  }

  return (
    <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
      <AuthHero
        eyebrow="Transway Xpress Global"
        headline="Customers, fulfillment, and shipments — one clean place."
        description="Buffalo and Etobicoke facilities, client-first CRM, and a CSV bridge to your WMS. Last-mile and international courier come next."
        bullets={[
          "Customer profiles with services, contracts, quotes",
          "Facility-scoped inbound receipts and outbound shipments",
          "WMS CSV import keeps SKUs and orders in sync",
          "Role-based access — admin, ops lead, warehouse (coming)",
        ]}
      />
      <div className="flex items-center justify-center lg:justify-start">
        <AuthForm
          mode="login"
          title="Welcome back"
          description="Sign in to your TXG workspace to pick up where you left off."
        />
      </div>
    </div>
  );
}
