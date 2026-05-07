"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";
import type { ContentPiece, ContentType, ContentStatus } from "@/types/marketing";

type ActionResult<T = void> = { ok: boolean; data?: T; error?: string };

export async function upsertContentAction(
  piece: Partial<ContentPiece> & { title: string; content_type: ContentType },
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    if (piece.id) {
      const { error } = await supabase
        .from("content_pieces")
        .update(piece)
        .eq("workspace_id", ctx.workspaceId)
        .eq("id", piece.id);
      if (error) throw error;
      revalidatePath("/app/content/calendar");
      revalidatePath("/app/content/articles");
      revalidatePath("/app/content/founder-brand");
      return { ok: true, data: { id: piece.id } };
    }
    const { data, error } = await supabase
      .from("content_pieces")
      .insert({
        workspace_id: ctx.workspaceId,
        created_by: ctx.user.id,
        author_id: ctx.user.id,
        ...piece,
      })
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/app/content/calendar");
    revalidatePath("/app/content/articles");
    revalidatePath("/app/content/founder-brand");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function updateContentStatusAction(
  id: string,
  status: ContentStatus,
): Promise<ActionResult> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    const updates: Partial<ContentPiece> = { status };
    if (status === "published") updates.published_at = new Date().toISOString();
    const { error } = await supabase
      .from("content_pieces")
      .update(updates)
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/app/content/calendar");
    revalidatePath("/app/content/articles");
    revalidatePath("/app/content/founder-brand");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function deleteContentAction(id: string): Promise<ActionResult> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("content_pieces")
      .delete()
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/app/content/calendar");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

// Lead magnets
export async function upsertLeadMagnetAction(
  magnet: { id?: string; title: string; slug: string; description?: string | null; file_url?: string | null; page_count?: number | null; active?: boolean },
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    if (magnet.id) {
      const { error } = await supabase
        .from("lead_magnets")
        .update(magnet)
        .eq("workspace_id", ctx.workspaceId)
        .eq("id", magnet.id);
      if (error) throw error;
      revalidatePath("/app/content/library");
      return { ok: true, data: { id: magnet.id } };
    }
    const { data, error } = await supabase
      .from("lead_magnets")
      .insert({ workspace_id: ctx.workspaceId, ...magnet })
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/app/content/library");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

// Newsletters
export async function upsertNewsletterAction(
  nl: { id?: string; subject: string; list_type?: string; preheader?: string | null; body?: string | null; scheduled_at?: string | null },
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    if (nl.id) {
      const { error } = await supabase
        .from("newsletters")
        .update(nl)
        .eq("workspace_id", ctx.workspaceId)
        .eq("id", nl.id);
      if (error) throw error;
      revalidatePath("/app/content/newsletters");
      return { ok: true, data: { id: nl.id } };
    }
    const { data, error } = await supabase
      .from("newsletters")
      .insert({
        workspace_id: ctx.workspaceId,
        list_type: nl.list_type ?? "prospect",
        ...nl,
      })
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/app/content/newsletters");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}
