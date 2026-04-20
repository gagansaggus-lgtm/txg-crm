import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { TicketMessages } from "@/components/tickets/ticket-messages";
import { TicketStatusEditor } from "@/components/tickets/ticket-status-editor";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import {
  ticketPriorityTone,
  ticketStatusTone,
} from "@/components/ui/status-pill-ticket";
import { formatDateTime } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

type TicketStatus = "open" | "pending" | "resolved" | "closed";
type TicketPriority = "low" | "normal" | "high" | "urgent";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;

  const supabase = await createSupabaseServerClient();
  const { data: ticket, error } = await supabase
    .from("tickets")
    .select("*, customers(id, display_name)")
    .eq("workspace_id", ctx.workspaceId)
    .eq("id", ticketId)
    .maybeSingle();
  if (error || !ticket) notFound();

  const { data: rawMessages } = await supabase
    .from("ticket_messages")
    .select("*, profiles:author_id(full_name, email)")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  const customer = (ticket as Record<string, unknown>).customers as { id: string; display_name: string } | null;
  const messages = (rawMessages ?? []).map((m: Record<string, unknown>) => {
    const profile = m.profiles as { full_name?: string; email?: string } | null;
    return {
      id: m.id as string,
      body: m.body as string,
      internal: Boolean(m.internal),
      created_at: m.created_at as string,
      author_name: profile?.full_name || profile?.email || null,
    };
  });

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Ticket"
        title={ticket.subject as string}
        subtitle={customer?.display_name}
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusPill
          label={ticket.status as string}
          tone={ticketStatusTone(ticket.status as TicketStatus)}
        />
        <StatusPill
          label={ticket.priority as string}
          tone={ticketPriorityTone(ticket.priority as TicketPriority)}
        />
        {ticket.related_type ? (
          <StatusPill label={`Re: ${ticket.related_type as string}`} tone="neutral" />
        ) : null}
        {ticket.due_at ? (
          <span className="text-xs text-[var(--ink-500)]">Due {formatDateTime(ticket.due_at as string)}</span>
        ) : null}
      </div>

      <Card>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-500)]">Status</p>
          <TicketStatusEditor
            ticketId={ticketId}
            currentStatus={ticket.status as TicketStatus}
          />
        </div>
      </Card>

      {ticket.body ? (
        <Card>
          <p className="whitespace-pre-wrap text-sm text-[var(--ink-700)]">{ticket.body as string}</p>
        </Card>
      ) : null}

      <Card>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-500)]">Conversation</p>
          <TicketMessages ticketId={ticketId} messages={messages} />
        </div>
      </Card>

      {customer ? (
        <Link href={`/app/customers/${customer.id}`} className="text-sm text-[var(--accent-600)]">
          ← Back to {customer.display_name}
        </Link>
      ) : null}
    </div>
  );
}
