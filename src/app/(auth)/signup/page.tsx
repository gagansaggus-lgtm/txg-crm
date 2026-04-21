import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthHero } from "@/components/auth/auth-hero";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SignupPage() {
  if (hasSupabaseEnv) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect("/app");
  }

  return (
    <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
      <AuthHero
        eyebrow="Join the TXG team"
        headline="Start with an account. Your admin flips the switch."
        description="Create your login. An admin will add you to the workspace with the right role — ops lead, warehouse, or customer."
        bullets={[
          "Corporate-grade auth backed by Supabase",
          "Role-scoped access — you only see what you need",
          "Mobile-first UI for the warehouse floor",
          "Works with your existing WMS, no rip-and-replace",
        ]}
      />
      <div className="flex items-center justify-center lg:justify-start">
        <AuthForm
          mode="signup"
          title="Create account"
          description="Use your work email and a strong password. An admin will wire you into the workspace."
        />
      </div>
    </div>
  );
}
