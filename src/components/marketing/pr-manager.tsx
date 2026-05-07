"use client";

import { SimpleListManager } from "@/components/marketing/simple-list-manager";
import type {
  PrContact,
  PressPiece,
  SpeakingEngagement,
} from "@/lib/supabase/queries/growth";
import {
  upsertPrContactAction,
  upsertPressPieceAction,
  upsertSpeakingAction,
} from "@/app/actions/growth";
import { formatDate } from "@/lib/utils";

const PIECE_STATUS = [
  { value: "draft", label: "Draft" },
  { value: "pitched", label: "Pitched" },
  { value: "in_progress", label: "In progress" },
  { value: "published", label: "Published" },
  { value: "declined", label: "Declined" },
  { value: "killed", label: "Killed" },
];

const SPEAKING_STATUS = [
  { value: "idea", label: "Idea" },
  { value: "submitted", label: "Submitted" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const SPEAKING_TYPES = [
  { value: "conference", label: "Conference" },
  { value: "panel", label: "Panel" },
  { value: "podcast", label: "Podcast" },
  { value: "webinar", label: "Webinar" },
  { value: "fireside", label: "Fireside" },
  { value: "workshop", label: "Workshop" },
  { value: "other", label: "Other" },
];

export function PrManager({
  contacts,
  pieces,
  speakingEngagements,
}: {
  contacts: PrContact[];
  pieces: PressPiece[];
  speakingEngagements: SpeakingEngagement[];
}) {
  return (
    <div className="space-y-6">
      <Section title={`Press Contacts (${contacts.length})`}>
        <SimpleListManager
          items={contacts}
          fields={[
            { key: "full_name", label: "Full name", required: true },
            { key: "publication", label: "Publication" },
            { key: "role_title", label: "Role / title" },
            { key: "beat", label: "Beat (e.g. logistics, India D2C, supply chain)" },
            { key: "email", label: "Email", type: "email" },
            { key: "twitter_handle", label: "Twitter handle" },
            { key: "linkedin_url", label: "LinkedIn URL" },
            { key: "notes", label: "Notes", type: "textarea" },
          ]}
          upsertAction={(data) =>
            upsertPrContactAction(data as Partial<PrContact> & { full_name: string })
          }
          itemRender={(c: PrContact) => (
            <>
              <p className="text-sm font-semibold text-[var(--ink-950)]">{c.full_name}</p>
              <p className="text-xs text-[var(--ink-500)]">
                {c.publication ?? "—"} · {c.role_title ?? "—"}
              </p>
              {c.email ? (
                <p className="text-xs text-[var(--accent-600)]">{c.email}</p>
              ) : null}
              <p className="text-[11px] text-[var(--ink-500)] mt-1">
                {c.responded_count} replies · {c.published_count} published
                {c.last_pitched_at
                  ? ` · last pitched ${formatDate(c.last_pitched_at)}`
                  : ""}
              </p>
            </>
          )}
          newButtonLabel="Add press contact"
          emptyMessage="No press contacts yet. Add journalists at YourStory, Inc42, ET, FreightWaves, etc."
        />
      </Section>

      <Section title={`Press Pieces (${pieces.length})`}>
        <SimpleListManager
          items={pieces}
          fields={[
            { key: "title", label: "Title", required: true },
            { key: "publication", label: "Publication" },
            {
              key: "status",
              label: "Status",
              type: "select",
              options: PIECE_STATUS,
              defaultValue: "draft",
            },
            { key: "published_url", label: "Published URL" },
            { key: "pitch_body", label: "Pitch body / story angle", type: "textarea" },
          ]}
          upsertAction={(data) =>
            upsertPressPieceAction(data as Partial<PressPiece> & { title: string })
          }
          itemRender={(p: PressPiece) => (
            <>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="rounded-md bg-[var(--surface-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-700)]">
                  {p.status.replace(/_/g, " ")}
                </span>
                {p.publication ? (
                  <span className="text-[11px] text-[var(--ink-500)]">{p.publication}</span>
                ) : null}
              </div>
              <p className="text-sm font-semibold text-[var(--ink-950)]">{p.title}</p>
              {p.published_url ? (
                <a
                  href={p.published_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[var(--accent-600)] hover:underline"
                >
                  {p.published_url}
                </a>
              ) : null}
            </>
          )}
          newButtonLabel="Add press piece"
          emptyMessage="No press pieces yet."
        />
      </Section>

      <Section title={`Speaking Engagements (${speakingEngagements.length})`}>
        <SimpleListManager
          items={speakingEngagements}
          fields={[
            { key: "event_name", label: "Event name", required: true },
            { key: "event_date", label: "Event date", type: "date" },
            { key: "event_location", label: "Location" },
            {
              key: "event_type",
              label: "Type",
              type: "select",
              options: SPEAKING_TYPES,
              defaultValue: "conference",
            },
            {
              key: "proposal_status",
              label: "Status",
              type: "select",
              options: SPEAKING_STATUS,
              defaultValue: "idea",
            },
            { key: "proposal_url", label: "Proposal / submission URL" },
            { key: "recording_url", label: "Recording URL (after event)" },
            { key: "notes", label: "Notes", type: "textarea" },
          ]}
          upsertAction={(data) =>
            upsertSpeakingAction(
              data as Partial<SpeakingEngagement> & { event_name: string },
            )
          }
          itemRender={(s: SpeakingEngagement) => (
            <>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="rounded-md bg-[var(--surface-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-700)]">
                  {s.proposal_status}
                </span>
                {s.event_type ? (
                  <span className="text-[10px] uppercase text-[var(--ink-500)]">
                    {s.event_type}
                  </span>
                ) : null}
                {s.event_date ? (
                  <span className="text-[11px] text-[var(--ink-500)]">
                    {formatDate(s.event_date)}
                  </span>
                ) : null}
              </div>
              <p className="text-sm font-semibold text-[var(--ink-950)]">{s.event_name}</p>
              {s.event_location ? (
                <p className="text-xs text-[var(--ink-500)]">{s.event_location}</p>
              ) : null}
            </>
          )}
          newButtonLabel="Add speaking engagement"
          emptyMessage="No speaking engagements tracked yet."
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)] mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}
