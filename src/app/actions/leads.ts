"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";
import {
  bulkInsertLeads,
  insertLead,
  type LeadInsertInput,
  updateLead,
  upsertLeadContact,
} from "@/lib/supabase/queries/leads";
import type { LeadStatus, Lead } from "@/types/marketing";

type ActionResult<T = void> = { ok: boolean; data?: T; error?: string };

export async function createLeadAction(
  input: LeadInsertInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    if (!input.display_name?.trim()) return { ok: false, error: "Display name is required" };

    const supabase = await createSupabaseServerClient();
    const id = await insertLead(supabase, ctx.workspaceId, input);
    revalidatePath("/app/leads");
    return { ok: true, data: { id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create lead" };
  }
}

export async function updateLeadAction(
  leadId: string,
  updates: Partial<Lead>,
): Promise<ActionResult> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };

    const supabase = await createSupabaseServerClient();
    await updateLead(supabase, ctx.workspaceId, leadId, updates);
    revalidatePath(`/app/leads/${leadId}`);
    revalidatePath("/app/leads");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update lead" };
  }
}

export async function updateLeadStatusAction(
  leadId: string,
  status: LeadStatus,
): Promise<ActionResult> {
  return updateLeadAction(leadId, { status });
}

export async function deleteLeadAction(leadId: string): Promise<ActionResult> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", leadId);
    if (error) throw error;
    revalidatePath("/app/leads");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to delete lead" };
  }
}

export async function addLeadContactAction(
  leadId: string,
  contact: {
    full_name?: string | null;
    role_title?: string | null;
    email?: string | null;
    linkedin_url?: string | null;
    whatsapp_number?: string | null;
  },
): Promise<ActionResult> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };

    const supabase = await createSupabaseServerClient();
    await upsertLeadContact(supabase, ctx.workspaceId, leadId, contact);
    revalidatePath(`/app/leads/${leadId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to add contact" };
  }
}

export async function importLeadsAction(
  inputs: LeadInsertInput[],
): Promise<ActionResult<{ inserted: number; skipped: number }>> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };

    if (!inputs.length) return { ok: false, error: "No rows to import" };
    if (inputs.length > 5000) return { ok: false, error: "Max 5000 rows per import. Split your file." };

    const supabase = await createSupabaseServerClient();
    const result = await bulkInsertLeads(supabase, ctx.workspaceId, inputs);
    revalidatePath("/app/leads");
    return { ok: true, data: result };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Import failed" };
  }
}
