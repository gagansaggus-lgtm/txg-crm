"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  email: z.string().email("Valid email required"),
  role: z.enum(["admin", "ops_lead", "ops_rep", "warehouse_lead", "warehouse_staff", "driver", "sales"]),
});
type Values = z.infer<typeof schema>;

const roleOptions: Array<{ value: Values["role"]; label: string; hint: string }> = [
  { value: "admin", label: "Admin", hint: "Full access, can invite others" },
  { value: "ops_lead", label: "Ops Lead", hint: "Angad's role — runs day-to-day" },
  { value: "ops_rep", label: "Ops Rep", hint: "Handles tickets + orders" },
  { value: "warehouse_lead", label: "Warehouse Lead", hint: "Phase 2 — runs a facility" },
  { value: "warehouse_staff", label: "Warehouse Staff", hint: "Phase 2 — mobile scan UI" },
  { value: "driver", label: "Driver", hint: "Phase 3 — last-mile" },
  { value: "sales", label: "Sales", hint: "CRM + quotes + pipeline only" },
];

export function InviteForm() {
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", role: "ops_rep" },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: Values) {
    const res = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error("Invite failed", { description: body.error ?? "Please try again." });
      return;
    }
    toast.success(`Invite sent to ${values.email}`, {
      description: body.inviteUrl
        ? "Link also copied — share it with your teammate."
        : "They'll receive it shortly.",
    });
    if (body.inviteUrl) navigator.clipboard?.writeText(body.inviteUrl).catch(() => {});
    form.reset({ email: "", role: "ops_rep" });
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FieldGroup>
        <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <Field data-invalid={errors.email ? "true" : undefined}>
            <FieldLabel htmlFor="email">Work email</FieldLabel>
            <Input id="email" type="email" placeholder="teammate@transwayxpress.com" {...form.register("email")} />
            <FieldError errors={errors.email ? [errors.email] : undefined} />
          </Field>
          <Field>
            <FieldLabel>Role</FieldLabel>
            <Select
              value={form.watch("role")}
              onValueChange={(v) => form.setValue("role", v as Values["role"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    <span className="font-medium">{r.label}</span>
                    <span className="ml-2 text-xs text-[var(--ink-500)]">{r.hint}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </FieldGroup>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Send invite
        </Button>
      </div>
    </form>
  );
}
