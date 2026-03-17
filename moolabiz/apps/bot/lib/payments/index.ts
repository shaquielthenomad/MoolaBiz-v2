export type { PaymentProvider, CreatePaymentParams, PaymentResult, YocoOrderState } from "./types";
export { checkYocoOrderStatus } from "./yoco";

import { createYocoPayment } from "./yoco";
import { createOzowPayment } from "./ozow";
import { createPayFastPayment } from "./payfast";
import type { CreatePaymentParams, PaymentResult } from "./types";

export async function createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
  switch (params.provider) {
    case "yoco": return createYocoPayment(params);
    case "ozow": return createOzowPayment(params);
    case "payfast": return createPayFastPayment(params);
    default: throw new Error(`Unknown payment provider: ${params.provider}`);
  }
}
