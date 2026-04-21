import type { SupabaseClient } from "@supabase/supabase-js";

export type MemoryType =
  | "insight"
  | "preference"
  | "incident"
  | "lesson"
  | "playbook_step"
  | "decision"
  | "fact"
  | "protocol";

type WriteMemoryArgs = {
  workspaceId: string;
  domain: string;
  memoryType: MemoryType;
  title: string;
  content: string;
  importance?: number;
  entityType?: string;
  entityId?: string;
  tags?: string[];
  sourceConversationId?: string;
  validUntil?: string;
  createdBy?: string;
};

export async function writeMemory(
  supabase: SupabaseClient,
  args: WriteMemoryArgs,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("crm_brain_memories")
    .insert({
      workspace_id: args.workspaceId,
      domain: args.domain,
      memory_type: args.memoryType,
      title: args.title,
      content: args.content,
      importance: args.importance ?? 3,
      entity_type: args.entityType ?? null,
      entity_id: args.entityId ?? null,
      tags: args.tags ?? [],
      source_conversation_id: args.sourceConversationId ?? null,
      valid_until: args.validUntil ?? null,
      created_by: args.createdBy ?? null,
    })
    .select("id")
    .single();
  if (error) {
    console.warn("[memories] write failed:", error.message);
    return null;
  }
  return data?.id ?? null;
}

export async function searchMemories(
  supabase: SupabaseClient,
  workspaceId: string,
  query: string,
  limit = 8,
) {
  // FTS via existing index idx_crm_memories_content_fts
  const { data } = await supabase
    .from("crm_brain_memories")
    .select("id, domain, memory_type, title, content, importance, tags, entity_type, entity_id, created_at")
    .eq("workspace_id", workspaceId)
    .is("superseded_by", null)
    .textSearch("title", query, { type: "websearch", config: "english" })
    .order("importance", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function memoriesForEntity(
  supabase: SupabaseClient,
  entityType: string,
  entityId: string,
  limit = 5,
) {
  const { data } = await supabase
    .from("crm_brain_memories")
    .select("id, domain, memory_type, title, content, importance, tags, created_at")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .is("superseded_by", null)
    .order("importance", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
