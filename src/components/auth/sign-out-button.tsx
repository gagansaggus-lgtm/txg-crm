"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const supabase = createSupabaseBrowserClient();
          await supabase.auth.signOut();
          router.replace("/login");
          router.refresh();
        })
      }
      className="rounded-full border border-[var(--line-strong)] bg-white px-4 py-2 text-sm font-medium text-[var(--ink-700)] transition hover:border-[var(--accent-500)] hover:text-[var(--accent-600)] disabled:opacity-60"
    >
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}
