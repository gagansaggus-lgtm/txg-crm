"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Mail, ExternalLink, Phone } from "lucide-react";

import type { LeadContact } from "@/types/marketing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addLeadContactAction } from "@/app/actions/leads";

export function LeadContactList({
  leadId,
  contacts,
}: {
  leadId: string;
  contacts: LeadContact[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    full_name: "",
    role_title: "",
    email: "",
    linkedin_url: "",
    whatsapp_number: "",
  });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.full_name && !form.email) {
      toast.error("Need at least name or email");
      return;
    }
    startTransition(async () => {
      const res = await addLeadContactAction(leadId, {
        full_name: form.full_name || null,
        role_title: form.role_title || null,
        email: form.email || null,
        linkedin_url: form.linkedin_url || null,
        whatsapp_number: form.whatsapp_number || null,
      });
      if (res.error) {
        toast.error("Failed", { description: res.error });
      } else {
        toast.success("Contact added");
        setForm({
          full_name: "",
          role_title: "",
          email: "",
          linkedin_url: "",
          whatsapp_number: "",
        });
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {contacts.length === 0 ? (
        <p className="text-sm text-[var(--ink-500)]">No contacts yet.</p>
      ) : (
        <ul className="space-y-2">
          {contacts.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3 py-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[var(--ink-950)]">
                    {c.full_name ?? "(no name)"}
                  </p>
                  {c.role_title ? (
                    <p className="text-xs text-[var(--ink-500)]">{c.role_title}</p>
                  ) : null}
                </div>
                {c.is_primary ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-700)]">
                    Primary
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--ink-700)]">
                {c.email ? (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3 w-3 text-[var(--ink-500)]" /> {c.email}
                  </span>
                ) : null}
                {c.linkedin_url ? (
                  <a
                    href={c.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--accent-600)] hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> LinkedIn
                  </a>
                ) : null}
                {c.whatsapp_number ? (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3 text-[var(--ink-500)]" />{" "}
                    {c.whatsapp_number}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <form
          onSubmit={submit}
          className="space-y-2 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-soft)] p-3"
        >
          <Input
            placeholder="Full name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
          <Input
            placeholder="Role / title"
            value={form.role_title}
            onChange={(e) => setForm({ ...form, role_title: e.target.value })}
          />
          <Input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            placeholder="LinkedIn URL"
            value={form.linkedin_url}
            onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
          />
          <Input
            placeholder="WhatsApp number"
            value={form.whatsapp_number}
            onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
          />
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={pending} size="sm">
              {pending ? "Adding…" : "Add contact"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="w-full"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add contact
        </Button>
      )}
    </div>
  );
}
