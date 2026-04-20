"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { BrandMark } from "@/components/branding/brand-mark";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup" | "reset";

type AuthFormProps = {
  mode: AuthMode;
  title: string;
  description: string;
};

export function AuthForm({ mode, title, description }: AuthFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      setMessage(null);

      if (!hasSupabaseEnv) {
        setError("Add your Supabase URL and anon key before using auth.");
        return;
      }

      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "").trim();
      const fullName = String(formData.get("fullName") ?? "").trim();
      const supabase = createSupabaseBrowserClient();

      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError(signInError.message);
          return;
        }
        router.replace("/app");
        router.refresh();
        return;
      }

      if (mode === "signup") {
        const redirectTo = `${window.location.origin}/auth/callback`;
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo, data: { full_name: fullName } },
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        if (data.session) {
          router.replace("/app");
          router.refresh();
          return;
        }
        setMessage("Account created. Check your email if confirmation is required in Supabase. Then run 0007_seed.sql to add yourself to the TXG workspace.");
        return;
      }

      const redirectTo = `${window.location.origin}/auth/callback?next=/login`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setMessage("Password reset email sent. Check your inbox.");
    });
  }

  return (
    <section className="glass-panel w-full max-w-xl rounded-[2rem] p-6 sm:p-8">
      <div className="space-y-6">
        <BrandMark compact />

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--surface-ink)]">{title}</h1>
          <p className="text-sm leading-7 text-[var(--ink-700)]">{description}</p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          {mode === "signup" ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--surface-ink)]">Full name</span>
              <input
                name="fullName"
                type="text"
                placeholder="Your full name"
                className="w-full rounded-2xl border border-[var(--line-soft)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-500)]"
              />
            </label>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--surface-ink)]">Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@txg.com"
              className="w-full rounded-2xl border border-[var(--line-soft)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-500)]"
            />
          </label>

          {mode !== "reset" ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--surface-ink)]">Password</span>
              <input
                name="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                placeholder="Enter your password"
                className="w-full rounded-2xl border border-[var(--line-soft)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-500)]"
              />
            </label>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          {message ? (
            <div className="rounded-2xl border border-[var(--warning-100)] bg-[var(--warning-100)] px-4 py-3 text-sm text-[var(--warning-700)]">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex w-full items-center justify-center rounded-full bg-[var(--surface-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Working..." : mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset email"}
          </button>
        </form>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--ink-700)]">
          {mode !== "login" ? (
            <Link href="/login" className="font-medium text-[var(--accent-600)]">Already have an account?</Link>
          ) : null}
          {mode !== "signup" ? (
            <Link href="/signup" className="font-medium text-[var(--accent-600)]">Create an account</Link>
          ) : null}
          {mode !== "reset" ? (
            <Link href="/reset-password" className="font-medium text-[var(--accent-600)]">Reset password</Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
