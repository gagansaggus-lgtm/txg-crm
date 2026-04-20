import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { FacilityBadge } from "@/components/ui/facility-badge";
import { StatusPill, receiptStatusTone } from "@/components/ui/status-pill";
import { ReceiptLinesEditor } from "@/components/warehouse/receipt-lines-editor";
import { formatDateTime } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function InboundReceiptDetailPage({
  params,
}: {
  params: Promise<{ receiptId: string }>;
}) {
  const { receiptId } = await params;
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;

  const supabase = await createSupabaseServerClient();
  const { data: receipt, error } = await supabase
    .from("inbound_receipts")
    .select("*, customers(id, display_name), facilities(id, code, name)")
    .eq("workspace_id", ctx.workspaceId)
    .eq("id", receiptId)
    .maybeSingle();
  if (error || !receipt) notFound();

  const customer = (receipt as Record<string, unknown>).customers as { id: string; display_name: string } | null;
  const facility = (receipt as Record<string, unknown>).facilities as { id: string; code: string; name: string } | null;
  const customerId = (receipt.customer_id as string) || customer?.id || "";

  const [linesRes, skusRes] = await Promise.all([
    supabase
      .from("inbound_receipt_lines")
      .select("*")
      .eq("receipt_id", receiptId)
      .order("id"),
    supabase
      .from("skus")
      .select("id, sku_code, description, uom")
      .eq("workspace_id", ctx.workspaceId)
      .eq("customer_id", customerId)
      .order("sku_code"),
  ]);

  const lines = (linesRes.data ?? []).map((l) => ({
    id: l.id as string,
    sku_code: (l.sku_code as string | null) ?? null,
    description: (l.description as string | null) ?? null,
    expected_qty: Number(l.expected_qty),
    received_qty: Number(l.received_qty),
    uom: (l.uom as string | null) ?? null,
    lot_code: (l.lot_code as string | null) ?? null,
    condition: (l.condition as string | null) ?? null,
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Receipt"
        title={receipt.receipt_number ?? `Receipt ${String(receiptId).slice(0, 8)}`}
        subtitle={customer ? customer.display_name : undefined}
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusPill label={receipt.status as string} tone={receiptStatusTone(receipt.status as string)} />
        {facility ? <FacilityBadge code={facility.code} name={facility.name} /> : null}
      </div>

      <Card>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <InfoRow label="Expected" value={formatDateTime(receipt.expected_at as string | null)} />
          <InfoRow label="Received" value={formatDateTime(receipt.received_at as string | null)} />
          <InfoRow label="Carrier" value={receipt.carrier as string | null} />
          <InfoRow label="BOL" value={receipt.bol_number as string | null} />
        </dl>
        {receipt.notes ? (
          <p className="mt-4 whitespace-pre-wrap rounded-xl bg-[var(--surface-accent)] p-4 text-sm text-[var(--ink-700)]">
            {receipt.notes as string}
          </p>
        ) : null}
      </Card>

      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-500)]">Lines</p>
            <span className="text-xs text-[var(--ink-500)]">{lines.length}</span>
          </div>
          <ReceiptLinesEditor
            receiptId={receiptId}
            customerId={customerId}
            lines={lines}
            skus={(skusRes.data ?? []).map((s) => ({
              id: s.id as string,
              sku_code: s.sku_code as string,
              description: (s.description as string | null) ?? null,
              uom: (s.uom as string | null) ?? null,
            }))}
            status={receipt.status as string}
            receivedAt={(receipt.received_at as string | null) ?? null}
          />
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

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.16em] text-[var(--ink-500)]">{label}</dt>
      <dd className="text-sm text-[var(--surface-ink)]">{value || "—"}</dd>
    </div>
  );
}
