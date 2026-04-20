import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";

export default function TicketsPage() {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Service" title="Tickets" subtitle="Coming in phase 2." />
      <Card>
        <p className="text-sm text-[var(--ink-500)]">
          Customer-facing service requests tied to a shipment, order, or receipt. Phase 2 work includes the full ticket UI plus SLA timers. The table already exists in the database so the API is ready.
        </p>
      </Card>
    </div>
  );
}
