import type { SupabaseClient } from "@supabase/supabase-js";

import { writeMemory } from "@/lib/brain/memories";
import { logActivity } from "@/lib/brain/activity-log";

// Tool schemas handed to Claude. Keep them stable — changing this list
// invalidates the system-prompt prefix cache.
export const CRM_TOOLS = [
  {
    name: "search_customers",
    description:
      "Find customers by display name, legal name, or billing city. Returns up to 10 matches with id, names, status, location, currency. Use when the user references a customer by name.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Partial name, legal name, or city to search for." },
        status: {
          type: "string",
          enum: ["prospect", "active", "churned"],
          description: "Optional status filter.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_customer",
    description: "Fetch one customer by UUID, including their services, last 5 activities, and 3 most important memories.",
    input_schema: {
      type: "object",
      properties: { customer_id: { type: "string", format: "uuid" } },
      required: ["customer_id"],
    },
  },
  {
    name: "list_open_ops",
    description:
      "Snapshot of current operational load — open receipts, pending orders, shipments in-transit, exceptions, open tickets. Use when the user asks 'what's happening' / 'what's the status'.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "search_memories",
    description:
      "Full-text search the CRM's long-term memory (L4) for relevant insights, preferences, incidents, lessons, or decisions. Use this before answering questions about how things were done, customer preferences, or past incidents.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 20 } },
      required: ["query"],
    },
  },
  {
    name: "remember_fact",
    description:
      "Save a durable memory (L4) that future CRM sessions should recall — customer preferences, decisions, protocols, lessons learned. Use sparingly for genuinely-important facts only.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short, scannable title (under 80 chars)." },
        content: { type: "string", description: "The full fact — what to remember, why, when it applies." },
        memory_type: {
          type: "string",
          enum: ["insight", "preference", "incident", "lesson", "decision", "fact", "protocol"],
        },
        importance: { type: "integer", minimum: 1, maximum: 5, description: "1 = trivia, 5 = load-bearing for the business." },
        domain: { type: "string", description: "e.g. 'customers', 'operations', 'finance'." },
        entity_type: { type: "string" },
        entity_id: { type: "string", format: "uuid" },
        tags: { type: "array", items: { type: "string" } },
      },
      required: ["title", "content", "memory_type", "domain"],
    },
  },
  {
    name: "list_recent_activity",
    description:
      "Read the episodic activity log (L2). Either workspace-wide, or scoped to a specific entity. Returns up to 25 events in reverse chronological order.",
    input_schema: {
      type: "object",
      properties: {
        entity_type: { type: "string" },
        entity_id: { type: "string", format: "uuid" },
        limit: { type: "integer", minimum: 1, maximum: 50 },
      },
    },
  },
  {
    name: "get_shipment_by_tracking",
    description: "Look up a shipment by its tracking_number or shipment_number.",
    input_schema: {
      type: "object",
      properties: { tracking_or_shipment_number: { type: "string" } },
      required: ["tracking_or_shipment_number"],
    },
  },
] as const;

// Tool dispatcher — takes the name + parsed input, returns a JSON-serializable result.
export async function runTool(
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string,
  name: string,
  input: Record<string, unknown>,
  conversationId: string,
): Promise<unknown> {
  switch (name) {
    case "search_customers": {
      const q = String(input.query ?? "").trim();
      let query = supabase
        .from("customers")
        .select("id, display_name, legal_name, status, billing_city, billing_region, billing_country, currency")
        .eq("workspace_id", workspaceId)
        .or(
          `display_name.ilike.%${q}%,legal_name.ilike.%${q}%,billing_city.ilike.%${q}%`,
        )
        .limit(10);
      if (input.status) query = query.eq("status", input.status as string);
      const { data, error } = await query;
      if (error) return { error: error.message };
      return { customers: data ?? [] };
    }
    case "get_customer": {
      const id = String(input.customer_id ?? "");
      const [{ data: c }, { data: services }, { data: activity }, { data: memories }] = await Promise.all([
        supabase.from("customers").select("*").eq("id", id).maybeSingle(),
        supabase.from("customer_services").select("service_type, active").eq("customer_id", id),
        supabase
          .from("crm_activity_log")
          .select("action, summary, created_at, actor_id")
          .eq("entity_type", "customer")
          .eq("entity_id", id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("crm_brain_memories")
          .select("title, content, memory_type, importance")
          .eq("entity_type", "customer")
          .eq("entity_id", id)
          .is("superseded_by", null)
          .order("importance", { ascending: false })
          .limit(3),
      ]);
      if (!c) return { error: "customer not found" };
      return { customer: c, services, recent_activity: activity, memories };
    }
    case "list_open_ops": {
      const [receipts, orders, shipments, tickets] = await Promise.all([
        supabase.from("inbound_receipts").select("id, status, expected_at, customer_id").eq("workspace_id", workspaceId).in("status", ["expected", "arrived", "receiving"]).limit(20),
        supabase.from("fulfillment_orders").select("id, status, required_ship_date, customer_id").eq("workspace_id", workspaceId).in("status", ["new", "allocated", "picking", "packed"]).limit(20),
        supabase.from("shipments").select("id, status, tracking_number, customer_id").eq("workspace_id", workspaceId).in("status", ["pending", "label_created", "picked_up", "in_transit", "out_for_delivery", "exception"]).limit(20),
        supabase.from("tickets").select("id, status, subject, priority, customer_id").eq("workspace_id", workspaceId).in("status", ["open", "pending"]).limit(20),
      ]);
      return {
        receipts: receipts.data ?? [],
        orders: orders.data ?? [],
        shipments: shipments.data ?? [],
        tickets: tickets.data ?? [],
      };
    }
    case "search_memories": {
      const { data } = await supabase
        .from("crm_brain_memories")
        .select("id, domain, memory_type, title, content, importance, tags, entity_type, entity_id")
        .eq("workspace_id", workspaceId)
        .is("superseded_by", null)
        .or(`title.ilike.%${input.query}%,content.ilike.%${input.query}%`)
        .order("importance", { ascending: false })
        .limit(Number(input.limit ?? 8));
      return { memories: data ?? [] };
    }
    case "remember_fact": {
      const id = await writeMemory(supabase, {
        workspaceId,
        domain: String(input.domain ?? "general"),
        memoryType: (input.memory_type ?? "fact") as never,
        title: String(input.title),
        content: String(input.content),
        importance: Number(input.importance ?? 3),
        entityType: input.entity_type as string | undefined,
        entityId: input.entity_id as string | undefined,
        tags: (input.tags as string[] | undefined) ?? [],
        sourceConversationId: conversationId,
        createdBy: userId,
      });
      return { memory_id: id, status: id ? "saved" : "failed" };
    }
    case "list_recent_activity": {
      let q = supabase
        .from("crm_activity_log")
        .select("action, entity_type, entity_id, summary, changes, created_at")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(Number(input.limit ?? 25));
      if (input.entity_type) q = q.eq("entity_type", input.entity_type as string);
      if (input.entity_id) q = q.eq("entity_id", input.entity_id as string);
      const { data } = await q;
      return { activity: data ?? [] };
    }
    case "get_shipment_by_tracking": {
      const k = String(input.tracking_or_shipment_number);
      const { data } = await supabase
        .from("shipments")
        .select("id, status, type, tracking_number, shipment_number, carrier, service_level, shipped_at, delivered_at, customer_id, notes")
        .eq("workspace_id", workspaceId)
        .or(`tracking_number.eq.${k},shipment_number.eq.${k}`)
        .limit(1)
        .maybeSingle();
      if (!data) return { error: "not found" };
      await logActivity(supabase, {
        workspaceId,
        actorId: userId,
        action: "ai_lookup",
        entityType: "shipment",
        entityId: data.id,
        summary: `AI looked up shipment ${k}`,
      });
      return { shipment: data };
    }
    default:
      return { error: `unknown tool: ${name}` };
  }
}
