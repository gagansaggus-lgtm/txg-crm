"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Customer = { id: string; display_name: string };

export function TicketForm({
  workspaceId,
  customers,
  defaultCustomerId,
}: {
  workspaceId: string;
  customers: Customer[];
  defaultCustomerId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const supabase = createSupabaseBrowserClient();
      const { data: userRes } = await supabase.auth.getUser();
      const customerId = String(formData.get("customer_id") ?? "");
      const payload = {
        workspace_id: workspaceId,
        customer_id: customerId || null,
        subject: String(formData.get("subject") ?? "").trim(),
        body: String(formData.get("body") ?? "").trim() || null,
        priority: String(formData.get("priority") ?? "normal"),
        status: "open",
        due_at: String(formData.get("due_at") ?? "") || null,
        related_type: String(formData.get("related_type") ?? "") || null,
        created_by: userRes.user?.id ?? null,
      };
      if (!payload.subject) {
        setError("Subject is required.");
        return;
      }
      const { data, error: insertError } = await supabase
        .from("tickets")
        .insert(payload)
        .select("id")
        .single();
      if (insertError) {
        setError(insertError.message);
        return;
      }
      router.replace(`/app/tickets/${data.id}`);
      router.refresh();
    });
  }

  return (
    <form action={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Customer">
          <select name="customer_id" defaultValue={defaultCustomerId ?? ""} className={inputCls}>
            <option value="">No customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.display_name}</option>
            ))}
          </select>
        </Field>
        <Field label="Priority">
          <select name="priority" defaultValue="normal" className={inputCls}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </Field>
        <Field label="Subject" required className="sm:col-span-2">
          <input name="subject" required className={inputCls} />
        </Field>
        <Field label="Related to">
          <select name="related_type" defaultValue="" className={inputCls}>
            <option value="">General</option>
            <option value="shipment">Shipment</option>
            <option value="order">Order</option>
            <option value="receipt">Receipt</option>
          </select>
        </Field>
        <Field label="Due">
          <input name="due_at" type="datetime-local" className={inputCls} />
        </Field>
      </div>
      <Field label="Details">
        <textarea name="body" rows={4} className={inputCls} />
      </Field>
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-full bg-[var(--surface-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Create ticket"}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded-2xl border border-[var(--line-soft)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-500)]";

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block space-y-2 ${className ?? ""}`}>
      <span className="text-sm font-medium text-[var(--surface-ink)]">
        {label}{required ? <span className="text-[var(--danger-700)]"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
