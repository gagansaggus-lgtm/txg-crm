import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { listReplies } from "@/lib/supabase/queries/outreach";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";
import { formatDateTime } from "@/lib/utils";

export default async function RepliesPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const replies = await listReplies(supabase, ctx.workspaceId);

  return (
    <div className="space-y-6">
      <div>
        <p className="brand-eyebrow text-[var(--accent-600)]">Outreach · Replies</p>
        <h1 className="brand-headline text-3xl text-[var(--ink-950)] mt-2">
          Replies ({replies.length})
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-700)]">
          Inbound responses across LinkedIn, email, and WhatsApp — sorted newest first.
        </p>
      </div>

      {replies.length === 0 ? (
        <Card>
          <CardContent className="px-6 py-12 text-center text-sm text-[var(--ink-500)]">
            No replies yet. As you mark messages sent, replies will land here.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {replies.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-[var(--line-soft)] bg-[var(--card)] p-4"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <Link
                  href={r.lead ? `/app/leads/${r.lead.id}` : "#"}
                  className="brand-headline text-base text-[var(--ink-950)] hover:text-[var(--accent-600)]"
                >
                  {r.lead?.display_name ?? "(no lead)"}
                </Link>
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-md bg-[var(--surface-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-700)]">
                    {r.channel.replace(/_/g, " ")}
                  </span>
                  {r.replied_at ? (
                    <span className="text-[var(--ink-500)]">
                      {formatDateTime(r.replied_at)}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="rounded-lg bg-[var(--surface-soft)] px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)] mb-1">
                  Their reply
                </p>
                <p className="whitespace-pre-wrap text-sm text-[var(--ink-950)]">
                  {r.reply_body ?? "(empty reply body)"}
                </p>
              </div>
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-[var(--ink-500)] hover:text-[var(--accent-600)]">
                  Show your original message
                </summary>
                <p className="mt-2 whitespace-pre-wrap text-xs text-[var(--ink-700)] border-l-2 border-[var(--line-soft)] pl-3">
                  {r.body}
                </p>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
