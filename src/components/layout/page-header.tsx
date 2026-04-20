import Link from "next/link";

type Action = { label: string; href: string };

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: Action[];
};

export function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-600)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--surface-ink)] sm:text-3xl">
          {title}
        </h1>
        {subtitle ? <p className="text-sm text-[var(--ink-500)]">{subtitle}</p> : null}
      </div>
      {actions && actions.length ? (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="inline-flex items-center rounded-full bg-[var(--surface-ink)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </header>
  );
}
