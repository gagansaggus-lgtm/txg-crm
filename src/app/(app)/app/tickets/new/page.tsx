import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { TicketForm } from "@/components/tickets/ticket-form";
import { listCustomers } from "@/lib/supabase/queries/customers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>;
}) {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const { customer } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const customers = await listCustomers(supabase, ctx.workspaceId);

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Service" title="New ticket" subtitle="Log a customer issue, request, or follow-up." />
      <Card>
        <TicketForm
          workspaceId={ctx.workspaceId}
          customers={customers.map((c) => ({ id: c.id, display_name: c.display_name }))}
          defaultCustomerId={customer}
        />
      </Card>
    </div>
  );
}
