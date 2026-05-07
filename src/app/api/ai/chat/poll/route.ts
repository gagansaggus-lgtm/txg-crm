import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/ai/chat/poll?jobId=<uuid>&conversationId=<uuid>
 *
 * Returns the current state of an AI chat job and the conversation's messages.
 * The client polls this until job.status is `completed` or `failed`.
 */
export async function GET(req: Request) {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const jobId = url.searchParams.get("jobId");
  const conversationId = url.searchParams.get("conversationId");

  if (!jobId || !conversationId) {
    return NextResponse.json(
      { error: "missing jobId or conversationId" },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data: job, error: jobErr } = await supabase
    .from("ai_jobs")
    .select("id, status, started_at, completed_at, retry_count")
    .eq("id", jobId)
    .single();

  if (jobErr || !job) {
    return NextResponse.json(
      { error: jobErr?.message ?? "job not found" },
      { status: 404 },
    );
  }

  const { data: messages } = await supabase
    .from("ai_messages")
    .select("id, role, content, created_at, metadata")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    job: {
      id: job.id,
      status: job.status,
      startedAt: job.started_at,
      completedAt: job.completed_at,
    },
    messages: messages ?? [],
  });
}
