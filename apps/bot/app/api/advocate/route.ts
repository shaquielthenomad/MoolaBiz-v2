import { NextRequest, NextResponse } from "next/server";
import { runDevilsAdvocate, BusinessProfile } from "@/lib/ai/devil";
import { supabase } from "@/lib/db/supabase";
import type { Business } from "@/lib/db/supabase";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ") || authHeader.slice(7) !== process.env.ADVOCATE_API_KEY) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { businessId?: string; business?: BusinessProfile };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  let profile: BusinessProfile;
  if (body.businessId) {
    const { data } = await supabase.from("businesses").select("*").eq("id", body.businessId).single();
    if (!data) return NextResponse.json({ error: "Business not found" }, { status: 404 });
    const biz = data as Business;
    profile = { name: biz.name, products: biz.products, hours: biz.hours, whatsapp_number: biz.whatsapp_number };
  } else if (body.business) { profile = body.business; }
  else return NextResponse.json({ error: "Provide businessId or business object" }, { status: 400 });

  const report = await runDevilsAdvocate(profile);
  return NextResponse.json(report);
}
