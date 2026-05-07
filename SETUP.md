# TXG Vector — Setup Guide

**One-time setup steps** to get the marketing platform running locally and against your live Supabase project. Allow 30–60 minutes total.

---

## 1. Apply Database Migrations (REQUIRED FIRST)

The platform schema lives in 11 new SQL migrations: `0010_marketing_ai_jobs.sql` through `0020_marketing_strategy_seed.sql`. None of the new pages will work until these are applied.

### Option A — Supabase Dashboard (recommended, no CLI setup)

1. Open your Supabase project → **SQL Editor** → **New query**
2. For each file in `supabase/migrations/` from `0010_*` through `0020_*` (in order):
   - Open the file in your editor
   - Copy the entire contents
   - Paste into the Supabase SQL Editor
   - Click **Run**
   - Confirm "Success. No rows returned" (or similar success message)
3. After 0020, run a sanity check:
   ```sql
   select count(*) as icp_count from public.icp_profiles;
   select count(*) as competitor_count from public.competitors;
   select count(*) as persona_count from public.personas;
   ```
   Expected: 6 ICPs, 6 competitors, 5 personas (per workspace).

The migrations are idempotent (`if not exists` everywhere) — safe to re-run.

### Option B — Supabase CLI (if you have it linked)

```powershell
npx supabase db push
```

This applies any unapplied migrations to your linked project.

---

## 2. Environment Variables

Create `.env.local` at the repo root if it doesn't already exist. You need:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
WMS_IMPORT_SECRET=any-random-string

# Optional — for Resend integration when email sending is wired up
RESEND_API_KEY=

# App URL (used for callbacks, emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Find Supabase keys at: Project Settings → API in the Supabase dashboard.

**The service role key bypasses RLS — never expose it to the browser. It's only read server-side.**

---

## 3. Install Dependencies

```powershell
npm install
```

This installs Next.js 16, React 19, Supabase client, papaparse for CSV parsing, framer-motion, etc.

---

## 4. Run the Dev Server

```powershell
npm run dev
```

Open http://localhost:3000 — you should land on the login page. Sign in with a user that's already a member of the TXG workspace.

---

## 5. (Optional) Set Up the Claude Code Agent

The agent processes the `ai_jobs` queue — needed when you wire up real lead enrichment, content generation, etc. Not required for day-1 usage.

### Prerequisites
- Claude Code CLI installed: `claude --version`
- Logged in via your Claude Max plan: run `claude` interactively once

### Manual run (testing)
```powershell
pwsh agents/run-jobs.ps1
```

The agent reads pending jobs from `ai_jobs`, executes them via prompts in `agents/jobs/<kind>.md`, writes results back.

### Scheduled run (production)
Run as Administrator:
```powershell
pwsh agents/scheduler/install.ps1 -RepoRoot "C:\Users\Jatin\Desktop\TXG Vector"
```

This registers a Windows Task Scheduler entry that runs the agent every 15 minutes.

---

## 6. (Optional) Create New Roles for the Team

If you want SDRs and AEs to have role-scoped access, update `workspace_members.role` in Supabase for each user:

```sql
update public.workspace_members
set role = 'sdr'  -- or 'ae', 'owner', 'public_face', 'marketing_admin'
where workspace_id = (select id from public.workspaces limit 1)
  and user_id = (select id from auth.users where email = 'sdr@transwayxpress.com');
```

The new role values were added in migration `0018_marketing_role_extension.sql`.

---

## 7. Verification Checklist

Open the app and click through:

- [ ] `/app/today` — Today dashboard loads with metrics (zeros if no data yet, that's OK)
- [ ] `/app/leads` — Leads list page loads (empty state OK)
- [ ] `/app/leads/import` — Import page shows the CSV upload form
- [ ] `/app/strategy/icps` — Shows the 6 seeded ICPs (Tier 1–5 + NA Mid-Market)
- [ ] `/app/strategy/competitors` — Shows the 6 seeded competitors
- [ ] `/app/outreach/sequences` — Empty state, "New sequence" button works
- [ ] `/app/outreach/queue` — Empty queue
- [ ] AI chat widget (bottom-right Sparkles icon) opens — it'll wait for the agent to process if you send a message

If any page returns a 500 error, check the browser console + dev server logs. Most likely cause: a migration didn't apply.

---

## 8. Production Deployment

For production, deploy to Vercel:

```powershell
vercel --prod
```

Set the same `.env.local` variables in Vercel → Project Settings → Environment Variables.

The Claude Code agent runs on a workstation, **not** on Vercel. It's a separate process that authenticates via your Max plan locally.

---

## Common Issues

**"relation 'leads' does not exist"** — Migrations didn't apply. Re-run them via SQL Editor.

**"workspace_members_role_check violation"** — Trying to assign a role that's not in the new enum. Run `0018_marketing_role_extension.sql` first.

**AI chat just spins forever** — The Claude Code agent isn't running. Either run `pwsh agents/run-jobs.ps1` manually or install the scheduler.

**CSV import says "Max 5,000 rows"** — Split your StoreLeads export into chunks of ≤5,000 rows and import each.

---

Next: read **USAGE.md** for the day-to-day workflows.
