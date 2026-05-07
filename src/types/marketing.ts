// TypeScript types for marketing platform tables (migrations 0010-0020).

export type AiJobStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export type AiJob = {
  id: string;
  workspace_id: string;
  kind: string;
  params: Record<string, unknown>;
  status: AiJobStatus;
  priority: number;
  scheduled_for: string;
  started_at: string | null;
  completed_at: string | null;
  retry_count: number;
  max_retries: number;
  requested_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AiJobResult = {
  id: string;
  ai_job_id: string;
  output: Record<string, unknown> | null;
  error: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  model_used: string | null;
  duration_ms: number | null;
  created_at: string;
};

// Layer 1 — Strategy & Brand
export type IcpProfile = {
  id: string;
  workspace_id: string;
  tier: "tier_1" | "tier_2" | "tier_3" | "tier_4" | "tier_5" | "na_mid_market" | "custom";
  name: string;
  description: string | null;
  firmographic_criteria: Record<string, unknown>;
  deal_size_min_usd: number | null;
  deal_size_max_usd: number | null;
  sales_motion: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Persona = {
  id: string;
  workspace_id: string;
  icp_profile_id: string | null;
  title: string;
  role_description: string | null;
  pain_points: string[];
  hooks: string[];
  content_recommendations: string[];
  created_at: string;
  updated_at: string;
};

export type Competitor = {
  id: string;
  workspace_id: string;
  name: string;
  website: string | null;
  positioning: string | null;
  pricing_notes: string | null;
  profile: Record<string, unknown>;
  last_scraped_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type CompetitorSignal = {
  id: string;
  workspace_id: string;
  competitor_id: string;
  signal_type:
    | "pricing_change"
    | "new_messaging"
    | "hire"
    | "product_launch"
    | "press"
    | "social"
    | "other";
  content: string | null;
  source_url: string | null;
  observed_at: string;
  created_at: string;
};

// Layer 5 — Outbound
export type LeadValidationStage =
  | "raw"
  | "pre_filtered"
  | "web_verified"
  | "signal_checked"
  | "icp_scored"
  | "contact_verified"
  | "rejected";

export type LeadStatus =
  | "new"
  | "researching"
  | "contacted"
  | "replied"
  | "call_booked"
  | "qualified"
  | "proposal"
  | "closed_won"
  | "closed_lost"
  | "nurture"
  | "do_not_contact";

export type LeadSource =
  | "storeleads"
  | "manual"
  | "website_form"
  | "lead_magnet"
  | "calculator"
  | "quiz"
  | "referral"
  | "partner"
  | "event"
  | "inbound_dm"
  | "cold_research"
  | "other";

export type Lead = {
  id: string;
  workspace_id: string;
  source: LeadSource;
  source_external_id: string | null;
  legal_name: string | null;
  display_name: string | null;
  website: string | null;
  vertical: string | null;
  country: string | null;
  city: string | null;
  estimated_gmv_usd: number | null;
  funding_stage: string | null;
  validation_stage: LeadValidationStage;
  rejection_reason: string | null;
  icp_profile_id: string | null;
  icp_score: number | null;
  icp_grade: "A" | "B" | "C" | "D" | "F" | null;
  enrichment_data: Record<string, unknown>;
  intent_signals: unknown[];
  status: LeadStatus;
  customer_id: string | null;
  last_enriched_at: string | null;
  last_contacted_at: string | null;
  next_action_at: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type LeadContact = {
  id: string;
  workspace_id: string;
  lead_id: string;
  full_name: string | null;
  role_title: string | null;
  persona_id: string | null;
  email: string | null;
  email_status: "unverified" | "verified" | "invalid" | "risky" | "bounced" | null;
  linkedin_url: string | null;
  whatsapp_number: string | null;
  phone: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OutreachChannel =
  | "email"
  | "linkedin_dm"
  | "linkedin_connection"
  | "whatsapp"
  | "voice_note"
  | "phone_call"
  | "sms"
  | "in_person";

export type OutreachSequence = {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  channels: string[];
  steps: Array<{
    step_number: number;
    channel: OutreachChannel;
    day_offset: number;
    template: string;
    subject?: string;
  }>;
  variant_group: string | null;
  active: boolean;
  for_icp_tier: string | null;
  for_persona_id: string | null;
  performance: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type OutreachMessageStatus =
  | "drafted"
  | "queued"
  | "sent"
  | "delivered"
  | "opened"
  | "replied"
  | "bounced"
  | "cancelled"
  | "failed";

export type OutreachMessage = {
  id: string;
  workspace_id: string;
  sequence_id: string | null;
  lead_id: string;
  lead_contact_id: string | null;
  step_number: number | null;
  channel: OutreachChannel;
  subject: string | null;
  body: string;
  personalization_metadata: Record<string, unknown>;
  ai_job_id: string | null;
  status: OutreachMessageStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  opened_at: string | null;
  replied_at: string | null;
  reply_body: string | null;
  reply_sentiment: string | null;
  external_message_id: string | null;
  resend_id: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

// Layer 3 — Content
export type ContentType =
  | "seo_article"
  | "linkedin_post"
  | "instagram_reel_script"
  | "youtube_script"
  | "youtube_short_script"
  | "twitter_thread"
  | "newsletter_issue"
  | "lead_magnet_pdf"
  | "case_study"
  | "whitepaper"
  | "video_script"
  | "podcast_outline";

export type ContentStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "scheduled"
  | "published"
  | "archived";

export type ContentPiece = {
  id: string;
  workspace_id: string;
  content_type: ContentType;
  status: ContentStatus;
  pillar:
    | "education"
    | "authority"
    | "pain_solution"
    | "proof"
    | "behind_scenes"
    | null;
  title: string;
  slug: string | null;
  body: string | null;
  excerpt: string | null;
  metadata: Record<string, unknown>;
  target_persona_id: string | null;
  target_keyword: string | null;
  secondary_keywords: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  hero_image_url: string | null;
  author_id: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  ai_job_id: string | null;
  parent_content_id: string | null;
  performance: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
