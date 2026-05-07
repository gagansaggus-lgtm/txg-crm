import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MessageSquare, Phone, ExternalLink, CheckCircle2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { getSequence } from "@/lib/supabase/queries/outreach";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";
import { cn } from "@/lib/utils";

const CHANNEL_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  linkedin_dm: ExternalLink,
  linkedin_connection: ExternalLink,
  whatsapp: MessageSquare,
  voice_note: Phone,
  phone_call: Phone,
  sms: MessageSquare,
  in_person: CheckCircle2,
};

export default async function SequenceDetailPage({
  params,
}: {
  params: Promise<{ sequenceId: string }>;
}) {
  const { sequenceId } = await params;
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const seq = await getSequence(supabase, ctx.workspaceId, sequenceId);
  if (!seq) notFound();

  const steps = (seq.steps ?? []) as Array<{
    step_number: number;
    channel: string;
    day_offset: number;
    template: string;
    subject?: string;
  }>;

  return (
    <div className="space-y-6">
      <Link
        href="/app/outreach/sequences"
        className="text-xs text-[var(--ink-500)] hover:text-[var(--accent-600)]"
      >
        ← All sequences
      </Link>

      <div>
        <p className="brand-eyebrow text-[var(--accent-600)]">Sequence</p>
        <h1 className="brand-headline text-3xl text-[var(--ink-950)] mt-2">
          {seq.name}
        </h1>
        {seq.description ? (
          <p className="mt-2 text-sm text-[var(--ink-700)]">{seq.description}</p>
        ) : null}
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)] mb-4">
            Touch sequence ({steps.length} steps)
          </p>
          <ol className="relative space-y-3 border-l-2 border-[var(--accent-600)]/30 pl-6">
            {steps.map((step) => {
              const Icon = CHANNEL_ICONS[step.channel] ?? Mail;
              return (
                <li key={step.step_number} className="relative">
                  <span
                    className={cn(
                      "absolute -left-[33px] top-1 grid h-6 w-6 place-items-center rounded-full",
                      "border-2 border-[var(--accent-600)] bg-[var(--card)] text-[10px] font-bold text-[var(--accent-600)]",
                    )}
                  >
                    {step.step_number}
                  </span>
                  <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--card)] p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent-700)]">
                        <Icon className="h-3.5 w-3.5" />
                        {step.channel.replace(/_/g, " ")}
                      </div>
                      <span className="text-[11px] text-[var(--ink-500)]">
                        Day {step.day_offset}
                      </span>
                    </div>
                    {step.subject ? (
                      <p className="mb-2 text-sm font-semibold text-[var(--ink-950)]">
                        Subject: {step.subject}
                      </p>
                    ) : null}
                    <p className="whitespace-pre-wrap text-sm text-[var(--ink-700)]">
                      {step.template}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-xs text-[var(--ink-500)]">
            Variables{" "}
            <code className="rounded bg-[var(--surface-soft)] px-1.5 py-0.5 text-[11px]">
              {"{{first_name}}"}
            </code>
            ,{" "}
            <code className="rounded bg-[var(--surface-soft)] px-1.5 py-0.5 text-[11px]">
              {"{{company}}"}
            </code>
            ,{" "}
            <code className="rounded bg-[var(--surface-soft)] px-1.5 py-0.5 text-[11px]">
              {"{{vertical}}"}
            </code>{" "}
            are auto-filled from each lead's data when assigned.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
