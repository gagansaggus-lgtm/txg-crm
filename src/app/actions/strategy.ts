"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";
import type { IcpProfile, Persona, Competitor, CompetitorSignal } from "@/types/marketing";

type ActionResult<T = void> = { ok: boolean; data?: T; error?: string };

// ============== ICP actions ==============

export async function updateIcpAction(
  icpId: string,
  updates: Partial<IcpProfile>,
): Promise<ActionResult> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("icp_profiles")
      .update(updates)
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", icpId);
    if (error) throw error;
    revalidatePath("/app/strategy/icps");
    revalidatePath(`/app/strategy/icps/${icpId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Update failed" };
  }
}

export async function createIcpAction(
  input: Pick<IcpProfile, "tier" | "name"> & Partial<IcpProfile>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("icp_profiles")
      .insert({ workspace_id: ctx.workspaceId, ...input })
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/app/strategy/icps");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Create failed" };
  }
}

// ============== Persona actions ==============

export async function upsertPersonaAction(
  persona: Partial<Persona> & { icp_profile_id: string; title: string },
): Promise<ActionResult> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    if (persona.id) {
      const { error } = await supabase
        .from("personas")
        .update(persona)
        .eq("workspace_id", ctx.workspaceId)
        .eq("id", persona.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("personas").insert({
        workspace_id: ctx.workspaceId,
        ...persona,
      });
      if (error) throw error;
    }
    revalidatePath("/app/strategy/icps");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Persona save failed" };
  }
}

export async function deletePersonaAction(personaId: string): Promise<ActionResult> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("personas")
      .delete()
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", personaId);
    if (error) throw error;
    revalidatePath("/app/strategy/icps");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Delete failed" };
  }
}

// ============== Competitor actions ==============

export async function upsertCompetitorAction(
  comp: Partial<Competitor> & { name: string },
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    if (comp.id) {
      const { error } = await supabase
        .from("competitors")
        .update(comp)
        .eq("workspace_id", ctx.workspaceId)
        .eq("id", comp.id);
      if (error) throw error;
      revalidatePath("/app/strategy/competitors");
      return { ok: true, data: { id: comp.id } };
    }
    const { data, error } = await supabase
      .from("competitors")
      .insert({ workspace_id: ctx.workspaceId, ...comp })
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/app/strategy/competitors");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed" };
  }
}

export async function logCompetitorSignalAction(
  signal: Pick<CompetitorSignal, "competitor_id" | "signal_type"> &
    Partial<CompetitorSignal>,
): Promise<ActionResult> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("competitor_signals").insert({
      workspace_id: ctx.workspaceId,
      ...signal,
    });
    if (error) throw error;
    revalidatePath(`/app/strategy/competitors`);
    revalidatePath(`/app/strategy/competitors/${signal.competitor_id}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed" };
  }
}
