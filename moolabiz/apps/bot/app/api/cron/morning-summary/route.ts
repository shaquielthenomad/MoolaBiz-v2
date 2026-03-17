import { NextRequest, NextResponse } from "next/server";
import { supabase, getRecentOrders } from "@/lib/db/supabase";
import { sendMessage } from "@/lib/whatsapp/client";
import type { Business } from "@/lib/db/supabase";

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { data: businesses } = await supabase.from("businesses").select("*");
    for (const biz of (businesses as Business[]) ?? []) {
      const orders = await getRecentOrders(biz.id, 8);
      if (orders.length === 0) continue;
      const total = orders.reduce((s, o) => s + o.total, 0);
      const paid = orders.filter((o) => o.payment_status === "paid").length;
      const summary = `🌅 Good morning! Here's your overnight summary for *${biz.name}*:\n\n📦 New orders: ${orders.length}\n💰 Revenue: R${total.toFixed(2)}\n✅ Paid: ${paid} | ⏳ Unpaid: ${orders.length - paid}\n\nReply *ORDERS* to see details.`;
      await sendMessage(biz.whatsapp_number, summary);
    }
    return NextResponse.json({ sent: businesses?.length ?? 0 });
  } catch (err) {
    console.error("Morning summary error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
