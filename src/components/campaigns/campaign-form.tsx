"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const schema = z.object({
  name: z.string().min(1, "Required"),
  subject: z.string().min(1, "Required"),
  from_name: z.string().min(1, "Required"),
  from_email: z.string().email("Valid email required"),
  reply_to: z.string().email("Valid email").or(z.literal("")).optional(),
  segment: z.enum(["all_active", "all_prospects", "warehousing", "fulfillment", "last_mile", "international_courier"]),
  body_html: z.string().min(10, "Write something"),
});
type Values = z.infer<typeof schema>;

export function CampaignForm({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      subject: "",
      from_name: "TXG",
      from_email: "hello@transwayxpress.com",
      reply_to: "",
      segment: "all_active",
      body_html: "<p>Hi {{display_name}},</p>\n<p>Your message here.</p>",
    },
  });
  const { errors, isSubmitting } = form.formState;

  async function save(values: Values, send: boolean) {
    const supabase = createSupabaseBrowserClient();
    const segmentFilter = segmentToFilter(values.segment);

    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        workspace_id: workspaceId,
        name: values.name,
        subject: values.subject,
        from_name: values.from_name,
        from_email: values.from_email,
        reply_to: values.reply_to || null,
        segment_filter: segmentFilter,
        body_html: values.body_html,
        status: send ? "scheduled" : "draft",
        scheduled_at: send ? new Date().toISOString() : null,
      })
      .select("id")
      .single();
    if (error || !data) {
      toast.error("Save failed", { description: error?.message });
      return;
    }
    if (send) {
      toast.info("Campaign queued", {
        description: "Will send once Resend is configured and the send worker runs. Status: scheduled.",
      });
    } else {
      toast.success("Saved as draft");
    }
    router.replace(`/app/campaigns`);
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit((v) => save(v, false))} className="space-y-5">
      <FieldGroup>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field data-invalid={errors.name ? "true" : undefined}>
            <FieldLabel htmlFor="name">Campaign name <span className="text-destructive">*</span></FieldLabel>
            <Input id="name" placeholder="Q2 Buffalo fulfillment push" {...form.register("name")} />
            <FieldError errors={errors.name ? [errors.name] : undefined} />
          </Field>
          <Field>
            <FieldLabel>Segment</FieldLabel>
            <Select value={form.watch("segment")} onValueChange={(v) => form.setValue("segment", v as Values["segment"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all_active">All active customers</SelectItem>
                <SelectItem value="all_prospects">All prospects</SelectItem>
                <SelectItem value="warehousing">Warehousing customers</SelectItem>
                <SelectItem value="fulfillment">Fulfillment customers</SelectItem>
                <SelectItem value="last_mile">Last-mile customers</SelectItem>
                <SelectItem value="international_courier">International courier customers</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field data-invalid={errors.subject ? "true" : undefined}>
          <FieldLabel htmlFor="subject">Subject line <span className="text-destructive">*</span></FieldLabel>
          <Input id="subject" {...form.register("subject")} />
          <FieldError errors={errors.subject ? [errors.subject] : undefined} />
        </Field>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="from_name">From name</FieldLabel>
            <Input id="from_name" {...form.register("from_name")} />
          </Field>
          <Field data-invalid={errors.from_email ? "true" : undefined}>
            <FieldLabel htmlFor="from_email">From email</FieldLabel>
            <Input id="from_email" type="email" {...form.register("from_email")} />
            <FieldError errors={errors.from_email ? [errors.from_email] : undefined} />
          </Field>
          <Field>
            <FieldLabel htmlFor="reply_to">Reply-to (optional)</FieldLabel>
            <Input id="reply_to" type="email" {...form.register("reply_to")} />
          </Field>
        </div>

        <Field data-invalid={errors.body_html ? "true" : undefined}>
          <FieldLabel htmlFor="body_html">Body (HTML)</FieldLabel>
          <FieldDescription>Use {`{{display_name}}`} and {`{{email}}`} for per-recipient merge fields.</FieldDescription>
          <Textarea id="body_html" rows={10} className="font-mono text-xs" {...form.register("body_html")} />
          <FieldError errors={errors.body_html ? [errors.body_html] : undefined} />
        </Field>
      </FieldGroup>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="submit" variant="outline" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save draft
        </Button>
        <Button
          type="button"
          size="lg"
          disabled={isSubmitting}
          onClick={() => form.handleSubmit((v) => save(v, true))()}
        >
          Schedule send
        </Button>
      </div>
    </form>
  );
}

function segmentToFilter(seg: Values["segment"]) {
  switch (seg) {
    case "all_active": return { customer_status: "active" };
    case "all_prospects": return { customer_status: "prospect" };
    default: return { service_type: seg };
  }
}
