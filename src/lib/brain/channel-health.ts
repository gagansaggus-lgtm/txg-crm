import type { SupabaseClient } from "@supabase/supabase-js";

// Writes/updates a heartbeat for a channel. Mandatory on every sync/cron/API path
// — the Apr 17 TMS observability collapse was caused by silent channel death.
export async function heartbeat(
  supabase: SupabaseClient,
  channelName: string,
  opts: {
    workspaceId?: string;
    channelType?: "cron" | "webhook" | "mcp" | "api" | "sync" | "chat";
    intervalSeconds?: number;
    error?: string;
    metadata?: Record<string, unknown>;
  } = {},
): Promise<void> {
  const now = new Date().toISOString();
  const isError = !!opts.error;
  const { error } = await supabase.from("channel_health").upsert(
    {
      workspace_id: opts.workspaceId ?? null,
      channel_name: channelName,
      channel_type: opts.channelType ?? "api",
      last_heartbeat_at: now,
      heartbeat_interval_seconds: opts.intervalSeconds ?? 300,
      last_error: opts.error ?? null,
      last_error_at: isError ? now : null,
      status: isError ? "degraded" : "healthy",
      metadata: opts.metadata ?? null,
      updated_at: now,
    },
    { onConflict: "workspace_id,channel_name" },
  );
  if (error) console.warn("[channel-health] failed:", error.message);
}

export async function listDeadChannels(
  supabase: SupabaseClient,
  workspaceId: string | null,
) {
  const nowMs = Date.now();
  const q = supabase
    .from("channel_health")
    .select("channel_name, channel_type, status, last_heartbeat_at, heartbeat_interval_seconds, last_error");
  const query = workspaceId
    ? q.or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
    : q.is("workspace_id", null);
  const { data } = await query;
  if (!data) return [];
  return data.filter((row) => {
    if (row.status === "dead") return true;
    if (!row.last_heartbeat_at) return false;
    const age = nowMs - new Date(row.last_heartbeat_at).getTime();
    const deadline = (row.heartbeat_interval_seconds ?? 300) * 1000 * 2;
    return age > deadline;
  });
}
