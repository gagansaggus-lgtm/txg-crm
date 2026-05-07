import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { LeadsTable } from "@/components/marketing/leads-table";
import { LeadFunnelBar } from "@/components/marketing/lead-funnel-bar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";
import {
  listLeads,
  leadCountsByStage,
  leadCountsByStatus,
} from "@/lib/supabase/queries/leads";
import { cn } from "@/lib/utils";

type SearchParams = {
  search?: string;
  stage?: string;
  status?: string;
  grade?: string;
  page?: string;
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;

  const supabase = await createSupabaseServerClient();
  const pageNum = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const pageSize = 50;

  const [{ leads, total }, stageCounts, statusCounts] = await Promise.all([
    listLeads(supabase, ctx.workspaceId, {
      search: params.search,
      validation_stage: params.stage as never,
      status: params.status as never,
      icp_grade: params.grade as never,
      limit: pageSize,
      offset: (pageNum - 1) * pageSize,
    }),
    leadCountsByStage(supabase, ctx.workspaceId),
    leadCountsByStatus(supabase, ctx.workspaceId),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pipeline · Leads"
        title="Validated leads database"
        subtitle={`${total.toLocaleString()} leads — scored, segmented, and ready for outreach.`}
        actions={[
          { label: "Import CSV", href: "/app/leads/import", variant: "secondary" },
          { label: "New lead", href: "/app/leads/new" },
        ]}
      />

      {total === 0 ? (
        <EmptyState />
      ) : (
        <>
          <LeadFunnelBar counts={stageCounts} />

          <FiltersBar params={params} statusCounts={statusCounts} />

          <Card>
            <CardContent className="p-0">
              <LeadsTable leads={leads} />
            </CardContent>
          </Card>

          {totalPages > 1 ? (
            <Pagination
              page={pageNum}
              totalPages={totalPages}
              params={params}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="px-6 py-12 text-center">
        <p className="brand-display text-2xl text-[var(--ink-950)]">
          No leads yet.
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm text-[var(--ink-500)]">
          Import your StoreLeads CSV, NA Shopify export, or paste leads manually
          to start the validation and outreach pipeline.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/app/leads/import"
            className={cn(buttonVariants({ variant: "default", size: "lg" }))}
          >
            Import CSV
          </Link>
          <Link
            href="/app/leads/new"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Add lead manually
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function FiltersBar({
  params,
  statusCounts,
}: {
  params: SearchParams;
  statusCounts: Record<string, number>;
}) {
  const stages = [
    { value: "", label: "All" },
    { value: "raw", label: "Raw" },
    { value: "pre_filtered", label: "Pre-filtered" },
    { value: "web_verified", label: "Web verified" },
    { value: "signal_checked", label: "Signal checked" },
    { value: "icp_scored", label: "ICP scored" },
    { value: "contact_verified", label: "Contact verified" },
    { value: "rejected", label: "Rejected" },
  ];

  const statuses = [
    { value: "", label: "All status" },
    { value: "new", label: "New" },
    { value: "researching", label: "Researching" },
    { value: "contacted", label: "Contacted" },
    { value: "replied", label: "Replied" },
    { value: "call_booked", label: "Call booked" },
    { value: "qualified", label: "Qualified" },
    { value: "proposal", label: "Proposal" },
    { value: "closed_won", label: "Closed won" },
    { value: "closed_lost", label: "Closed lost" },
    { value: "nurture", label: "Nurture" },
  ];

  return (
    <Card>
      <CardContent className="flex flex-wrap items-end gap-3 px-4 py-3">
        <form
          action="/app/leads"
          method="get"
          className="flex flex-1 min-w-[260px] items-center gap-2"
        >
          <input
            type="search"
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Search name, website…"
            className="h-9 w-full rounded-lg border border-[var(--input)] bg-transparent px-3 text-sm outline-none focus:border-[var(--accent-600)]"
          />
          {params.stage ? (
            <input type="hidden" name="stage" value={params.stage} />
          ) : null}
          {params.status ? (
            <input type="hidden" name="status" value={params.status} />
          ) : null}
          <Button type="submit" variant="outline" size="sm">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-1">
          <span className="text-xs uppercase tracking-wider text-[var(--ink-500)]">
            Stage:
          </span>
          {stages.map((s) => {
            const isActive = (params.stage ?? "") === s.value;
            const href = buildHref({ ...params, stage: s.value || undefined });
            return (
              <Link
                key={s.value || "all"}
                href={href}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-[var(--accent-100)] text-[var(--accent-700)]"
                    : "text-[var(--ink-700)] hover:bg-[var(--surface-soft)]",
                )}
              >
                {s.label}
              </Link>
            );
          })}
        </div>

        <form action="/app/leads" method="get" className="flex items-center gap-2">
          {params.search ? (
            <input type="hidden" name="search" value={params.search} />
          ) : null}
          {params.stage ? (
            <input type="hidden" name="stage" value={params.stage} />
          ) : null}
          <span className="text-xs uppercase tracking-wider text-[var(--ink-500)]">
            Status:
          </span>
          <select
            name="status"
            defaultValue={params.status ?? ""}
            className="h-7 rounded-md border border-[var(--input)] bg-transparent px-2 text-xs outline-none focus:border-[var(--accent-600)]"
          >
            {statuses.map((s) => (
              <option key={s.value || "all"} value={s.value}>
                {s.label}
                {s.value && statusCounts[s.value]
                  ? ` (${statusCounts[s.value]})`
                  : ""}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline" size="sm">
            Apply
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Pagination({
  page,
  totalPages,
  params,
}: {
  page: number;
  totalPages: number;
  params: SearchParams;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--line-soft)] bg-[var(--card)] px-4 py-3">
      <p className="text-sm text-[var(--ink-500)]">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={buildHref({ ...params, page: String(page - 1) })}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Previous
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link
            href={buildHref({ ...params, page: String(page + 1) })}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function buildHref(params: SearchParams): string {
  const sp = new URLSearchParams();
  if (params.search) sp.set("search", params.search);
  if (params.stage) sp.set("stage", params.stage);
  if (params.status) sp.set("status", params.status);
  if (params.grade) sp.set("grade", params.grade);
  if (params.page && params.page !== "1") sp.set("page", params.page);
  const qs = sp.toString();
  return `/app/leads${qs ? `?${qs}` : ""}`;
}
