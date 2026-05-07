import type { SupabaseClient } from "@supabase/supabase-js";

import type { ContentPiece, ContentType, ContentStatus } from "@/types/marketing";

export async function listContentPieces(
  supabase: SupabaseClient,
  workspaceId: string,
  filters: {
    content_type?: ContentType | ContentType[];
    status?: ContentStatus | ContentStatus[];
    limit?: number;
  } = {},
): Promise<ContentPiece[]> {
  let q = supabase
    .from("content_pieces")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (filters.content_type) {
    if (Array.isArray(filters.content_type))
      q = q.in("content_type", filters.content_type);
    else q = q.eq("content_type", filters.content_type);
  }
  if (filters.status) {
    if (Array.isArray(filters.status)) q = q.in("status", filters.status);
    else q = q.eq("status", filters.status);
  }
  q = q.order("scheduled_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 200);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ContentPiece[];
}

export async function getContentPiece(
  supabase: SupabaseClient,
  workspaceId: string,
  id: string,
): Promise<ContentPiece | null> {
  const { data, error } = await supabase
    .from("content_pieces")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as ContentPiece) ?? null;
}

// Newsletter
export type NewsletterRow = {
  id: string;
  workspace_id: string;
  list_type: "prospect" | "internal" | "partner" | "investor";
  issue_number: number | null;
  subject: string;
  preheader: string | null;
  body: string | null;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  scheduled_at: string | null;
  sent_at: string | null;
  recipient_count: number | null;
  open_count: number | null;
  click_count: number | null;
  created_at: string;
};

export async function listNewsletters(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<NewsletterRow[]> {
  const { data, error } = await supabase
    .from("newsletters")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as NewsletterRow[];
}

// Lead magnets
export type LeadMagnet = {
  id: string;
  workspace_id: string;
  title: string;
  slug: string;
  description: string | null;
  file_url: string | null;
  hero_image_url: string | null;
  page_count: number | null;
  download_count: number;
  active: boolean;
  email_required: boolean;
  trigger_email_sequence: string | null;
  created_at: string;
  updated_at: string;
};

export async function listLeadMagnets(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<LeadMagnet[]> {
  const { data, error } = await supabase
    .from("lead_magnets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("active", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as LeadMagnet[];
}

// SEO keywords (for articles page)
export type SeoKeyword = {
  id: string;
  workspace_id: string;
  keyword: string;
  cluster: string | null;
  search_volume: number | null;
  difficulty: number | null;
  target_url: string | null;
  current_rank: number | null;
  last_checked_at: string | null;
  created_at: string;
};

export async function listSeoKeywords(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<SeoKeyword[]> {
  const { data, error } = await supabase
    .from("seo_keywords")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("search_volume", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as SeoKeyword[];
}
