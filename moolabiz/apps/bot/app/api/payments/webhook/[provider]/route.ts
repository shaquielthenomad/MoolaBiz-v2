import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus, supabase } from "@/lib/db/supabase";
import { sendMessage } from "@/lib/whatsapp/client";
import { verifyYocoWebhook } from "@/lib/payments/yoco";
import { verifyOzowWebhook } from "@/lib/payments/ozow";
import { verifyPayFastWebhook } from "@/lib/payments/payfast";

async function sendReceipt(orderId: string): Promise<void> {
  const { data: order } = await supabase.from("orders").select("customers(name, whatsapp_number)").eq("id", orderId).single();
  const customer = (order?.customers as unknown) as { name: string; whatsapp_number: string } | null;
  if (customer?.whatsapp_number) {
    await sendMessage(customer.whatsapp_number, `✅ Payment received! Thank you ${customer.name || "Customer"}. Your order is confirmed.`);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }): Promise<NextResponse> {
  const { provider } = await params;
  try {
    if (provider === "yoco") {
      const rawBody = await req.text();
      const signature = req.headers.get("x-yoco-signature") ?? "";
      if (!verifyYocoWebhook(rawBody, signature)) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      const payload = JSON.parse(rawBody) as { type: string; payload: { metadata: { orderId: string } } };
      if (payload.type === "payment.succeeded") {
        const orderId = payload.payload.metadata.orderId;
        await updateOrderStatus(orderId, "confirmed", "paid");
        await sendReceipt(orderId);
      }
      return NextResponse.json({ ok: true });
    }
    if (provider === "ozow") {
      const rawBody = await req.text();
      const formParams = Object.fromEntries(new URLSearchParams(rawBody));
      if (!verifyOzowWebhook(formParams)) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      if (formParams.Status === "Complete") {
        await updateOrderStatus(formParams.TransactionReference, "confirmed", "paid");
        await sendReceipt(formParams.TransactionReference);
      }
      return NextResponse.json({ ok: true });
    }
    if (provider === "payfast") {
      const rawBody = await req.text();
      const formParams = Object.fromEntries(new URLSearchParams(rawBody));
      if (!verifyPayFastWebhook(formParams)) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      if (formParams.payment_status === "COMPLETE") {
        await updateOrderStatus(formParams.m_payment_id, "confirmed", "paid");
        await sendReceipt(formParams.m_payment_id);
      }
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  } catch (err) {
    console.error(`[webhook/${provider}]`, err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
