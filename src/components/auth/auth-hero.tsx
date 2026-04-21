import { CheckCircle2 } from "lucide-react";

import { BrandMark } from "@/components/branding/brand-mark";

type AuthHeroProps = {
  eyebrow: string;
  headline: string;
  description: string;
  bullets: string[];
};

export function AuthHero({ eyebrow, headline, description, bullets }: AuthHeroProps) {
  return (
    <div className="hidden h-full flex-col justify-between gap-10 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-10 lg:flex">
      <BrandMark />
      <div className="space-y-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--accent-600)]">
          {eyebrow}
        </p>
        <h1 className="brand-display text-5xl leading-[1.05] tracking-tight text-[var(--ink-950)]">
          {headline}
        </h1>
        <p className="max-w-lg text-base leading-7 text-[var(--ink-700)]">{description}</p>
      </div>
      <ul className="space-y-3 text-sm text-[var(--ink-700)]">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-600)]" strokeWidth={2} />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--ink-500)]">
        ePowering fulfillment globally
      </p>
    </div>
  );
}
