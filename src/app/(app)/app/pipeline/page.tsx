import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";

export default function PipelinePage() {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Sales" title="Pipeline" subtitle="Coming in phase 2." />
      <Card>
        <p className="text-sm text-[var(--ink-500)]">
          A simple lead → qualified → quote → signed board. For phase 1, most clients exist already, so quotes and contracts live on the customer detail page.
        </p>
      </Card>
    </div>
  );
}
