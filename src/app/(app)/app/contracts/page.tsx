import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { formatDate } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function ContractsPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;

  const supabase = await createSupabaseServerClient();
  const { data: contracts } = await supabase
    .from("contracts")
    .select("*, customers(id, display_name)")
    .eq("workspace_id", ctx.workspaceId)
    .order("effective_date", { ascending: false });

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="CRM" title="Contracts" subtitle="Signed and pending contracts across customers." />

      {!contracts || contracts.length === 0 ? (
        <EmptyState title="No contracts yet" description="Add contracts from the customer detail page." />
      ) : (
        <Card>
          <ul className="divide-y divide-[var(--line-soft)]">
            {contracts.map((c) => {
              const customer = (c as Record<string, unknown>).customers as { id: string; display_name: string } | null;
              return (
                <li key={c.id}>
                  <Link href={`/app/contracts/${c.id}`} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-semibold text-[var(--surface-ink)]">{c.name}</p>
                      <p className="text-xs text-[var(--ink-500)]">
                        {customer?.display_name ?? "—"} · {formatDate(c.effective_date)}
                        {c.end_date ? ` – ${formatDate(c.end_date)}` : ""}
                      </p>
                    </div>
                    <StatusPill
                      label={c.status as string}
                      tone={c.status === "active" ? "success" : c.status === "expired" || c.status === "terminated" ? "danger" : "neutral"}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
