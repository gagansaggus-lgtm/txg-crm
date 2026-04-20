import type { SupabaseClient } from "@supabase/supabase-js";

import type { Quote } from "@/types/db";

export async function listQuotes(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<Array<Quote & { customer_name: string | null }>> {
  const { data, error } = await supabase
    .from("quotes")
    .select("*, customers(display_name)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...(row as unknown as Quote),
    customer_name:
      ((row as { customers?: { display_name?: string } }).customers?.display_name) ?? null,
  }));
}
