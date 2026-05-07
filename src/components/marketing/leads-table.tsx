import Link from "next/link";

import type { Lead } from "@/types/marketing";
import { cn } from "@/lib/utils";

const STAGE_LABELS: Record<string, string> = {
  raw: "Raw",
  pre_filtered: "Pre-filtered",
  web_verified: "Web ✓",
  signal_checked: "Signals ✓",
  icp_scored: "ICP scored",
  contact_verified: "Contact ✓",
  rejected: "Rejected",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-[var(--surface-soft)] text-[var(--ink-700)]",
  researching: "bg-blue-50 text-blue-700",
  contacted: "bg-amber-50 text-amber-700",
  replied: "bg-purple-50 text-purple-700",
  call_booked: "bg-emerald-50 text-emerald-700",
  qualified: "bg-emerald-100 text-emerald-800",
  proposal: "bg-orange-100 text-orange-800",
  closed_won: "bg-emerald-200 text-emerald-900",
  closed_lost: "bg-red-50 text-red-700",
  nurture: "bg-slate-50 text-slate-700",
  do_not_contact: "bg-red-100 text-red-800",
};

const GRADE_COLORS: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-amber-100 text-amber-800",
  D: "bg-orange-100 text-orange-800",
  F: "bg-red-100 text-red-800",
};

export function LeadsTable({ leads }: { leads: Lead[] }) {
  if (!leads.length) {
    return (
      <div className="px-6 py-12 text-center text-sm text-[var(--ink-500)]">
        No leads match these filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--line-soft)] bg-[var(--surface-soft)]">
            <Th>Company</Th>
            <Th>Vertical</Th>
            <Th>Country</Th>
            <Th className="text-center">Grade</Th>
            <Th className="text-right">Score</Th>
            <Th>Stage</Th>
            <Th>Status</Th>
            <Th className="text-right">GMV (USD)</Th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead.id}
              className="border-b border-[var(--line-soft)] hover:bg-[var(--surface-soft)] transition-colors"
            >
              <Td>
                <Link
                  href={`/app/leads/${lead.id}`}
                  className="font-medium text-[var(--ink-950)] hover:text-[var(--accent-600)]"
                >
                  {lead.display_name ?? lead.legal_name ?? "(no name)"}
                </Link>
                {lead.website ? (
                  <p className="truncate text-[11px] text-[var(--ink-500)]">
                    {lead.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </p>
                ) : null}
              </Td>
              <Td className="text-[13px] text-[var(--ink-700)]">
                {lead.vertical ?? "—"}
              </Td>
              <Td className="text-[13px] text-[var(--ink-700)]">
                {lead.country ?? "—"}
              </Td>
              <Td className="text-center">
                {lead.icp_grade ? (
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                      GRADE_COLORS[lead.icp_grade] ?? "bg-slate-100 text-slate-700",
                    )}
                  >
                    {lead.icp_grade}
                  </span>
                ) : (
                  <span className="text-[var(--ink-400)]">—</span>
                )}
              </Td>
              <Td className="text-right tabular-nums text-[13px] text-[var(--ink-700)]">
                {lead.icp_score ?? "—"}
              </Td>
              <Td>
                <span className="inline-flex rounded-md bg-[var(--surface-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--ink-700)]">
                  {STAGE_LABELS[lead.validation_stage] ?? lead.validation_stage}
                </span>
              </Td>
              <Td>
                <span
                  className={cn(
                    "inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium capitalize",
                    STATUS_COLORS[lead.status] ?? "bg-slate-50 text-slate-700",
                  )}
                >
                  {lead.status.replace(/_/g, " ")}
                </span>
              </Td>
              <Td className="text-right tabular-nums text-[13px] text-[var(--ink-700)]">
                {lead.estimated_gmv_usd
                  ? `$${(lead.estimated_gmv_usd / 1000).toLocaleString()}K`
                  : "—"}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-500)]",
        className,
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3", className)}>{children}</td>;
}
