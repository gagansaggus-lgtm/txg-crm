import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  if (hasSupabaseEnv) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect("/app");
  }

  return (
    <AuthForm
      mode="reset"
      title="Reset password"
      description="We will send a password reset email to the address you use for TXG."
    />
  );
}
