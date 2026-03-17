import { detectLanguage, translateToEnglish, translateFromEnglish } from "@/lib/ai/lelapa";
import { processMessage, extractBusinessSetup, MessageContext } from "@/lib/ai/ollama";
import { runDevilsAdvocate } from "@/lib/ai/devil";
import {
  getBusinessByWhatsApp, upsertBusiness, getOrCreateCustomer,
  updateOrderStatus, savePaymentDetails, supabase,
} from "@/lib/db/supabase";
import type { Order } from "@/lib/db/supabase";
import { sendMessage } from "@/lib/whatsapp/client";
import { createPayment, checkYocoOrderStatus } from "@/lib/payments";

const onboardingState = new Map<string, { stage: "awaiting_name" | "awaiting_products" | "awaiting_hours" | "done"; transcript: string }>();

export async function handleIncomingMessage(fromNumber: string, messageText: string): Promise<void> {
  const lang = await detectLanguage(messageText);
  const englishText = await translateToEnglish(messageText, lang);
  const business = await getBusinessByWhatsApp(fromNumber);

  if (!business) {
    await handleOnboarding(fromNumber, englishText, lang);
    return;
  }

  const customer = await getOrCreateCustomer(fromNumber, business.id);
  if (!customer) {
    await sendMessage(fromNumber, "Sorry, something went wrong. Please try again.");
    return;
  }

  const context: MessageContext = {
    businessName: business.name, products: business.products, hours: business.hours, language: lang,
  };

  const normalised = englishText.trim().toUpperCase();
  if (normalised === "PAID?" || normalised === "CHECK PAYMENT" || normalised === "PAYMENT STATUS") {
    const cust = await getOrCreateCustomer(fromNumber, business.id);
    if (cust) {
      const { data: latestOrder } = await supabase.from("orders").select("id")
        .eq("business_id", business.id).eq("customer_id", cust.id).eq("payment_status", "unpaid")
        .order("created_at", { ascending: false }).limit(1).single();
      if (latestOrder) {
        await checkAndConfirmPayment(fromNumber, (latestOrder as { id: string }).id, lang);
        return;
      }
    }
  }

  const englishReply = await processMessage(englishText, context);
  const localReply = await translateFromEnglish(englishReply, lang);
  await sendMessage(fromNumber, localReply);
}

async function handleOnboarding(fromNumber: string, englishText: string, lang: Parameters<typeof translateFromEnglish>[1]): Promise<void> {
  const state = onboardingState.get(fromNumber) ?? { stage: "awaiting_name" as const, transcript: "" };
  state.transcript += `\nUser: ${englishText}`;

  switch (state.stage) {
    case "awaiting_name": {
      const reply = await translateFromEnglish(
        "Welcome to MoolaBiz! 🎉 I'll help you set up your WhatsApp business bot in 3 steps.\n\nStep 1: What is the name of your business?", lang);
      await sendMessage(fromNumber, reply);
      state.stage = "awaiting_products";
      break;
    }
    case "awaiting_products": {
      const reply = await translateFromEnglish(
        `Great! Step 2: List your products or services with prices.\nExample: "Braids R200, Relaxer R150, Washing R80"`, lang);
      await sendMessage(fromNumber, reply);
      state.stage = "awaiting_hours";
      break;
    }
    case "awaiting_hours": {
      const reply = await translateFromEnglish("Perfect! Last step – what are your business hours?\nExample: Mon-Sat 8am-6pm", lang);
      await sendMessage(fromNumber, reply);
      state.stage = "done";
      break;
    }
    case "done": {
      const extracted = await extractBusinessSetup(state.transcript);
      const profile = {
        whatsapp_number: fromNumber, name: extracted.businessName ?? "My Business",
        products: extracted.products ?? [], hours: extracted.hours ?? "Mon-Fri 9am-5pm", plan: "basic" as const,
      };
      await upsertBusiness(profile);
      onboardingState.delete(fromNumber);

      const reply = await translateFromEnglish(
        `✅ Your business bot is live!\n\nCustomers can now WhatsApp you and I'll handle their queries 24/7.\n\nReply "MENU" anytime to see options.`, lang);
      await sendMessage(fromNumber, reply);

      runDevilsAdvocate(profile).then(async (report) => {
        const topChallenge = report.challenges[0];
        const topBlindSpot = report.blindSpots[0];
        const followUp = `🤔 *Devil's Advocate Check*\n\n` +
          `⚠️ ${topChallenge?.issue ?? "Review your pricing strategy."}\n\n` +
          `💡 ${topBlindSpot ?? "Consider who your direct competitors are."}\n\n` +
          `❓ ${report.provokeQuestion}\n\nReply "FULL REVIEW" to get the complete analysis.`;
        const localFollowUp = await translateFromEnglish(followUp, lang);
        await sendMessage(fromNumber, localFollowUp);
      }).catch((err: unknown) => { console.error("[devil's advocate]", err); });
      return;
    }
  }
  onboardingState.set(fromNumber, state);
}

export async function sendPaymentLink(
  customerPhone: string, orderId: string, amount: number, description: string,
  provider: "yoco" | "ozow" | "payfast", language: string
): Promise<void> {
  const result = await createPayment({ orderId, amount, customerName: "", customerPhone, description, provider });
  await savePaymentDetails(orderId, result.provider, result.paymentUrl, result.paymentReference, result.yocoOrderId);
  const lang = language as Parameters<typeof translateFromEnglish>[1];
  const message = await translateFromEnglish(`💳 To complete your order, please pay here: ${result.paymentUrl}`, lang);
  await sendMessage(customerPhone, message);
}

export async function checkAndConfirmPayment(customerPhone: string, orderId: string, language: string): Promise<void> {
  const lang = language as Parameters<typeof translateFromEnglish>[1];
  const { data: orderData } = await supabase.from("orders").select("payment_status, payment_provider, yoco_order_id").eq("id", orderId).single();
  if (!orderData) {
    await sendMessage(customerPhone, await translateFromEnglish("❌ Order not found.", lang));
    return;
  }
  const order = orderData as Pick<Order, "payment_status" | "payment_provider" | "yoco_order_id">;

  if (order.payment_status === "paid") {
    await sendMessage(customerPhone, await translateFromEnglish("✅ Your payment has been received! Your order is confirmed.", lang));
    return;
  }

  if (order.payment_provider === "yoco" && order.yoco_order_id) {
    const state = await checkYocoOrderStatus(order.yoco_order_id);
    if (state === "completed") {
      await updateOrderStatus(orderId, "confirmed", "paid");
      await sendMessage(customerPhone, await translateFromEnglish("✅ Payment confirmed! Your order is confirmed.", lang));
      return;
    }
    if (state === "cancelled") {
      await sendMessage(customerPhone, await translateFromEnglish("❌ Your payment was cancelled. Please try again.", lang));
      return;
    }
    await sendMessage(customerPhone, await translateFromEnglish("⏳ We haven't received your payment yet. Please complete it using the link.", lang));
    return;
  }

  await sendMessage(customerPhone, await translateFromEnglish("⏳ Payment not yet received. If you've already paid, please wait a moment.", lang));
}
