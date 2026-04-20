import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: { label: string; href: string };
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="card-surface flex flex-col items-center gap-3 rounded-[1.5rem] p-8 text-center">
      <p className="text-lg font-semibold text-[var(--surface-ink)]">{title}</p>
      {description ? (
        <p className="max-w-md text-sm text-[var(--ink-500)]">{description}</p>
      ) : null}
      {action ? (
        <Link
          href={action.href}
          className="rounded-full bg-[var(--surface-ink)] px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
