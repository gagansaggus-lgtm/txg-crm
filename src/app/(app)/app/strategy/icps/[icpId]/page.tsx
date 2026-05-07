import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { IcpEditor } from "@/components/marketing/icp-editor";
import { PersonaList } from "@/components/marketing/persona-list";
import { getIcpDetail } from "@/lib/supabase/queries/strategy";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function IcpDetailPage({
  params,
}: {
  params: Promise<{ icpId: string }>;
}) {
  const { icpId } = await params;
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const detail = await getIcpDetail(supabase, ctx.workspaceId, icpId);
  if (!detail) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/app/strategy/icps"
        className="text-xs text-[var(--ink-500)] hover:text-[var(--accent-600)]"
      >
        ← All ICPs
      </Link>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardContent className="p-6">
            <IcpEditor icp={detail.icp} />
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardContent className="p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)] mb-3">
                Stats
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-[var(--ink-500)]">Personas</span>
                  <strong className="text-[var(--ink-950)]">
                    {detail.personas.length}
                  </strong>
                </li>
                <li className="flex justify-between">
                  <span className="text-[var(--ink-500)]">Leads matched</span>
                  <strong className="text-[var(--ink-950)]">
                    {detail.lead_count}
                  </strong>
                </li>
                <li className="flex justify-between">
                  <span className="text-[var(--ink-500)]">Status</span>
                  <strong className="text-[var(--ink-950)]">
                    {detail.icp.active ? "Active" : "Inactive"}
                  </strong>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)] mb-3">
            Personas in this ICP
          </p>
          <PersonaList icpId={detail.icp.id} personas={detail.personas} />
        </CardContent>
      </Card>
    </div>
  );
}
