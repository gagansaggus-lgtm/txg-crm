# Job Kind: chat_message

## Description
Process a single user message in an `ai_conversations` row, generate the assistant reply,
and write it back to `ai_messages`.

## Inputs (params)
- `conversation_id`: uuid — the conversation this message belongs to
- `user_message_id`: uuid — the user message that was just inserted
- `workspace_id`: uuid — workspace for tool scoping
- `route`: string — model intent route (passed through for logging)
- `page_context`: object | null — optional `{ route, entity }` for grounding the reply

## Outputs (ai_job_results.output)
- `assistant_message_id`: uuid — the new ai_messages row created
- `tokens_in`: integer
- `tokens_out`: integer
- `model`: string

## Side effects
- Inserts a new row into `ai_messages` with `role='assistant'` and the generated content
- Updates `ai_conversations.last_message_at`

## Algorithm
1. Load the conversation row and confirm it belongs to `params.workspace_id`.
2. Load the last 12 messages from `ai_messages` for this conversation (oldest first).
3. Build the system prompt using `STATIC_PRIMER` + `buildDynamicContext` from
   `src/lib/ai/system-prompt.ts`.
4. Run the CRM tool execution loop using `src/lib/ai/tools.ts` (these run in-process
   with direct Supabase access via the service role key — no external API).
5. Stream the assistant text into a single new `ai_messages` row.
6. When complete, return the new `assistant_message_id` and token counts.

## Failure conditions
- `conversation_id` does not exist → `fail_ai_job("conversation not found")`
- `workspace_id` mismatch with the conversation → `fail_ai_job("workspace mismatch")`
- Any unrecoverable tool error → `fail_ai_job` with the error message
