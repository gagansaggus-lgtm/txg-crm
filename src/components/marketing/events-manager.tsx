"use client";

import { SimpleListManager } from "@/components/marketing/simple-list-manager";
import type { EventRow } from "@/lib/supabase/queries/growth";
import { upsertEventAction } from "@/app/actions/growth";
import { formatDate } from "@/lib/utils";

const TYPES = [
  { value: "trade_show", label: "Trade show" },
  { value: "webinar", label: "Webinar" },
  { value: "meetup", label: "Meetup" },
  { value: "private_event", label: "Private event" },
  { value: "conference", label: "Conference" },
  { value: "other", label: "Other" },
];

const STATUSES = [
  { value: "planned", label: "Planned" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function EventsManager({ events }: { events: EventRow[] }) {
  return (
    <SimpleListManager
      items={events}
      fields={[
        { key: "name", label: "Event name", required: true },
        {
          key: "event_type",
          label: "Type",
          type: "select",
          options: TYPES,
          defaultValue: "trade_show",
        },
        { key: "start_date", label: "Start date", type: "date" },
        { key: "end_date", label: "End date", type: "date" },
        { key: "location", label: "Location" },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: STATUSES,
          defaultValue: "planned",
        },
        { key: "cost_usd", label: "Cost (USD)", type: "number" },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
      upsertAction={(data) =>
        upsertEventAction(
          data as Partial<EventRow> & {
            name: string;
            event_type: EventRow["event_type"];
          },
        )
      }
      itemRender={(e: EventRow) => (
        <>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="rounded-md bg-[var(--surface-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-700)]">
              {e.status}
            </span>
            <span className="text-[10px] uppercase text-[var(--ink-500)]">
              {e.event_type.replace(/_/g, " ")}
            </span>
            {e.start_date ? (
              <span className="text-[11px] text-[var(--ink-500)]">
                {formatDate(e.start_date)}
              </span>
            ) : null}
          </div>
          <p className="text-sm font-semibold text-[var(--ink-950)]">{e.name}</p>
          {e.location ? (
            <p className="text-xs text-[var(--ink-500)]">{e.location}</p>
          ) : null}
          {e.cost_usd ? (
            <p className="text-[11px] text-[var(--ink-500)] mt-1">
              Budget ${e.cost_usd.toLocaleString()}
            </p>
          ) : null}
        </>
      )}
      newButtonLabel="Add event"
      emptyMessage="No events yet. Add D2C Summit, IRCE, MODEX, ProMat, etc."
    />
  );
}
