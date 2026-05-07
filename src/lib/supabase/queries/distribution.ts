import type { SupabaseClient } from "@supabase/supabase-js";

export type SocialPostRow = {
  id: string;
  workspace_id: string;
  platform: string;
  posted_as: string | null;
  body: string | null;
  status: "draft" | "scheduled" | "posted" | "failed" | "cancelled";
  scheduled_at: string | null;
  posted_at: string | null;
  external_post_url: string | null;
  performance: Record<string, unknown>;
  created_at: string;
};

export async function listSocialPosts(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<SocialPostRow[]> {
  const { data, error } = await supabase
    .from("social_posts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("scheduled_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as SocialPostRow[];
}

export type CommunityMember = {
  id: string;
  workspace_id: string;
  channel: "whatsapp" | "telegram" | "linkedin_group" | "discord" | "slack" | "other";
  display_name: string | null;
  email: string | null;
  whatsapp_number: string | null;
  source: string | null;
  joined_at: string;
  engagement_score: number;
  status: "active" | "inactive" | "removed" | "banned";
  metadata: Record<string, unknown>;
};

export async function listCommunityMembers(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<CommunityMember[]> {
  const { data, error } = await supabase
    .from("community_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("joined_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as CommunityMember[];
}

export type EngagementTarget = {
  id: string;
  workspace_id: string;
  for_user_id: string;
  platform: string;
  target_url: string;
  target_author: string | null;
  draft_comment: string | null;
  status: "queued" | "engaged" | "skipped" | "expired";
  generated_for_date: string;
  engaged_at: string | null;
  created_at: string;
};

export async function listEngagementTargets(
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string,
): Promise<EngagementTarget[]> {
  const { data, error } = await supabase
    .from("engagement_targets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("for_user_id", userId)
    .order("generated_for_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as EngagementTarget[];
}

export type SocialMention = {
  id: string;
  workspace_id: string;
  source_platform: string;
  mention_text: string;
  source_url: string | null;
  author_handle: string | null;
  sentiment: string | null;
  intent_signal: string | null;
  observed_at: string;
  reviewed: boolean;
};

export async function listSocialMentions(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<SocialMention[]> {
  const { data, error } = await supabase
    .from("social_mentions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("observed_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as SocialMention[];
}
