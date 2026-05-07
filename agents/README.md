# TXG Marketing Platform — Claude Code Agent Runtime

This directory holds the Claude Code agent that processes the `ai_jobs` queue.

## How it works

1. Windows Task Scheduler runs `agents/run-jobs.ps1` on a schedule (default: every 15 minutes).
2. The script invokes `claude -p` with a job dispatcher prompt.
3. Claude Code claims pending jobs from Supabase via the `claim_next_ai_job` RPC.
4. For each job kind, it loads the matching prompt template from `agents/jobs/<kind>.md`.
5. It executes the work and writes results back via `complete_ai_job` or `fail_ai_job`.

## Authentication

Runs under the user's Claude Max plan (OAuth via Claude Code CLI). The workstation
must remain logged in. **No Anthropic API key is used or required.**

## Job Kinds

See `docs/superpowers/specs/2026-05-07-txg-marketing-platform-design.md` Section 8.1
for the full catalog. Each kind has a corresponding markdown file in `agents/jobs/<kind>.md`
with the prompt and expected output schema.

Implemented in Foundation:
- `smoke_test` — verifies the runtime end-to-end
- `validate_leads_batch` — runs lead validation pipeline stages 1–3 on a batch

Future plans add: `chat_message`, `enrich_lead_deep`, `score_leads_icp_fit`,
`generate_outreach_sequence`, `generate_daily_sdr_queue`, `generate_seo_articles`,
`generate_founder_posts`, `generate_engagement_targets`, `atomize_long_form`,
`generate_newsletter`, `monitor_competitors`, `monitor_target_accounts`,
`social_listening`, `generate_proposal`, `generate_pr_pitches`, `weekly_kpi_report`,
`competitive_battle_card_refresh`.

## Environment

Required env vars (read from `.env.local` at repo root):
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Manual run

```powershell
pwsh agents/run-jobs.ps1
```

## Schedule installation (one-time, run as administrator)

```powershell
pwsh agents/scheduler/install.ps1 -RepoRoot "C:\Users\Jatin\Desktop\TXG Vector"
```
