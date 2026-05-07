"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";
import type {
  BrandAsset,
  SalesAsset,
  BattleCard,
} from "@/lib/supabase/queries/brand";

type ActionResult<T = void> = { ok: boolean; data?: T; error?: string };

// ============== Brand assets ==============

export async function upsertBrandAssetAction(
  asset: Partial<BrandAsset> & { name: string; asset_type: BrandAsset["asset_type"] },
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    if (asset.id) {
      const { error } = await supabase
        .from("brand_assets")
        .update(asset)
        .eq("workspace_id", ctx.workspaceId)
        .eq("id", asset.id);
      if (error) throw error;
      revalidatePath("/app/strategy/brand");
      return { ok: true, data: { id: asset.id } };
    }
    const { data, error } = await supabase
      .from("brand_assets")
      .insert({ workspace_id: ctx.workspaceId, ...asset })
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/app/strategy/brand");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function deleteBrandAssetAction(id: string): Promise<ActionResult> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("brand_assets")
      .delete()
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/app/strategy/brand");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

// ============== Sales assets ==============

export async function upsertSalesAssetAction(
  asset: Partial<SalesAsset> & { name: string; asset_type: SalesAsset["asset_type"] },
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    if (asset.id) {
      const { error } = await supabase
        .from("sales_assets")
        .update(asset)
        .eq("workspace_id", ctx.workspaceId)
        .eq("id", asset.id);
      if (error) throw error;
      revalidatePath("/app/strategy/sales-kit");
      return { ok: true, data: { id: asset.id } };
    }
    const { data, error } = await supabase
      .from("sales_assets")
      .insert({ workspace_id: ctx.workspaceId, ...asset })
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/app/strategy/sales-kit");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function deleteSalesAssetAction(id: string): Promise<ActionResult> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("sales_assets")
      .delete()
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/app/strategy/sales-kit");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

// ============== Battle cards ==============

export async function upsertBattleCardAction(
  card: Partial<BattleCard> & { competitor_id: string },
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    const payload = {
      workspace_id: ctx.workspaceId,
      ...card,
      last_refreshed_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("battle_cards")
      .upsert(payload, { onConflict: "workspace_id,competitor_id" })
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/app/strategy/sales-kit");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}
