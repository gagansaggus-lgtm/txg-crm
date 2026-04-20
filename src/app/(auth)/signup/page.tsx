import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SignupPage() {
  if (hasSupabaseEnv) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect("/app");
  }

  return (
    <AuthForm
      mode="signup"
      title="Create account"
      description="Start with your email and password. After signup, an admin runs 0007_seed.sql to add you to the TXG workspace."
    />
  );
}
