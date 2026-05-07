"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";
import type {
  OutreachSequence,
  OutreachMessage,
  OutreachChannel,
} from "@/types/marketing";
import { DEFAULT_SEQUENCE_STEPS } from "@/lib/supabase/queries/outreach";

type ActionResult<T = void> = { ok: boolean; data?: T; error?: string };

// ============== Sequences ==============

export async function createSequenceAction(
  input: {
    name: string;
    description?: string | null;
    channels?: string[];
    for_icp_tier?: string | null;
  },
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("outreach_sequences")
      .insert({
        workspace_id: ctx.workspaceId,
        name: input.name,
        description: input.description ?? null,
        channels: input.channels ?? [
          "linkedin_dm",
          "email",
          "whatsapp",
          "linkedin_connection",
        ],
        for_icp_tier: input.for_icp_tier ?? null,
        steps: DEFAULT_SEQUENCE_STEPS,
      })
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/app/outreach/sequences");
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function updateSequenceAction(
  sequenceId: string,
  updates: Partial<OutreachSequence>,
): Promise<ActionResult> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("outreach_sequences")
      .update(updates)
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", sequenceId);
    if (error) throw error;
    revalidatePath("/app/outreach/sequences");
    revalidatePath(`/app/outreach/sequences/${sequenceId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

// ============== Lead → Sequence assignment ==============

/**
 * Assign a lead to a sequence — generates draft messages for each step,
 * scheduled at the appropriate day offsets. Marks lead status='researching'.
 */
export async function assignLeadToSequenceAction(
  leadId: string,
  sequenceId: string,
): Promise<ActionResult<{ messages_drafted: number }>> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();

    const { data: seq, error: seqErr } = await supabase
      .from("outreach_sequences")
      .select("*")
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", sequenceId)
      .single();
    if (seqErr || !seq) return { ok: false, error: "Sequence not found" };

    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("*, lead_contacts:lead_contacts(*)")
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", leadId)
      .single();
    if (leadErr || !lead) return { ok: false, error: "Lead not found" };

    const contact = (lead.lead_contacts as { id: string; full_name: string | null }[] | null)?.find(
      () => true,
    );

    const steps = (seq.steps as OutreachSequence["steps"]) ?? [];
    const now = Date.now();
    const rows = steps.map((step) => ({
      workspace_id: ctx.workspaceId,
      sequence_id: sequenceId,
      lead_id: leadId,
      lead_contact_id: contact?.id ?? null,
      step_number: step.step_number,
      channel: step.channel as OutreachChannel,
      subject: step.subject ?? null,
      body: renderTemplate(step.template, lead, contact),
      status: "drafted",
      scheduled_at: new Date(
        now + step.day_offset * 24 * 60 * 60 * 1000,
      ).toISOString(),
      assigned_to: ctx.user.id,
    }));

    const { error: msgErr } = await supabase.from("outreach_messages").insert(rows);
    if (msgErr) throw msgErr;

    await supabase
      .from("leads")
      .update({
        status: lead.status === "new" ? "researching" : lead.status,
        next_action_at: rows[0]?.scheduled_at ?? null,
      })
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", leadId);

    revalidatePath(`/app/leads/${leadId}`);
    revalidatePath(`/app/outreach/queue`);
    revalidatePath(`/app/outreach/sequences`);
    return { ok: true, data: { messages_drafted: rows.length } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

// ============== Message lifecycle (mark sent, replied, etc.) ==============

export async function markMessageSentAction(
  messageId: string,
): Promise<ActionResult> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();

    const { data: msg, error: msgErr } = await supabase
      .from("outreach_messages")
      .select("lead_id")
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", messageId)
      .single();
    if (msgErr || !msg) return { ok: false, error: "Message not found" };

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("outreach_messages")
      .update({ status: "sent", sent_at: now })
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", messageId);
    if (error) throw error;

    await supabase
      .from("leads")
      .update({ status: "contacted", last_contacted_at: now })
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", msg.lead_id);

    revalidatePath("/app/outreach/queue");
    revalidatePath(`/app/leads/${msg.lead_id}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function markMessageRepliedAction(
  messageId: string,
  replyBody: string,
  sentiment?: "positive" | "neutral" | "negative",
): Promise<ActionResult> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();

    const { data: msg } = await supabase
      .from("outreach_messages")
      .select("lead_id")
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", messageId)
      .single();
    if (!msg) return { ok: false, error: "Message not found" };

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("outreach_messages")
      .update({
        status: "replied",
        replied_at: now,
        reply_body: replyBody,
        reply_sentiment: sentiment ?? null,
      })
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", messageId);
    if (error) throw error;

    await supabase
      .from("leads")
      .update({ status: "replied" })
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", msg.lead_id);

    revalidatePath("/app/outreach/queue");
    revalidatePath("/app/outreach/replies");
    revalidatePath(`/app/leads/${msg.lead_id}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function updateMessageBodyAction(
  messageId: string,
  body: string,
  subject?: string | null,
): Promise<ActionResult> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("outreach_messages")
      .update({ body, ...(subject !== undefined ? { subject } : {}) })
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", messageId);
    if (error) throw error;
    revalidatePath("/app/outreach/queue");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function cancelMessageAction(messageId: string): Promise<ActionResult> {
  try {
    const ctx = await loadWorkspaceContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("outreach_messages")
      .update({ status: "cancelled" })
      .eq("workspace_id", ctx.workspaceId)
      .eq("id", messageId);
    if (error) throw error;
    revalidatePath("/app/outreach/queue");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

// ============== Helpers ==============

function renderTemplate(
  template: string,
  lead: { display_name?: string | null; legal_name?: string | null; vertical?: string | null },
  contact: { full_name?: string | null } | undefined,
): string {
  const company = lead.display_name ?? lead.legal_name ?? "your team";
  const vertical = lead.vertical ?? "ecommerce";
  const fullName = contact?.full_name ?? "";
  const firstName = fullName ? fullName.split(/\s+/)[0] : "there";
  return template
    .replace(/\{\{first_name\}\}/g, firstName)
    .replace(/\{\{full_name\}\}/g, fullName || firstName)
    .replace(/\{\{company\}\}/g, company)
    .replace(/\{\{vertical\}\}/g, vertical);
}
