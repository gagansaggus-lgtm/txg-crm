import type { SupabaseClient } from "@supabase/supabase-js";

import type { IcpProfile } from "@/types/marketing";

export type BrandAsset = {
  id: string;
  workspace_id: string;
  asset_type:
    | "logo"
    | "palette"
    | "typography"
    | "photography"
    | "template"
    | "voice_tone"
    | "other";
  name: string;
  file_url: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  version: number;
  created_at: string;
  updated_at: string;
};

export async function listBrandAssets(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<BrandAsset[]> {
  const { data, error } = await supabase
    .from("brand_assets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("asset_type")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BrandAsset[];
}

export type SalesAsset = {
  id: string;
  workspace_id: string;
  asset_type:
    | "pitch_deck"
    | "case_study_one_pager"
    | "integration_doc"
    | "compliance_doc"
    | "sla_doc"
    | "roi_calculator_internal"
    | "objection_handling"
    | "discovery_script"
    | "demo_recording"
    | "other";
  name: string;
  description: string | null;
  file_url: string | null;
  version: string;
  for_icp_tier: string | null;
  for_persona_id: string | null;
  for_service: string | null;
  for_geography: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export async function listSalesAssets(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<SalesAsset[]> {
  const { data, error } = await supabase
    .from("sales_assets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("active", { ascending: false })
    .order("asset_type")
    .order("name");
  if (error) throw error;
  return (data ?? []) as SalesAsset[];
}

export type BattleCard = {
  id: string;
  workspace_id: string;
  competitor_id: string;
  positioning: string | null;
  key_objections: Array<{ objection: string; response: string }>;
  comparative_pricing: Record<string, unknown>;
  win_themes: string[];
  loss_themes: string[];
  last_refreshed_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function listBattleCards(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<Array<BattleCard & { competitor_name?: string }>> {
  const { data, error } = await supabase
    .from("battle_cards")
    .select("*, competitor:competitors(name)")
    .eq("workspace_id", workspaceId);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const r = row as BattleCard & { competitor: { name: string } | null };
    return { ...r, competitor_name: r.competitor?.name };
  });
}

export type ProposalRow = {
  id: string;
  workspace_id: string;
  lead_id: string | null;
  customer_id: string | null;
  service_tier: string | null;
  projected_monthly_volume: number | null;
  total_value_usd: number | null;
  status:
    | "draft"
    | "review"
    | "sent"
    | "viewed"
    | "accepted"
    | "declined"
    | "expired";
  sent_at: string | null;
  viewed_at: string | null;
  decided_at: string | null;
  prepared_by: string | null;
  created_at: string;
  updated_at: string;
};

export async function listProposals(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<ProposalRow[]> {
  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as ProposalRow[];
}

export async function getIcpsForFiltering(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<Pick<IcpProfile, "id" | "tier" | "name">[]> {
  const { data, error } = await supabase
    .from("icp_profiles")
    .select("id, tier, name")
    .eq("workspace_id", workspaceId)
    .eq("active", true);
  if (error) throw error;
  return (data ?? []) as Pick<IcpProfile, "id" | "tier" | "name">[];
}
