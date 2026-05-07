"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import type { CommunityMember } from "@/lib/supabase/queries/distribution";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addCommunityMemberAction } from "@/app/actions/distribution";
import { formatDate } from "@/lib/utils";

export function CommunityManager({ members }: { members: CommunityMember[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    channel: "whatsapp",
    display_name: "",
    email: "",
    whatsapp_number: "",
    source: "",
  });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.display_name && !form.email && !form.whatsapp_number) {
      toast.error("Need at least name, email, or phone");
      return;
    }
    startTransition(async () => {
      const res = await addCommunityMemberAction({
        channel: form.channel,
        display_name: form.display_name || null,
        email: form.email || null,
        whatsapp_number: form.whatsapp_number || null,
        source: form.source || null,
      });
      if (!res.ok) toast.error("Failed", { description: res.error });
      else {
        toast.success("Added");
        setForm({
          channel: form.channel,
          display_name: "",
          email: "",
          whatsapp_number: "",
          source: "",
        });
        setAdding(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {members.length === 0 ? (
        <p className="text-sm text-[var(--ink-500)]">
          No community members yet. Add the first founders to your WhatsApp / Telegram
          groups manually, or import a list.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--line-soft)]">
                <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
                  Name
                </th>
                <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
                  Channel
                </th>
                <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
                  Contact
                </th>
                <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
                  Source
                </th>
                <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {members.slice(0, 100).map((m) => (
                <tr key={m.id} className="border-b border-[var(--line-soft)]">
                  <td className="px-2 py-2">{m.display_name ?? "—"}</td>
                  <td className="px-2 py-2 text-xs">{m.channel.replace(/_/g, " ")}</td>
                  <td className="px-2 py-2 text-xs text-[var(--ink-700)]">
                    {m.email ?? m.whatsapp_number ?? "—"}
                  </td>
                  <td className="px-2 py-2 text-xs">{m.source ?? "—"}</td>
                  <td className="px-2 py-2 text-xs text-[var(--ink-500)]">
                    {formatDate(m.joined_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {members.length > 100 ? (
            <p className="mt-2 text-xs text-[var(--ink-500)]">
              Showing 100 of {members.length} members.
            </p>
          ) : null}
        </div>
      )}

      {adding ? (
        <form
          onSubmit={submit}
          className="space-y-2 rounded-lg border border-[var(--accent-600)]/30 bg-[var(--accent-100)]/30 p-4"
        >
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.channel}
              onChange={(e) => setForm({ ...form, channel: e.target.value })}
              className="h-9 rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 text-sm outline-none focus:border-[var(--accent-600)]"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
              <option value="linkedin_group">LinkedIn group</option>
              <option value="discord">Discord</option>
              <option value="slack">Slack</option>
              <option value="other">Other</option>
            </select>
            <Input
              placeholder="Display name"
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              placeholder="WhatsApp / phone"
              value={form.whatsapp_number}
              onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
            />
          </div>
          <Input
            placeholder="Source (optional, e.g. event-2026-q2)"
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={pending} size="sm">
              {pending ? "Adding…" : "Add member"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)} className="w-full">
          <Plus className="mr-1 h-4 w-4" />
          Add member
        </Button>
      )}
    </div>
  );
}
