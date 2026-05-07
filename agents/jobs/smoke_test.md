# Job Kind: smoke_test

## Description
Smoke test job that confirms the agent runtime is working end-to-end.

## Inputs (params)
- `message`: string — message to echo back

## Outputs (ai_job_results.output)
- `echo`: string — the same message
- `processed_at`: ISO timestamp string
- `worker`: "claude_code"

## Side effects
None.

## Algorithm
1. Read `params.message`.
2. Construct output JSON: `{ "echo": params.message, "processed_at": "<now>", "worker": "claude_code" }`.
3. Call `complete_ai_job` with the output.

## Failure conditions
- `params.message` missing or not a string → call `fail_ai_job("missing or invalid message")`.
