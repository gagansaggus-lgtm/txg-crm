import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function NewCampaignPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketing"
        title="New campaign"
        subtitle="Compose, pick a segment, and schedule. Draft saves any time — send only runs when you hit Send."
      />
      <Card>
        <CardContent>
          <CampaignForm workspaceId={ctx.workspaceId} />
        </CardContent>
      </Card>
    </div>
  );
}
