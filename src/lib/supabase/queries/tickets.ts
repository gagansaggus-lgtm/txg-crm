import type { SupabaseClient } from "@supabase/supabase-js";

export type TicketRow = {
  id: string;
  workspace_id: string;
  customer_id: string | null;
  subject: string;
  body: string | null;
  status: "open" | "pending" | "resolved" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  assigned_to: string | null;
  related_type: string | null;
  related_id: string | null;
  due_at: string | null;
  created_at: string;
};

export async function listTickets(
  supabase: SupabaseClient,
  workspaceId: string,
  filters: { status?: string } = {},
) {
  let query = supabase
    .from("tickets")
    .select("*, customers(display_name)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (filters.status) query = query.eq("status", filters.status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...(row as unknown as TicketRow),
    customer_name:
      ((row as { customers?: { display_name?: string } }).customers?.display_name) ?? null,
  }));
}
