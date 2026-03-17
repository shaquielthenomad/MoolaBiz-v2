import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getBusinessStats, supabase } from "@/lib/db/supabase";
import type { Business } from "@/lib/db/supabase";
import AdvocatePanel from "./AdvocatePanel";

function checkAuth(authHeader: string | null): boolean {
  if (!authHeader?.startsWith("Basic ")) return false;
  const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
  const [, password] = decoded.split(":");
  return password === process.env.ADMIN_PASSWORD;
}

export default async function DashboardPage() {
  const headersList = await headers();
  if (!checkAuth(headersList.get("authorization"))) redirect("/api/dashboard-auth");

  const { data: businesses } = await supabase.from("businesses").select("*").order("created_at", { ascending: false });
  const bizList = (businesses as Business[]) ?? [];
  const statsPerBiz = await Promise.all(bizList.map(async (b) => ({ ...b, stats: await getBusinessStats(b.id) })));
  const totalRevenue = statsPerBiz.reduce((s, b) => s + b.stats.totalRevenue, 0);
  const totalOrders = statsPerBiz.reduce((s, b) => s + b.stats.totalOrders, 0);
  const totalCustomers = statsPerBiz.reduce((s, b) => s + b.stats.totalCustomers, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-brand-dark text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="text-xl">💰</span><span className="font-bold text-lg">MoolaBiz Admin</span></div>
        <span className="text-white/70 text-sm">Dashboard</span>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          {[{ label: "Total Revenue", value: `R${totalRevenue.toFixed(2)}`, icon: "💰" }, { label: "Total Orders", value: totalOrders.toString(), icon: "📦" }, { label: "Total Customers", value: totalCustomers.toString(), icon: "👥" }].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
              <span className="text-4xl">{card.icon}</span>
              <div><p className="text-2xl font-extrabold text-gray-900">{card.value}</p><p className="text-sm text-gray-500">{card.label}</p></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100"><h2 className="font-bold text-gray-900">Registered Businesses</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr><th className="px-6 py-3 text-left">Business</th><th className="px-6 py-3 text-left">WhatsApp</th><th className="px-6 py-3 text-left">Plan</th><th className="px-6 py-3 text-right">Orders</th><th className="px-6 py-3 text-right">Customers</th><th className="px-6 py-3 text-right">Revenue</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {statsPerBiz.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50"><td className="px-6 py-4 font-medium">{b.name}</td><td className="px-6 py-4 text-gray-500">{b.whatsapp_number}</td><td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${b.plan === "growth" ? "bg-brand-dark text-white" : "bg-brand-light text-brand-dark"}`}>{b.plan}</span></td><td className="px-6 py-4 text-right">{b.stats.totalOrders}</td><td className="px-6 py-4 text-right">{b.stats.totalCustomers}</td><td className="px-6 py-4 text-right font-semibold">R{b.stats.totalRevenue.toFixed(2)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <AdvocatePanel businesses={bizList} />
      </main>
    </div>
  );
}
