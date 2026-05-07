import { Card, CardContent } from "@/components/ui/card";
import { PartnersManager } from "@/components/marketing/partners-manager";
import { listPartners } from "@/lib/supabase/queries/growth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function PartnersPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const partners = await listPartners(supabase, ctx.workspaceId);

  const counts = partners.reduce(
    (acc, p) => {
      acc.total++;
      if (p.agreement_status === "signed" || p.agreement_status === "active")
        acc.active++;
      acc.pipeline += p.referral_pipeline_value_usd ?? 0;
      acc.referrals += p.referrals_received ?? 0;
      return acc;
    },
    { total: 0, active: 0, pipeline: 0, referrals: 0 },
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="brand-eyebrow text-[var(--accent-600)]">Growth · Partners</p>
        <h1 className="brand-headline text-3xl text-[var(--ink-950)] mt-2">
          Partnership program
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-700)]">
          Strategic, channel, and tech partners — referral pipeline and co-marketing.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total partners" value={counts.total} />
        <Stat label="Active" value={counts.active} />
        <Stat
          label="Pipeline value"
          value={`$${(counts.pipeline / 1000).toFixed(0)}K`}
        />
        <Stat label="Referrals received" value={counts.referrals} />
      </div>

      <Card>
        <CardContent className="p-6">
          <PartnersManager partners={partners} />
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--line-soft)] bg-[var(--card)] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-500)]">
        {label}
      </p>
      <p className="mt-1 brand-display text-2xl text-[var(--ink-950)]">{value}</p>
    </div>
  );
}
