import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthHero } from "@/components/auth/auth-hero";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  if (hasSupabaseEnv) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect("/app");
  }

  return (
    <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
      <AuthHero
        eyebrow="Password reset"
        headline="Back on track in under a minute."
        description="Enter your email and we will send you a link to choose a new password. The link expires in an hour."
        bullets={[
          "Secure Supabase password reset flow",
          "Link expires automatically for safety",
          "Your ops data stays exactly where you left it",
          "Need help? Ping the admin on your team.",
        ]}
      />
      <div className="flex items-center justify-center lg:justify-start">
        <AuthForm
          mode="reset"
          title="Reset password"
          description="We will send a reset link to the email you use for TXG."
        />
      </div>
    </div>
  );
}
