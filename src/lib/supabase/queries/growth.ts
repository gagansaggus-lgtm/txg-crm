import type { SupabaseClient } from "@supabase/supabase-js";

export type Partner = {
  id: string;
  workspace_id: string;
  name: string;
  partner_type: "strategic" | "channel" | "tech" | "reseller" | "other";
  website: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  agreement_status:
    | "prospect"
    | "negotiating"
    | "signed"
    | "active"
    | "paused"
    | "terminated";
  agreement_url: string | null;
  agreement_signed_at: string | null;
  referral_pipeline_value_usd: number;
  referrals_received: number;
  notes: string | null;
  created_at: string;
};

export async function listPartners(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<Partner[]> {
  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("agreement_status")
    .order("name");
  if (error) throw error;
  return (data ?? []) as Partner[];
}

export type PrContact = {
  id: string;
  workspace_id: string;
  full_name: string;
  publication: string | null;
  role_title: string | null;
  beat: string | null;
  email: string | null;
  twitter_handle: string | null;
  linkedin_url: string | null;
  preferred_contact: string | null;
  last_pitched_at: string | null;
  responded_count: number;
  published_count: number;
  notes: string | null;
  created_at: string;
};

export async function listPrContacts(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<PrContact[]> {
  const { data, error } = await supabase
    .from("pr_contacts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("publication")
    .order("full_name");
  if (error) throw error;
  return (data ?? []) as PrContact[];
}

export type PressPiece = {
  id: string;
  workspace_id: string;
  title: string;
  status:
    | "draft"
    | "pitched"
    | "in_progress"
    | "published"
    | "declined"
    | "killed";
  publication: string | null;
  published_url: string | null;
  published_at: string | null;
  pitch_body: string | null;
  created_at: string;
};

export async function listPressPieces(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<PressPiece[]> {
  const { data, error } = await supabase
    .from("press_pieces")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as PressPiece[];
}

export type EventRow = {
  id: string;
  workspace_id: string;
  name: string;
  event_type:
    | "trade_show"
    | "webinar"
    | "meetup"
    | "private_event"
    | "conference"
    | "other";
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  status: "planned" | "confirmed" | "in_progress" | "completed" | "cancelled";
  cost_usd: number | null;
  notes: string | null;
};

export async function listEvents(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("start_date", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as EventRow[];
}

export type Influencer = {
  id: string;
  workspace_id: string;
  name: string;
  primary_platform: string | null;
  follower_count: number | null;
  niche: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  created_at: string;
};

export async function listInfluencers(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<Influencer[]> {
  const { data, error } = await supabase
    .from("influencers")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("follower_count", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as Influencer[];
}

export type SpeakingEngagement = {
  id: string;
  workspace_id: string;
  event_name: string;
  event_date: string | null;
  event_location: string | null;
  event_type:
    | "conference"
    | "panel"
    | "podcast"
    | "webinar"
    | "fireside"
    | "workshop"
    | "other"
    | null;
  proposal_status:
    | "idea"
    | "submitted"
    | "accepted"
    | "declined"
    | "completed"
    | "cancelled";
  proposal_url: string | null;
  recording_url: string | null;
};

export async function listSpeakingEngagements(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<SpeakingEngagement[]> {
  const { data, error } = await supabase
    .from("speaking_engagements")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("event_date", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as SpeakingEngagement[];
}
