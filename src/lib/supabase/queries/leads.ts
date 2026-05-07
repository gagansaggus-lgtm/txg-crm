import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Lead,
  LeadContact,
  LeadStatus,
  LeadValidationStage,
  IcpProfile,
} from "@/types/marketing";

export type LeadWithCounts = Lead & {
  contact_count?: number;
  last_message_at?: string | null;
};

export type LeadFilters = {
  status?: LeadStatus | LeadStatus[];
  validation_stage?: LeadValidationStage | LeadValidationStage[];
  icp_grade?: "A" | "B" | "C" | "D" | "F";
  vertical?: string;
  country?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

export async function listLeads(
  supabase: SupabaseClient,
  workspaceId: string,
  filters: LeadFilters = {},
): Promise<{ leads: Lead[]; total: number }> {
  let query = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .eq("workspace_id", workspaceId);

  if (filters.status) {
    if (Array.isArray(filters.status)) {
      query = query.in("status", filters.status);
    } else {
      query = query.eq("status", filters.status);
    }
  }
  if (filters.validation_stage) {
    if (Array.isArray(filters.validation_stage)) {
      query = query.in("validation_stage", filters.validation_stage);
    } else {
      query = query.eq("validation_stage", filters.validation_stage);
    }
  }
  if (filters.icp_grade) query = query.eq("icp_grade", filters.icp_grade);
  if (filters.vertical) query = query.eq("vertical", filters.vertical);
  if (filters.country) query = query.eq("country", filters.country);
  if (filters.search) {
    query = query.or(
      `display_name.ilike.%${filters.search}%,legal_name.ilike.%${filters.search}%,website.ilike.%${filters.search}%`,
    );
  }

  query = query
    .order("icp_score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(
      filters.offset ?? 0,
      (filters.offset ?? 0) + (filters.limit ?? 50) - 1,
    );

  const { data, error, count } = await query;
  if (error) throw error;
  return {
    leads: (data ?? []) as Lead[],
    total: count ?? 0,
  };
}

export async function getLeadDetail(
  supabase: SupabaseClient,
  workspaceId: string,
  leadId: string,
) {
  const { data: lead, error } = await supabase
    .from("leads")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", leadId)
    .maybeSingle();

  if (error) throw error;
  if (!lead) return null;

  const [contactsRes, messagesRes, icpRes, assignmentRes] = await Promise.all([
    supabase
      .from("lead_contacts")
      .select("*")
      .eq("lead_id", leadId)
      .order("is_primary", { ascending: false }),
    supabase
      .from("outreach_messages")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(50),
    lead.icp_profile_id
      ? supabase
          .from("icp_profiles")
          .select("*")
          .eq("id", lead.icp_profile_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("sdr_assignments")
      .select("*, sdr:profiles!sdr_assignments_sdr_id_fkey(id, full_name, email)")
      .eq("lead_id", leadId)
      .eq("active", true)
      .maybeSingle(),
  ]);

  return {
    lead: lead as Lead,
    contacts: (contactsRes.data ?? []) as LeadContact[],
    messages: messagesRes.data ?? [],
    icp_profile: (icpRes.data ?? null) as IcpProfile | null,
    assignment: assignmentRes.data ?? null,
  };
}

export async function leadCountsByStage(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<Record<LeadValidationStage, number>> {
  const { data, error } = await supabase
    .from("leads")
    .select("validation_stage")
    .eq("workspace_id", workspaceId);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const stage = (row as { validation_stage: string }).validation_stage;
    counts[stage] = (counts[stage] ?? 0) + 1;
  }
  return counts as Record<LeadValidationStage, number>;
}

export async function leadCountsByStatus(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<Record<LeadStatus, number>> {
  const { data, error } = await supabase
    .from("leads")
    .select("status")
    .eq("workspace_id", workspaceId);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const s = (row as { status: string }).status;
    counts[s] = (counts[s] ?? 0) + 1;
  }
  return counts as Record<LeadStatus, number>;
}

export type LeadInsertInput = Partial<
  Pick<
    Lead,
    | "source"
    | "source_external_id"
    | "legal_name"
    | "display_name"
    | "website"
    | "vertical"
    | "country"
    | "city"
    | "estimated_gmv_usd"
    | "funding_stage"
    | "notes"
    | "icp_profile_id"
  >
> & { display_name: string };

export async function insertLead(
  supabase: SupabaseClient,
  workspaceId: string,
  input: LeadInsertInput,
): Promise<string> {
  const { data, error } = await supabase
    .from("leads")
    .insert({
      workspace_id: workspaceId,
      source: input.source ?? "manual",
      ...input,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function bulkInsertLeads(
  supabase: SupabaseClient,
  workspaceId: string,
  inputs: LeadInsertInput[],
): Promise<{ inserted: number; skipped: number }> {
  if (!inputs.length) return { inserted: 0, skipped: 0 };
  const rows = inputs.map((input) => ({
    workspace_id: workspaceId,
    source: input.source ?? "manual",
    ...input,
  }));
  // Use upsert ignoring conflicts on (workspace_id, source, source_external_id)
  const { data, error } = await supabase
    .from("leads")
    .upsert(rows, {
      onConflict: "workspace_id,source,source_external_id",
      ignoreDuplicates: true,
    })
    .select("id");
  if (error) throw error;
  return {
    inserted: data?.length ?? 0,
    skipped: inputs.length - (data?.length ?? 0),
  };
}

export async function updateLead(
  supabase: SupabaseClient,
  workspaceId: string,
  leadId: string,
  updates: Partial<Lead>,
): Promise<void> {
  const { error } = await supabase
    .from("leads")
    .update(updates)
    .eq("workspace_id", workspaceId)
    .eq("id", leadId);
  if (error) throw error;
}

export async function deleteLead(
  supabase: SupabaseClient,
  workspaceId: string,
  leadId: string,
): Promise<void> {
  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", leadId);
  if (error) throw error;
}

export async function upsertLeadContact(
  supabase: SupabaseClient,
  workspaceId: string,
  leadId: string,
  contact: Partial<LeadContact> & { full_name?: string | null; email?: string | null },
): Promise<void> {
  if (contact.id) {
    const { error } = await supabase
      .from("lead_contacts")
      .update(contact)
      .eq("workspace_id", workspaceId)
      .eq("id", contact.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("lead_contacts").insert({
      workspace_id: workspaceId,
      lead_id: leadId,
      ...contact,
    });
    if (error) throw error;
  }
}
