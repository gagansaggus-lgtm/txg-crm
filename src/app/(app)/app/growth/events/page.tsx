import { Card, CardContent } from "@/components/ui/card";
import { EventsManager } from "@/components/marketing/events-manager";
import { listEvents } from "@/lib/supabase/queries/growth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function EventsPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();
  const events = await listEvents(supabase, ctx.workspaceId);

  return (
    <div className="space-y-6">
      <div>
        <p className="brand-eyebrow text-[var(--accent-600)]">Growth · Events</p>
        <h1 className="brand-headline text-3xl text-[var(--ink-950)] mt-2">
          Events ({events.length})
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-700)]">
          Trade shows, conferences, meetups. Track planning, attendance, lead capture.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <EventsManager events={events} />
        </CardContent>
      </Card>
    </div>
  );
}
