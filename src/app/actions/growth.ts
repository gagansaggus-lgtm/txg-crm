"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";
import type {
  Partner,
  PrContact,
  PressPiece,
  EventRow,
  Influencer,
  SpeakingEngagement,
} from "@/lib/supabase/queries/growth";

type ActionResult<T = void> = { ok: boolean; data?: T; error?: string };

// Partners
export async function upsertPartnerAction(
  partner: Partial<Partner> & { name: string; partner_type: Partner["partner_type"] },
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    if (partner.id) {
      const { error } = await supabase
        .from("partners")
        .update(partner)
        .eq("workspace_id", ctx.workspaceId)
        .eq("id", partner.id);
      if (error) throw error;
      revalidatePath("/app/growth/partners");
      return { ok: true, data: { id: partner.id } };
    }
    const { data, error } = await supabase
      .from("partners")
      .insert({ workspace_id: ctx.workspaceId, ...partner })
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/app/growth/partners");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function deletePartnerAction(id: string): Promise<ActionResult> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("partners")
      .delete()
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/app/growth/partners");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

// PR
export async function upsertPrContactAction(
  contact: Partial<PrContact> & { full_name: string },
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    if (contact.id) {
      const { error } = await supabase
        .from("pr_contacts")
        .update(contact)
        .eq("workspace_id", ctx.workspaceId)
        .eq("id", contact.id);
      if (error) throw error;
      revalidatePath("/app/growth/pr");
      return { ok: true, data: { id: contact.id } };
    }
    const { data, error } = await supabase
      .from("pr_contacts")
      .insert({ workspace_id: ctx.workspaceId, ...contact })
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/app/growth/pr");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function upsertPressPieceAction(
  piece: Partial<PressPiece> & { title: string },
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    if (piece.id) {
      const { error } = await supabase
        .from("press_pieces")
        .update(piece)
        .eq("workspace_id", ctx.workspaceId)
        .eq("id", piece.id);
      if (error) throw error;
      revalidatePath("/app/growth/pr");
      return { ok: true, data: { id: piece.id } };
    }
    const { data, error } = await supabase
      .from("press_pieces")
      .insert({ workspace_id: ctx.workspaceId, ...piece })
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/app/growth/pr");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

// Events
export async function upsertEventAction(
  event: Partial<EventRow> & { name: string; event_type: EventRow["event_type"] },
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    if (event.id) {
      const { error } = await supabase
        .from("events")
        .update(event)
        .eq("workspace_id", ctx.workspaceId)
        .eq("id", event.id);
      if (error) throw error;
      revalidatePath("/app/growth/events");
      return { ok: true, data: { id: event.id } };
    }
    const { data, error } = await supabase
      .from("events")
      .insert({ workspace_id: ctx.workspaceId, ...event })
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/app/growth/events");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

// Influencers
export async function upsertInfluencerAction(
  influencer: Partial<Influencer> & { name: string },
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    if (influencer.id) {
      const { error } = await supabase
        .from("influencers")
        .update(influencer)
        .eq("workspace_id", ctx.workspaceId)
        .eq("id", influencer.id);
      if (error) throw error;
      revalidatePath("/app/growth/influencers");
      return { ok: true, data: { id: influencer.id } };
    }
    const { data, error } = await supabase
      .from("influencers")
      .insert({ workspace_id: ctx.workspaceId, ...influencer })
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/app/growth/influencers");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

// Speaking
export async function upsertSpeakingAction(
  s: Partial<SpeakingEngagement> & { event_name: string },
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    if (s.id) {
      const { error } = await supabase
        .from("speaking_engagements")
        .update(s)
        .eq("workspace_id", ctx.workspaceId)
        .eq("id", s.id);
      if (error) throw error;
      revalidatePath("/app/growth/pr");
      return { ok: true, data: { id: s.id } };
    }
    const { data, error } = await supabase
      .from("speaking_engagements")
      .insert({ workspace_id: ctx.workspaceId, ...s })
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/app/growth/pr");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}
