# TXG Marketing Website — Design Specification

**Date:** 2026-05-07
**Author:** Strategy + engineering session
**Status:** Design draft, pending review
**Companion document:** `2026-05-07-txg-marketing-platform-design.md`
**Domain:** transwayxpress.com (and dual-market subpaths /india, /us, /canada)

---

## 1. Executive Summary

The current TXG website is a generic WordPress + Bravis theme installation with lorem ipsum testimonials in production, a single newsletter form as the only lead capture, no India market presence, and no calculators or lead magnets. It cannot host the strategic marketing the company is building. **It will be rebuilt** on Next.js (same stack as TXG Vector), hosted on Vercel, with a parallel emergency-fix track on the existing WordPress site to bridge the 4–6 week rebuild window.

The rebuilt site is a **conversion engine**, not a brochure. Every page exists to move a visitor toward one of four conversion paths: (1) talk to sales, (2) use a free tool (calculator/quiz), (3) download a lead magnet, (4) subscribe to the newsletter. It serves two market audiences (India outbound, NA inbound) without compromising either, and is designed for SEO compounding from Day 1.

### Success criteria at 90 days (post-launch)
- 12,000+ unique monthly visitors (50% organic, 30% referral, 20% direct)
- 5+ keywords ranking in Top 20 (target: "ship from India to USA," "4PL India to North America," etc.)
- 200+ free tool uses per month
- 80+ lead magnet downloads per month
- 600+ newsletter subscribers acquired through site
- 30+ qualified inbound leads/month
- Page speed Lighthouse 95+ on mobile, 98+ on desktop
- Core Web Vitals all green

---

## 2. Strategic Frame

### 2.1 Site Mission

The website exists to do three jobs:

1. **Convert intent.** Capture demand from people actively researching cross-border logistics and 4PL services.
2. **Educate the category.** Teach the Indian D2C market what a 4PL is and why it matters — own the educational ground that turns into pipeline.
3. **Project authority.** Make TXG look like the asset-based 12-year incumbent it is, not a 2023 startup posting templates.

### 2.2 What the Site Is Not

- A blog (it has a blog, but the site is not a blog)
- A static brochure (every page has a conversion mechanism)
- A self-serve product (TXG sales motion is consultative; pricing is not public; quotes happen in conversation)
- A platform login portal (TXG Vector is separate; the marketing site links to it but does not host it)

### 2.3 Audience Routing

The site serves two distinct audiences with overlapping infrastructure:

**India audience (primary outbound focus)**
- Indian D2C founders considering NA expansion
- Routed via paid channels, founder LinkedIn, content marketing
- Lands on India-specific entry pages
- Currency in INR for examples; English language

**North America audience (secondary)**
- NA mid-market e-commerce brands
- Routed via SEO, referral, content
- Lands on NA-specific entry pages
- Currency in USD/CAD

**Geographic detection** is automatic on first visit (IP geolocation) but with a clear country switcher in the header. Cookie-stored preference for return visits.

---

## 3. Information Architecture

### 3.1 Top-Level Navigation

```
HEADER NAV
├── Solutions
│   ├── Cross-Border Fulfillment       (anchor: India → NA)
│   ├── Direct Cross-Border Shipping   (Phase 1 service)
│   ├── Hybrid Fulfillment             (Phase 2 service)
│   ├── Full Local Fulfillment         (Phase 3 service)
│   ├── Returns & Reverse Logistics
│   └── Last-Mile Delivery (NA)
├── Industries
│   ├── Fashion & Apparel
│   ├── Beauty & Wellness
│   ├── Food & Beverage (compliant)
│   ├── Electronics & Tech
│   ├── Home & Living
│   └── Health & Supplements
├── Resources
│   ├── Cross-Border Playbook          (lead magnet)
│   ├── Shipping Cost Calculator       (free tool)
│   ├── ROI Calculator                 (free tool)
│   ├── Cross-Border Readiness Quiz    (free tool)
│   ├── Blog
│   ├── Case Studies
│   ├── Customs & Compliance Guides
│   └── Webinars & Events              (Phase 1)
├── About
│   ├── Our Story (12 years of Transway, 3 years of TXG)
│   ├── Leadership
│   ├── Facilities (Buffalo, Etobicoke)
│   ├── Coverage Map (interactive)
│   └── Press & News
└── For Indian Brands                  (dedicated India entry)

PRIMARY CTA (always visible):
[ Get Your Cross-Border Quote ]      → opens consultation booking flow

SECONDARY CTA (header right):
[ Track Shipment ]                   → existing functionality, link out

FOOTER
- Quick links to all sections
- Newsletter signup
- Address blocks (Buffalo, Etobicoke, India ops contact)
- Legal (Privacy, Terms, Cookies)
- Trust signals (BBB, CIFFA membership, etc. when available)
- Social links
- Language/region switcher
```

### 3.2 URL Structure

Clean, descriptive, SEO-friendly. No query strings for canonical pages.

```
transwayxpress.com/                            (NA home — default)
transwayxpress.com/india                       (India home)
transwayxpress.com/canada                      (Canada home, NA route)
transwayxpress.com/us                          (US home, NA route)
transwayxpress.com/solutions/cross-border-fulfillment
transwayxpress.com/solutions/direct-shipping
transwayxpress.com/solutions/hybrid
transwayxpress.com/solutions/full-fulfillment
transwayxpress.com/industries/fashion
transwayxpress.com/industries/beauty
transwayxpress.com/resources/playbook         (gated lead magnet landing)
transwayxpress.com/tools/shipping-calculator
transwayxpress.com/tools/roi-calculator
transwayxpress.com/tools/readiness-quiz
transwayxpress.com/blog
transwayxpress.com/blog/[article-slug]
transwayxpress.com/case-studies
transwayxpress.com/case-studies/[case-slug]
transwayxpress.com/about
transwayxpress.com/about/team
transwayxpress.com/about/facilities
transwayxpress.com/coverage
transwayxpress.com/press
transwayxpress.com/contact
transwayxpress.com/quote                      (consultation booking)
```

Hindi content (Phase 2): served at `transwayxpress.com/hi/*` with proper hreflang tags.

---

## 4. Page-by-Page Specifications

### 4.1 NA Home (`/`)

**Goal:** Convert NA mid-market e-commerce visitors into qualified leads.

**Hero section:**
- Headline: "Asset-Based 4PL for E-Commerce Brands Scaling Across North America"
- Subhead: "12 years of Canadian and US logistics infrastructure. 80% pincode coverage. One platform — Vector — connecting your store to our warehouses, our fleet, and your customers."
- Primary CTA: "Get a Custom Quote"
- Secondary CTA: "See Our Coverage Map"
- Hero visual: animated map of Canada + US with TXG facilities and routes overlaid; subtle motion

**Section 2 — Trust Strip:**
- Logos of platforms TXG integrates with (Shopify, WooCommerce, Magento, Amazon, Walmart Marketplace)
- "Operated by Transway Group — trusted logistics partner since 2014"

**Section 3 — Services Overview:**
- Three cards: Warehousing & Fulfillment / Last-Mile Delivery / Returns & Reverse Logistics
- Each links to detailed solution page

**Section 4 — Why TXG (the differentiation):**
- Asset-based — own warehouses, own fleet
- Two strategic facilities at the busiest US-Canada crossing
- Vector platform — full visibility, REST API, native Shopify
- Bulk consolidation expertise — 50% lower per-order costs achievable

**Section 5 — Outcomes (proof):**
- Three featured case studies (when available; placeholders + "case studies launching soon" until then)

**Section 6 — Tools Strip:**
- "Free: ROI Calculator — see what TXG saves you" → /tools/roi-calculator
- "Free: Shipping Cost Calculator" → /tools/shipping-calculator

**Section 7 — Recent Insights:**
- Three latest blog posts

**Section 8 — Final CTA:**
- "Ready to scale your fulfillment? Book a 30-minute consultation" — Calendly embed or routing to /quote

**Footer**

### 4.2 India Home (`/india`)

**Goal:** Convert Indian D2C founders into qualified leads.

**Hero section:**
- Headline: "Sell in North America Without Setting Up Operations There"
- Subhead: "Asset-based 4PL with infrastructure in Buffalo and Etobicoke. Cut your delivery time from 20 days to 7. Cut your shipping cost in half. Start lean, scale when ready."
- Primary CTA: "Book a Free Cross-Border Strategy Call"
- Secondary CTA: "Use the Shipping Cost Calculator"
- Hero visual: India → North America corridor visualization

**Section 2 — The Pain (resonance):**
- "₹1,500–3,000 per order kills your unit economics"
- "15–20 day delivery destroys conversion and repeat purchase"
- "Returns infrastructure doesn't exist for most Indian brands shipping cross-border"
- "Local warehousing in NA requires capital you do not want to commit on day one"

**Section 3 — The Flexible Entry Model (the differentiator):**
- Three-phase visualization: Direct → Hybrid → Full Fulfillment
- "Most logistics providers force you into warehousing. We let you start lean and scale when the numbers work."

**Section 4 — How It Works:**
- Step-by-step illustration: order placed in India → handed to TXG → bulk consolidation → break-bulk in NA → last-mile to customer
- Numbers: "7–12 day delivery" / "50% lower per-order cost" / "Full visibility"

**Section 5 — Why TXG (incumbent positioning):**
- "12 years of NA logistics history"
- "80–90% Canadian, 70% US pincode coverage"
- "Owned warehouses on both sides of the border"
- "Vector platform — your shipments, your data, real-time"

**Section 6 — Tools (high-converting):**
- Embedded shipping cost calculator preview ("Enter your current per-order cost. See what TXG would charge.")
- ROI calculator
- Cross-Border Readiness Quiz

**Section 7 — The Playbook (lead magnet):**
- "Download: The Complete India → North America Cross-Border Playbook (28 pages, free)"
- Email gate

**Section 8 — Industries served:**
- Vertical pages linked

**Section 9 — Final CTA:**
- "Ready to talk? Book your free strategy call. We will show you the exact unit economics for your category and SKUs."

**Footer**

### 4.3 Solutions Pages (six pages)

Each solution page follows the same structure:

1. **Hero** — clear service description + primary CTA
2. **What it includes** — bullet list of inclusions, exclusions, scope
3. **Best for** — ICP fit (which type of brand should choose this)
4. **How it works** — step-by-step with visuals
5. **Pricing logic** — not exact prices, but pricing basis (per kg, per order, per pallet) with examples
6. **Compatible integrations** — Shopify, WooCommerce, Amazon, etc.
7. **Case studies** — 2-3 featured (when available)
8. **FAQ** — top 8–10 questions, schema-marked for rich snippets
9. **CTA** — book consultation specific to this solution

### 4.4 Industry Pages (six pages)

Each industry page:

1. **Hero** — "Cross-border fulfillment for [Fashion/Beauty/etc.] brands"
2. **Specific pain points** for that vertical (compliance, fragility, seasonality, sizing/returns)
3. **TXG's tailored approach** for that vertical
4. **Vertical-specific case studies**
5. **Compliance and certifications relevant** (FSSAI for food, AYUSH for wellness, etc.)
6. **CTA**

### 4.5 Tool Pages (three pages)

#### `/tools/shipping-calculator`

Interactive calculator embedded in page:
- Inputs: origin city (India), destination country (US/Canada), product weight, dimensions, monthly volume estimate
- Outputs: estimated cost per order across the three TXG service models, comparison to "typical 3PL" pricing, projected delivery time
- Email gate before showing detailed breakdown PDF download
- Lead created in Vector pipeline with all inputs captured (high-quality lead data)

#### `/tools/roi-calculator`

- Inputs: current monthly NA orders, current cost per order, current avg delivery time, current return rate
- Outputs: monthly savings, annual savings, time saved per order, customer experience improvement projection
- Email gate for detailed PDF report
- Lead enters pipeline with full ROI profile pre-computed

#### `/tools/readiness-quiz`

- 10–12 questions: company stage, current international orders, current logistics, pain points, growth goals
- Output: Cross-Border Readiness Score (0–100) + tier recommendation (Tier 1/2/3 ICP) + tailored next steps
- Email gate for full report
- Lead enters pipeline tagged with quiz answers (extremely high-quality personalization data)

### 4.6 Blog (`/blog`)

- Index page with category filtering, search, featured posts
- Article template: clear typography, table of contents (sidebar on desktop, collapsible on mobile), inline CTAs, related articles, author bio (Draz, Gagan, or guest), share buttons, comments via Disqus or none (decision later)
- Schema markup: Article, BlogPosting, Author, Organization
- RSS feed
- Newsletter signup CTAs in-line and at end of every article

### 4.7 Case Studies (`/case-studies`)

- Index with filtering by industry, service, geography, deal size
- Individual case study template (when first cases available):
  - Brand intro, vertical, geography
  - The challenge (specific pain points, before metrics)
  - The solution (which TXG model, why)
  - Implementation (timeline, integration details)
  - Results (specific metrics: cost savings, delivery time, conversion impact, return rate)
  - Quote from founder/operator
  - "What's next" — expansion plans
- Each case study downloadable as PDF (gated lead magnet)
- Anonymized template available for cases where client requests confidentiality (per user's instruction not to disclose names)

### 4.8 About (`/about`)

- The story (12 years of Transway Transport, founding of TXG in 2023, the 4PL pivot)
- Leadership: Gagan, Draz, Daniel, key team members with photos and bios
- Facilities: Buffalo, NY and Etobicoke, ON with photos, square footage, capacity, addresses
- Values
- Press mentions

### 4.9 Coverage (`/coverage`)

Interactive map:
- Canada and US pincode coverage visualization
- Click any pincode → confirmation of delivery service + estimated transit time
- Service radius around each facility
- High-volume corridors highlighted

### 4.10 Quote / Booking (`/quote`)

- Consultation booking flow:
  - Brand info (name, website, vertical)
  - Volume estimate (current monthly orders, projected)
  - Geographic focus
  - Current logistics setup (open text or multiple choice)
  - Goals (multiple choice: cost reduction, faster delivery, returns, expansion)
  - Calendly integrated for time selection
- On submission: lead created in Vector, routed to Daniel or appropriate AE based on tier inference, confirmation email sent, calendar invite created

---

## 5. Content Model

### 5.1 Content Types

Each is a structured record in the database, not free-form HTML. Content management is via Vector's Content Calendar (Layer 3.1) — Claude Code drafts, founder approves, system publishes to website.

| Type | Fields | Example |
|------|--------|---------|
| Blog Article | title, slug, excerpt, body (markdown), author, category, tags, hero_image, seo_title, seo_description, schema_markup, published_at, related_articles | "What is a 4PL and why it matters for Indian D2C brands" |
| Case Study | brand_name (anonymized when needed), vertical, service, challenge, solution, results (jsonb metrics), quote, hero_image, published_at | "How [Anonymized Beauty Brand] cut delivery time from 18 to 7 days" |
| Solution Page | title, description, inclusions, exclusions, ideal_for, how_it_works (steps), pricing_basis, integrations, faq | "Direct Cross-Border Shipping" |
| Industry Page | industry, pain_points, approach, certifications, case_studies (refs), faq | "Fashion & Apparel" |
| Lead Magnet | title, description, hero_image, file_url, length_pages, gated_form_fields, post_download_email_sequence_id | "The India → NA Playbook" |
| Tool | tool_name, inputs (jsonb schema), outputs (jsonb schema), result_pdf_template, email_capture_required | Shipping Cost Calculator |
| Author | name, bio, photo, linkedin_url, articles_authored_count | Draz, Gagan |
| Page Block | type (hero/feature/cta/etc.), content (jsonb), order, page_id | Reusable building blocks |

### 5.2 Content Workflow

```
[Vector Content Calendar]
   ↓ (draft created — by Claude Code or human)
[Review queue in Vector]
   ↓ (founder/marketing approves)
[Published — auto-pushes to website via API]
   ↓
[Website renders from Supabase]
```

The website itself does not have a CMS. Vector IS the CMS. The website queries Supabase for content. This means a single editing experience for everyone, no double-entry, no separate WordPress admin.

### 5.3 SEO Per Content Piece

Every content type has SEO fields:
- `seo_title` (auto-generated from title if blank, max 60 chars)
- `seo_description` (auto-generated from excerpt if blank, max 160 chars)
- `og_image` (auto-generated if blank using brand template)
- `canonical_url`
- `structured_data` (jsonb — Article, BreadcrumbList, FAQPage, etc.)
- `target_keyword` (primary)
- `secondary_keywords` (array)

Claude Code's content generation jobs populate these fields automatically.

---

## 6. SEO Architecture

### 6.1 Technical Foundation

- **Next.js 15+ App Router** with React Server Components for fast static rendering
- **Vercel hosting** with Edge Network for global low-latency delivery
- **Image optimization** via Next.js Image component (AVIF/WebP, lazy load, blurred placeholder)
- **Sitemap.xml** auto-generated from content database, submitted to Google and Bing
- **robots.txt** properly configured
- **Schema.org structured data** on every page (Organization, Article, FAQPage, Product, Service, BreadcrumbList, LocalBusiness for facility pages)
- **Open Graph + Twitter Card** meta tags on every page
- **Canonical tags** on every page
- **hreflang tags** for India/NA/future Hindi variants
- **Core Web Vitals targets:**
  - LCP < 1.5s
  - FID < 100ms
  - CLS < 0.1
- **Lighthouse mobile score:** 95+
- **Page weight:** under 1MB initial load

### 6.2 Keyword Strategy (Tier 1 — Pillars)

Pillar pages target high-volume, high-intent queries. These are major content investments, designed to rank long-term.

| Pillar Topic | Target Keywords | Pillar Page |
|--------------|-----------------|-------------|
| Cross-border fulfillment India to NA | "ship from India to USA", "fulfillment India to North America", "cross-border ecommerce India" | /solutions/cross-border-fulfillment |
| 4PL services | "what is a 4PL", "4PL company", "4PL vs 3PL", "best 4PL for ecommerce" | /resources/what-is-a-4pl (long-form pillar article) |
| Indian D2C export to USA | "Indian D2C international expansion", "Indian brands selling in USA", "export from India ecommerce" | /india |
| Cost of shipping India to USA | "cost to ship from India to USA", "India to USA shipping cost", "cheapest way to ship India to USA" | /tools/shipping-calculator |
| Customs clearance for Indian exporters | "customs clearance for D2C exports India", "duties for shipping to USA from India" | /resources/customs-clearance-guide |

### 6.3 Keyword Strategy (Tier 2 — Cluster Articles)

Each pillar has 8–15 supporting articles published over 90 days, targeting long-tail queries that link back to the pillar. This is the SEO Content Engine (Layer 3.2 in platform spec) producing the cluster.

### 6.4 Local SEO

- Google Business Profile for Buffalo, NY (verified, photos, regular posts)
- Google Business Profile for Etobicoke, ON
- Local schema (LocalBusiness) on /about/facilities pages
- NAP (Name, Address, Phone) consistency across all listings
- Industry directory submissions: FreightWaves directory, Logistics Management, CSCMP directory, GlobalTrade.net

### 6.5 International SEO

- hreflang for `en-IN` (India), `en-US` (US), `en-CA` (Canada), `hi-IN` (Hindi, future)
- Country-specific currency display (INR for India audience, USD for US, CAD for Canada)
- Country-specific case studies surfaced first (Indian brand stories on /india, NA stories on /us and /canada)
- Geographic targeting in Google Search Console for each region

### 6.6 Performance Monitoring

- Google Search Console (verified, sitemap submitted, indexation monitored)
- Google Analytics 4 (or privacy-friendly alternative like Plausible/Fathom — decision later)
- Search rank tracking via lightweight tool (manual or Ahrefs free if budget allows)
- Monthly SEO performance review built into weekly auto-reports

---

## 7. Lead Capture Mechanisms

### 7.1 Capture Points (every site visit has multiple opportunities)

| Mechanism | Pages | Quality | Volume |
|-----------|-------|---------|--------|
| Primary "Get Quote" CTA | All pages, sticky | Highest | Low |
| Calendly booking flow | /quote | Highest | Low-Med |
| Free tools (calculator, ROI, quiz) | /tools/* | High | Medium |
| Lead magnet downloads | /resources/* | Med-High | Medium |
| Newsletter signup | Footer, blog sidebar, exit-intent | Medium | High |
| Webinar registration | Phase 1 activation | High | Variable |
| Contact form | /contact | Variable | Low |
| Live chat | Phase 1 (not in MVP) | Variable | Variable |

### 7.2 Form Standards

Every form follows the same standards:
- Minimum fields (no friction): email + role-relevant follow-up
- Smart defaults (geographic detection, vertical inference where possible)
- Inline validation (no submit-then-error)
- Auto-progressive profiling (if user already submitted email, don't ask again — ask the next field instead)
- Confirmation page with clear next step (not just "Thanks for submitting")
- Anti-spam (honeypot field + reCAPTCHA v3 on critical forms only)
- GDPR-compliant consent checkbox where required
- Unsubscribe headers in all emails

### 7.3 Lead Routing

```
Form submitted on website
   ↓
Webhook fires to Vector
   ↓
Lead created in Supabase (leads table)
   ↓
Auto-classification by Claude Code job (within minutes):
   - ICP tier inference (firmographic signals from form data)
   - Initial scoring
   - Vertical assignment
   - Persona match
   ↓
Routing rules:
   - Tier 1 → Daniel (AE) immediately, alert sent
   - Tier 2 → Round-robin Angad/Jatin
   - Tier 3 → Daniel
   - Tier 4 → Founder community + nurture
   - Tier 5 → Pure nurture, low-touch
   ↓
Initial response automation:
   - Confirmation email (Resend, immediate)
   - First touch in nurture sequence (depending on tier and source)
   - Notification to assigned SDR/AE in Vector
```

### 7.4 Conversion Tracking

Every form conversion fires:
- GA4 event with form name, page, lead tier estimate
- UTM parameters captured to attribution table
- Source/medium/campaign tracked
- A/B test variant tracked if applicable

---

## 8. Tools — Detailed Specifications

### 8.1 Shipping Cost Calculator

**Purpose:** Highest-converting tool. Captures real cost data from prospects, gives them concrete savings numbers, creates a high-intent lead.

**Inputs:**
- Origin (dropdown: Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Other)
- Destination (US, Canada, Both)
- Average product weight (kg, dropdown ranges)
- Average dimensions (small/medium/large/oversize, with tooltip definitions)
- Estimated monthly orders (slider: 50, 100, 500, 1000, 5000+)
- Current shipping cost per order (text input, optional)
- Average delivery time today (slider, optional)

**Outputs:**
- TXG estimated cost per order in three models: Direct, Hybrid, Full Fulfillment (with assumptions disclosed)
- Estimated delivery time for each model
- Comparison to provided current cost (if entered)
- Annual savings projection
- "Send detailed breakdown to your inbox" CTA — email capture

**Backend logic:**
- Static pricing matrix (configurable in Vector by Daniel/Gagan, not exposed publicly)
- Margin and rate logic stays internal; tool surfaces results, not methodology
- Saved to `tool_uses` table for analytics + as lead context

### 8.2 ROI Calculator

**Purpose:** For brands already shipping internationally — quantifies the financial gain of switching to TXG.

**Inputs:**
- Current monthly NA orders
- Current cost per order
- Current average delivery days
- Current return rate (%)
- Current customer LTV (optional)
- Vertical

**Outputs:**
- Monthly savings (cost differential × orders)
- Annual savings
- Estimated CSAT improvement (from delivery time reduction)
- Estimated repeat purchase impact
- Estimated returns reduction value
- Total annual value of switching
- "Get the full ROI report" — gated PDF

### 8.3 Cross-Border Readiness Quiz

**Purpose:** Self-segmenting lead capture. The output guides the prospect AND tells TXG exactly how to engage them.

**Questions (10–12):**
1. Are you currently selling internationally? (No / Some orders / Significant orders)
2. Where do you want to expand first? (US / Canada / Both / Other)
3. What is your current monthly Indian GMV? (ranges)
4. What's your biggest barrier? (Cost / Speed / Returns / Operations / Customs / All)
5. Do you have a US/Canada team or partner today? (Yes / No)
6. What is your funding stage? (Bootstrap / Seed / Series A+)
7. What is your vertical? (multiple choice)
8. How important is delivery speed for your category? (1–5)
9. Do you currently offer returns to NA customers? (Yes / No / Not sure)
10. When do you want to launch in NA? (Immediately / 3 months / 6 months / Exploring)

**Outputs:**
- Readiness score (0–100)
- Tier classification (you're a fit for Tier 1 / 2 / 3 / 4 / 5 — internal only)
- Recommended TXG model (Direct / Hybrid / Full Fulfillment)
- Personalized next steps (3 actionable items)
- "Talk to our cross-border specialist" CTA

---

## 9. Design System

### 9.1 Visual Language

Aligned with Vector's redesign committed earlier:
- White / off-white surfaces
- Deep navy (`#0d1e3d`) primary text
- TXG orange (`#f75928`) singular accent — used for primary CTAs and active states
- Calm, premium, enterprise — not loud, not bright

### 9.2 Typography

- **Display (hero, big numbers):** Nunito Sans 800
- **Headlines (section titles, H1, H2):** Manrope 700
- **Body (paragraph text):** DM Sans 400
- **Mono (technical, code-like):** Consolas

### 9.3 Page Templates

Five master templates cover 90% of pages:
1. **Hero + Sections** (home, India home, solution pages, industry pages)
2. **Long-form content** (blog articles, guides)
3. **Tool/Calculator** (interactive, multi-step, results display)
4. **Listing** (blog index, case studies index, resources index)
5. **Conversion** (quote form, booking flow, contact)

Each template has 4–8 reusable section components: hero, feature grid, stats strip, testimonial, CTA, FAQ, content + sidebar, comparison table.

### 9.4 Imagery & Photography

- Custom photography of Buffalo and Etobicoke facilities (commissioned in Week 2–3 of website rebuild)
- Real warehouse operations, real trucks, real team — no stock
- Where stock is necessary (industry pages, conceptual visuals): consistent style only, premium stock (Stocksy or similar)
- Custom illustrations for data visualization (coverage map, flow diagrams) — vector-based, brand-aligned
- All images: AVIF + WebP with JPEG fallback, multiple sizes, properly alt-tagged

### 9.5 Motion

- Subtle entrance animations on scroll (fade + small Y translate)
- Hover states: gentle lift (2–3px translateY)
- Page transitions: instant where possible, with route prefetching
- Hero animations: tasteful, performant — not distracting
- Tool interactions: real-time feedback, animated number counters where outputs change

### 9.6 Accessibility

- WCAG 2.1 AA target
- Semantic HTML throughout
- Keyboard navigation everywhere
- Screen reader testing
- Color contrast ratios verified
- Form labels and errors properly associated
- Focus indicators visible

---

## 10. Technical Stack

### 10.1 Stack Decisions

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 15+ App Router | Same as TXG Vector; SSG + ISR + RSC for fast SEO; team familiarity |
| Hosting | Vercel | Best-in-class Next.js hosting; edge network; auto-scaling |
| Data | Supabase (shared with Vector) | Single source of truth; no duplication; RLS-secured |
| Email | Resend | Same as Vector |
| Forms | Server Actions (Next.js native) | No third-party form service needed |
| Analytics | Google Analytics 4 + Plausible (privacy-respecting alternative running in parallel) | GA for marketing data, Plausible for clean privacy-friendly metrics |
| Search (on-site) | Postgres FTS via Supabase | No Algolia/external dependency at this stage |
| CMS | Custom (Vector's Content Calendar) | One CMS, one editing experience |
| Image hosting | Supabase Storage + Next.js Image | No Cloudinary / external dependency |
| Booking | Calendly embed | Already used by sales team |

### 10.2 Environment Strategy

- `dev.transwayxpress.com` — preview deploys for every PR
- `staging.transwayxpress.com` — pre-production review environment
- `transwayxpress.com` — production

### 10.3 Performance Budgets

| Metric | Budget |
|--------|--------|
| Initial page weight | < 1MB |
| First Contentful Paint | < 1.0s |
| Largest Contentful Paint | < 1.5s |
| Time to Interactive | < 2.5s |
| Cumulative Layout Shift | < 0.05 |
| First Input Delay | < 100ms |
| JS bundle (initial) | < 200KB compressed |

Enforced in CI via Lighthouse CI on every PR.

---

## 11. Migration Plan

### 11.1 Track A — Emergency WP Fixes (Week 1)

Done immediately on existing WordPress site to bridge the rebuild window. No new functionality — only critical credibility and capture fixes.

| Fix | Method | Time |
|-----|--------|------|
| Remove lorem ipsum testimonials | Direct Elementor edit (admin login) | 30 min |
| Add /india landing page | Elementor template (basic version) | 4 hours |
| Replace generic CTAs with specific Vector-routed forms | Add HTML/JS form, webhook to Vector | 2 hours |
| Fix homepage hero copy | Elementor edit | 30 min |
| Add proper meta titles and descriptions on key pages | Yoast SEO plugin | 2 hours |
| Connect newsletter signup to Vector | Webhook from current form | 1 hour |
| Submit verified ownership to Google Search Console | DNS verification | 30 min |
| Add basic schema markup | Insert JSON-LD via tag manager | 1 hour |

Total: 1 day of work on existing WordPress, buying 4–6 weeks of cover.

### 11.2 Track B — Real Rebuild (Weeks 2–8)

| Week | Milestone |
|------|-----------|
| 2 | Next.js project scaffolded; design system implemented; home + India home wireframes built |
| 3 | NA home, India home, About, Contact, Quote pages live in staging |
| 4 | Solutions pages (6) + Industries pages (6) live in staging |
| 5 | Tools (3) live and functional in staging — calculator, ROI, quiz |
| 6 | Blog + Case Studies + Resources sections live in staging; 12 articles migrated/produced |
| 7 | Final polish, performance optimization, accessibility audit, copy review |
| 8 | Production cutover: DNS swap from WordPress to Vercel |

### 11.3 Production Cutover

```
Day 1: Final smoke tests on staging
Day 2: Deploy to production Vercel (transwayxpress.com)
Day 2: Update DNS A/CNAME records
Day 2: Set up 301 redirects from old WP URLs to new URLs (preserve SEO)
Day 3: Monitor traffic, error logs, Search Console for indexation issues
Day 7: WordPress site decommissioned (kept as backup for 30 days, then deleted)
```

### 11.4 SEO Preservation

- Every old URL mapped to a new URL (or 410 if deprecated)
- 301 redirects in place from Day 1 of cutover
- Google Search Console "Change of Address" filed if domain changes (not needed if same domain)
- Sitemap submitted with new structure
- Internal linking audit ensures no orphaned old URLs in new site
- Indexation monitoring weekly post-launch

---

## 12. Content Plan (Launch + 90 Days)

### 12.1 Launch Content (live at cutover)

- 1 NA Home + 1 India Home
- 6 Solution pages
- 6 Industry pages
- 3 Tool pages (live, functional)
- About + Leadership + Facilities + Coverage + Press + Contact + Quote
- 12 Blog articles (initial cluster targeting Pillar 1 keywords)
- 2 Lead magnets ready for download
- 0 Case studies (placeholders + "case studies launching soon")

### 12.2 Post-Launch 90-Day Content (added by Layer 3 engine)

- 24 additional blog articles (2/week)
- 3–5 case studies as clients close and approve documentation
- 2 additional lead magnets
- Quarterly cross-border industry update
- Customs/compliance guide series
- Vertical deep-dives (one per industry)

### 12.3 Editorial Calendar Integration

The website's content lives in Vector's Content Calendar. The marketing team (Draz, Gagan, future hires) sees one calendar — what's drafted, scheduled, published, performing — across blog, social, email, and lead magnets simultaneously. Atomization (Layer 3.5) means every long-form piece becomes derivative content automatically.

---

## 13. Analytics & Measurement

### 13.1 Tracking Setup

- GA4 with enhanced events (form submissions, tool uses, CTA clicks, scroll depth, video plays)
- Conversion goals defined: quote_requested, lead_magnet_downloaded, newsletter_signed_up, calculator_used, quiz_completed
- UTM parameters preserved through funnel
- Server-side events for backend conversions (lead created, qualified, closed) tied to original visit
- Plausible Analytics in parallel (cookie-free, privacy-respecting)

### 13.2 Reporting (auto-generated weekly)

- Traffic by source/medium
- Top pages by traffic
- Top pages by conversion
- Conversion rates per CTA
- Tool usage statistics
- Newsletter performance
- Blog article performance (traffic, engagement, conversions attributed)
- SEO progress: keyword rankings, organic traffic growth, indexation health

### 13.3 Attribution to Pipeline

Website conversions feed Vector's attribution model (Layer 10.1 in platform spec). Every closed deal can be traced back to the original website visit, the article they read, the tool they used, the lead magnet they downloaded, and the conversion event that became a lead. This is the foundation of measuring what content actually generates revenue.

---

## 14. Out of Scope (Phase 0 — deferred to later)

- **Hindi content** (Phase 2 — when India primary traction is confirmed)
- **Live chat** (Phase 1 — when team has bandwidth to staff it)
- **Customer portal login** (already in Vector; no marketing site duplication needed)
- **E-commerce / self-serve booking** (sales is consultative; not appropriate)
- **Webinar registration system** (Phase 1 — when audience exists)
- **Forum / community on the site itself** (community lives on WhatsApp/Telegram/LinkedIn)
- **Job board / careers section** (not a hiring priority in Phase 0)
- **Video case studies** (Phase 1 — once first cases close)
- **Podcast hosting on site** (Phase 1)

---

## 15. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Rebuild slips past 8 weeks | Medium | Medium | WP emergency fixes provide cover; weekly check-ins |
| Migration breaks SEO (old rankings lost) | Medium | High | Comprehensive 301 redirects, gradual rollout, Search Console monitoring |
| Tool calculations are inaccurate | Medium | Medium | Conservative pricing assumptions, "estimate" language, sales team confirms in conversation |
| Form submissions don't reach Vector | Low | High | Webhook retry logic, monitoring, daily reconciliation |
| Page speed regresses post-launch | Medium | Medium | Lighthouse CI in PRs, performance budgets enforced |
| Content production lags (relying on Claude Code) | Medium | Medium | Buffer of 8–12 articles ready before launch |
| Hosting costs balloon | Low | Low | Vercel pricing predictable; Supabase costs scale with usage but reasonable |

---

## 16. Approval Required

Sections requiring user review before implementation begins:

- [ ] Site mission and audience routing (Section 2)
- [ ] Information architecture (Section 3)
- [ ] Page-by-page specifications (Section 4)
- [ ] Content model (Section 5)
- [ ] SEO architecture (Section 6)
- [ ] Lead capture mechanisms (Section 7)
- [ ] Tool specifications (Section 8)
- [ ] Design system (Section 9)
- [ ] Technical stack (Section 10)
- [ ] Migration plan (Section 11)
- [ ] Phase 0 content plan (Section 12)
- [ ] Out-of-scope deferrals (Section 14)

After approval, implementation moves to detailed plan via the writing-plans skill, with the rebuild planned as a parallel track to the platform build.
