import { createHmac, timingSafeEqual } from "crypto";
import axios from "axios";
import type { CreatePaymentParams, PaymentResult, YocoOrderState } from "./types";

const YOCO_BASE_URL = "https://api.yoco.com/v1";

export async function createYocoPayment(params: CreatePaymentParams): Promise<PaymentResult> {
  const secretKey = process.env.YOCO_SECRET_KEY;
  if (!secretKey) throw new Error("YOCO_SECRET_KEY is not configured.");
  const amountInCents = Math.round(params.amount * 100);
  const { data } = await axios.post(`${YOCO_BASE_URL}/payment_links/`, {
    amount_in_cents: amountInCents, currency: "ZAR",
    customer_reference: params.customerName, customer_description: params.description,
  }, { headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" } });
  return { paymentUrl: data.url, paymentReference: data.id, provider: "yoco", yocoOrderId: data.order_id };
}

export async function checkYocoOrderStatus(yocoOrderId: string): Promise<YocoOrderState> {
  const secretKey = process.env.YOCO_SECRET_KEY;
  if (!secretKey) throw new Error("YOCO_SECRET_KEY is not configured.");
  const { data } = await axios.get(`${YOCO_BASE_URL}/orders/${yocoOrderId}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  return data.state;
}

export function verifyYocoWebhook(body: string, signature: string): boolean {
  const secret = process.env.YOCO_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(body).digest();
  const received = Buffer.from(signature, "hex");
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}
