"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

type ActionResult<T = void> = { ok: boolean; data?: T; error?: string };

// Social posts
export async function upsertSocialPostAction(
  post: {
    id?: string;
    platform: string;
    posted_as?: string | null;
    body: string;
    scheduled_at?: string | null;
    status?: "draft" | "scheduled" | "posted" | "cancelled";
  },
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    if (post.id) {
      const { error } = await supabase
        .from("social_posts")
        .update(post)
        .eq("workspace_id", ctx.workspaceId)
        .eq("id", post.id);
      if (error) throw error;
      revalidatePath("/app/distribution/social");
      return { ok: true, data: { id: post.id } };
    }
    const { data, error } = await supabase
      .from("social_posts")
      .insert({
        workspace_id: ctx.workspaceId,
        created_by: ctx.user.id,
        ...post,
      })
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/app/distribution/social");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function markSocialPostPostedAction(
  id: string,
  externalUrl?: string,
): Promise<ActionResult> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("social_posts")
      .update({
        status: "posted",
        posted_at: new Date().toISOString(),
        external_post_url: externalUrl ?? null,
      })
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/app/distribution/social");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function deleteSocialPostAction(id: string): Promise<ActionResult> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("social_posts")
      .delete()
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/app/distribution/social");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

// Community members
export async function addCommunityMemberAction(
  member: {
    channel: string;
    display_name?: string | null;
    email?: string | null;
    whatsapp_number?: string | null;
    source?: string | null;
  },
): Promise<ActionResult> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("community_members").insert({
      workspace_id: ctx.workspaceId,
      ...member,
    });
    if (error) throw error;
    revalidatePath("/app/distribution/community");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

// Engagement targets
export async function markEngagementEngagedAction(
  id: string,
): Promise<ActionResult> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("engagement_targets")
      .update({ status: "engaged", engaged_at: new Date().toISOString() })
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/app/distribution/engagement");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function markEngagementSkippedAction(
  id: string,
): Promise<ActionResult> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("engagement_targets")
      .update({ status: "skipped" })
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/app/distribution/engagement");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

// Mentions
export async function markMentionReviewedAction(
  id: string,
): Promise<ActionResult> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("social_mentions")
      .update({ reviewed: true })
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/app/distribution/listening");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}
