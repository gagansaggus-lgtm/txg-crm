# TXG CRM

Transway Xpress Global Inc. — customer + light ops layer alongside the existing WMS.

## Service lines
- **Phase 1 (this build):** warehousing & fulfillment.
- **Phase 3:** last-mile delivery.
- **Phase 4:** international courier.

## Facilities
- Buffalo, NY (main)
- Etobicoke, ON (small)

## Stack
Next.js 15 App Router, TypeScript, Tailwind v4, Supabase (Postgres + Auth + RLS), Vercel.

## Local setup

```bash
cd txg-crm
cp .env.example .env.local   # fill in Supabase keys + WMS_IMPORT_SECRET
npm install
npm run dev
```

Run the SQL migrations in `supabase/migrations/` in order against your Supabase project (SQL editor or CLI).

After seeding, sign up via `/signup`, then run `supabase/migrations/0007_seed.sql` to wire your account into the TXG workspace.

## Layout

```
src/app/(auth)/          login, signup, reset-password
src/app/(app)/app/       protected app shell
  dashboard/             ops snapshot
  customers/             client CRM
  quotes/                quotes + rate cards
  contracts/             contracts
  warehouse/             inbound, orders, shipments, SKUs
  tasks/                 task list
  settings/              facilities, team, rate cards, WMS import
  pipeline/              (phase 2 stub)
  tickets/               (phase 2 stub)
src/app/api/wms/import/  CSV import endpoint
src/lib/wms/             pluggable WMS adapter (CSV today, API later)
supabase/migrations/     0001-0007
```
