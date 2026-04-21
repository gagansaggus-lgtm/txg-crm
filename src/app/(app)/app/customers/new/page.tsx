import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerForm } from "@/components/customers/customer-form";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function NewCustomerPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CRM"
        title="Add customer"
        subtitle="Start with the basics. You can edit everything later."
      />
      <Card>
        <CardContent>
          <CustomerForm workspaceId={ctx.workspaceId} />
        </CardContent>
      </Card>
    </div>
  );
}
