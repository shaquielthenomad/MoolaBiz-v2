"use client";
import { useState } from "react";
import type { Business } from "@/lib/db/supabase";
import type { DevilsAdvocateReport } from "@/lib/ai/devil";
import { fetchAdvocateReport } from "./actions";

interface AdvocateCardProps { business: Business }
const RISK_BADGE: Record<string, string> = { low: "bg-green-100 text-green-800", medium: "bg-yellow-100 text-yellow-800", high: "bg-red-100 text-red-800" };

function AdvocateCard({ business }: AdvocateCardProps) {
  const [report, setReport] = useState<DevilsAdvocateReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAnalysis() {
    setLoading(true); setError(null);
    try { setReport(await fetchAdvocateReport(business.id)); }
    catch (err) { setError(err instanceof Error ? err.message : "Unknown error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-900">{business.name}</span>
          {report && <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${RISK_BADGE[report.overallRisk] ?? RISK_BADGE.medium}`}>{report.overallRisk} risk</span>}
        </div>
        <button onClick={runAnalysis} disabled={loading} className="px-4 py-1.5 rounded-lg bg-brand-dark text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
          {loading ? "Analysing…" : "Run Fresh Analysis"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mb-2">⚠️ {error}</p>}
      {report && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Top Challenges</p>
            <ul className="space-y-1">
              {report.challenges.slice(0, 2).map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${c.severity === "high" ? "bg-red-500" : c.severity === "medium" ? "bg-yellow-500" : "bg-green-500"}`} />
                  <span><span className="font-medium">{c.category}:</span> {c.issue}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-l-4 border-brand-dark pl-3">
            <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Hard Question</p>
            <p className="text-sm italic font-bold text-gray-800">&ldquo;{report.provokeQuestion}&rdquo;</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Verdict</p>
            <p className="text-sm text-gray-700">{report.verdict}</p>
          </div>
        </div>
      )}
      {!report && !loading && <p className="text-sm text-gray-400">Click &ldquo;Run Fresh Analysis&rdquo; to stress-test this business.</p>}
    </div>
  );
}

export default function AdvocatePanel({ businesses }: { businesses: Business[] }) {
  if (businesses.length === 0) return null;
  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🤔</span>
        <h2 className="font-bold text-gray-900 text-lg">Devil&apos;s Advocate Analysis</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {businesses.map((b) => <AdvocateCard key={b.id} business={b} />)}
      </div>
    </section>
  );
}
