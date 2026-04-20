import { cache } from "react";

import { TXG_WORKSPACE_SLUG } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type WorkspaceContext = {
  user: { id: string; email: string; fullName: string };
  workspaceId: string;
  role:
    | "admin"
    | "ops_lead"
    | "ops_rep"
    | "warehouse_lead"
    | "warehouse_staff"
    | "driver"
    | "sales"
    | "customer_contact";
  facilityId: string | null;
};

export const loadWorkspaceContext = cache(async (): Promise<WorkspaceContext | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", TXG_WORKSPACE_SLUG)
    .maybeSingle();
  if (!workspace) return null;

  const { data: member } = await supabase
    .from("workspace_members")
    .select("role, facility_id, status")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!member) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user: {
      id: user.id,
      email: user.email ?? "",
      fullName: profile?.full_name ?? "",
    },
    workspaceId: workspace.id,
    role: member.role,
    facilityId: member.facility_id ?? null,
  };
});
