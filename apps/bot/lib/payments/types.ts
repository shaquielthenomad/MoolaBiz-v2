export type PaymentProvider = "yoco" | "ozow" | "payfast";

export interface CreatePaymentParams {
  orderId: string; amount: number; customerName: string;
  customerPhone: string; description: string; provider: PaymentProvider;
}

export interface PaymentResult {
  paymentUrl: string; paymentReference: string; provider: PaymentProvider; yocoOrderId?: string;
}

export type YocoOrderState = "open" | "completed" | "cancelled";
