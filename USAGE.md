# TXG Vector — Day-to-Day Usage

How to actually use the marketing platform once it's set up. This is the operational manual for the team.

---

## The Daily Rhythm

```
Morning (9 AM)     →  Open /app/today
                      Review your queue · Send drafted outreach · Check replies

Mid-day            →  Discovery calls · Update lead status as conversations move

Afternoon          →  Add new leads · Tune ICPs · Log competitor signals

End of day         →  Mark sent messages · Move qualified leads to next stage
```

---

## Workflow 1 — Importing Leads (One-Time per Source)

You have a CSV of brands (StoreLeads export, NA Shopify list, BuiltWith export, partner-shared list).

1. Go to **Leads → Import CSV**
2. Pick the source (StoreLeads / Manual / Referral / etc.)
3. Drag your CSV onto the upload box, or click to browse
4. Map columns — the system auto-detects common ones (name, website, vertical). Confirm or override.
5. Preview shows first 10 rows of the cleaned data
6. Click **Import N leads**

Imported leads start in `validation_stage = raw` and `status = new`. The Claude Code agent (when running) advances them through validation stages overnight. You can also work them manually right away.

**Limit:** 5,000 rows per upload. Split larger files.

**Duplicates:** matched on `(source, source_external_id)`. Re-importing the same StoreLeads CSV is safe — duplicates skip silently.

---

## Workflow 2 — Daily SDR Outreach (the revenue motion)

This is the core workflow. Every weekday morning:

1. Go to **Outreach → My Queue** (or click the "Your queue" card on Today)
2. You see today's drafted messages — typically 20–40 across LinkedIn DM, email, WhatsApp
3. For each message:
   - **Read the lead context** (click the brand name to see the full lead detail)
   - **Edit the body** if the AI draft needs personalization tweaks (use the Edit button)
   - **Click Copy** — it copies the message body (and subject for emails) to your clipboard
   - **Paste into the destination:**
     - LinkedIn DM → open LinkedIn, paste, send
     - Email → open Gmail/Outlook (or Resend, when wired), paste, send
     - WhatsApp → open WhatsApp Web, paste, send
   - **Click Mark Sent** in TXG Vector — this updates the lead status to "contacted" and stamps the timestamp

When a recipient replies, mark the message as **Replied** (or paste the reply for tracking). The lead status auto-moves to "replied", and the message shows in **Outreach → Replies**.

**Why manual paste-and-send instead of automated?**
LinkedIn explicitly prohibits automated personal-account posting. WhatsApp Business API is heavyweight and templated. Email automation requires a Resend API key and proper sender warm-up. Day-1 you ship volume by doing the last-mile send manually — Claude Code does the drafting, you do the sending. Once volume justifies it, we wire up Resend for email automation in Plan 6.

---

## Workflow 3 — Building & Assigning a Sequence

A "sequence" is a multi-step, multi-channel outbound cadence. Default template is 9 touches over ~50 days.

1. Go to **Outreach → Sequences → New sequence**
2. Name it (e.g. "NA D2C Cold Outreach Q2 2026")
3. The system seeds it with the default 9-touch template
4. Click into the sequence to view/edit the steps

To assign a lead to a sequence:

1. Open a lead detail page (`/app/leads/<id>`)
2. Click **Assign sequence** → pick the sequence
3. The system generates 9 personalized draft messages with variables filled in (`{{first_name}}`, `{{company}}`, `{{vertical}}`)
4. Each message lands in the assigned SDR's queue, scheduled at its day offset
5. The lead status moves from "new" → "researching"

Round-robin assignment: when leads come in via website forms (when wired up), the system uses `assign_lead_round_robin()` to distribute across active SDRs evenly.

---

## Workflow 4 — Managing ICPs & Personas

ICPs (Ideal Customer Profiles) drive lead scoring, content recommendations, and sequence selection.

The platform ships with 6 seeded ICPs:
- **Tier 1** — Premium NA D2C ($5M–$50M GMV, growth-stage)
- **Tier 2** — Growth-stage NA D2C ($500K–$5M)
- **Tier 3** — Indian conglomerates (Indian D2C cross-border)
- **Tier 4** — Indian diaspora brands (NA-founded, India supply)
- **Tier 5** — Bootstrap exporters
- **NA Mid-Market** — $5M–$100M e-commerce needing 4PL

Per the latest strategic pivot, **NA fulfillment is primary**. Tier 3-5 (India-focused) become opportunistic.

To tune them:
1. Go to **Strategy → ICPs & Personas**
2. Click any ICP card
3. Edit firmographic criteria (revenue range, verticals, geography, signals)
4. Edit deal size range and sales motion
5. Add personas to the ICP — buyer personas with pain points, hooks, content recommendations

Tier 1 ships with 5 personas (Founder, COO, CFO, Supply Chain Head, E-commerce Manager). You can edit their pain points, hooks, and content recommendations to refine messaging.

---

## Workflow 5 — Logging Competitive Intelligence

When ShipBob raises prices, when DHL launches a new product, when ShipGlobal hires a VP of Sales — track it.

1. Go to **Strategy → Competitors**
2. Click a competitor
3. Click **Log signal** in the right rail
4. Pick signal type (pricing change, new messaging, hire, product launch, press, social, other)
5. Write what happened, paste source URL

Signals accumulate per competitor. Every weekly report (when wired) summarizes the highest-impact signals. Battle cards (when built) auto-refresh from this data.

---

## Workflow 6 — The Lead Lifecycle

Every lead moves through stages:

```
new
  ↓ (you click "Assign sequence" or AI auto-assigns)
researching
  ↓ (first message sent)
contacted
  ↓ (they reply)
replied
  ↓ (they book a call via Calendly)
call_booked
  ↓ (call happens, qualified)
qualified
  ↓ (proposal sent)
proposal
  ↓ (closed)
closed_won  /  closed_lost
```

Update status manually from the lead detail page (top-right dropdown), or it advances automatically when:
- Sending a message → "contacted"
- Marking a reply → "replied"
- (Future) Calendly webhook fires → "call_booked"

---

## Workflow 7 — Pipeline Visibility

The **Today** dashboard shows top-line metrics for whoever's logged in:
- Your queue (drafted + queued)
- Replies waiting
- In pipeline (contacted → proposal stages)
- Active leads
- Pipeline by status (visual breakdown)
- Validation funnel (raw → contact verified)
- Quick actions

Click any metric to drill into the filtered list.

For the full pipeline kanban: **Pipeline** in the sidebar (existing module — links to leads + customers + deals).

---

## What's Done · What's Next

### ✅ Working today
- Lead import + manual creation + edit + delete
- Lead detail with contacts, outreach timeline, status updater
- ICP & Persona CRUD
- Competitor CRUD + signal logging
- Outreach sequences (create + edit + the default 9-touch template)
- Lead-to-sequence assignment with personalization
- SDR daily queue (review, edit, copy, mark sent, mark replied)
- Replies inbox
- Today dashboard with metrics & quick links
- AI chat widget (rewired to Claude Code job queue)

### 🟡 Wired but needs activation (next plans)
- Zoho ZeptoMail email sending (Plan 6) — currently you copy/paste. Once wired, "Mark sent" sends via ZeptoMail.
- Zoho Social API (Plan 6) — content drafted in Vector auto-posts via Zoho Social API to LinkedIn Company, Instagram, YouTube, Facebook. Already included in your Zoho One subscription.
- WhatsApp Business API (Plan 6) — for compliant broadcast (only if/when conversation volume justifies)
- Free public tools (calculator, ROI, quiz) — Plan 5
- SEO content engine + atomization — Plan 4
- Founder Brand OS (LinkedIn post drafts daily) — Plan 4
- Partnership + PR pipelines — Plan 7
- Events + influencer tracker — Plan 8
- Sales asset library + battle cards + proposals — Plan 9
- Marketing analytics + attribution — Plan 10
- Marketing website rebuild — Plan 12

### Pending follow-up plans
Plans 2–12 build the remaining functionality on top of the schema and infrastructure already shipped. Each plan is independently buildable; pick whatever delivers next-most-value when you're ready.

---

## Tips

**Start by importing your best 500 leads, not all 100K.** Better to see a working pipeline with high-quality leads than drown in noise.

**The default 9-touch sequence is research-framed for a reason.** "I'm researching how brands handle X" gets 5–10× the reply rate of "want to buy our service?" Resist the urge to make it salesier on day one.

**Mark sent immediately after pasting and sending.** Otherwise the queue piles up and you lose track. The button is one click — train yourself to muscle-memory it.

**Use the search and filter on /app/leads aggressively.** Tier 1 grade-A leads ($5M+ GMV in your verticals) are worth 50× more time than Tier 5. Filter, focus, send.

**The agent runtime is optional for day-1.** All the manual workflows above work without it. Add the scheduler when volume justifies overnight automation.

---

Questions? Check the design specs in `docs/superpowers/specs/` or the implementation plan in `docs/superpowers/plans/2026-05-07-foundation.md`.
