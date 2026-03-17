import { NextRequest, NextResponse } from "next/server";
import { getUpcomingAppointments, supabase } from "@/lib/db/supabase";
import { sendMessage } from "@/lib/whatsapp/client";
import type { Customer, Business } from "@/lib/db/supabase";

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const appointments = await getUpcomingAppointments(120);
    let sent = 0;
    for (const appt of appointments) {
      const [{ data: customer }, { data: business }] = await Promise.all([
        supabase.from("customers").select("*").eq("id", appt.customer_id).single(),
        supabase.from("businesses").select("*").eq("id", appt.business_id).single(),
      ]);
      if (!customer || !business) continue;
      const time = new Date(appt.datetime).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
      const msg = `⏰ Reminder: You have an appointment for *${appt.service}* at *${time}* today.\n📍 ${(business as Business).name}\n\nReply *CONFIRM* or *CANCEL*.`;
      await sendMessage((customer as Customer).whatsapp_number, msg);
      sent++;
    }
    return NextResponse.json({ reminders_sent: sent });
  } catch (err) {
    console.error("Reminders error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
