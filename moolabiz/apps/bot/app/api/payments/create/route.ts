import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { createPayment } from "@/lib/payments";
import { savePaymentDetails } from "@/lib/db/supabase";
import type { PaymentProvider } from "@/lib/payments/types";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token || token !== process.env.PAYMENTS_API_KEY) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { orderId?: string; provider?: PaymentProvider };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { orderId, provider } = body;
  if (!orderId || !provider) return NextResponse.json({ error: "orderId and provider required" }, { status: 400 });

  const { data: order, error } = await supabase.from("orders").select("*, customers(*)").eq("id", orderId).single();
  if (error || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const customer = order.customers as { name: string; whatsapp_number: string } | null;
  try {
    const result = await createPayment({ orderId, amount: Number(order.total), customerName: customer?.name ?? "Customer", customerPhone: customer?.whatsapp_number ?? "", description: `Order #${orderId}`, provider });
    await savePaymentDetails(orderId, result.provider, result.paymentUrl, result.paymentReference, result.yocoOrderId);
    return NextResponse.json({ paymentUrl: result.paymentUrl, paymentReference: result.paymentReference, provider: result.provider, ...(result.yocoOrderId ? { yocoOrderId: result.yocoOrderId } : {}) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Payment creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
