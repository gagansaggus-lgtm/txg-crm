import type { SupabaseClient } from "@supabase/supabase-js";

type LogActivityArgs = {
  workspaceId: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary?: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

// Writes an immutable episodic-log row (L2 of the CRM brain).
// Every CRUD operation in the app should flow through this helper so that:
//  - the timeline on each entity is complete
//  - the brain-ingest cron has one source to scan
//  - the AI assistant can ground responses in real history
export async function logActivity(
  supabase: SupabaseClient,
  args: LogActivityArgs,
): Promise<void> {
  const { error } = await supabase.from("crm_activity_log").insert({
    workspace_id: args.workspaceId,
    actor_id: args.actorId ?? null,
    action: args.action,
    entity_type: args.entityType,
    entity_id: args.entityId ?? null,
    summary: args.summary ?? null,
    changes: args.changes ?? null,
    metadata: args.metadata ?? null,
  });
  if (error) {
    console.warn("[activity-log] failed:", error.message);
  }
}
