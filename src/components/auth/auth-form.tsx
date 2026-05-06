"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { BrandMark } from "@/components/branding/brand-mark";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup" | "reset";

type AuthFormProps = {
  mode: AuthMode;
  title: string;
  description: string;
};

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  fullName: z.string().min(1, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});

const resetSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export function AuthForm({ mode, title, description }: AuthFormProps) {
  const router = useRouter();

  type Values = z.infer<typeof signupSchema> &
    z.infer<typeof loginSchema> &
    z.infer<typeof resetSchema>;
  const schema = mode === "login" ? loginSchema : mode === "signup" ? signupSchema : resetSchema;

  const form = useForm<Values>({
    resolver: zodResolver(schema as typeof signupSchema),
    defaultValues: { email: "", password: "", fullName: "" },
  });

  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: Values) {
    if (!hasSupabaseEnv) {
      toast.error("Missing Supabase env", {
        description: "Add your Supabase URL and anon key before using auth.",
      });
      return;
    }

    const supabase = createSupabaseBrowserClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) {
        toast.error("Sign-in failed", { description: error.message });
        return;
      }
      toast.success("Welcome back");
      router.replace("/app");
      router.refresh();
      return;
    }

    if (mode === "signup") {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { emailRedirectTo: redirectTo, data: { full_name: values.fullName } },
      });
      if (error) {
        toast.error("Signup failed", { description: error.message });
        return;
      }
      if (data.session) {
        toast.success("Account created");
        router.replace("/app");
        router.refresh();
        return;
      }
      toast.info("Check your email", {
        description: "Confirm your email, then an admin will add you to the TXG workspace.",
        duration: 8000,
      });
      return;
    }

    const redirectTo = `${window.location.origin}/auth/callback?next=/login`;
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, { redirectTo });
    if (error) {
      toast.error("Reset failed", { description: error.message });
      return;
    }
    toast.success("Reset email sent", { description: "Check your inbox for the reset link." });
  }

  const ctaLabel =
    isSubmitting
      ? "Working…"
      : mode === "login"
        ? "Sign in"
        : mode === "signup"
          ? "Create account"
          : "Send reset email";

  return (
    <section className="w-full max-w-md rounded-2xl border border-[var(--line-soft)] bg-[var(--card)] p-8 shadow-[var(--shadow-soft)]">
      <div className="space-y-6">
        <div className="flex lg:hidden">
          <BrandMark compact />
        </div>

        <div className="space-y-1.5">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--ink-400)]">
            Transway Xpress Global
          </p>
          <h1 className="brand-headline text-[28px] leading-tight text-[var(--ink-950)]">
            {title}
          </h1>
          <p className="text-sm text-[var(--ink-500)]">{description}</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            {mode === "signup" ? (
              <Field data-invalid={errors.fullName ? "true" : undefined}>
                <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                <Input id="fullName" placeholder="Your full name" {...form.register("fullName")} />
                <FieldError errors={errors.fullName ? [errors.fullName] : undefined} />
              </Field>
            ) : null}

            <Field data-invalid={errors.email ? "true" : undefined}>
              <FieldLabel htmlFor="email">Email address</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@transwayxpress.com"
                {...form.register("email")}
              />
              <FieldError errors={errors.email ? [errors.email] : undefined} />
            </Field>

            {mode !== "reset" ? (
              <Field data-invalid={errors.password ? "true" : undefined}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="Enter your password"
                  {...form.register("password")}
                />
                <FieldError errors={errors.password ? [errors.password] : undefined} />
              </Field>
            ) : null}
          </FieldGroup>

          <Button type="submit" className="h-10 w-full rounded-xl text-sm font-semibold shadow-[var(--shadow-cta)]" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {ctaLabel}
              </>
            ) : (
              ctaLabel
            )}
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          {mode !== "login" ? (
            <Link href="/login" className="font-medium text-[var(--accent-600)] hover:underline">
              Back to sign in
            </Link>
          ) : null}
          {mode !== "reset" ? (
            <Link href="/reset-password" className="text-[var(--ink-500)] hover:text-[var(--accent-600)]">
              Forgot password?
            </Link>
          ) : null}
        </div>

        {mode === "login" ? (
          <p className="text-center text-[11px] text-[var(--ink-400)]">
            Access is by invitation only. Contact your admin to join.
          </p>
        ) : null}
      </div>
    </section>
  );
}
