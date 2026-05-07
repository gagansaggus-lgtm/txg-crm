import { LeadNewForm } from "@/components/marketing/lead-new-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function NewLeadPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pipeline · Leads · New"
        title="Add a lead manually"
        subtitle="Capture a single brand or contact. For bulk uploads, use Import CSV."
      />
      <Card>
        <CardContent className="p-6">
          <LeadNewForm />
        </CardContent>
      </Card>
    </div>
  );
}
