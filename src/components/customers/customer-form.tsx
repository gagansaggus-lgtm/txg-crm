"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

const SERVICE_TYPES = [
  "warehousing",
  "fulfillment",
  "last_mile",
  "international_courier",
] as const;
type ServiceType = (typeof SERVICE_TYPES)[number];

const serviceOptions: Array<{ value: ServiceType; label: string }> = [
  { value: "warehousing", label: "Warehousing" },
  { value: "fulfillment", label: "Fulfillment" },
  { value: "last_mile", label: "Last-mile" },
  { value: "international_courier", label: "International courier" },
];

const customerSchema = z.object({
  legal_name: z.string().min(1, "Legal name is required"),
  display_name: z.string().min(1, "Display name is required"),
  status: z.enum(["prospect", "active", "churned"]),
  currency: z.enum(["USD", "CAD"]),
  billing_email: z.union([z.string().email("Enter a valid email"), z.literal("")]).optional(),
  billing_phone: z.string().optional(),
  billing_city: z.string().optional(),
  billing_region: z.string().optional(),
  billing_country: z.string().optional(),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
  services: z.array(z.enum(SERVICE_TYPES)),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export function CustomerForm({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      legal_name: "",
      display_name: "",
      status: "prospect",
      currency: "USD",
      billing_email: "",
      billing_phone: "",
      billing_city: "",
      billing_region: "",
      billing_country: "",
      payment_terms: "",
      notes: "",
      services: ["warehousing"],
    },
  });

  const { errors, isSubmitting } = form.formState;
  const services = form.watch("services");

  function toggleService(service: ServiceType) {
    const current = form.getValues("services");
    const next = current.includes(service)
      ? current.filter((s) => s !== service)
      : [...current, service];
    form.setValue("services", next, { shouldDirty: true });
  }

  async function onSubmit(values: CustomerFormValues) {
    const supabase = createSupabaseBrowserClient();
    const { data: userRes } = await supabase.auth.getUser();

    const payload = {
      workspace_id: workspaceId,
      legal_name: values.legal_name.trim(),
      display_name: values.display_name.trim(),
      status: values.status,
      billing_email: values.billing_email?.trim() || null,
      billing_phone: values.billing_phone?.trim() || null,
      billing_city: values.billing_city?.trim() || null,
      billing_region: values.billing_region?.trim() || null,
      billing_country: values.billing_country?.trim() || null,
      payment_terms: values.payment_terms?.trim() || null,
      currency: values.currency,
      notes: values.notes?.trim() || null,
      created_by: userRes.user?.id ?? null,
    };

    const { data, error: insertError } = await supabase
      .from("customers")
      .insert(payload)
      .select("id")
      .single();

    if (insertError) {
      toast.error("Could not save customer", { description: insertError.message });
      return;
    }

    if (values.services.length > 0) {
      const rows = values.services.map((service_type) => ({
        workspace_id: workspaceId,
        customer_id: data.id,
        service_type,
        active: true,
      }));
      const { error: svcErr } = await supabase.from("customer_services").insert(rows);
      if (svcErr) {
        toast.warning("Customer saved, but services failed", { description: svcErr.message });
        router.replace(`/app/customers/${data.id}`);
        router.refresh();
        return;
      }
    }

    toast.success(`${values.display_name} added`);
    router.replace(`/app/customers/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={errors.legal_name ? "true" : undefined}>
            <FieldLabel htmlFor="legal_name">
              Legal name <span className="text-destructive">*</span>
            </FieldLabel>
            <Input id="legal_name" placeholder="Acme Logistics Inc." {...form.register("legal_name")} />
            <FieldError errors={errors.legal_name ? [errors.legal_name] : undefined} />
          </Field>

          <Field data-invalid={errors.display_name ? "true" : undefined}>
            <FieldLabel htmlFor="display_name">
              Display name <span className="text-destructive">*</span>
            </FieldLabel>
            <Input id="display_name" placeholder="Acme" {...form.register("display_name")} />
            <FieldError errors={errors.display_name ? [errors.display_name] : undefined} />
          </Field>

          <Field>
            <FieldLabel htmlFor="status">Status</FieldLabel>
            <Select
              value={form.watch("status")}
              onValueChange={(v) => form.setValue("status", v as CustomerFormValues["status"])}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="churned">Churned</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="currency">Currency</FieldLabel>
            <Select
              value={form.watch("currency")}
              onValueChange={(v) => form.setValue("currency", v as CustomerFormValues["currency"])}
            >
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="CAD">CAD</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field data-invalid={errors.billing_email ? "true" : undefined}>
            <FieldLabel htmlFor="billing_email">Billing email</FieldLabel>
            <Input
              id="billing_email"
              type="email"
              placeholder="billing@acme.com"
              {...form.register("billing_email")}
            />
            <FieldError errors={errors.billing_email ? [errors.billing_email] : undefined} />
          </Field>

          <Field>
            <FieldLabel htmlFor="billing_phone">Billing phone</FieldLabel>
            <Input id="billing_phone" placeholder="+1 716 555 0100" {...form.register("billing_phone")} />
          </Field>

          <Field>
            <FieldLabel htmlFor="billing_city">City</FieldLabel>
            <Input id="billing_city" {...form.register("billing_city")} />
          </Field>

          <Field>
            <FieldLabel htmlFor="billing_region">Region / State</FieldLabel>
            <Input id="billing_region" {...form.register("billing_region")} />
          </Field>

          <Field>
            <FieldLabel htmlFor="billing_country">Country</FieldLabel>
            <Input id="billing_country" placeholder="US" {...form.register("billing_country")} />
          </Field>

          <Field>
            <FieldLabel htmlFor="payment_terms">Payment terms</FieldLabel>
            <Input id="payment_terms" placeholder="Net 30" {...form.register("payment_terms")} />
          </Field>
        </div>

        <Field>
          <FieldLabel>Services</FieldLabel>
          <FieldDescription>Which offerings this customer uses. You can change later.</FieldDescription>
          <FieldContent>
            <div className="flex flex-wrap gap-2 pt-1">
              {serviceOptions.map((option) => {
                const active = services.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleService(option.value)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-foreground hover:border-primary/40",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="notes">Notes</FieldLabel>
          <Textarea id="notes" rows={3} {...form.register("notes")} />
        </Field>
      </FieldGroup>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save customer"
          )}
        </Button>
      </div>
    </form>
  );
}
