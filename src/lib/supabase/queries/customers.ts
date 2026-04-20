import type { SupabaseClient } from "@supabase/supabase-js";

import type { Customer, CustomerContact, CustomerService, Contract, Quote } from "@/types/db";

export async function listCustomers(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("display_name");
  if (error) throw error;
  return (data ?? []) as Customer[];
}

export async function getCustomer(
  supabase: SupabaseClient,
  workspaceId: string,
  customerId: string,
) {
  const { data: customer, error } = await supabase
    .from("customers")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", customerId)
    .maybeSingle();
  if (error) throw error;
  if (!customer) return null;

  const [contactsRes, servicesRes, contractsRes, quotesRes] = await Promise.all([
    supabase.from("customer_contacts").select("*").eq("customer_id", customerId).order("is_primary", { ascending: false }),
    supabase.from("customer_services").select("*").eq("customer_id", customerId),
    supabase.from("contracts").select("*").eq("customer_id", customerId).order("effective_date", { ascending: false }),
    supabase.from("quotes").select("*").eq("customer_id", customerId).order("created_at", { ascending: false }).limit(10),
  ]);

  return {
    customer: customer as Customer,
    contacts: (contactsRes.data ?? []) as CustomerContact[],
    services: (servicesRes.data ?? []) as CustomerService[],
    contracts: (contractsRes.data ?? []) as Contract[],
    quotes: (quotesRes.data ?? []) as Quote[],
  };
}

export async function insertCustomer(
  supabase: SupabaseClient,
  workspaceId: string,
  input: {
    legal_name: string;
    display_name: string;
    status: Customer["status"];
    billing_email?: string | null;
    billing_phone?: string | null;
    billing_city?: string | null;
    billing_region?: string | null;
    billing_country?: string | null;
    payment_terms?: string | null;
    currency?: string | null;
    notes?: string | null;
    services?: Array<Customer extends never ? never : "warehousing" | "fulfillment" | "last_mile" | "international_courier">;
  },
): Promise<string> {
  const { data: user } = await supabase.auth.getUser();
  const { services = [], ...rest } = input;
  const { data, error } = await supabase
    .from("customers")
    .insert({
      workspace_id: workspaceId,
      created_by: user.user?.id ?? null,
      ...rest,
    })
    .select("id")
    .single();
  if (error) throw error;

  if (services.length) {
    await supabase.from("customer_services").insert(
      services.map((service_type) => ({
        workspace_id: workspaceId,
        customer_id: data.id,
        service_type,
        active: true,
      })),
    );
  }

  return data.id as string;
}
