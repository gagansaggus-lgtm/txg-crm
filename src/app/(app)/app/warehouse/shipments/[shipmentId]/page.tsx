import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { FacilityBadge } from "@/components/ui/facility-badge";
import { StatusPill, shipmentStatusTone } from "@/components/ui/status-pill";
import { formatDateTime } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ shipmentId: string }>;
}) {
  const { shipmentId } = await params;
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;

  const supabase = await createSupabaseServerClient();
  const { data: shipment, error } = await supabase
    .from("shipments")
    .select("*, customers(id, display_name), facilities(id, code, name)")
    .eq("workspace_id", ctx.workspaceId)
    .eq("id", shipmentId)
    .maybeSingle();
  if (error || !shipment) notFound();

  const { data: events } = await supabase
    .from("shipment_events")
    .select("*")
    .eq("shipment_id", shipmentId)
    .order("event_at", { ascending: false });

  const customer = (shipment as Record<string, unknown>).customers as { id: string; display_name: string } | null;
  const facility = (shipment as Record<string, unknown>).facilities as { code: string; name: string } | null;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Shipment"
        title={(shipment.shipment_number as string | null) ?? (shipment.tracking_number as string | null) ?? `Shipment ${String(shipmentId).slice(0, 8)}`}
        subtitle={customer?.display_name}
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusPill label={shipment.status as string} tone={shipmentStatusTone(shipment.status as string)} />
        {facility ? <FacilityBadge code={facility.code} name={facility.name} /> : null}
        <StatusPill label={(shipment.type as string).replace("_", " ")} tone="neutral" />
      </div>

      <Card>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <InfoRow label="Carrier" value={shipment.carrier as string | null} />
          <InfoRow label="Service" value={shipment.service_level as string | null} />
          <InfoRow label="Tracking" value={shipment.tracking_number as string | null} />
          <InfoRow label="Weight (kg)" value={shipment.weight_kg as unknown as string | null} />
          <InfoRow label="Shipped" value={formatDateTime(shipment.shipped_at as string | null)} />
          <InfoRow label="Delivered" value={formatDateTime(shipment.delivered_at as string | null)} />
          <InfoRow label="Cost" value={shipment.cost as unknown as string | null} />
          <InfoRow label="Charge" value={shipment.charge as unknown as string | null} />
        </dl>
      </Card>

      <Card>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-500)]">Events</p>
          {!events || events.length === 0 ? (
            <p className="text-sm text-[var(--ink-500)]">No events logged. Phase 2 adds scan-based events.</p>
          ) : (
            <ol className="space-y-3 text-sm">
              {events.map((e) => (
                <li key={e.id} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[var(--accent-500)]" />
                  <div>
                    <p className="font-medium text-[var(--surface-ink)]">{e.event_code}</p>
                    <p className="text-xs text-[var(--ink-500)]">
                      {formatDateTime(e.event_at)} · {e.source}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                    {e.notes ? <p className="text-xs text-[var(--ink-700)]">{e.notes}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          )}
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
      <dd className="text-sm text-[var(--surface-ink)]">{value ?? "—"}</dd>
    </div>
  );
}
