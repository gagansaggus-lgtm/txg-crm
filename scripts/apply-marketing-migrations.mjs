// One-time migration applier for TXG Vector marketing platform.
// Uses Supabase Management API. Hardcoded to project ref hlycebvmylbuukbfclfv (txg-crm).
// Will refuse to run against any other project.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

// HARDCODED to txg-crm. Do not change without explicit user approval.
const PROJECT_REF = "hlycebvmylbuukbfclfv";
const PROJECT_NAME = "txg-crm";
const API_BASE = "https://api.supabase.com/v1";

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error("ERROR: SUPABASE_ACCESS_TOKEN env var required");
  process.exit(1);
}

const MIGRATION_FILES = [
  "0010_marketing_ai_jobs.sql",
  "0011_marketing_strategy.sql",
  "0012_marketing_content.sql",
  "0013_marketing_social.sql",
  "0014_marketing_leads_outreach.sql",
  "0015_marketing_partnerships_pr_events.sql",
  "0016_marketing_sales_enablement.sql",
  "0017_marketing_ops_analytics.sql",
  "0018_marketing_role_extension.sql",
  "0019_marketing_helpers.sql",
  "0020_marketing_strategy_seed.sql",
];

async function executeSql(query, label) {
  const url = `${API_BASE}/projects/${PROJECT_REF}/database/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`\n✗ FAILED: ${label}`);
    console.error(`  Status: ${res.status} ${res.statusText}`);
    console.error(`  Response: ${text.slice(0, 1500)}`);
    return { ok: false, error: text };
  }
  return { ok: true, response: text };
}

async function applyMigration(filename) {
  const sqlPath = path.join(REPO_ROOT, "supabase/migrations", filename);
  if (!fs.existsSync(sqlPath)) {
    console.error(`✗ ${filename} not found at ${sqlPath}`);
    return false;
  }
  const sql = fs.readFileSync(sqlPath, "utf-8");
  process.stdout.write(`Applying ${filename} (${(sql.length / 1024).toFixed(1)} KB)... `);
  const result = await executeSql(sql, filename);
  if (!result.ok) {
    return false;
  }
  console.log("OK");
  return true;
}

async function verifyAndCount() {
  console.log("\n=== Verification ===");
  const queries = [
    { label: "icp_profiles count", sql: "select count(*) as n from public.icp_profiles" },
    { label: "personas count", sql: "select count(*) as n from public.personas" },
    { label: "competitors count", sql: "select count(*) as n from public.competitors" },
    { label: "ai_jobs table exists", sql: "select count(*) as n from public.ai_jobs" },
    { label: "leads table exists", sql: "select count(*) as n from public.leads" },
    {
      label: "marketing_helpers functions",
      sql: "select string_agg(proname, ', ' order by proname) as fns from pg_proc where proname in ('enqueue_ai_job','claim_next_ai_job','complete_ai_job','fail_ai_job','assign_lead_round_robin')",
    },
  ];
  for (const q of queries) {
    const result = await executeSql(q.sql, q.label);
    if (result.ok) {
      console.log(`  ${q.label}: ${result.response}`);
    }
  }
}

async function main() {
  console.log(`Target project: ${PROJECT_NAME} (${PROJECT_REF})`);
  console.log(`API endpoint: ${API_BASE}`);
  console.log(`Migration files: ${MIGRATION_FILES.length}\n`);

  // Sanity ping — confirm the token works and project exists
  const ping = await executeSql(
    "select current_database() as db, version() as ver",
    "ping",
  );
  if (!ping.ok) {
    console.error("\nCannot reach project. Aborting.");
    process.exit(1);
  }
  console.log(`Connected: ${ping.response}\n`);

  // Apply each migration sequentially
  for (const file of MIGRATION_FILES) {
    const ok = await applyMigration(file);
    if (!ok) {
      console.error("\nStopping — fix the failing migration before retry.");
      process.exit(1);
    }
  }

  await verifyAndCount();
  console.log("\n✓ All migrations applied successfully.");
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
