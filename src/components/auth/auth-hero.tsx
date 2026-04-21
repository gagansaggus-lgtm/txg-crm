"use client";

import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

import { BrandMark } from "@/components/branding/brand-mark";

type AuthHeroProps = {
  eyebrow: string;
  headline: string;
  description: string;
  bullets: string[];
};

export function AuthHero({ eyebrow, headline, description, bullets }: AuthHeroProps) {
  return (
    <div className="section-dark relative hidden h-full flex-col justify-between gap-10 overflow-hidden rounded-3xl p-10 lg:flex">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[var(--accent-600)]/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[var(--accent-500)]/20 blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
        className="relative"
      >
        <BrandMark variant="light" />
      </motion.div>

      <div className="relative space-y-6">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.2, 0.7, 0.2, 1] }}
          className="brand-eyebrow !text-[var(--accent-500)]"
        >
          {eyebrow}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18, ease: [0.2, 0.7, 0.2, 1] }}
          className="brand-display text-5xl leading-[1.02] text-white sm:text-6xl"
        >
          {headline}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
          className="max-w-lg text-base leading-7 text-white/75"
        >
          {description}
        </motion.p>
      </div>

      <motion.ul
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.4 } } }}
        className="relative space-y-3 text-sm text-white/85"
      >
        {bullets.map((b) => (
          <motion.li
            key={b}
            variants={{
              hidden: { opacity: 0, x: -8 },
              show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.2, 0.7, 0.2, 1] } },
            }}
            className="flex items-start gap-3"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-500)]" strokeWidth={2} />
            <span>{b}</span>
          </motion.li>
        ))}
      </motion.ul>

      <p className="relative text-xs uppercase tracking-[0.28em] text-white/50">
        ePowering fulfillment globally
      </p>
    </div>
  );
}
