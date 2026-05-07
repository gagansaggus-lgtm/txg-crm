import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { SequenceCreateButton } from "@/components/marketing/sequence-create-button";
import { listSequences } from "@/lib/supabase/queries/outreach";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function SequencesPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const sequences = await listSequences(supabase, ctx.workspaceId);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="brand-eyebrow text-[var(--accent-600)]">Outreach · Sequences</p>
          <h1 className="brand-headline text-3xl text-[var(--ink-950)] mt-2">
            Outreach sequences
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-700)]">
            Multi-step, multi-channel cadences. Each new sequence starts with the default
            9-touch research-style template.
          </p>
        </div>
        <SequenceCreateButton />
      </div>

      {sequences.length === 0 ? (
        <Card>
          <CardContent className="px-6 py-12 text-center text-sm text-[var(--ink-500)]">
            No sequences yet. Create one to start drafting outreach for your leads.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {sequences.map((s) => {
            const steps = (s.steps ?? []) as { channel: string }[];
            const channelCounts: Record<string, number> = {};
            for (const step of steps) {
              channelCounts[step.channel] = (channelCounts[step.channel] ?? 0) + 1;
            }
            return (
              <Link
                key={s.id}
                href={`/app/outreach/sequences/${s.id}`}
                className="block rounded-xl border border-[var(--line-soft)] bg-[var(--card)] p-5 transition-colors hover:border-[var(--accent-600)]/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="brand-headline text-base text-[var(--ink-950)]">
                    {s.name}
                  </h3>
                  {!s.active ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-400)]">
                      Inactive
                    </span>
                  ) : null}
                </div>
                {s.description ? (
                  <p className="mt-2 text-sm text-[var(--ink-700)] line-clamp-2">
                    {s.description}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-md bg-[var(--surface-soft)] px-2 py-0.5 text-[11px] text-[var(--ink-700)]">
                    <strong>{steps.length}</strong> steps
                  </span>
                  {Object.entries(channelCounts).map(([ch, n]) => (
                    <span
                      key={ch}
                      className="rounded-md bg-[var(--surface-soft)] px-2 py-0.5 text-[11px] text-[var(--ink-700)]"
                    >
                      {ch.replace(/_/g, " ")} ×{n}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
