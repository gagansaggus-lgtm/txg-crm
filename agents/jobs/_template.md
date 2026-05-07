# Job Kind: <KIND_NAME>

## Description
<one-sentence description of what this job does>

## Inputs (params)
Read from `params` jsonb on the ai_jobs row:
- `<field>`: <type> — <purpose>

## Outputs (ai_job_results.output)
Write to `ai_job_results.output` jsonb:
- `<field>`: <type> — <meaning>

## Side effects
List the rows this job creates or updates.

## Algorithm
Step-by-step instructions for Claude Code to execute when claiming this job kind.

## Failure conditions
List the inputs or runtime states that should fail the job (call `fail_ai_job`).
