"use server";
import { runDevilsAdvocate } from "@/lib/ai/devil";
import { supabase } from "@/lib/db/supabase";
import type { Business } from "@/lib/db/supabase";
import type { DevilsAdvocateReport } from "@/lib/ai/devil";

export async function fetchAdvocateReport(businessId: string): Promise<DevilsAdvocateReport> {
  const { data } = await supabase.from("businesses").select("*").eq("id", businessId).single();
  if (!data) throw new Error("Business not found");
  const biz = data as Business;
  return runDevilsAdvocate({ name: biz.name, products: biz.products, hours: biz.hours, whatsapp_number: biz.whatsapp_number });
}
