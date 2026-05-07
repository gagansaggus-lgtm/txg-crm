import { LeadImportClient } from "@/components/marketing/lead-import-client";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function LeadImportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pipeline · Leads · Import"
        title="Import leads from CSV"
        subtitle="Upload your StoreLeads export, NA Shopify list, or any CSV. Map columns, preview, then import."
      />
      <Card>
        <CardContent className="p-6">
          <LeadImportClient />
        </CardContent>
      </Card>
    </div>
  );
}
