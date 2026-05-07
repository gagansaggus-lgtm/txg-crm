import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";
import { pickModel } from "@/lib/ai/model-router";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatRequestBody = {
  conversationId?: string;
  message: string;
  pageContext?: { route?: string; entity?: { type: string; id: string } };
};

/**
 * POST /api/ai/chat
 *
 * Enqueues a `chat_message` AI job. The Claude Code agent runtime processes
 * the job (using the user's Max plan, no external API key) and writes the
 * assistant reply to ai_messages. The client polls /api/ai/chat/poll for results.
 */
export async function POST(req: Request) {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as ChatRequestBody;
  if (!body.message?.trim()) {
    return NextResponse.json({ error: "empty message" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  // Resolve or create the conversation
  let conversationId = body.conversationId;
  if (!conversationId) {
    const { data: conv, error } = await supabase
      .from("ai_conversations")
      .insert({
        workspace_id: ctx.workspaceId,
        user_id: ctx.user.id,
        title: body.message.slice(0, 80),
      })
      .select("id")
      .single();
    if (error || !conv) {
      return NextResponse.json(
        { error: error?.message ?? "conv create failed" },
        { status: 500 },
      );
    }
    conversationId = conv.id;
  }

  // Persist the user message
  const { data: userMsg, error: userMsgErr } = await supabase
    .from("ai_messages")
    .insert({
      conversation_id: conversationId,
      role: "user",
      content: body.message,
    })
    .select("id")
    .single();

  if (userMsgErr || !userMsg) {
    return NextResponse.json(
      { error: userMsgErr?.message ?? "message persist failed" },
      { status: 500 },
    );
  }

  // Pick model intent route (used for logging / future model-specific handling)
  const route = pickModel(body.message);

  // Enqueue chat_message job — Claude Code agent runtime will process it
  const { data: jobId, error: enqueueErr } = await supabase.rpc("enqueue_ai_job", {
    p_workspace_id: ctx.workspaceId,
    p_kind: "chat_message",
    p_params: {
      conversation_id: conversationId,
      user_message_id: userMsg.id,
      workspace_id: ctx.workspaceId,
      route: route.model,
      page_context: body.pageContext ?? null,
    },
    p_priority: 50,
    p_scheduled_for: null,
    p_requested_by: ctx.user.id,
  });

  if (enqueueErr) {
    return NextResponse.json({ error: enqueueErr.message }, { status: 500 });
  }

  return NextResponse.json({
    conversationId,
    jobId,
    pollUrl: `/api/ai/chat/poll?jobId=${jobId}&conversationId=${conversationId}`,
  });
}
