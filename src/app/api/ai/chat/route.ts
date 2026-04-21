import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";
import { getCrmSessionContext } from "@/lib/brain/session-context";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { CRM_TOOLS, runTool } from "@/lib/ai/tools";
import { heartbeat } from "@/lib/brain/channel-health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-sonnet-4-6";
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI not configured. Set ANTHROPIC_API_KEY in Vercel env vars to enable." },
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
    if (error || !conv) {
      return NextResponse.json({ error: error?.message ?? "could not create conversation" }, { status: 500 });
    }
    conversationId = conv.id;
  }

  // Load message history (last 40) for context continuity
  const { data: history } = await supabase
    .from("ai_messages")
    .select("role, content, tool_calls, tool_name, tool_input, tool_result")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(40);

  // Build Anthropic messages array from history + new user message
  type AnthropicMessage = Anthropic.MessageParam;
  const priorMessages: AnthropicMessage[] = [];
  for (const row of history ?? []) {
    if (row.role === "user" && row.content) {
      priorMessages.push({ role: "user", content: row.content });
    } else if (row.role === "assistant") {
      // Stored assistant content was plain text — rehydrate as text block
      if (row.content) priorMessages.push({ role: "assistant", content: row.content });
    }
    // Tool rounds aren't replayed into the next request — they'd bloat context.
    // Full agentic replay happens within a single request iteration only.
  }

  // Persist user message BEFORE streaming so it's always durable
  await supabase.from("ai_messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: body.message,
  });

  const sessionContext = await getCrmSessionContext(supabase, ctx.workspaceId, {
    id: ctx.user.id,
    email: ctx.user.email,
    fullName: ctx.user.fullName,
    role: ctx.role,
  });
  const systemPrompt = buildSystemPrompt(sessionContext, body.pageContext);

  const client = new Anthropic({ apiKey });

  const messages: AnthropicMessage[] = [...priorMessages, { role: "user", content: body.message }];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      send("conversation", { conversationId });

      let finalText = "";
      try {
        for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
          const msgStream = client.messages.stream({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system: systemPrompt,
            cache_control: { type: "ephemeral" },
            tools: CRM_TOOLS as unknown as Anthropic.Tool[],
            messages,
            thinking: { type: "adaptive" },
          });

          for await (const event of msgStream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              send("delta", { text: event.delta.text });
            }
          }

          const final = await msgStream.finalMessage();

          const assistantText = final.content
            .filter((b): b is Anthropic.TextBlock => b.type === "text")
            .map((b) => b.text)
            .join("");
          if (assistantText) finalText += assistantText;

          if (final.stop_reason !== "tool_use") {
            // Done — append the assistant turn to messages for completeness and break.
            messages.push({ role: "assistant", content: final.content });
            break;
          }

          // Execute each tool_use block and feed results back
          messages.push({ role: "assistant", content: final.content });
          const toolUses = final.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const tu of toolUses) {
            send("tool_use", { id: tu.id, name: tu.name, input: tu.input });
            let result: unknown;
            try {
              result = await runTool(
                supabase,
                ctx.workspaceId,
                ctx.user.id,
                tu.name,
                (tu.input as Record<string, unknown>) ?? {},
                conversationId!,
              );
            } catch (err) {
              result = { error: err instanceof Error ? err.message : "tool execution failed" };
            }
            send("tool_result", { id: tu.id, name: tu.name, result });
            toolResults.push({
              type: "tool_result",
              tool_use_id: tu.id,
              content: JSON.stringify(result),
            });
          }
          messages.push({ role: "user", content: toolResults });
        }

        // Persist final assistant message
        if (finalText) {
          await supabase.from("ai_messages").insert({
            conversation_id: conversationId,
            role: "assistant",
            content: finalText,
            metadata: { model: MODEL },
          });
          await supabase
            .from("ai_conversations")
            .update({ last_message_at: new Date().toISOString() })
            .eq("id", conversationId);
        }

        send("done", { conversationId });
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
