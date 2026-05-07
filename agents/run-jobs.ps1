# agents/run-jobs.ps1
# Entry point for scheduled Claude Code job processing.
# Authenticates via the user's Claude Max plan; no API key needed.

param(
  [int]$MaxJobsPerRun = 5,
  [string]$LogPath = "$PSScriptRoot/logs"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $LogPath)) {
  New-Item -ItemType Directory -Path $LogPath -Force | Out-Null
}

$timestamp = (Get-Date).ToString("yyyyMMdd-HHmmss")
$logFile = Join-Path $LogPath "run-$timestamp.log"

$repoRoot = Split-Path -Parent $PSScriptRoot

Push-Location $repoRoot
try {
  $prompt = @"
You are running the TXG marketing job processor.

For each iteration up to $MaxJobsPerRun:
1. Call the Supabase RPC ``claim_next_ai_job`` to atomically claim the next pending job.
2. If no job is returned, exit.
3. Load the prompt for the job kind from ``agents/jobs/<kind>.md``.
4. Read params from the job row.
5. Execute the work as described in that prompt file.
6. On success: call ``complete_ai_job(job_id, output_jsonb, tokens_in, tokens_out, model, duration_ms)``.
7. On failure: call ``fail_ai_job(job_id, error_message)``.
8. Log a one-line status to stdout: ``[{timestamp}] {kind} {job_id} {status}``.

Use the env vars NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
Do not modify or skip jobs you don't recognize — call fail_ai_job with "unknown kind: <kind>".
Be conservative: do not commit DB writes outside the documented job algorithm.
"@

  Write-Host "[$(Get-Date -Format 'HH:mm:ss')] starting job runner, max=$MaxJobsPerRun" | Tee-Object -FilePath $logFile

  & claude -p $prompt 2>&1 | Tee-Object -FilePath $logFile -Append
  $exitCode = $LASTEXITCODE

  Write-Host "[$(Get-Date -Format 'HH:mm:ss')] runner exit=$exitCode" | Tee-Object -FilePath $logFile -Append
  exit $exitCode
}
finally {
  Pop-Location
}
