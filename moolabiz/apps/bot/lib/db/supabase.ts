import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase env vars are not configured.");
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) { return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop]; },
});

// ─── Types ───────────────────────────────────────────────────────────────
export interface Business {
  id: string; whatsapp_number: string; name: string;
  products: Array<{ name: string; price: number }>; hours: string;
  plan: "basic" | "growth"; payment_provider?: "yoco" | "ozow" | "payfast"; created_at: string;
}

export interface Customer {
  id: string; whatsapp_number: string; business_id: string;
  name: string; last_order_date: string | null; created_at: string;
}

export interface Order {
  id: string; business_id: string; customer_id: string;
  items: Array<{ name: string; qty: number; price: number }>; total: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  payment_status: "unpaid" | "paid"; payment_provider?: string;
  payment_link?: string; payment_reference?: string; yoco_order_id?: string; created_at: string;
}

export interface Appointment {
  id: string; business_id: string; customer_id: string;
  service: string; datetime: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled"; created_at: string;
}

// ─── Business helpers ────────────────────────────────────────────────────
export async function getBusinessByWhatsApp(whatsappNumber: string): Promise<Business | null> {
  const { data } = await supabase.from("businesses").select("*").eq("whatsapp_number", whatsappNumber).single();
  return data as Business | null;
}

export async function upsertBusiness(business: Partial<Business> & { whatsapp_number: string }): Promise<Business | null> {
  const { data } = await supabase.from("businesses").upsert(business, { onConflict: "whatsapp_number" }).select().single();
  return data as Business | null;
}

// ─── Customer helpers ────────────────────────────────────────────────────
export async function getOrCreateCustomer(whatsappNumber: string, businessId: string): Promise<Customer | null> {
  const { data: existing } = await supabase.from("customers").select("*").eq("whatsapp_number", whatsappNumber).eq("business_id", businessId).single();
  if (existing) return existing as Customer;
  const { data } = await supabase.from("customers").insert({ whatsapp_number: whatsappNumber, business_id: businessId }).select().single();
  return data as Customer | null;
}

export async function updateCustomerName(customerId: string, name: string): Promise<void> {
  await supabase.from("customers").update({ name }).eq("id", customerId);
}

// ─── Order helpers ───────────────────────────────────────────────────────
export async function createOrder(order: Omit<Order, "id" | "created_at">): Promise<Order | null> {
  const { data } = await supabase.from("orders").insert(order).select().single();
  return data as Order | null;
}

export async function getRecentOrders(businessId: string, sinceHours = 8): Promise<Order[]> {
  const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000).toISOString();
  const { data } = await supabase.from("orders").select("*").eq("business_id", businessId).gte("created_at", since).order("created_at", { ascending: false });
  return (data as Order[]) ?? [];
}

export async function updateOrderStatus(orderId: string, status: Order["status"], paymentStatus?: Order["payment_status"]): Promise<void> {
  const update: Partial<Order> = { status };
  if (paymentStatus) update.payment_status = paymentStatus;
  await supabase.from("orders").update(update).eq("id", orderId);
}

export async function savePaymentDetails(orderId: string, provider: string, link: string, reference: string, yocoOrderId?: string): Promise<void> {
  const update: Partial<Order> = { payment_provider: provider, payment_link: link, payment_reference: reference };
  if (yocoOrderId) update.yoco_order_id = yocoOrderId;
  await supabase.from("orders").update(update).eq("id", orderId);
}

// ─── Appointment helpers ─────────────────────────────────────────────────
export async function createAppointment(appt: Omit<Appointment, "id" | "created_at">): Promise<Appointment | null> {
  const { data } = await supabase.from("appointments").insert(appt).select().single();
  return data as Appointment | null;
}

export async function getUpcomingAppointments(withinMinutes = 120): Promise<Appointment[]> {
  const now = new Date();
  const until = new Date(now.getTime() + withinMinutes * 60 * 1000);
  const { data } = await supabase.from("appointments").select("*").eq("status", "confirmed").gte("datetime", now.toISOString()).lte("datetime", until.toISOString());
  return (data as Appointment[]) ?? [];
}

// ─── Stats helpers ───────────────────────────────────────────────────────
export async function getBusinessStats(businessId: string) {
  const [ordersResult, customersResult] = await Promise.all([
    supabase.from("orders").select("total, status, payment_status, created_at").eq("business_id", businessId).order("created_at", { ascending: false }),
    supabase.from("customers").select("id").eq("business_id", businessId),
  ]);
  const orders = (ordersResult.data as Pick<Order, "total" | "status" | "payment_status" | "created_at">[]) ?? [];
  const totalRevenue = orders.filter((o) => o.payment_status === "paid").reduce((sum, o) => sum + o.total, 0);
  return { totalOrders: orders.length, totalRevenue, totalCustomers: customersResult.data?.length ?? 0, recentOrders: orders.slice(0, 10) };
}
