import { redirect } from "next/navigation";

import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function RootPage() {
  if (!hasSupabaseEnv) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  redirect(user ? "/app" : "/login");
}
