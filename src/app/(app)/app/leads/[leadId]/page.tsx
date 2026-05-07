import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { LeadStatusUpdater } from "@/components/marketing/lead-status-updater";
import { LeadEditForm } from "@/components/marketing/lead-edit-form";
import { LeadContactList } from "@/components/marketing/lead-contact-list";
import { LeadOutreachTimeline } from "@/components/marketing/lead-outreach-timeline";
import { getLeadDetail } from "@/lib/supabase/queries/leads";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";
import { cn, formatDateTime } from "@/lib/utils";

const VALIDATION_LABELS: Record<string, string> = {
  raw: "Raw",
  pre_filtered: "Pre-filtered",
  web_verified: "Web verified",
  signal_checked: "Signals checked",
  icp_scored: "ICP scored",
  contact_verified: "Contact verified",
  rejected: "Rejected",
};

const SOURCE_LABELS: Record<string, string> = {
  storeleads: "StoreLeads",
  manual: "Manual entry",
  website_form: "Website form",
  lead_magnet: "Lead magnet",
  calculator: "Tool: calculator",
  quiz: "Tool: quiz",
  referral: "Referral",
  partner: "Partner",
  event: "Event",
  inbound_dm: "Inbound DM",
  cold_research: "Cold research",
  other: "Other",
};

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;

  const supabase = await createSupabaseServerClient();
  const detail = await getLeadDetail(supabase, ctx.workspaceId, leadId);
  if (!detail) notFound();

  const { lead, contacts, messages, icp_profile, assignment } = detail;
  const displayName = lead.display_name ?? lead.legal_name ?? "(no name)";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs">
        <Link
          href="/app/leads"
          className="text-[var(--ink-500)] hover:text-[var(--accent-600)]"
        >
          ← All leads
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="brand-eyebrow text-[var(--accent-600)]">Lead</p>
          <h1 className="brand-headline text-3xl text-[var(--ink-950)]">
            {displayName}
          </h1>
          {lead.website ? (
            <a
              href={lead.website}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[var(--accent-600)] hover:underline"
            >
              {lead.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </a>
          ) : null}
        </div>
        <LeadStatusUpdater leadId={lead.id} currentStatus={lead.status} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
              <Field label="Source" value={SOURCE_LABELS[lead.source] ?? lead.source} />
              <Field
                label="Validation"
                value={VALIDATION_LABELS[lead.validation_stage] ?? lead.validation_stage}
              />
              <Field
                label="ICP Grade"
                value={
                  lead.icp_grade ? (
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                        gradeColor(lead.icp_grade),
                      )}
                    >
                      {lead.icp_grade}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
              <Field label="Score" value={lead.icp_score ?? "—"} />
              <Field label="Vertical" value={lead.vertical ?? "—"} />
              <Field
                label="Country"
                value={lead.country ?? "—"}
              />
              <Field
                label="Est. GMV"
                value={
                  lead.estimated_gmv_usd
                    ? `$${(lead.estimated_gmv_usd / 1000).toLocaleString()}K`
                    : "—"
                }
              />
              <Field
                label="Funding stage"
                value={lead.funding_stage ?? "—"}
              />
            </CardContent>
          </Card>

          {icp_profile ? (
            <Card>
              <CardContent className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)]">
                  Matched ICP profile
                </p>
                <h3 className="mt-1 brand-headline text-lg text-[var(--ink-950)]">
                  {icp_profile.name}
                </h3>
                {icp_profile.description ? (
                  <p className="mt-2 text-sm text-[var(--ink-700)]">
                    {icp_profile.description}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent className="p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)] mb-3">
                Contacts
              </p>
              <LeadContactList leadId={lead.id} contacts={contacts} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)] mb-3">
                Outreach timeline
              </p>
              <LeadOutreachTimeline messages={messages} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardContent className="p-5 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)]">
                Edit
              </p>
              <LeadEditForm lead={lead} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)] mb-3">
                Activity
              </p>
              <ul className="space-y-2 text-xs text-[var(--ink-700)]">
                <li>
                  <span className="text-[var(--ink-500)]">Created: </span>
                  {formatDateTime(lead.created_at)}
                </li>
                {lead.last_enriched_at ? (
                  <li>
                    <span className="text-[var(--ink-500)]">Enriched: </span>
                    {formatDateTime(lead.last_enriched_at)}
                  </li>
                ) : null}
                {lead.last_contacted_at ? (
                  <li>
                    <span className="text-[var(--ink-500)]">Last contact: </span>
                    {formatDateTime(lead.last_contacted_at)}
                  </li>
                ) : null}
                {assignment ? (
                  <li>
                    <span className="text-[var(--ink-500)]">Assigned to: </span>
                    {(assignment.sdr as { full_name?: string; email?: string } | null)
                      ?.full_name ?? "(unknown)"}
                  </li>
                ) : (
                  <li className="text-[var(--ink-500)]">No SDR assigned</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-500)]">
        {label}
      </p>
      <p className="mt-1 text-sm text-[var(--ink-950)] font-medium">{value}</p>
    </div>
  );
}

function gradeColor(g: string) {
  switch (g) {
    case "A":
      return "bg-emerald-100 text-emerald-800";
    case "B":
      return "bg-blue-100 text-blue-800";
    case "C":
      return "bg-amber-100 text-amber-800";
    case "D":
      return "bg-orange-100 text-orange-800";
    case "F":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}
