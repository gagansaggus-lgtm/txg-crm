# agents/scheduler/install.ps1
# Installs the Windows Task Scheduler entry for the TXG agent runner.
# Run as Administrator.

param(
  [Parameter(Mandatory=$true)][string]$RepoRoot,
  [string]$TaskName = "TXG Marketing Agent"
)

$ErrorActionPreference = "Stop"

$runner = Join-Path $RepoRoot "agents/run-jobs.ps1"
if (-not (Test-Path $runner)) {
  throw "Runner not found at $runner"
}

$templatePath = Join-Path $PSScriptRoot "task-template.xml"
$xml = Get-Content $templatePath -Raw
$xml = $xml.Replace("%TXG_AGENTS_RUNNER%", $runner)
$xml = $xml.Replace("%TXG_REPO_ROOT%", $RepoRoot)

$tempXml = [System.IO.Path]::GetTempFileName() + ".xml"
$xml | Out-File -FilePath $tempXml -Encoding Unicode

try {
  $existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  if ($existing) {
    Write-Host "Task '$TaskName' already exists. Unregistering first."
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
  }

  Register-ScheduledTask -Xml (Get-Content $tempXml -Raw) -TaskName $TaskName | Out-Null
  Write-Host "Installed scheduled task: $TaskName"
  Write-Host "It will run every 15 minutes."
}
finally {
  if (Test-Path $tempXml) { Remove-Item $tempXml -Force }
}
