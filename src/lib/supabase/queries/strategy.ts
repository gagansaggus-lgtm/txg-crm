import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  IcpProfile,
  Persona,
  Competitor,
  CompetitorSignal,
} from "@/types/marketing";

// ============== ICPs & Personas ==============

export async function listIcps(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<IcpProfile[]> {
  const { data, error } = await supabase
    .from("icp_profiles")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("tier");
  if (error) throw error;
  return (data ?? []) as IcpProfile[];
}

export async function getIcpDetail(
  supabase: SupabaseClient,
  workspaceId: string,
  icpId: string,
) {
  const [icpRes, personasRes, leadCountRes] = await Promise.all([
    supabase
      .from("icp_profiles")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("id", icpId)
      .maybeSingle(),
    supabase
      .from("personas")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("icp_profile_id", icpId)
      .order("created_at"),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("icp_profile_id", icpId),
  ]);

  if (icpRes.error) throw icpRes.error;
  if (!icpRes.data) return null;

  return {
    icp: icpRes.data as IcpProfile,
    personas: (personasRes.data ?? []) as Persona[],
    lead_count: leadCountRes.count ?? 0,
  };
}

export async function listPersonas(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<Persona[]> {
  const { data, error } = await supabase
    .from("personas")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as Persona[];
}

// ============== Competitors ==============

export async function listCompetitors(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<Array<Competitor & { signal_count?: number }>> {
  const { data, error } = await supabase
    .from("competitors")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("active", { ascending: false })
    .order("name");
  if (error) throw error;
  return (data ?? []) as Competitor[];
}

export async function getCompetitorDetail(
  supabase: SupabaseClient,
  workspaceId: string,
  competitorId: string,
) {
  const [compRes, signalsRes] = await Promise.all([
    supabase
      .from("competitors")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("id", competitorId)
      .maybeSingle(),
    supabase
      .from("competitor_signals")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("competitor_id", competitorId)
      .order("observed_at", { ascending: false })
      .limit(50),
  ]);

  if (compRes.error) throw compRes.error;
  if (!compRes.data) return null;

  return {
    competitor: compRes.data as Competitor,
    signals: (signalsRes.data ?? []) as CompetitorSignal[],
  };
}
