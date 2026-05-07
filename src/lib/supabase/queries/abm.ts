import type { SupabaseClient } from "@supabase/supabase-js";

export type AbmAccount = {
  id: string;
  workspace_id: string;
  lead_id: string;
  tier_priority: number;
  account_intel: Record<string, unknown>;
  stakeholders: Array<{
    name?: string;
    role?: string;
    email?: string;
    linkedin?: string;
  }>;
  one_pager_url: string | null;
  one_pager_generated_at: string | null;
  account_owner_id: string | null;
  status:
    | "cold"
    | "aware"
    | "engaged"
    | "active"
    | "opportunity"
    | "closed_won"
    | "closed_lost"
    | "paused";
  created_at: string;
  updated_at: string;
};

export type AbmAccountWithLead = AbmAccount & {
  lead?: {
    id: string;
    display_name: string | null;
    website: string | null;
    vertical: string | null;
    icp_grade: string | null;
    estimated_gmv_usd: number | null;
  } | null;
};

export async function listAbmAccounts(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<AbmAccountWithLead[]> {
  const { data, error } = await supabase
    .from("abm_accounts")
    .select(
      "*, lead:leads(id, display_name, website, vertical, icp_grade, estimated_gmv_usd)",
    )
    .eq("workspace_id", workspaceId)
    .order("tier_priority")
    .order("status");
  if (error) throw error;
  return (data ?? []) as AbmAccountWithLead[];
}
