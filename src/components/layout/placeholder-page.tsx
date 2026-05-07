import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

type PlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  comingNext: string;
};

/**
 * Placeholder page used for new marketing platform routes that have schema
 * + agent runtime in place but UI implementation deferred to a follow-up plan.
 */
export function PlaceholderPage({ eyebrow, title, description, comingNext }: PlaceholderProps) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} subtitle={description} />
      <Card>
        <CardContent className="px-6 py-10">
          <p className="text-sm text-[var(--ink-700)]">
            This module is part of the marketing platform build. The schema and
            agent runtime are in place; UI implementation arrives in a follow-up plan.
          </p>
          <p className="mt-3 text-sm text-[var(--ink-500)]">
            Coming next:{" "}
            <span className="text-[var(--ink-950)] font-medium">{comingNext}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
