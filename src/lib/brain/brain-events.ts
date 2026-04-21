import type { SupabaseClient } from "@supabase/supabase-js";

export type BrainEventSeverity = "info" | "warning" | "critical";

type WriteBrainEventArgs = {
  workspaceId: string;
  sourceAgent: string;
  eventType: string;
  domain: string;
  severity?: BrainEventSeverity;
  title: string;
  description?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  confidence?: number;
};

export async function writeBrainEvent(
  supabase: SupabaseClient,
  args: WriteBrainEventArgs,
): Promise<void> {
  const { error } = await supabase.from("crm_brain_events").insert({
    workspace_id: args.workspaceId,
    source_agent: args.sourceAgent,
    event_type: args.eventType,
    domain: args.domain,
    severity: args.severity ?? "info",
    title: args.title,
    description: args.description ?? null,
    entity_type: args.entityType ?? null,
    entity_id: args.entityId ?? null,
    metadata: args.metadata ?? null,
    confidence: args.confidence ?? 0.8,
  });
  if (error) console.warn("[brain-events] failed:", error.message);
}

export async function listActiveEvents(
  supabase: SupabaseClient,
  workspaceId: string,
  limit = 20,
) {
  const { data } = await supabase
    .from("crm_brain_events")
    .select("id, event_type, domain, severity, title, description, entity_type, entity_id, created_at, metadata")
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .order("severity", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
