import Link from "next/link";
import { notFound } from "next/navigation";

import { ActivityTimeline } from "@/components/customers/activity-timeline";
import { ContactEditor } from "@/components/customers/contact-editor";
import { ContractForm } from "@/components/customers/contract-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { StatusPill, customerStatusTone } from "@/components/ui/status-pill";
import { formatDate } from "@/lib/utils";
import { getCustomer } from "@/lib/supabase/queries/customers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

const SERVICE_LABEL: Record<string, string> = {
  warehousing: "Warehousing",
  fulfillment: "Fulfillment",
  last_mile: "Last-mile",
  international_courier: "International courier",
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;

  const supabase = await createSupabaseServerClient();
  const detail = await getCustomer(supabase, ctx.workspaceId, customerId);
  if (!detail) notFound();

  const { customer, contacts, services, contracts, quotes } = detail;

  const { data: rawActivities } = await supabase
    .from("activities")
    .select("*, profiles:author_id(full_name, email)")
    .eq("workspace_id", ctx.workspaceId)
    .eq("customer_id", customerId)
    .order("occurred_at", { ascending: false })
    .limit(20);

  const activities = (rawActivities ?? []).map((a: Record<string, unknown>) => {
    const profile = a.profiles as { full_name?: string; email?: string } | null;
    return {
      id: a.id as string,
      kind: a.kind as "call" | "email" | "note" | "meeting",
      subject: (a.subject as string | null) ?? null,
      body: (a.body as string | null) ?? null,
      occurred_at: a.occurred_at as string,
      author_name: profile?.full_name || profile?.email || null,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customer"
        title={customer.display_name}
        subtitle={customer.legal_name}
        actions={[
          { label: "New quote", href: `/app/quotes/new?customer=${customer.id}` },
          { label: "New receipt", href: `/app/warehouse/inbound/new?customer=${customer.id}` },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusPill label={customer.status} tone={customerStatusTone(customer.status)} />
        {services.map((s) => (
          <StatusPill key={s.id} label={SERVICE_LABEL[s.service_type] ?? s.service_type} tone="info" />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-500)]">Billing</p>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <InfoRow label="Email" value={customer.billing_email} />
              <InfoRow label="Phone" value={customer.billing_phone} />
              <InfoRow label="City" value={customer.billing_city} />
              <InfoRow label="Region" value={customer.billing_region} />
              <InfoRow label="Country" value={customer.billing_country} />
              <InfoRow label="Payment terms" value={customer.payment_terms} />
              <InfoRow label="Currency" value={customer.currency} />
            </dl>
          </div>
        </Card>

        <Card>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-500)]">Contacts</p>
              <span className="text-xs text-[var(--ink-500)]">{contacts.length}</span>
            </div>
            <ContactEditor workspaceId={ctx.workspaceId} customerId={customer.id} contacts={contacts} />
          </div>
        </Card>

        <Card>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-500)]">Contracts</p>
              <Link href="/app/contracts" className="text-xs text-[var(--accent-600)]">View all</Link>
            </div>
            <ContractForm workspaceId={ctx.workspaceId} customerId={customer.id} />
            {contracts.length === 0 ? (
              <p className="text-sm text-[var(--ink-500)]">No contracts yet.</p>
            ) : (
              <ul className="divide-y divide-[var(--line-soft)]">
                {contracts.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium text-[var(--surface-ink)]">{c.name}</p>
                      <p className="text-xs text-[var(--ink-500)]">
                        {formatDate(c.effective_date)}{c.end_date ? ` – ${formatDate(c.end_date)}` : ""}
                      </p>
                    </div>
                    <StatusPill
                      label={c.status}
                      tone={c.status === "active" ? "success" : c.status === "expired" || c.status === "terminated" ? "danger" : "neutral"}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-500)]">Quotes</p>
              <Link href={`/app/quotes/new?customer=${customer.id}`} className="text-xs text-[var(--accent-600)]">
                New quote
              </Link>
            </div>
            {quotes.length === 0 ? (
              <p className="text-sm text-[var(--ink-500)]">No quotes yet.</p>
            ) : (
              <ul className="divide-y divide-[var(--line-soft)]">
                {quotes.map((q) => (
                  <li key={q.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium text-[var(--surface-ink)]">{q.quote_number ?? q.id.slice(0, 8)}</p>
                      <p className="text-xs text-[var(--ink-500)]">
                        {formatDate(q.created_at)} · {q.currency} {q.total}
                      </p>
                    </div>
                    <StatusPill
                      label={q.status}
                      tone={q.status === "accepted" ? "success" : q.status === "rejected" || q.status === "expired" ? "danger" : "info"}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      {customer.notes ? (
        <Card>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-500)]">Notes</p>
            <p className="whitespace-pre-wrap text-sm text-[var(--ink-700)]">{customer.notes}</p>
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-500)]">Activity</p>
          <ActivityTimeline
            workspaceId={ctx.workspaceId}
            customerId={customer.id}
            activities={activities}
          />
        </div>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.16em] text-[var(--ink-500)]">{label}</dt>
      <dd className="text-sm text-[var(--surface-ink)]">{value || "—"}</dd>
    </div>
  );
}
