"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";
import type { AbmAccount } from "@/lib/supabase/queries/abm";

type ActionResult<T = void> = { ok: boolean; data?: T; error?: string };

export async function promoteLeadToAbmAction(
  leadId: string,
  tierPriority = 1,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("abm_accounts")
      .upsert(
        {
          workspace_id: ctx.workspaceId,
          lead_id: leadId,
          tier_priority: tierPriority,
          account_owner_id: ctx.user.id,
        },
        { onConflict: "workspace_id,lead_id" },
      )
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/app/accounts");
    revalidatePath(`/app/leads/${leadId}`);
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function updateAbmAccountAction(
  id: string,
  updates: Partial<AbmAccount>,
): Promise<ActionResult> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("abm_accounts")
      .update(updates)
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/app/accounts");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function removeAbmAccountAction(id: string): Promise<ActionResult> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("abm_accounts")
      .delete()
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/app/accounts");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}
