import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  OutreachSequence,
  OutreachMessage,
  OutreachChannel,
  Lead,
} from "@/types/marketing";

// ============== Sequences ==============

export async function listSequences(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<OutreachSequence[]> {
  const { data, error } = await supabase
    .from("outreach_sequences")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("active", { ascending: false })
    .order("name");
  if (error) throw error;
  return (data ?? []) as OutreachSequence[];
}

export async function getSequence(
  supabase: SupabaseClient,
  workspaceId: string,
  sequenceId: string,
): Promise<OutreachSequence | null> {
  const { data, error } = await supabase
    .from("outreach_sequences")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", sequenceId)
    .maybeSingle();
  if (error) throw error;
  return (data as OutreachSequence) ?? null;
}

// ============== Messages (SDR queue) ==============

export type SdrQueueItem = OutreachMessage & {
  lead?: Pick<Lead, "id" | "display_name" | "website" | "vertical" | "icp_grade"> | null;
};

export async function listMyQueue(
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string,
  options: { status?: OutreachMessage["status"][] } = {},
): Promise<SdrQueueItem[]> {
  let query = supabase
    .from("outreach_messages")
    .select(
      "*, lead:leads(id, display_name, website, vertical, icp_grade)",
    )
    .eq("workspace_id", workspaceId)
    .eq("assigned_to", userId);

  if (options.status?.length) {
    query = query.in("status", options.status);
  } else {
    query = query.in("status", ["drafted", "queued"]);
  }

  query = query
    .order("scheduled_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(200);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SdrQueueItem[];
}

export async function listAllQueue(
  supabase: SupabaseClient,
  workspaceId: string,
  options: { status?: OutreachMessage["status"][] } = {},
): Promise<SdrQueueItem[]> {
  let query = supabase
    .from("outreach_messages")
    .select(
      "*, lead:leads(id, display_name, website, vertical, icp_grade)",
    )
    .eq("workspace_id", workspaceId);

  if (options.status?.length) {
    query = query.in("status", options.status);
  }

  query = query.order("created_at", { ascending: false }).limit(200);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SdrQueueItem[];
}

export async function listReplies(
  supabase: SupabaseClient,
  workspaceId: string,
  options: { unread_only?: boolean } = {},
): Promise<SdrQueueItem[]> {
  let query = supabase
    .from("outreach_messages")
    .select(
      "*, lead:leads(id, display_name, website, vertical, icp_grade)",
    )
    .eq("workspace_id", workspaceId)
    .eq("status", "replied");

  if (options.unread_only) {
    // Could later add a 'reviewed_at' column. For now just return all replies.
  }

  query = query.order("replied_at", { ascending: false }).limit(100);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SdrQueueItem[];
}

export async function queueCounts(
  supabase: SupabaseClient,
  workspaceId: string,
  userId?: string,
) {
  let q = supabase
    .from("outreach_messages")
    .select("status", { count: "exact" })
    .eq("workspace_id", workspaceId);
  if (userId) q = q.eq("assigned_to", userId);
  const { data, error } = await q;
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const r of data ?? []) {
    const s = (r as { status: string }).status;
    counts[s] = (counts[s] ?? 0) + 1;
  }
  return counts;
}

// Default 16-touch sequence template for new outbound runs.
export const DEFAULT_SEQUENCE_STEPS: OutreachSequence["steps"] = [
  {
    step_number: 1,
    channel: "linkedin_connection" as OutreachChannel,
    day_offset: 0,
    template:
      "Hi {{first_name}}, I'm researching how brands like {{company}} handle international fulfillment. Would love to connect.",
  },
  {
    step_number: 2,
    channel: "email" as OutreachChannel,
    day_offset: 3,
    subject: "Researching {{company}}'s NA fulfillment",
    template:
      "Hi {{first_name}},\n\nI'm researching how {{vertical}} brands handle their North American fulfillment. {{company}} caught my eye — would you share what's working and what's broken right now? I'll send aggregated findings back to everyone who participates.\n\n— TXG team\n(Asset-based fulfillment for NA · 12 years operating · transwayxpress.com)",
  },
  {
    step_number: 3,
    channel: "linkedin_dm" as OutreachChannel,
    day_offset: 7,
    template:
      "Hi {{first_name}} — following up on my note. Quick question: what's your biggest fulfillment headache right now?",
  },
  {
    step_number: 4,
    channel: "linkedin_dm" as OutreachChannel,
    day_offset: 10,
    template:
      "Hi {{first_name}}, sharing a quick voice note — what we're seeing across {{vertical}} brands working with us.",
  },
  {
    step_number: 5,
    channel: "whatsapp" as OutreachChannel,
    day_offset: 14,
    template:
      "Hi {{first_name}}, this is from TXG — wanted to make sure my LinkedIn note didn't slip through. Mind if I share how we'd cut your per-order cost? 🙏",
  },
  {
    step_number: 6,
    channel: "email" as OutreachChannel,
    day_offset: 21,
    subject: "Quick value share — {{vertical}} fulfillment data",
    template:
      "Hi {{first_name}},\n\nSharing one finding from our research: {{vertical}} brands using TXG's bulk-consolidation model are cutting per-order costs by ~50%, with delivery times down from 15-20 days to 7-12.\n\nWorth a 15-min call to see if it applies to {{company}}?\n\n— TXG team",
  },
  {
    step_number: 7,
    channel: "email" as OutreachChannel,
    day_offset: 35,
    subject: "Case study — {{vertical}} brand",
    template:
      "Hi {{first_name}},\n\nQuick case study from a {{vertical}} brand we onboarded — went from 18-day delivery and 22% return rate to 7-day delivery and 9% returns. Happy to share full details on a call if it helps.\n\n— TXG team",
  },
  {
    step_number: 8,
    channel: "linkedin_dm" as OutreachChannel,
    day_offset: 42,
    template:
      "Hi {{first_name}} — last LinkedIn nudge from me. Want to grab 15 min to walk through what we'd do for {{company}}? If not, no worries, I'll move you off active outreach.",
  },
  {
    step_number: 9,
    channel: "whatsapp" as OutreachChannel,
    day_offset: 49,
    template:
      "Hi {{first_name}}, final attempt — should I close the loop on this or is there a better time?",
  },
];
