"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit2, Save, X } from "lucide-react";

import type { BattleCard } from "@/lib/supabase/queries/brand";
import type { Competitor } from "@/types/marketing";
import { Button } from "@/components/ui/button";
import { upsertBattleCardAction } from "@/app/actions/brand";
import { formatDate } from "@/lib/utils";

export function BattleCardsManager({
  cards,
  competitors,
}: {
  cards: Array<BattleCard & { competitor_name?: string }>;
  competitors: Competitor[];
}) {
  const competitorsWithoutCards = competitors.filter(
    (c) => !cards.some((card) => card.competitor_id === c.id),
  );

  return (
    <div className="space-y-4">
      {cards.length === 0 && competitorsWithoutCards.length === 0 ? (
        <p className="text-sm text-[var(--ink-500)]">
          Add competitors first (Strategy → Competitors), then build battle cards here.
        </p>
      ) : null}

      {cards.map((c) => (
        <BattleCardEditor key={c.id} card={c} />
      ))}

      {competitorsWithoutCards.map((c) => (
        <BattleCardEditor
          key={c.id}
          card={{
            id: "",
            workspace_id: "",
            competitor_id: c.id,
            competitor_name: c.name,
            positioning: null,
            key_objections: [],
            comparative_pricing: {},
            win_themes: [],
            loss_themes: [],
            last_refreshed_at: null,
            created_at: "",
            updated_at: "",
          }}
          newForCompetitor
        />
      ))}
    </div>
  );
}

function BattleCardEditor({
  card,
  newForCompetitor,
}: {
  card: BattleCard & { competitor_name?: string };
  newForCompetitor?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(newForCompetitor ?? false);
  const [form, setForm] = useState({
    positioning: card.positioning ?? "",
    win_themes: (card.win_themes ?? []).join("\n"),
    loss_themes: (card.loss_themes ?? []).join("\n"),
    objections: (card.key_objections ?? [])
      .map((o) => `${o.objection}\n→ ${o.response}`)
      .join("\n\n"),
  });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const objections = form.objections
        .split(/\n\n+/)
        .map((block) => {
          const [objection, ...responseLines] = block.split("\n");
          const response = responseLines.join("\n").replace(/^→\s*/, "");
          return objection?.trim() ? { objection: objection.trim(), response: response.trim() } : null;
        })
        .filter((x): x is { objection: string; response: string } => x !== null);

      const res = await upsertBattleCardAction({
        competitor_id: card.competitor_id,
        positioning: form.positioning || null,
        key_objections: objections,
        win_themes: form.win_themes.split("\n").map((s) => s.trim()).filter(Boolean),
        loss_themes: form.loss_themes.split("\n").map((s) => s.trim()).filter(Boolean),
      });
      if (!res.ok) toast.error("Save failed", { description: res.error });
      else {
        toast.success("Battle card saved");
        setEditing(false);
        router.refresh();
      }
    });
  }

  if (!editing) {
    return (
      <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--card)] p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h4 className="brand-headline text-base text-[var(--ink-950)]">
              vs. {card.competitor_name}
            </h4>
            {card.last_refreshed_at ? (
              <p className="text-[10px] text-[var(--ink-500)]">
                Refreshed {formatDate(card.last_refreshed_at)}
              </p>
            ) : null}
          </div>
          <Button variant="ghost" size="icon-xs" onClick={() => setEditing(true)}>
            <Edit2 className="h-3 w-3" />
          </Button>
        </div>
        {card.positioning ? (
          <p className="text-sm text-[var(--ink-700)] mb-2">{card.positioning}</p>
        ) : null}
        {card.win_themes?.length ? (
          <div className="mb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
              We win on
            </p>
            <ul className="list-inside list-disc text-xs text-[var(--ink-700)]">
              {card.win_themes.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {card.loss_themes?.length ? (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-700 mb-1">
              They win on
            </p>
            <ul className="list-inside list-disc text-xs text-[var(--ink-700)]">
              {card.loss_themes.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-lg border border-[var(--accent-600)]/30 bg-[var(--accent-100)]/30 p-4"
    >
      <div className="flex items-center justify-between">
        <h4 className="brand-headline text-base text-[var(--ink-950)]">
          vs. {card.competitor_name}
        </h4>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => setEditing(false)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)] mb-1">
          Our positioning vs. them
        </p>
        <textarea
          value={form.positioning}
          onChange={(e) => setForm({ ...form, positioning: e.target.value })}
          rows={2}
          className="w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-600)]"
        />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
          We win on (one per line)
        </p>
        <textarea
          value={form.win_themes}
          onChange={(e) => setForm({ ...form, win_themes: e.target.value })}
          rows={3}
          className="w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-600)]"
        />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-red-700 mb-1">
          They win on (one per line)
        </p>
        <textarea
          value={form.loss_themes}
          onChange={(e) => setForm({ ...form, loss_themes: e.target.value })}
          rows={2}
          className="w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-600)]"
        />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)] mb-1">
          Common objections (objection on one line, → followed by response, blank line between)
        </p>
        <textarea
          value={form.objections}
          onChange={(e) => setForm({ ...form, objections: e.target.value })}
          rows={5}
          placeholder={"They're cheaper than you\n→ Yes, but our 12-year history and asset-based facilities mean reliability they can't match.\n\nThey have more SKUs supported\n→ True for some categories, but our cross-border lane is purpose-built for D2C."}
          className="w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-sm font-mono outline-none focus:border-[var(--accent-600)]"
        />
      </div>
      <Button type="submit" disabled={pending} size="sm">
        <Save className="mr-1 h-3.5 w-3.5" />
        {pending ? "Saving…" : "Save battle card"}
      </Button>
    </form>
  );
}
