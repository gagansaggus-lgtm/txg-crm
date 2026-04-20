import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { QuoteForm } from "@/components/quotes/quote-form";
import { listCustomers } from "@/lib/supabase/queries/customers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function NewQuotePage({
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
      <PageHeader eyebrow="CRM" title="New quote" subtitle="A lightweight record to track totals and status. Line items come in a follow-up build." />
      <Card>
        {customers.length === 0 ? (
          <p className="text-sm text-[var(--ink-500)]">Add a customer first.</p>
        ) : (
          <QuoteForm
            workspaceId={ctx.workspaceId}
            customers={customers.map((c) => ({ id: c.id, display_name: c.display_name }))}
            defaultCustomerId={customer}
          />
        )}
      </Card>
    </div>
  );
}
