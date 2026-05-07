# TXG Vector — Marketing Platform Design Specification

**Date:** 2026-05-07
**Author:** Strategy + engineering session, in collaboration with Gagan, Draz, and the TXG team
**Status:** Design draft, pending review
**Companion document:** `2026-05-07-txg-marketing-website-design.md`

---

## 1. Executive Summary

TXG Vector becomes the operating system for Transway Xpress Global's marketing and sales engine. It is a single platform where Gagan, Draz, Daniel, Angad, and Jatin run every marketing motion — strategy, content, outbound, social, partnerships, PR, sales enablement, analytics — with Claude Code as the AI engine and Supabase as the persistent store.

The platform is budget-aware (no paid AI vendors, lean MarTech stack), built in 9 layers across 32 modules, with every layer activated in Week 1 and deepened over 90 days. The first revenue motion is outbound research-style outreach to a validated subset of ~5,000 Indian D2C brands drawn from a 100,000-lead StoreLeads export. Inbound, content, partnerships, and PR run in parallel from Day 1.

The strategy is not paid acquisition. It is **out-publish, out-research, out-personalize** — using Claude Code to produce content and personalization volume that competitors cannot match without large marketing teams.

### Success criteria at 90 days
- 10,000+ Indian D2C leads contacted across personalized multi-channel sequences
- 15–30 closed Indian D2C clients
- 30+ SEO articles published, ranking for first keyword cluster
- 1,500+ combined LinkedIn following (Draz + Gagan)
- 6+ documented case studies
- 4+ published media mentions
- 4+ partnership agreements signed
- 300+ founder community members (WhatsApp + Telegram)
- Functional marketing website live with calculators and lead magnets
- Self-sustaining inbound: 30+ qualified leads/month from organic channels

---

## 2. Strategic Context

### 2.1 The Company

Transway Group has operated **Transway Transport** as a trucking business in Canada and the United States since **2014**. In **2023** the group launched **TXG (Transway Xpress Global)** as a full 4PL solutions arm. TXG owns warehousing in Buffalo, NY (US main) and Etobicoke, ON (Canadian operations). Combined coverage is 80–90% of Canadian pincodes and 70% of US pincodes.

Services: warehousing, fulfillment, last-mile, and international courier — sold under three commercial models for cross-border clients:

1. **Direct Shipping** — orders ship directly from India through TXG's cross-border solution. No NA storage, no upfront inventory.
2. **Hybrid** — high-velocity SKUs stored in TXG's NA warehouses, low-velocity SKUs ship direct from India.
3. **Full Fulfillment** — bulk inventory shipped to NA, fulfilled domestically with 2–5 day delivery.

### 2.2 The Pricing Advantage

TXG's commercial advantage on the cross-border lane is delivered through bulk consolidation in India and break-bulk in North America. Net effect: **~50% lower cost per order** than the prevailing alternatives, and delivery times reduced from the typical 15–20 days to **7–12 days**. (This methodology is internal; the customer-facing positioning is "lower cost, faster delivery" without disclosing operational mechanics.)

### 2.3 The Strategic Insight

TXG is **the only asset-based 4PL serving the India → North America corridor** with first-party infrastructure on both ends. Competitors in this lane (ShipGlobal, QuickShip, Shypmax, Shiprocket X) are software-led freight aggregators without first-party warehousing in NA. Enterprise incumbents (DHL, FedEx, Flexport) treat this corridor as a transactional shipping product, not an integrated 4PL service. TXG sits in a category of one.

This insight drives every marketing decision in this document. TXG is positioned as **an incumbent extending into a new market**, not a startup. The 12-year operational history of Transway Transport is a marketing asset that is currently invisible and must be foregrounded.

### 2.4 Market Selection

Primary market: **Indian D2C brands expanding to North America.** Reasoning:
- Less competitive than the saturated North American 3PL/4PL market
- High pain density (₹1,500–3,000/order shipping cost, 15–20 day delivery, no returns infra)
- Educational gap — Indian D2C founders do not yet understand the 4PL category, which means TXG can lead category creation
- TXG's pricing advantage is most valuable on this lane

Secondary market: **Mid-market North American e-commerce brands** — addressed via the same platform with separate ICP profiles, in parallel.

Future markets (out of scope for this spec): Europe, Southeast Asia, Middle East — sequenced after India proof.

### 2.5 The Team

| Person | Role | Primary platform need |
|--------|------|----------------------|
| Gagan | Owner | Strategic dashboard, top-down visibility, growing LinkedIn presence |
| Draz | Partner — public face, LinkedIn + PR | Founder Brand OS (primary), PR pipeline, community |
| Daniel | Account Executive — closes deals | Pipeline mgmt, proposal generation, contract handoff |
| Angad | Ops + SDR (India focus) | SDR queue, outreach personalization, pipeline |
| Jatin | SDR (India focus) | Same as Angad |

### 2.6 Budget Reality

Effectively zero paid media budget today. The platform must rely entirely on owned and earned channels: SEO content, founder personal brands, organic social, partnerships, PR, community, and personalized outbound. Paid advertising infrastructure is built into the platform but activates only when budget exists.

### 2.7 AI Constraint

The platform uses Claude via the user's **Claude Max plan**, accessed through the Claude Code CLI in scheduled batch mode. **No external AI API keys.** No Anthropic API, no OpenAI, no OpenRouter. The existing OpenRouter integration in the AI chat module is removed and replaced with a Claude Code-driven batch architecture for all AI work. Real-time in-app AI features that previously required an API are reframed as batch precomputed results displayed in the UI.

---

## 3. Audience & ICP Definitions

### 3.1 Primary ICP — Indian D2C Brands

Five tiers, with explicit firmographic boundaries used by Claude Code for lead scoring.

#### Tier 1 — Premium D2C
- **Revenue:** $1M+ annual GMV
- **Funding:** Series A or later (Sequoia Surge, Elevation, Fireside, DSG portfolio companies)
- **Verticals:** Fashion, beauty, wellness, home, electronics, food
- **Signals:** Active US/Canada Shopify orders, hiring international ops, US/Canada retargeting ads running
- **Deal size:** $200K–$2M ARR
- **Sales motion:** ABM (account-based), CEO-to-CEO, 6–12 month cycle
- **Approach:** Personalized, multi-stakeholder, executive sponsorship

#### Tier 2 — Growth-Stage D2C
- **Revenue:** $200K–$1M GMV
- **Funding:** Bootstrap or seed
- **Verticals:** Same as Tier 1
- **Signals:** Testing US/Canada market, occasional international orders, founder-led ops
- **Deal size:** $30K–$200K ARR
- **Sales motion:** Outbound SDR + AE, 1–3 month cycle
- **Approach:** Founder-to-founder, ROI-driven

#### Tier 3 — Indian Conglomerates
- **Revenue:** Export divisions, $5M+ in cross-border revenue
- **Verticals:** Multi-vertical, often heritage/established brands
- **Deal size:** $2M+ ARR
- **Sales motion:** Partner-led, C-suite, 9–18 month cycle

#### Tier 4 — Indian Diaspora Brands (NA-founded)
- **Revenue:** $50K–$500K GMV
- **Notable:** Founded in Canada/US by Indian founders, supply chain in India
- **Deal size:** $50K–$500K ARR
- **Sales motion:** Community-led, referral, founder-to-founder

#### Tier 5 — Bootstrap/Side-Hustle Exporters
- **Revenue:** Below $200K GMV, mostly Etsy/Amazon sellers expanding internationally
- **Deal size:** $5K–$30K ARR
- **Sales motion:** Self-serve, low-touch, content-led inbound only

### 3.2 Secondary ICP — North American Mid-Market

Mid-market e-commerce brands ($5M–$100M GMV) needing 4PL with cross-border complexity. Targeted through inbound, content, and SEO. Lower priority than India in Phase 0 but the platform supports it from Day 1.

### 3.3 Buyer Persona Map (Tier 1 Indian D2C — example)

A Tier 1 Indian D2C account has 4–5 stakeholders in the buying committee. Each gets distinct messaging:

| Persona | Title | Pain | Hook | Content type |
|---------|-------|------|------|--------------|
| **Founder** | CEO | Growth ceiling, international expansion strategy | "Unlock the US market without operational overhead" | Strategy POV, founder-to-founder posts |
| **COO** | COO / VP Ops | Operational reliability, SLAs | "Day-of integration, not multi-quarter migration" | Process documentation, SLA proof |
| **CFO** | CFO / Finance Head | TCO, unit economics, FX | "50% cost reduction, predictable per-order pricing" | ROI calculators, financial modeling |
| **Supply Chain Head** | Supply Chain Director | API integration, WMS compatibility, technical capability | "Vector platform — full visibility, REST API, Shopify-native" | Technical docs, integration guides |
| **E-commerce Mgr** | E-commerce / Growth Manager | Order turnaround, customer experience, returns | "7–12 day delivery, returns handled, branded tracking" | Customer experience case studies |

Same persona structure applies to Tier 2 (collapsed — founder often plays multiple roles) and Tier 3 (expanded — adds Procurement Lead, Compliance Officer).

### 3.4 Persona Routing in the Platform

Each lead in the database is tagged with persona-relevant content recommendations. When Claude Code generates outreach, it selects messaging variants based on persona. When the marketing site serves a visitor, it routes to persona-appropriate content (cookie-based, opt-in via quiz).

---

## 4. Messaging Framework

### 4.1 Positioning Statement

> For ambitious Indian D2C brands building international demand, TXG is the asset-based 4PL that lets you launch in North America without operational overhead — combining 12 years of Canadian and US logistics infrastructure with cross-border bulk consolidation that reduces your cost-per-order by half and delivery time by two-thirds. Unlike freight aggregators, we own the warehouses. Unlike enterprise carriers, we are flexible enough to start lean.

### 4.2 Core Narrative

Three sentences that get repeated everywhere.

1. **The Promise:** Expand to North America without setting up operations there.
2. **The Proof:** Asset-based 4PL with 12 years of NA logistics history and 80%+ pincode coverage.
3. **The Path:** Start lean (direct ship), scale into hybrid, graduate to full local fulfillment.

### 4.3 Pillar Messages (used in content)

- **Pillar 1 — Education:** "What is a 4PL and why it matters for cross-border" — TXG creates the category
- **Pillar 2 — Authority:** "12 years of NA logistics, 80% pincode coverage" — incumbent positioning
- **Pillar 3 — Pain + Solution:** "Your shipping cost is killing your international margin" — direct value framing
- **Pillar 4 — Proof:** Case studies, before/after metrics, client outcomes (when available)
- **Pillar 5 — Behind the Scenes:** Warehouse ops, customs clearance, real shipments — trust through transparency

Content distribution: 30% Education, 25% Authority, 20% Pain+Solution, 15% Proof, 10% Behind the Scenes.

### 4.4 Sales Message (close script)

> If we can reduce your cost per order by half and your delivery time from three weeks to one — would you be open to running a pilot shipment this month?

### 4.5 Anti-Patterns (what not to say)

- "We are a startup" — TXG is an incumbent, do not adopt startup language
- "Best in class," "industry leader," "world-class" — generic claims that prove nothing
- Disclosure of bulk-consolidation pricing methodology — internal only
- Feature-led messaging without ROI framing
- Promises of speed/cost without quantifying

---

## 5. Architecture

### 5.1 The Three-Layer Model

```
┌─────────────────────────────────────────────────────────────┐
│                    TXG VECTOR (Next.js)                     │
│   The Internal Operating System — the team works here       │
│   ──────────────────────────────────────────────────────    │
│   Strategy · Content · Outreach · Social · Partnerships     │
│   PR · Events · Sales Enablement · Analytics · Settings     │
└─────────────────────────┬───────────────────────────────────┘
                          │
            (reads, writes, schedules jobs)
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                       SUPABASE                              │
│         Persistent state — single source of truth           │
│   ──────────────────────────────────────────────────────    │
│   leads · accounts · sequences · messages · content_posts   │
│   social_posts · campaigns · partners · pr_contacts         │
│   events · case_studies · sales_assets · kpi_snapshots      │
│   ai_jobs (queue) · ai_job_results · settings · activities  │
└─────────────┬───────────────────────────┬───────────────────┘
              │                           │
              ▼                           ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│  CLAUDE CODE AGENT       │  │  DELIVERY APIs (delivery     │
│  RUNTIME                 │  │  pipes, not AI)              │
│  ────────────────────    │  │  ────────────────────────    │
│  Scheduled jobs via      │  │  Resend (transactional + 　  │
│  Windows Task Scheduler  │  │    bulk email)               │
│  Authenticates via       │  │  Ayrshare (LinkedIn, IG,     │
│    Claude Max            │  │    YouTube, Twitter)         │
│  Reads ai_jobs queue     │  │  WhatsApp Business Cloud API │
│  Writes results to       │  │  Calendly (booking)          │
│    ai_job_results        │  │  Stripe (proposals/payment)  │
│  No external AI API key  │  │                              │
└──────────────────────────┘  └──────────────────────────────┘
```

### 5.2 The Job Queue Pattern

All AI work flows through this pattern:

1. **Trigger:** TXG Vector UI (user clicks "regenerate posts") or scheduled cron (every Monday at 6 AM IST)
2. **Enqueue:** Insert row into `ai_jobs` table with `status='pending'`, `kind='generate_linkedin_posts'`, `params={...}`
3. **Claude Code picks up:** Cron job runs `claude -p "Process pending ai_jobs"` — scans pending jobs, executes, writes results
4. **Result stored:** `ai_job_results` table populated with output, `ai_jobs.status='completed'`
5. **TXG Vector reads:** UI polls or subscribes to results; user reviews and approves

This pattern handles every AI use case in the platform: content generation, lead enrichment, outreach personalization, scoring, summarization, reporting.

### 5.3 Claude Code Authentication

Claude Code authenticates via the user's Max plan (OAuth, no API key). Scheduled jobs run via Windows Task Scheduler on a workstation Gagan or the team controls. The workstation must remain logged into Claude Code for jobs to execute. Production-grade reliability requires a dedicated machine; for Phase 0 a developer workstation is acceptable.

Future option (out of scope for this spec): migrate scheduled jobs to a dedicated Linux server running Claude Code in headless mode under a service account. Discussed but not implemented in Phase 0.

### 5.4 Multi-Tenancy

Workspace model in Supabase remains as currently implemented (single TXG workspace; multi-workspace ready for future productization). All marketing tables include `workspace_id` foreign key with RLS policies.

### 5.5 Existing TXG Vector Modules (preserved)

The current modules (Customers, Quotes, Contracts, Tickets, Pipeline, Tasks, Inbox, Campaigns, Resources, Warehouse, Settings) remain functional. Marketing platform extends these — for example, Pipeline becomes the unified pipeline for both ops/customer-success deals and new-business sales pipeline.

The current AI Chat widget is preserved but its backend is rewired from OpenRouter to Claude Code job queue. Real-time chat UX is reframed: user messages enqueue a job, the response streams in as soon as Claude Code processes it (latency ~1–10 seconds during active hours, longer if Claude Code is not running).

---

## 6. The 9 Layers and 32 Modules

### Layer 1 — Strategy & Brand Foundation (3 modules)

**1.1 — Brand & Visual Identity System**
Centralized brand book inside Vector. Stores logo files, color palette, typography rules, voice and tone guidelines, photography style, template library (post templates, deck templates, document templates). Every module pulls visual assets from this central source, ensuring consistency across all output.

**1.2 — ICP & Persona Workspace**
Editable definitions of the 5 Indian D2C tiers + secondary NA mid-market ICP, plus persona maps with pains, hooks, and content recommendations per persona. Used by lead scoring (Layer 5) and content routing (Layer 3). Not just a static doc — these are structured records that other modules read.

**1.3 — Competitive Intelligence Tracker**
Database of competitors with profiles (positioning, pricing, messaging, recent activity, hiring signals, social presence). Claude Code job runs weekly to scrape competitor websites, LinkedIn pages, and news for changes. Updates flagged as activity_log events. Battle cards (Layer 9) auto-generated from this data.

### Layer 2 — Digital Presence (4 modules)

**2.1 — Marketing Site Bridge**
Connection layer between TXG Vector and the rebuilt marketing website (separate spec). Vector pushes content (blog posts, case studies, lead magnets) to the site. Site pushes back lead data (form submissions, calculator usage, content downloads, newsletter signups). Bidirectional via shared Supabase or webhooks.

**2.2 — Free Tools System**
Hosts the Shipping Cost Calculator, ROI Calculator, and Cross-Border Readiness Quiz as embedded React components. Each tool captures the user's inputs, generates a personalized result, captures their email for the result PDF, and creates a lead in the pipeline tagged with their inputs (which become powerful personalization data for outreach).

**2.3 — Lead Magnet Manager**
Library of gated PDF assets ("India → NA Cross-Border Playbook," "ROI of 4PL," "Customs Clearance Guide for Indian Exporters"). Each asset has its own download form, email capture, and triggered email nurture sequence. Asset performance (downloads, conversion to call) tracked.

**2.4 — Reviews & Reputation Manager**
Tracks Google Business Profile, Trustpilot, Clutch listings. Sends review request emails to clients at the right milestones (post-onboarding, post-first-shipment, after positive NPS). Aggregates reviews into a unified dashboard. Auto-publishes positive reviews to website and social.

### Layer 3 — Content Production Engine (5 modules)

**3.1 — Content Calendar**
The unified calendar across all content types and channels. Shows what is scheduled, drafted, approved, published, and performing. Filterable by author (Draz, Gagan, company), platform (LinkedIn, blog, newsletter, YouTube, Instagram), status, and content pillar. The single place anyone in the team checks "what's going out today."

**3.2 — SEO Article Engine**
Claude Code generates 2–3 SEO-targeted blog articles per week based on a managed keyword list. Each article: 1,200–2,000 words, includes internal links, schema markup, meta description, target keyword, secondary keywords. Drafts go to a review queue; Draz or Gagan approves before publication. Published articles auto-flow to the marketing site.

**3.3 — Founder Brand OS (Draz + Gagan)**
LinkedIn personal brand engine for both founders. Daily Claude Code job generates post drafts in each founder's voice, drawing from a strategic content brief, recent industry news, internal wins (closed deals, milestones), and pillar-message rotation. Drafts queued for the founder's morning review. Approved posts copied to clipboard with one click for manual posting (LinkedIn API does not allow third-party automated personal posting).

Engagement automation: the system also surfaces 10–20 relevant posts each morning for each founder to comment on (target accounts, industry leaders, peers). Suggested comments drafted by Claude Code; founder posts manually after review.

**3.4 — Newsletter System**
Two newsletters: prospect-facing (weekly, India D2C cross-border focus) and company-internal (weekly, ops + wins + comms). Claude Code drafts each issue from approved content blocks, recent posts, and recent wins. Owner approves and sends. Tracks: subscribers, open rate, click rate, conversion to lead/call.

**3.5 — Multi-Format Content Atomizer**
Every long-form piece (SEO article, case study, lead magnet) is automatically transformed by Claude Code into 10–15 derivative pieces:
- 3 LinkedIn carousels (Draz, Gagan, company)
- 5 LinkedIn text posts
- 3 Instagram Reels scripts
- 2 YouTube Shorts scripts
- 2 Twitter threads
- 1 newsletter section
- 1 podcast talking points outline

Atomized pieces enter the Content Calendar (3.1) automatically, scheduled across channels with intelligent timing. This is the core mechanism that lets one strategic content investment fuel a month of distribution.

### Layer 4 — Social Media & Distribution (3 modules)

**4.1 — Social Publishing Pipeline**
Integration with **Ayrshare** API for company-page social posting (LinkedIn Company Page, Instagram, YouTube, Twitter, Facebook). Personal-profile posting (Draz, Gagan LinkedIn) remains manual via the Founder Brand OS clipboard workflow. Schedules posts across timezones (India and NA), tracks performance, surfaces top-performing content for boosting (when paid budget activates).

**4.2 — Community Manager**
WhatsApp Business broadcast lists, Telegram channel, LinkedIn group management. Scheduled broadcasts, member counts, engagement tracking. Founder community ("D2C Goes Global") created here — value content delivered weekly, members nurtured into pipeline. Reddit and Quora engagement queue: Claude Code surfaces relevant questions; team members answer (manual posting).

**4.3 — Social Listening**
Daily Claude Code job scans LinkedIn, Twitter, Reddit, news for mentions of TXG, key competitors, and target accounts. Aggregates signals into a brand mentions feed. Identifies buying intent signals from target accounts (e.g., "we are looking for a 3PL partner" posted by a Tier 2 account). Auto-flags as outbound trigger.

### Layer 5 — Outbound Engine (5 modules)

**5.1 — Lead Validation & Enrichment Pipeline**
The first thing built. Imports the 100K StoreLeads CSV. Multi-stage filter:

- **Stage 1 (no AI, pure code):** Drop leads with missing/invalid websites, malformed emails, duplicates. Expected: 100K → 60K.
- **Stage 2 (lightweight enrichment):** HTTP liveness check on every website. Drop dead sites. Capture site response headers, last-modified, basic metadata. Expected: 60K → 35K.
- **Stage 3 (signal scrape):** Check social presence (Instagram handle exists and active), recent activity, product page existence. Expected: 35K → 20K.
- **Stage 4 (Claude Code ICP scoring):** For each remaining lead, Claude Code runs a research prompt: visits the site, classifies vertical, estimates GMV, looks for international shipping signals, identifies the founder, scores the lead A/B/C/D against ICP criteria. Expected: 20K → 8K viable leads with full profiles.
- **Stage 5 (contact verification):** Validate founder email (deliverability check), find LinkedIn profile, find WhatsApp number where possible. Expected: 8K → 5K leads with full contact info.

Output: a clean, scored, contactable lead database. Approximate timeline: Week 1 for stages 1–3 (automated), Week 2 for stages 4–5 (Claude Code batches running overnight).

**5.2 — Outbound Research Engine**
The personalized outreach machine. For each scored lead, Claude Code drafts a sequence of touches across channels — LinkedIn DM, cold email, WhatsApp message — each personalized with the brand's specific products, recent activity, founder background, and inferred pain. Messages framed as **research, not pitch**: "I'm researching how Indian D2C brands handle international shipping — would you share your experience?"

Sequence template (16 touches over 8 weeks):
- Day 1: LinkedIn connection request with personalized note
- Day 3: Cold email — research framing
- Day 7: LinkedIn DM follow-up (after connection accepted)
- Day 10: Voice note on LinkedIn (recorded by SDR)
- Day 14: WhatsApp message
- Day 21: Cold email — value share (insight from research)
- Day 28: LinkedIn engagement (comment on their post)
- Day 35: Email — case study or social proof
- Day 42: LinkedIn DM — direct ask
- Day 49: WhatsApp — final attempt
- Days 56–63: Drop to nurture sequence

Each touch is generated, queued in the SDR's daily list, reviewed, and sent. Reply tracking is automated; replies route back to the originating SDR.

**5.3 — Multi-SDR Pipeline Workspace**
Lead assignment rules: leads round-robin between Angad and Jatin with no duplicates. Pipeline stages: New → Researching → Contacted → Replied → Call Booked → Qualified → Proposal → Closed/Lost. Activity log per lead. Daniel sees handoffs — when an SDR books a qualified call, ownership transfers.

Role-based dashboards:
- **SDR view:** Today's queue (40 leads to act on), replies awaiting response, calls booked this week, conversion metrics
- **AE view (Daniel):** Qualified pipeline, proposals out, closes pending, deal velocity
- **Owner view (Gagan):** Total pipeline, by stage, by SDR, by source, deal velocity, forecast
- **Founder view (Draz):** Inbound leads from his content, engagement metrics, partnership pipeline

**5.4 — ABM Engine (Tier 1 Named Accounts)**
Top 100 Indian D2C accounts get distinct ABM treatment. Each named account has:
- Multi-stakeholder map (founder, COO, CFO, supply chain head, e-commerce manager — found and verified)
- Account intelligence feed — automated daily monitoring of their LinkedIn activity, news, hiring signals, social posts, funding events
- Personalized one-pager — generated by Claude Code, shows the brand's estimated current cost vs. TXG cost, vertical-specific case studies, integration plan
- Coordinated multi-channel touches across all 5 stakeholders simultaneously over 8–12 weeks
- Executive sponsorship from Gagan or Draz when account progresses to qualified

**5.5 — Sequence Builder & A/B Testing**
Tooling for non-technical users (Draz, Daniel) to build, modify, and test outreach sequences. Variant testing on subject lines, opening lines, framing (research vs. value vs. direct). Performance dashboards: reply rate, call booked rate, qualified rate per variant. Best-performing variants auto-promoted to default.

### Layer 7 — Partnerships, PR & Analyst Relations (3 modules)

(Layer 6 is removed per scope decision — no existing customer marketing.)

**7.1 — Partnership Manager**
Three partnership tiers:
- **Strategic:** Co-marketing, joint customers (Razorpay, Cashfree, Sequoia Surge, Antler)
- **Channel:** Referral partners (export consultants, CA firms, freight forwarders in India)
- **Tech:** Integration partners (Shopify, WooCommerce, Unicommerce, Shiprocket as upstream integrations)

Each partner has a record: contact, agreement type, referral pipeline, co-marketing assets, performance. Claude Code drafts outreach to potential partners, with full personalization based on their portfolio companies, services, and audience.

**7.2 — PR & Media Pipeline**
Database of journalists, podcast hosts, publications across India business press (YourStory, Inc42, ET, Business Standard, Entrackr) and NA logistics press (FreightWaves, Supply Chain Dive, Journal of Commerce). Each contact has interests, recent stories, contact preferences. Press release templates, pitch templates. Claude Code drafts personalized pitches per journalist. Speaking engagement tracker, award submissions tracker, podcast guest pipeline.

**7.3 — Industry Association & Influencer Tracker**
Memberships and event participation in IAMAI, FICCI, CII, India-Canada Chamber of Commerce, USIBC. Influencer/creator database (Indian business YouTubers, D2C podcasters, supply chain LinkedIn voices). Outreach pipeline for guest appearances, collaborations, speaking spots.

### Layer 8 — Events, Community, Influencers (3 modules)

**8.1 — Trade Show & Speaking Calendar**
Calendar of relevant industry events (D2C Summit India, IRCE, MODEX, ProMat, Logistics conferences). Each event has decision criteria (attendance value, ROI estimate), prep checklist, lead capture method (event app, scanner, manual), post-event nurture sequence. Booth materials and presentation assets stored.

**8.2 — Influencer Collaboration Tracker**
Pipeline for influencer outreach — D2C creators, business YouTubers, supply chain influencers. Tracks initial contact, negotiation, content delivered, performance, payment terms. Claude Code drafts personalized outreach. UGC program when clients begin producing content about their TXG experience.

**8.3 — Webinar Manager (Phase 1+ activation)**
Skipping in Phase 0. Module exists in the platform but not activated until audience reaches threshold (~1,000 LinkedIn followers + 5+ documented case studies). When activated: webinar registration, attendee tracking, recording delivery, post-event nurture. Co-hosted webinars with partners (Layer 7) handled here too.

### Layer 9 — Sales Enablement (3 modules)

**9.1 — Pitch Asset Library**
Pitch decks (by ICP, by service, by geography), case study one-pagers, technical integration docs, compliance certificates, SLA documents. Version controlled. Claude Code can clone and customize a deck for a specific account in under a minute.

**9.2 — Battle Cards & Objection Handling**
For each top competitor (ShipGlobal, QuickShip, Shypmax, ShipBob, DHL eCommerce, Amazon FBA): battle card with positioning, key wins/losses, objection responses, comparative pricing notes. Auto-updated weekly from Layer 1.3 (Competitive Intelligence). SDRs and AE read these before calls.

**9.3 — Proposal Generator**
Daniel selects an account, picks service tier, enters projected volume; Claude Code generates a fully customized proposal PDF using account-specific data, vertical-specific case studies, and the proposal template. PDF auto-stored, link sent to prospect, status tracked.

### Layer 10 — Marketing Ops, Analytics, Intelligence (3 modules)

**10.1 — Attribution & Funnel Analytics**
UTM tagging applied to every outbound link. Source/medium/campaign tracking on every lead. Multi-touch attribution model (first/last/multi). Funnel analytics (drop-off at each stage). Cohort analysis (close rate by ICP segment, by source, by SDR). Customer lifetime value tracking.

**10.2 — Role-Based Dashboards & Reports**
Daily auto-generated dashboards per role (Owner, AE, SDR, Founder). Weekly auto-generated reports (Monday 7 AM IST, sent via email and shown in app). Monthly strategic review pack (the Monday after month-end). All reports generated by Claude Code from raw data; humans review.

**10.3 — Marketing-Sales SLA Tracker**
Tracks the SLA contract between marketing and sales: how many MQLs marketing commits to per month, how fast sales contacts MQLs (target: 4 hours), conversion targets (MQL → SQL → won). Visible to all team members. Drives accountability between functions.

---

## 7. Database Schema Additions

New tables added to the existing Supabase schema. All include `workspace_id` (FK to `workspaces`), `created_at`, `updated_at`. RLS policies follow existing workspace-scoping pattern.

### 7.1 Strategy Tables (Layer 1)
- `brand_assets` — file references, type, usage_notes, version
- `icp_profiles` — tier, name, firmographic_criteria (jsonb), deal_size_range, sales_motion
- `personas` — icp_id (FK), title, pain_points (jsonb), hooks (jsonb), content_recommendations (jsonb)
- `competitors` — name, positioning, pricing_notes, last_scraped_at, profile (jsonb)
- `competitor_signals` — competitor_id (FK), signal_type, content, observed_at

### 7.2 Content Tables (Layer 3)
- `content_pieces` — type (article/post/email/video_script/lead_magnet), status, author_id, body, metadata (jsonb), pillar, target_persona_id, scheduled_at, published_at, performance (jsonb)
- `content_calendars` — calendar entries linking content_pieces to channels and dates
- `seo_keywords` — keyword, search_volume, difficulty, target_url, current_rank, last_checked_at
- `newsletters` — issue_number, subject, body, sent_at, recipient_count, open_rate, click_rate
- `atomized_outputs` — parent_content_id (FK), child_content_id (FK), atomization_strategy

### 7.3 Social & Distribution Tables (Layer 4)
- `social_posts` — platform, content_piece_id (FK), scheduled_at, posted_at, ayrshare_id, performance (jsonb)
- `community_members` — channel (whatsapp/telegram/linkedin), contact_info (encrypted), joined_at, engagement_score
- `social_mentions` — source, mention_text, sentiment, source_url, related_account_id

### 7.4 Lead & Outreach Tables (Layer 5)
- `leads` — extends existing customers schema; status='lead' before becoming customer; storeleads_id, validation_stage, icp_tier, icp_score, vertical, estimated_gmv, last_enriched_at, persona_match (jsonb)
- `lead_contacts` — lead_id (FK), name, role, email, linkedin_url, whatsapp, contact_verified
- `outreach_sequences` — name, channels, steps (jsonb), variant_group
- `outreach_messages` — sequence_id (FK), lead_id (FK), step_number, channel, body, status (drafted/queued/sent/replied/bounced), sent_at, replied_at
- `sdr_assignments` — lead_id (FK), assigned_to (FK profiles), assigned_at, transferred_at
- `abm_accounts` — lead_id (FK), tier_1_priority, account_intel (jsonb), stakeholders (jsonb)
- `account_intelligence_signals` — abm_account_id (FK), signal_type, observed_at, signal_data (jsonb)

### 7.5 Partnership & PR Tables (Layer 7)
- `partners` — name, type (strategic/channel/tech), contact_info, agreement_status, referral_pipeline_value
- `partner_activities` — partner_id (FK), activity_type, occurred_at, notes
- `pr_contacts` — name, publication, role, beat, contact_info, last_pitched_at, response_history (jsonb)
- `press_pieces` — title, status (draft/pitched/published), publication, url, published_at, pitched_to (jsonb array of pr_contact_ids)
- `speaking_engagements` — event_name, date, status, speaker (FK profiles), proposal_status

### 7.6 Event & Community Tables (Layer 8)
- `events` — name, type (trade_show/speaking/internal), date, location, lead_capture_method, status, prep_checklist (jsonb)
- `event_leads` — event_id (FK), lead_id (FK), captured_at, source_within_event
- `influencers` — name, platform, follower_count, niche, contact_info, collaboration_history (jsonb)
- `influencer_outreach` — influencer_id (FK), outreach_status, last_contacted_at, next_step

### 7.7 Sales Enablement Tables (Layer 9)
- `sales_assets` — type (pitch_deck/case_study/integration_doc/etc), name, file_url, version, last_updated_at, ICP_target
- `battle_cards` — competitor_id (FK), positioning, key_objections (jsonb), comparative_pricing (jsonb), updated_at
- `proposals` — lead_id (FK), service_tier, projected_volume, generated_at, status, file_url

### 7.8 Marketing Ops Tables (Layer 10)
- `attribution_touches` — lead_id (FK), touch_type, channel, campaign, occurred_at, content_piece_id (FK nullable)
- `kpi_snapshots` — date, metric_name, value, source_module, role_visibility (jsonb)
- `marketing_sales_sla` — period (weekly), mqls_committed, mqls_delivered, sla_response_time_target_hours, sla_response_time_actual_hours

### 7.9 AI Job Queue Tables (cross-cutting)
- `ai_jobs` — kind, params (jsonb), status (pending/running/completed/failed), created_at, started_at, completed_at, requested_by (FK profiles)
- `ai_job_results` — ai_job_id (FK), output (jsonb), tokens_used, model_used, error (nullable)

### 7.10 Existing Tables (modifications)
- `customers` — add `lead_origin_id` (FK to leads, nullable), `acquisition_source` (text), `acquisition_campaign_id` (FK)
- `pipeline_stages` — extended to include `lead`, `mql`, `sql`, `proposal`, `closed_won`, `closed_lost`
- `activities` — extended `kind` enum to include `outreach_sent`, `outreach_replied`, `linkedin_engagement`, `content_engagement`

### 7.11 Indexes & Performance

Critical indexes for query patterns:
- `leads(workspace_id, icp_tier, icp_score)` — SDR queue selection
- `leads(workspace_id, validation_stage)` — pipeline progression
- `outreach_messages(lead_id, sent_at)` — touch history per lead
- `outreach_messages(workspace_id, status, scheduled_at)` — daily queue generation
- `social_posts(workspace_id, scheduled_at)` — calendar view
- `content_pieces(workspace_id, status, scheduled_at)` — calendar view
- `attribution_touches(lead_id, occurred_at)` — attribution reporting

---

## 8. Claude Code Agent Specification

### 8.1 Job Catalog (initial set)

| Job kind | Schedule | Purpose | Output |
|----------|----------|---------|--------|
| `validate_leads_batch` | Daily 2 AM IST | Run lead validation pipeline stages 1–4 on new imports | Validated lead rows |
| `enrich_lead_deep` | On demand (per lead, batched) | Stage 5 deep enrichment for specific leads | Persona match, founder identification, contact verification |
| `score_leads_icp_fit` | Daily 4 AM IST | Re-score leads against current ICP definitions | Updated icp_score |
| `generate_outreach_sequence` | On demand (when SDR creates new sequence) | Personalize a full sequence for a specific lead | 16 message drafts queued |
| `generate_daily_sdr_queue` | Daily 6 AM IST | Build today's outbound queue per SDR | Today's queue per SDR (40 messages each) |
| `generate_seo_articles` | Twice weekly (Mon, Thu) | Draft SEO articles from keyword targets | Article drafts in review queue |
| `generate_founder_posts` | Daily 5 AM IST | Draft LinkedIn posts for Draz and Gagan | 1 post per founder per day in review queue |
| `generate_engagement_targets` | Daily 5 AM IST | Surface 10–20 LinkedIn posts for each founder to comment on, with draft comments | Engagement queue per founder |
| `atomize_long_form` | On approval of long-form content | Break down into 10–15 derivative outputs | Atomized pieces in calendar |
| `generate_newsletter` | Weekly (Sunday) | Draft prospect newsletter from week's content | Newsletter draft in review queue |
| `monitor_competitors` | Weekly (Monday) | Scan competitor websites and LinkedIn for changes | Competitor signal events |
| `monitor_target_accounts` | Daily | Scan top 100 ABM accounts for buying signals | Signal events flagged in ABM Engine |
| `social_listening` | Daily | Aggregate brand and competitor mentions | Social mention rows |
| `generate_proposal` | On demand (Daniel triggers) | Build customized proposal PDF | PDF stored, link returned |
| `generate_pr_pitches` | Weekly | Draft personalized journalist pitches | Pitch drafts in PR pipeline |
| `weekly_kpi_report` | Weekly (Monday 7 AM IST) | Generate weekly performance report | Report stored, sent via email |
| `competitive_battle_card_refresh` | Weekly | Refresh battle cards from competitor signals | Updated battle_cards rows |

### 8.2 Job Execution Pattern

Each scheduled job is a standalone Claude Code invocation:

```bash
# Pseudocode — actual command runs from Windows Task Scheduler

claude -p --output-format=json << 'EOF'
You are running scheduled job: generate_daily_sdr_queue
Connect to Supabase (credentials via .env)
1. Fetch today's pending leads for each SDR
2. For each lead, find next pending step in their sequence
3. Personalize the message using lead data + persona + ICP
4. Insert into outreach_messages with status='queued'
5. Mark ai_job complete
EOF
```

In practice: each job is a Markdown file in the repo under `agents/jobs/<job_name>.md` containing the prompt. Claude Code loads it, executes, writes results.

### 8.3 Job Failure Handling

- Each job has `max_retries=3`, retry interval `15min`
- On failure after retries: row written to `ai_job_results.error`, alert sent to admin via Brain channel health system (already exists in TXG Vector)
- If Claude Code session is not authenticated (Max plan logged out), job stays in `pending` until session is re-established. Alert sent after 30 minutes.

### 8.4 Cost & Rate Limit Awareness

Claude Max plan has rate limits. Job ordering is prioritized: revenue-critical jobs (outreach personalization, lead scoring) run first; non-critical (atomization, social listening) run later or on weekends. Heavy jobs (lead validation across 20K leads) split into batches of 100 with 30-second delays.

---

## 9. UI/UX Redesign Principles

### 9.1 Design Philosophy

- **Density without clutter** — Vector users (Daniel, Angad, Jatin) work intensively in the platform 6+ hours per day. Information density matters. Linear/Notion/Superhuman as design references, not Salesforce/HubSpot.
- **Speed-of-thought interactions** — keyboard-first navigation, inline editing, optimistic UI, sub-second transitions
- **Single-pane workflows** — minimize navigation between pages for high-frequency tasks (SDR daily queue should be one screen)
- **Role-aware** — same database, different views per role; Owner does not see SDR queue clutter; SDR does not see partnership pipeline by default
- **Ambient intelligence** — Claude Code suggestions appear contextually inline, not as separate "AI buttons"

### 9.2 Information Architecture

```
Top-Level Navigation
├── Today                  (role-specific home: queues, alerts, what to do now)
├── Pipeline               (deals, leads, accounts — unified view across all sources)
│   ├── Inbox              (replies, inbound leads, today's work)
│   ├── Leads              (the validated database)
│   ├── Accounts           (Tier 1 ABM accounts)
│   ├── Deals              (in-progress sales — Daniel's view)
│   └── Customers          (existing — preserved from current Vector)
├── Content                (the production engine)
│   ├── Calendar           (unified calendar)
│   ├── Articles           (SEO articles, drafts and published)
│   ├── Founder Brand      (Draz + Gagan personal brand)
│   ├── Newsletters        (prospect + internal)
│   └── Library            (lead magnets, case studies, deck templates, sales assets)
├── Distribution           (where content goes)
│   ├── Social             (cross-platform posts via Ayrshare)
│   ├── Community          (WhatsApp, Telegram, LinkedIn group)
│   ├── Engagement         (today's posts to comment on)
│   └── Listening          (mentions, signals)
├── Outreach               (the outbound machine)
│   ├── My Queue           (SDR daily list — personal)
│   ├── Sequences          (templates and active sequences)
│   ├── Replies            (everyone's replies, filterable)
│   └── ABM                (named accounts)
├── Growth                 (everything that isn't outbound)
│   ├── Partners
│   ├── PR & Media
│   ├── Events
│   ├── Influencers
│   └── Awards
├── Strategy               (the foundation)
│   ├── Brand Book
│   ├── ICPs & Personas
│   ├── Competitors
│   ├── Battle Cards
│   └── Messaging
├── Operations             (preserved — TXG ops platform)
│   ├── Warehouse
│   ├── Quotes
│   ├── Contracts
│   └── Tickets
├── Analytics
│   ├── Dashboard
│   ├── Funnel
│   ├── Attribution
│   └── Reports
└── Settings
```

### 9.3 Today View (the new home)

Today replaces the current Dashboard as the default landing page. It is **role-specific**:

**For an SDR (Angad/Jatin):**
- "Your queue today: 40 messages" — primary CTA, opens daily queue
- "8 replies waiting for you" — secondary
- "3 calls booked this week"
- "Top of feed: 12 new leads scored A this morning"

**For Daniel (AE):**
- "5 qualified opportunities awaiting your action"
- "2 proposals out, 1 expiring this week"
- "3 calls scheduled today"

**For Draz (founder + PR):**
- "Your post for today is ready" — primary CTA
- "12 LinkedIn engagements suggested"
- "2 PR pitches drafted, awaiting your review"
- "1 podcast booking opportunity"

**For Gagan (owner):**
- Strategic dashboard: pipeline value, deals progressing, top metrics, alerts, this week's wins

### 9.4 Visual Design Language

Continuing from the redesign committed earlier (white sidebar, navy text, orange accents):
- White/off-white surfaces (`#ffffff` cards, `#f5f6f8` canvas)
- Deep navy ink (`#0d1e3d`) for primary text
- TXG orange (`#f75928`) as the singular accent — used sparingly for primary CTAs and active states
- Manrope for headings, DM Sans for body, Nunito Sans for display
- Strong typographic hierarchy — display sizes for key numbers, dense compact UI for tables and queues
- Generous whitespace inside cards, tight spacing between cards (high information density per screen without visual chaos)

### 9.5 Component Library Updates

Existing shadcn/ui components retained. New components required:
- **CommandPalette** — keyboard-driven action launcher (Cmd-K) — globally accessible
- **InlineApprovalChip** — the "approve this Claude Code draft" UI element used across Founder Brand, SEO Articles, Outreach, Newsletter
- **LeadCard** — compact lead representation with all relevant signals at a glance
- **SequenceTimeline** — visual representation of a 16-touch sequence with touch states
- **AccountStakeholderMap** — multi-stakeholder view for ABM accounts
- **AtomizationGraph** — visual showing how a long-form piece atomized into 15 derivative outputs
- **KPISpark** — small inline sparkline for embedding metrics in lists

### 9.6 Mobile

Phase 0 prioritizes desktop. Mobile read-only access for the founder views (Gagan's dashboard, Draz's morning approval flow) is acceptable. Full mobile authoring is deferred to Phase 1.

---

## 10. Multi-User Role System

### 10.1 Roles

Existing role enum in `workspace_members` is extended:

```sql
role text not null check (role in (
  'admin',           -- existing
  'ops_lead',        -- existing (Angad)
  'ops_rep',         -- existing
  'warehouse_lead',  -- existing
  'warehouse_staff', -- existing
  'driver',          -- existing
  'sales',           -- existing — split below
  'customer_contact',-- existing
  -- New roles for marketing platform:
  'owner',           -- Gagan
  'public_face',     -- Draz
  'ae',              -- Daniel (sales role split for clarity)
  'sdr',             -- Angad, Jatin
  'marketing_admin'  -- future hire
));
```

### 10.2 Permissions Matrix (subset)

| Capability | Owner | Public Face | AE | SDR | Ops Lead |
|------------|-------|-------------|----|----|----------|
| View all pipeline | ✓ | View deals | ✓ | Own + team | View ops only |
| Approve content | ✓ | ✓ Founder Brand | – | – | – |
| Send outreach | – | ✓ | ✓ | ✓ | – |
| ABM accounts (read) | ✓ | ✓ | ✓ | – | – |
| ABM accounts (assign) | ✓ | – | ✓ | – | – |
| Generate proposals | ✓ | – | ✓ | – | – |
| Trigger Claude Code jobs | ✓ | ✓ Limited | ✓ Limited | ✓ Limited | – |
| Edit Brand Book | ✓ | ✓ | – | – | – |
| Edit ICPs | ✓ | – | – | – | – |
| Strategic analytics | ✓ | View | View | View own | – |

RLS policies enforce these at the database level using existing `is_workspace_member`, `has_workspace_role` helpers.

---

## 11. Integrations

### 11.1 Resend (email delivery)

- All transactional and marketing email sent via Resend
- Domain: `mail.transwayxpress.com` (subdomain — protects main domain reputation during ramp)
- Sender authentication: SPF, DKIM, DMARC configured
- Bounce, complaint, unsubscribe handling via webhooks → Supabase
- Cost at projected volume (~10K emails/month): well within free tier or sub-$50/month

### 11.2 Ayrshare (social posting)

- Publishes to LinkedIn Company Page, Instagram Business, YouTube, Twitter/X, Facebook Business
- Personal LinkedIn (Draz, Gagan) is NOT posted by Ayrshare — manual posting via clipboard workflow (LinkedIn API restricts this)
- Webhook callbacks → social_posts.performance updated daily
- Cost: ~$50–150/month at projected volume

### 11.3 WhatsApp Business Cloud API (Meta)

- Required for compliant outbound WhatsApp at scale
- Initial setup: phone number provisioning, business verification, message templates submitted for approval
- Templates required for first message to a new number; conversational replies after that
- Cost: per-conversation pricing, ~$0.005–0.05 per message depending on Indian markets

### 11.4 LinkedIn (manual + browser-assisted)

- LinkedIn API is closed for personal posting and connection requests for non-official integrations
- Approach: Claude Code drafts; SDR/founder posts manually via browser
- Optional: A Chrome extension built for the team that detects when they're on a LinkedIn profile and shows the queued draft inline. Reduces friction.
- Future option: enterprise LinkedIn API access if pursued (requires Sales Navigator + LinkedIn approval, takes weeks)

### 11.5 Calendly (booking)

- Standard Calendly accounts for Daniel, Angad, Jatin
- Webhooks → leads.status updated to "Call Booked"
- Cost: $10/user/month

### 11.6 StoreLeads (lead source)

- Already done — CSV exported by user
- One-time import workflow into Lead Validation Pipeline (5.1)

### 11.7 Apollo / Hunter (contact verification — optional)

- Used in Stage 5 of lead validation for email/phone verification
- Free tier covers initial 5K leads; paid tier ~$50/month if needed

---

## 12. Success Metrics & KPIs

### 12.1 90-Day Targets

| Layer | Metric | Target |
|-------|--------|--------|
| Outbound | Validated leads in DB | 5,000 |
| Outbound | Personalized messages sent | 2,500 |
| Outbound | Reply rate | 8–15% |
| Outbound | Discovery calls booked | 60–120 |
| Outbound | Qualified opportunities | 20–40 |
| Outbound | Closed clients | 8–15 |
| Content | SEO articles published | 30+ |
| Content | First keyword cluster ranking (Top 20) | 5+ keywords |
| Content | LinkedIn impressions (combined) | 500K+ |
| Content | Newsletter subscribers | 600+ |
| Distribution | Social posts published | 250+ |
| Distribution | Community members (WA + Telegram) | 300+ |
| Tools (organic) | Calculator uses | 200+ |
| Tools (organic) | Lead magnet downloads | 80+ |
| Tools (organic) | Inbound qualified leads | 30+ |
| Partnerships | Partner agreements signed | 4+ |
| PR | Published media mentions | 4+ |
| PR | Podcast appearances | 6+ |
| PR | Award shortlists | 2+ |
| Strategy | Documented case studies | 3–5 |

### 12.2 Leading Indicators (weekly)

These metrics are tracked weekly and predict quarterly outcomes:

- New verified leads added to DB
- Total messages sent across all channels
- Reply count (raw and rate)
- Calls booked (raw and rate)
- Content published (count + estimated reach)
- LinkedIn engagement (posts published, comments made, DMs received)
- Inbound leads (count + source breakdown)
- Pipeline value progression (stage value movements)

### 12.3 Lagging Indicators (monthly)

- Closed won / closed lost
- Average deal size
- Sales cycle length
- CAC by source
- Customer lifetime value (after 6 months of data)
- Content ROI (pipeline attributed to specific content pieces)

---

## 13. 8-Week Build Plan

### Week 1 — Foundation Sprint
**Goal:** Every layer skeletoned. Lead validation running. Vector UI redesign starts.

- Day 1–2: Brand book + ICP definitions + persona maps + messaging framework documented in Layer 1
- Day 1–3: Database schema migrations (all tables created, RLS configured)
- Day 2–3: Lead validation pipeline stages 1–3 running (Layer 5.1 partial)
- Day 3–4: Marketing site Track A — emergency WP fixes (lorem ipsum removed, India page added)
- Day 4–5: Founder Brand OS skeleton (Layer 3.3) — first daily post job runs
- Day 5–6: Content Calendar (Layer 3.1) live, social channels connected via Ayrshare
- Day 6–7: SDR pipeline stages defined, role-based dashboards live (Today view)

### Week 2 — Outbound Activation
**Goal:** Angad and Jatin sending real outreach.

- Validation pipeline stages 4–5 complete on top 8K leads
- Outreach sequences built (Layer 5.2, 5.5)
- SDR daily queue generation working (Claude Code job)
- Resend + WhatsApp Business API configured
- First 200 personalized outreach messages sent

### Week 3 — Content + Founder Brand
**Goal:** Content engine producing volume.

- SEO Article Engine producing 2 articles/week (Layer 3.2)
- Founder Brand OS at full daily cadence — Draz 5/week, Gagan 2/week
- LinkedIn Engagement Targets system live
- First newsletter drafted and sent
- Content Atomizer running on first long-form pieces

### Week 4 — Lead Generation Tools
**Goal:** Inbound pipeline starting.

- Shipping Cost Calculator live on website (Layer 2.2)
- ROI Calculator live
- First 2 lead magnets published (Layer 2.3)
- Lead capture forms wired
- Email nurture sequences active

### Week 5 — Marketing Website Rebuild Begins
**Goal:** Real marketing site infrastructure.

- New Next.js marketing site initialized (separate spec)
- IA, design system, first page templates built
- Old WP site redirects planned
- Content migration plan executed

### Week 6 — Partnerships & PR
**Goal:** Earned media and channel partnerships activating.

- Partnership Manager (Layer 7.1) with 20+ targets identified
- First 10 partnership outreach messages sent
- PR & Media Pipeline (Layer 7.2) with 50+ journalists
- First press pitch sent
- Award submissions calendar populated

### Week 7 — ABM Activation
**Goal:** Top 100 named accounts under coordinated treatment.

- ABM Engine (Layer 5.4) populated with 100 Tier 1 accounts
- Multi-stakeholder mapping complete (5+ stakeholders per account)
- Account intelligence monitoring active
- First account-specific one-pagers generated

### Week 8 — Analytics, Reporting, Hardening
**Goal:** Full measurement and team operational rhythm.

- Attribution model fully configured
- Weekly auto-generated reports running
- Marketing-Sales SLA tracker live
- All dashboards complete per role
- Performance review of first 8 weeks
- Phase 1 plan written based on data

---

## 14. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Claude Code session not running, scheduled jobs fail | Medium | High | Dedicated workstation; alerting on missed jobs; manual trigger fallback |
| Claude Max rate limits hit during heavy enrichment | Medium | Medium | Batch sizing, prioritized job queue, weekend overflow |
| LinkedIn flags personal accounts for "automation" | Low | High | All personal posting is manual; Claude only drafts |
| Email deliverability collapses (sender reputation damage) | Medium | High | Subdomain isolation, gradual ramp, list hygiene, content quality |
| WhatsApp Business templates rejected | Medium | Medium | Pre-approved templates only at start, human-language templates |
| Lead data quality lower than 5K viable | Medium | Medium | Multiple data sources beyond StoreLeads; community-sourced leads as backup |
| Team adoption of new platform low | Low | High | Daily training in Week 1; founders model usage; metrics make non-use visible |
| Marketing website rebuild slips | Medium | Medium | Track A WP fixes provide cover; site rebuild not blocking other work |
| Founder time to approve content | High | Medium | Optimize approval UX (one-tap approve from mobile); batch reviews; default-to-publish for low-risk content |
| Competitor copies the strategy | Low | Low | Content compounds, network effects in community ownership; first-mover advantage |
| Compliance (CAN-SPAM, GDPR) | Medium | High | Unsubscribe headers everywhere, no purchased lists, opt-in tracking, legal review of templates |

---

## 15. Out of Scope (Phase 0)

Explicitly excluded from this spec; deferred to Phase 1 or 2:

- **Layer 6 — Existing customer marketing** (per scope decision, not built)
- **Webinars** (audience threshold not met)
- **Original research publication** (data being collected via outbound, publication in Phase 1)
- **Paid advertising platforms** (no budget; infrastructure built but not activated)
- **Mobile-first authoring** (desktop-first in Phase 0)
- **Multi-workspace SaaS productization** (single-tenant TXG only)
- **Advanced ML lead scoring** (Claude Code prompt-based scoring sufficient at current scale)
- **Russian / Hindi content production** (English only Phase 0; Hindi Phase 2 when India primary market traction confirmed)
- **Advanced attribution modeling (data science)** (multi-touch attribution sufficient at current volume)
- **CRM marketplace integrations beyond what is specified** (Salesforce, HubSpot connectors not built — TXG Vector is the CRM)

---

## 16. Open Decisions

Items still requiring decision before or during implementation:

1. **Claude Code execution host** — Workstation (Phase 0) or dedicated server (when?)
2. **Marketing website hosting** — Vercel (recommended) vs other; ties to web rebuild spec
3. **LinkedIn personal post automation** — Accept manual, or build Chrome extension?
4. **WhatsApp Business templates** — Start with research-framed templates or value-share templates?
5. **Hindi content layer** — When does this activate?
6. **Partnership program contracts** — Standardized terms or per-deal?
7. **Influencer marketing budget** — Even modest budget unlocks paid collaborations; defer to Phase 1?

---

## 17. Glossary

- **4PL** — Fourth Party Logistics; manages the entire supply chain on behalf of the client, including managing 3PLs, technology, and strategy
- **ABM** — Account-Based Marketing; targeted multi-stakeholder marketing to named accounts
- **AE** — Account Executive; closes deals
- **CSM** — Customer Success Manager
- **GMV** — Gross Merchandise Value; total dollar value of orders processed
- **ICP** — Ideal Customer Profile
- **MQL** — Marketing Qualified Lead
- **SDR** — Sales Development Representative; qualifies leads, books calls
- **SLA** — Service Level Agreement
- **SQL** — Sales Qualified Lead
- **TAM/SAM** — Total / Serviceable Addressable Market
- **TCO** — Total Cost of Ownership

---

## Approval Required

Sections requiring user review before implementation begins:

- [ ] Strategic context (Section 2) — accuracy and completeness
- [ ] ICP and persona definitions (Section 3) — match the real Indian D2C landscape
- [ ] Messaging framework (Section 4) — voice, narrative, anti-patterns
- [ ] 32 modules (Section 6) — scope confirmed
- [ ] Database schema (Section 7) — review with engineering lens
- [ ] Claude Code job catalog (Section 8.1) — completeness
- [ ] UI/UX redesign principles (Section 9) — design direction
- [ ] Roles and permissions (Section 10) — match team reality
- [ ] 8-week build plan (Section 13) — realistic given team capacity
- [ ] Out of scope items (Section 15) — comfort with deferrals

After approval, implementation moves to detailed plan via the writing-plans skill, sub-system by sub-system.
