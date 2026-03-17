import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface TenantRecord {
  id: string;
  business_name: string;
  whatsapp_number: string;
  payment_provider: string;
  subdomain: string;
  coolify_service_id: string | null;
  status: "provisioning" | "awaiting_config" | "live" | "error";
  whatsapp_phone_id: string | null;
  whatsapp_token: string | null;
  webhook_verify_token: string;
  created_at: string;
}

export async function createTenant(
  businessName: string,
  whatsappNumber: string,
  paymentProvider: string
): Promise<TenantRecord> {
  const slug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);
  const uniqueId = `${slug}-${Date.now().toString(36)}`;
  const subdomain = `${uniqueId}.moolabiz.app`;

  const { data, error } = await supabase
    .from("tenants")
    .insert({
      business_name: businessName,
      whatsapp_number: whatsappNumber,
      payment_provider: paymentProvider,
      subdomain,
      status: "provisioning",
      webhook_verify_token: randomBytes(16).toString("hex"),
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create tenant: ${error.message}`);
  return data as TenantRecord;
}

export async function updateTenantStatus(
  id: string,
  status: TenantRecord["status"],
  extra?: Partial<TenantRecord>
) {
  await supabase
    .from("tenants")
    .update({ status, ...extra })
    .eq("id", id);
}

export async function updateTenantWhatsApp(
  id: string,
  phoneId: string,
  token: string
) {
  await supabase
    .from("tenants")
    .update({
      whatsapp_phone_id: phoneId,
      whatsapp_token: token,
      status: "live",
    })
    .eq("id", id);
}

export async function getTenant(id: string): Promise<TenantRecord | null> {
  const { data } = await supabase.from("tenants").select("*").eq("id", id).single();
  return data as TenantRecord | null;
}

export async function getAllTenants(): Promise<TenantRecord[]> {
  const { data } = await supabase
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as TenantRecord[]) ?? [];
}

export function generateSecrets() {
  return {
    cronSecret: randomBytes(16).toString("hex"),
    paymentsApiKey: randomBytes(16).toString("hex"),
    advocateApiKey: randomBytes(16).toString("hex"),
    adminPassword: randomBytes(8).toString("hex"),
    webhookVerifyToken: randomBytes(16).toString("hex"),
  };
}
