import { NextResponse } from "next/server";
import OpenAI from "openai";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";
import { getCrmSessionContext } from "@/lib/brain/session-context";
import { STATIC_PRIMER, buildDynamicContext } from "@/lib/ai/system-prompt";
import { runTool } from "@/lib/ai/tools";
import { CRM_TOOLS_OPENAI } from "@/lib/ai/openai-tools";
import { pickModel } from "@/lib/ai/model-router";
import { heartbeat } from "@/lib/brain/channel-health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TOKENS = 4096;
const MAX_TOOL_ITERATIONS = 6;

type ChatRequestBody = {
  conversationId?: string;
  message: string;
  pageContext?: { route?: string; entity?: { type: string; id: string } };
};

export async function POST(req: Request) {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as ChatRequestBody;
  if (!body.message?.trim()) return NextResponse.json({ error: "empty message" }, { status: 400 });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI not configured. Set OPENROUTER_API_KEY in Vercel env vars." },
      { status: 503 },
    );
  }

  const supabase = await createSupabaseServerClient();
  await heartbeat(supabase, "ai-chat", { workspaceId: ctx.workspaceId, channelType: "chat", intervalSeconds: 600 });

  // Load or create conversation
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
    if (error || !conv) return NextResponse.json({ error: error?.message ?? "conv create failed" }, { status: 500 });
    conversationId = conv.id;
  }

  // Load last 12 messages for context (trimmed from 40 per the cost audit)
  const { data: history } = await supabase
    .from("ai_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(12);

  type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

  const priorMessages: ChatMessage[] = (history ?? [])
    .filter((m) => m.content && (m.role === "user" || m.role === "assistant"))
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content as string }));

  // Persist user message before streaming
  await supabase.from("ai_messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: body.message,
  });

  // Pick model by intent, assemble session context
  const route = pickModel(body.message);
  const sessionContext = await getCrmSessionContext(supabase, ctx.workspaceId, {
    id: ctx.user.id,
    email: ctx.user.email,
    fullName: ctx.user.fullName,
    role: ctx.role,
  });
  const dynamicContext = buildDynamicContext(sessionContext, body.pageContext);

  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://txg-crm.vercel.app",
      "X-Title": "TXG CRM",
    },
  });

  // Two-block system: stable primer (cached) + dynamic context (fresh).
  // OpenRouter exposes Anthropic's cache_control via message-level annotations.
  type SystemContent = { type: "text"; text: string; cache_control?: { type: "ephemeral" } };
  const systemContent: SystemContent[] = [
    ...(route.cacheable
      ? [{ type: "text" as const, text: STATIC_PRIMER, cache_control: { type: "ephemeral" as const } }]
      : [{ type: "text" as const, text: STATIC_PRIMER }]),
    { type: "text" as const, text: dynamicContext },
  ];

  const messages: ChatMessage[] = [
    { role: "system", content: systemContent as unknown as string },
    ...priorMessages,
    { role: "user", content: body.message },
  ];

  const encoder = new TextEncoder();
  let totalTokensUsed = 0;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      send("conversation", { conversationId });
      send("model", { model: route.model, reasoning: route.reasoning });

      let finalText = "";
      try {
        for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
          const completion = await client.chat.completions.create({
            model: route.model,
            max_tokens: MAX_TOKENS,
            messages,
            tools: CRM_TOOLS_OPENAI,
            stream: true,
            stream_options: { include_usage: true },
          });

          // Accumulate text + tool_calls from the stream
          let assistantText = "";
          const toolCallsAccum: Record<
            number,
            { id?: string; name?: string; argsBuffer: string }
          > = {};
          let stopReason: string | null = null;

          for await (const chunk of completion) {
            const choice = chunk.choices?.[0];
            if (!choice) continue;
            const delta = choice.delta;
            if (delta?.content) {
              assistantText += delta.content;
              send("delta", { text: delta.content });
            }
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0;
                const slot = (toolCallsAccum[idx] ??= { argsBuffer: "" });
                if (tc.id) slot.id = tc.id;
                if (tc.function?.name) slot.name = tc.function.name;
                if (tc.function?.arguments) slot.argsBuffer += tc.function.arguments;
              }
            }
            if (choice.finish_reason) stopReason = choice.finish_reason;
            if ("usage" in chunk && chunk.usage) {
              totalTokensUsed = (chunk.usage.total_tokens ?? 0);
            }
          }

          if (assistantText) finalText += assistantText;

          const pendingToolCalls = Object.values(toolCallsAccum).filter((t) => t.id && t.name);
          if (stopReason !== "tool_calls" && pendingToolCalls.length === 0) {
            // Done
            break;
          }

          // Replay assistant turn with tool_calls
          messages.push({
            role: "assistant",
            content: assistantText || null,
            tool_calls: pendingToolCalls.map((t) => ({
              id: t.id!,
              type: "function" as const,
              function: { name: t.name!, arguments: t.argsBuffer || "{}" },
            })),
          });

          for (const tc of pendingToolCalls) {
            let parsedArgs: Record<string, unknown> = {};
            try {
              parsedArgs = tc.argsBuffer ? JSON.parse(tc.argsBuffer) : {};
            } catch {
              parsedArgs = {};
            }
            send("tool_use", { id: tc.id, name: tc.name, input: parsedArgs });
            let result: unknown;
            try {
              result = await runTool(
                supabase,
                ctx.workspaceId,
                ctx.user.id,
                tc.name!,
                parsedArgs,
                conversationId!,
              );
            } catch (err) {
              result = { error: err instanceof Error ? err.message : "tool failed" };
            }
            send("tool_result", { id: tc.id, name: tc.name, result });
            messages.push({
              role: "tool",
              tool_call_id: tc.id!,
              content: JSON.stringify(result),
            });
          }
        }

        // Persist final assistant message with model metadata
        if (finalText) {
          await supabase.from("ai_messages").insert({
            conversation_id: conversationId,
            role: "assistant",
            content: finalText,
            metadata: {
              model: route.model,
              routing_reason: route.reasoning,
              total_tokens: totalTokensUsed,
            },
          });
          await supabase
            .from("ai_conversations")
            .update({ last_message_at: new Date().toISOString() })
            .eq("id", conversationId);
        }

        send("done", { conversationId, model: route.model, tokens: totalTokensUsed });
      } catch (err) {
        console.error("[ai-chat] error:", err);
        send("error", { message: err instanceof Error ? err.message : "chat failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
