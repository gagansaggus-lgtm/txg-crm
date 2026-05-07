"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Edit2, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type SimpleField = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "select" | "number" | "date" | "datetime-local" | "email";
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
};

export type SimpleEntity = Record<string, unknown> & { id?: string };

export function SimpleListManager<T extends SimpleEntity>({
  items,
  fields,
  upsertAction,
  itemRender,
  newButtonLabel = "Add",
  emptyMessage = "No items yet.",
}: {
  items: T[];
  fields: SimpleField[];
  upsertAction: (data: Record<string, unknown>) => Promise<{ ok: boolean; error?: string }>;
  itemRender: (item: T) => React.ReactNode;
  newButtonLabel?: string;
  emptyMessage?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<string | "new" | null>(null);

  return (
    <div className="space-y-3">
      {items.length === 0 && editing !== "new" ? (
        <p className="text-sm text-[var(--ink-500)]">{emptyMessage}</p>
      ) : null}

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id as string}
            className="flex items-start justify-between gap-3 rounded-lg border border-[var(--line-soft)] bg-[var(--card)] p-3"
          >
            <div className="flex-1 min-w-0">{itemRender(item)}</div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setEditing(item.id as string)}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          </li>
        ))}
      </ul>

      {editing === "new" ? (
        <SimpleEditor
          fields={fields}
          onCancel={() => setEditing(null)}
          onSave={async (data) => {
            const res = await upsertAction(data);
            if (!res.ok) {
              toast.error("Save failed", { description: res.error });
              return false;
            }
            toast.success("Saved");
            router.refresh();
            return true;
          }}
        />
      ) : (
        <Button variant="outline" onClick={() => setEditing("new")} className="w-full">
          <Plus className="mr-1 h-4 w-4" />
          {newButtonLabel}
        </Button>
      )}

      {editing && editing !== "new"
        ? (() => {
            const item = items.find((i) => i.id === editing);
            if (!item) return null;
            return (
              <div className="rounded-lg border border-[var(--accent-600)]/30 bg-[var(--accent-100)]/30 p-4">
                <SimpleEditor
                  fields={fields}
                  initial={item}
                  onCancel={() => setEditing(null)}
                  onSave={async (data) => {
                    const res = await upsertAction({ id: item.id, ...data });
                    if (!res.ok) {
                      toast.error("Save failed", { description: res.error });
                      return false;
                    }
                    toast.success("Saved");
                    router.refresh();
                    setEditing(null);
                    return true;
                  }}
                />
              </div>
            );
          })()
        : null}
    </div>
  );
}

function SimpleEditor({
  fields,
  initial,
  onCancel,
  onSave,
}: {
  fields: SimpleField[];
  initial?: SimpleEntity;
  onCancel: () => void;
  onSave: (data: Record<string, unknown>) => Promise<boolean>;
}) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<Record<string, string>>(() => {
    const initialState: Record<string, string> = {};
    for (const field of fields) {
      const v = initial?.[field.key];
      if (v == null) initialState[field.key] = field.defaultValue ?? "";
      else if (field.type === "datetime-local" && typeof v === "string")
        initialState[field.key] = v.slice(0, 16);
      else initialState[field.key] = String(v);
    }
    return initialState;
  });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Validate required fields
    for (const field of fields) {
      if (field.required && !form[field.key]?.trim()) {
        toast.error(`${field.label} required`);
        return;
      }
    }
    startTransition(async () => {
      const data: Record<string, unknown> = {};
      for (const field of fields) {
        const raw = form[field.key];
        if (!raw && raw !== "0") {
          data[field.key] = null;
          continue;
        }
        if (field.type === "number") data[field.key] = parseInt(raw, 10) || 0;
        else if (field.type === "datetime-local")
          data[field.key] = new Date(raw).toISOString();
        else data[field.key] = raw;
      }
      await onSave(data);
    });
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-2 rounded-lg border border-[var(--accent-600)]/30 bg-[var(--accent-100)]/30 p-4"
    >
      {fields.map((field) => {
        if (field.type === "textarea") {
          return (
            <div key={field.key}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-500)] mb-1">
                {field.label}
                {field.required ? <span className="text-[var(--accent-600)] ml-0.5">*</span> : null}
              </p>
              <textarea
                value={form[field.key] ?? ""}
                onChange={(e) =>
                  setForm({ ...form, [field.key]: e.target.value })
                }
                placeholder={field.placeholder}
                rows={3}
                className="w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-600)]"
              />
            </div>
          );
        }
        if (field.type === "select" && field.options) {
          return (
            <div key={field.key}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-500)] mb-1">
                {field.label}
              </p>
              <select
                value={form[field.key] ?? ""}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                className="h-9 w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 text-sm outline-none focus:border-[var(--accent-600)]"
              >
                {field.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        return (
          <div key={field.key}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-500)] mb-1">
              {field.label}
              {field.required ? <span className="text-[var(--accent-600)] ml-0.5">*</span> : null}
            </p>
            <Input
              type={field.type ?? "text"}
              required={field.required}
              placeholder={field.placeholder}
              value={form[field.key] ?? ""}
              onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
            />
          </div>
        );
      })}
      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
