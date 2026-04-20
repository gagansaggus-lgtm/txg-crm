import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { formatDate } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const { contractId } = await params;
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;

  const supabase = await createSupabaseServerClient();
  const { data: contract, error } = await supabase
    .from("contracts")
    .select("*, customers(id, display_name)")
    .eq("workspace_id", ctx.workspaceId)
    .eq("id", contractId)
    .maybeSingle();
  if (error || !contract) notFound();

  const customer = (contract as Record<string, unknown>).customers as { id: string; display_name: string } | null;

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Contract" title={contract.name as string} subtitle={customer?.display_name} />

      <div className="flex flex-wrap items-center gap-2">
        <StatusPill
          label={contract.status as string}
          tone={contract.status === "active" ? "success" : contract.status === "expired" || contract.status === "terminated" ? "danger" : "neutral"}
        />
        <span className="text-sm text-[var(--ink-700)]">
          {formatDate(contract.effective_date as string | null)}
          {contract.end_date ? ` – ${formatDate(contract.end_date as string | null)}` : ""}
        </span>
      </div>

      {contract.terms_url ? (
        <Card>
          <a
            href={contract.terms_url as string}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-[var(--accent-600)]"
          >
            Open contract document →
          </a>
        </Card>
      ) : null}

      {contract.notes ? (
        <Card>
          <p className="whitespace-pre-wrap text-sm text-[var(--ink-700)]">{contract.notes as string}</p>
        </Card>
      ) : null}

      {customer ? (
        <Link href={`/app/customers/${customer.id}`} className="text-sm text-[var(--accent-600)]">
          ← Back to {customer.display_name}
        </Link>
      ) : null}
    </div>
  );
}
