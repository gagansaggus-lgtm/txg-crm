import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { CompetitorCreateButton } from "@/components/marketing/competitor-create-button";
import { listCompetitors } from "@/lib/supabase/queries/strategy";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function CompetitorsPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const competitors = await listCompetitors(supabase, ctx.workspaceId);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="brand-eyebrow text-[var(--accent-600)]">Strategy · Competitors</p>
          <h1 className="brand-headline text-3xl text-[var(--ink-950)] mt-2">
            Competitive Intelligence
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-700)]">
            Track positioning, pricing, and signals from {competitors.length}{" "}
            competitors. Updates feed battle cards automatically.
          </p>
        </div>
        <CompetitorCreateButton />
      </div>

      {competitors.length === 0 ? (
        <Card>
          <CardContent className="px-6 py-12 text-center text-sm text-[var(--ink-500)]">
            No competitors yet. Apply migration 0020 (seed data) for the default 6,
            or add your own.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {competitors.map((c) => {
            const profile = (c.profile ?? {}) as Record<string, unknown>;
            return (
              <Link
                key={c.id}
                href={`/app/strategy/competitors/${c.id}`}
                className="block rounded-xl border border-[var(--line-soft)] bg-[var(--card)] p-5 transition-colors hover:border-[var(--accent-600)]/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="brand-headline text-base text-[var(--ink-950)]">
                    {c.name}
                  </h3>
                  {!c.active ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-400)]">
                      Inactive
                    </span>
                  ) : null}
                </div>
                {c.website ? (
                  <p className="mt-1 truncate text-xs text-[var(--accent-600)]">
                    {c.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </p>
                ) : null}
                {c.positioning ? (
                  <p className="mt-3 line-clamp-3 text-sm text-[var(--ink-700)]">
                    {c.positioning}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.asset_based === true ? (
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      Asset-based
                    </span>
                  ) : profile.asset_based === false ? (
                    <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      Software-led
                    </span>
                  ) : null}
                  {profile.incumbent ? (
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                      Incumbent
                    </span>
                  ) : null}
                  {profile.weakness ? (
                    <span className="rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700">
                      ⚠ {(profile.weakness as string).replace(/_/g, " ")}
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
