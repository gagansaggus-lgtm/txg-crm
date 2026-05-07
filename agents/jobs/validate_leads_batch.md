# Job Kind: validate_leads_batch

## Description
Run validation pipeline stages 1–3 on a batch of leads (no AI required for these stages).

## Inputs (params)
- `batch_size`: integer — how many leads to validate (default 100, max 500)
- `target_stage`: string — `pre_filtered` | `web_verified` | `signal_checked` (which stage to advance to)

## Outputs (ai_job_results.output)
- `processed`: integer — count of leads processed
- `advanced`: integer — count moved to `target_stage`
- `rejected`: integer — count moved to `validation_stage='rejected'`
- `errors`: array — any per-lead errors
- `next_action`: string — what to do next (e.g. "enqueue web_verified batch")

## Side effects
- Updates `leads.validation_stage`
- Updates `leads.rejection_reason` when rejecting
- Updates `leads.last_enriched_at`

## Algorithm

### For `target_stage='pre_filtered'`:
1. Select up to `batch_size` leads where `validation_stage='raw'` for this workspace.
2. For each lead:
   - If `website` is null/empty/malformed → set `validation_stage='rejected'`, `rejection_reason='no_website'`.
   - If `display_name` is null/empty → set `rejection_reason='no_name'`, `validation_stage='rejected'`.
   - Else → set `validation_stage='pre_filtered'`.

### For `target_stage='web_verified'`:
1. Select up to `batch_size` leads where `validation_stage='pre_filtered'`.
2. For each lead, attempt HTTP HEAD on the website (5s timeout).
   - 2xx or 3xx → `validation_stage='web_verified'`.
   - 4xx, 5xx, timeout, DNS fail → `validation_stage='rejected'`, `rejection_reason='website_dead'`.
3. Update `last_enriched_at`.

### For `target_stage='signal_checked'`:
1. Select up to `batch_size` leads where `validation_stage='web_verified'`.
2. For each lead, fetch the homepage HTML and check for:
   - presence of product page links (e.g. `/products`, `/shop`, `/collections`)
   - social handle in footer (Instagram, Facebook)
   - last-updated meta or visible recent activity
3. If at least 2 of 3 signals → set `validation_stage='signal_checked'`.
   Else → `validation_stage='rejected'`, `rejection_reason='inactive_signals'`.

## Failure conditions
- `target_stage` not in the allowed set → `fail_ai_job("invalid target_stage: <value>")`.
- `batch_size` > 500 → cap silently to 500 and continue.
- Per-lead errors are collected in `output.errors` but do NOT fail the entire job.
