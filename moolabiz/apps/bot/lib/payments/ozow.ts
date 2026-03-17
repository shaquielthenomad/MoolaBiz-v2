import { createHash } from "crypto";
import axios from "axios";
import type { CreatePaymentParams, PaymentResult } from "./types";

function sha512Lower(input: string): string {
  return createHash("sha512").update(input).digest("hex").toLowerCase();
}

export async function createOzowPayment(params: CreatePaymentParams): Promise<PaymentResult> {
  const siteCode = process.env.OZOW_SITE_CODE;
  const apiKey = process.env.OZOW_API_KEY;
  const privateKey = process.env.OZOW_PRIVATE_KEY;
  if (!siteCode || !apiKey || !privateKey) throw new Error("Ozow env vars not configured.");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const amount = params.amount.toFixed(2);
  const ref = params.orderId;
  const successUrl = `${appUrl}/payment/success?orderId=${ref}`;
  const cancelUrl = `${appUrl}/payment/cancel?orderId=${ref}`;
  const errorUrl = `${appUrl}/payment/error?orderId=${ref}`;
  const notifyUrl = `${appUrl}/api/payments/webhook/ozow`;

  const hashInput = siteCode + "ZA" + "ZAR" + amount + ref + ref + cancelUrl + errorUrl + successUrl + "false" + privateKey;
  const hashCheck = sha512Lower(hashInput);

  const { data } = await axios.post<{ url: string }>("https://api.ozow.com/postpaymentrequest", {
    SiteCode: siteCode, CountryCode: "ZA", CurrencyCode: "ZAR", Amount: amount,
    TransactionReference: ref, BankReference: ref, Customer: params.customerName,
    SuccessUrl: successUrl, CancelUrl: cancelUrl, ErrorUrl: errorUrl, NotifyUrl: notifyUrl,
    IsTest: false, HashCheck: hashCheck,
  }, { headers: { ApiKey: apiKey, "Content-Type": "application/json" } });

  return { paymentUrl: data.url, paymentReference: ref, provider: "ozow" };
}

export function verifyOzowWebhook(params: Record<string, string>): boolean {
  const privateKey = process.env.OZOW_PRIVATE_KEY;
  if (!privateKey) return false;
  const { SiteCode, TransactionId, TransactionReference, Amount, Status, Optional1, Optional2, Optional3, Optional4, Optional5, CurrencyCode, IsTest, StatusMessage, Hash } = params;
  const hashInput = (SiteCode??"")+(TransactionId??"")+(TransactionReference??"")+(Amount??"")+(Status??"")+(Optional1??"")+(Optional2??"")+(Optional3??"")+(Optional4??"")+(Optional5??"")+(CurrencyCode??"")+(IsTest??"")+(StatusMessage??"")+privateKey;
  return sha512Lower(hashInput) === (Hash ?? "").toLowerCase();
}
