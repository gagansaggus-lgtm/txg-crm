import type { SupabaseClient } from "@supabase/supabase-js";

import { listActiveEvents } from "@/lib/brain/brain-events";
import { listDeadChannels } from "@/lib/brain/channel-health";

export type CrmSessionContext = {
  identity: {
    fullName: string | null;
    email: string;
    role: string;
  };
  rules: string[];
  criticalAlerts: Array<{ severity: string; title: string; description?: string; ageMinutes: number }>;
  deadChannels: string[];
  keyNumbers: Record<string, number>;
  generatedAt: string;
};

const ABSOLUTE_RULES = [
  "Teams only for internal Transway communication — never email internally.",
  "Respect role scoping: admin/ops_lead can see everything; other roles scoped later.",
  "Every new feature must have AI hooks (activity_log, brain_memories, MCP tools).",
  "Never auto-send external emails or marketing without explicit user approval.",
  "Concise, direct, autonomous execution — Gagan uses voice-to-text, be forgiving of typos.",
];

export async function getCrmSessionContext(
  supabase: SupabaseClient,
  workspaceId: string,
  user: { id: string; email: string; fullName?: string | null; role?: string },
): Promise<CrmSessionContext> {
  const now = Date.now();
  const [events, dead, customers, receipts, orders, shipments, tickets] = await Promise.all([
    listActiveEvents(supabase, workspaceId, 10),
    listDeadChannels(supabase, workspaceId),
    supabase.from("customers").select("id, status").eq("workspace_id", workspaceId),
    supabase.from("inbound_receipts").select("id, status").eq("workspace_id", workspaceId),
    supabase.from("fulfillment_orders").select("id, status").eq("workspace_id", workspaceId),
    supabase.from("shipments").select("id, status").eq("workspace_id", workspaceId),
    supabase.from("tickets").select("id, status").eq("workspace_id", workspaceId),
  ]);

  const keyNumbers: Record<string, number> = {
    activeCustomers: (customers.data ?? []).filter((c) => c.status === "active").length,
    openReceipts: (receipts.data ?? []).filter((r) => r.status !== "closed" && r.status !== "received").length,
    pendingOrders: (orders.data ?? []).filter((o) => o.status === "new" || o.status === "allocated" || o.status === "picking").length,
    shipmentsInTransit: (shipments.data ?? []).filter((s) => ["picked_up", "in_transit", "out_for_delivery"].includes(s.status)).length,
    shipmentExceptions: (shipments.data ?? []).filter((s) => s.status === "exception").length,
    openTickets: (tickets.data ?? []).filter((t) => t.status === "open" || t.status === "pending").length,
  };

  return {
    identity: {
      fullName: user.fullName ?? null,
      email: user.email,
      role: user.role ?? "admin",
    },
    rules: ABSOLUTE_RULES,
    criticalAlerts: events
      .filter((e) => e.severity === "critical" || e.severity === "warning")
      .map((e) => ({
        severity: e.severity,
        title: e.title,
        description: e.description ?? undefined,
        ageMinutes: Math.round((now - new Date(e.created_at).getTime()) / 60_000),
      })),
    deadChannels: dead.map((c) => c.channel_name),
    keyNumbers,
    generatedAt: new Date().toISOString(),
  };
}
