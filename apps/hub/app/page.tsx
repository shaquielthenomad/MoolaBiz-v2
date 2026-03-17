"use client";

import { useState, useCallback } from "react";

type Step = "landing" | "signup" | "deploying" | "wizard" | "done";

const FEATURES = [
  { icon: "🤖", title: "24/7 AI Assistant", desc: "Never miss an order. Your bot works while you sleep." },
  { icon: "🌍", title: "African Languages", desc: "Zulu, Xhosa, Afrikaans, Sesotho & English — automatically." },
  { icon: "📦", title: "Orders & Cart", desc: "Customers browse, order and pay — all in WhatsApp." },
  { icon: "📅", title: "Appointments", desc: "Automatic booking, confirmations and 2-hour reminders." },
  { icon: "💳", title: "Instant Payments", desc: "Yoco, Ozow or PayFast links sent in seconds." },
  { icon: "💬", title: "Morning Reports", desc: "Wake up to overnight orders + revenue on WhatsApp." },
];

const TESTIMONIALS = [
  { name: "Zanele M.", biz: "Hair Braiding — Soweto", quote: "Before MoolaBiz I missed bookings. Now my bot handles everything while I braid!" },
  { name: "Sipho K.", biz: "Spaza Shop — Khayelitsha", quote: "My customers order in Xhosa. I just pack and deliver. Yoh, this thing is amazing!" },
  { name: "Fatima A.", biz: "Catering — Durban", quote: "R149/month? I make that back in one extra order. Best business decision I made." },
];

export default function HubPage() {
  const [step, setStep] = useState<Step>("landing");
  const [businessName, setBusinessName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [paymentProvider, setPaymentProvider] = useState("yoco");
  const [tenantData, setTenantData] = useState<{
    tenantId: string;
    subdomain: string;
    webhookUrl: string;
    webhookVerifyToken: string;
  } | null>(null);
  const [phoneId, setPhoneId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [wizardStep, setWizardStep] = useState(1);
  const [error, setError] = useState("");

  const handleSignup = useCallback(async () => {
    if (!businessName.trim() || !whatsappNumber.trim()) {
      setError("Please fill in your business name and WhatsApp number.");
      return;
    }
    setError("");
    setStep("deploying");

    try {
      const res = await fetch("/api/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, whatsappNumber, paymentProvider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      setTenantData(data);
      // Small delay so user sees the success animation
      setTimeout(() => setStep("wizard"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("signup");
    }
  }, [businessName, whatsappNumber, paymentProvider]);

  const handleWizardComplete = useCallback(async () => {
    if (!phoneId || !accessToken || !tenantData) return;
    // In production: PATCH the tenant with WhatsApp creds
    // For now we just mark done
    setStep("done");
  }, [phoneId, accessToken, tenantData]);

  // ─── LANDING ────────────────────────────────────────────────────────────
  if (step === "landing") {
    return (
      <div className="min-h-screen">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="text-xl font-bold text-brand-dark tracking-tight">MoolaBiz</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm text-gray-500 font-medium">
            <a href="#features" className="hover:text-brand-dark transition-colors">Features</a>
            <a href="#pricing" className="hover:text-brand-dark transition-colors">Pricing</a>
            <a href="#stories" className="hover:text-brand-dark transition-colors">Stories</a>
          </div>
          <button
            onClick={() => setStep("signup")}
            className="bg-brand-green text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-brand-dark transition-all hover:scale-105"
          >
            Get My Free Bot
          </button>
        </nav>

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-dark via-[#0E8A75] to-brand-green text-white pt-20 pb-28 px-6">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
          <div className="max-w-4xl mx-auto text-center relative">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-8 border border-white/20">
              <span>🇿🇦</span> Built for South African informal traders
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.1] mb-6 tracking-tight">
              Your Business on WhatsApp,<br />
              <span className="text-brand-light">24/7 — No Sleep Needed</span>
            </h1>
            <p className="text-lg md:text-xl text-white/85 max-w-2xl mx-auto mb-10 leading-relaxed">
              MoolaBiz gives spaza shops, hair braiders, caterers and every hustler
              a smart WhatsApp bot that takes orders, books appointments and answers
              customers — in their language — while you focus on your work.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setStep("signup")}
                className="bg-white text-brand-dark font-extrabold px-10 py-4 rounded-full text-lg hover:bg-brand-light transition-all hover:scale-105 shadow-xl shadow-black/20"
              >
                Get My Free Shop Bot →
              </button>
            </div>
            <p className="mt-6 text-white/60 text-sm">
              100% free AI · Setup in under 8 minutes · Cancel anytime
            </p>
          </div>
        </section>

        {/* Social proof */}
        <div className="bg-brand-light/50 border-y border-brand-green/10 py-4 px-6">
          <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 text-sm text-brand-dark font-semibold">
            <span>✅ Free AI forever</span>
            <span>✅ 5 African languages</span>
            <span>✅ Instant payments</span>
            <span>✅ No tech skills needed</span>
          </div>
        </div>

        {/* Features */}
        <section id="features" className="py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4 tracking-tight">Everything your business needs</h2>
            <p className="text-gray-500 text-center max-w-xl mx-auto mb-14">From spaza shops to salons — if you serve customers, MoolaBiz automates it.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f) => (
                <div key={f.title} className="border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-brand-green/30 transition-all group">
                  <div className="text-4xl mb-4 group-hover:animate-float">{f.icon}</div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 px-6 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-14 tracking-tight">Up and running in 3 steps</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { step: "1", title: "Sign up here", desc: "Fill in your business name, WhatsApp number, and payment preference." },
                { step: "2", title: "Connect WhatsApp", desc: "Follow our simple wizard to link your WhatsApp Business number." },
                { step: "3", title: "Bot goes live", desc: "Customers can start ordering immediately — your bot handles everything." },
              ].map((s) => (
                <div key={s.step} className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-brand-green text-white text-2xl font-extrabold flex items-center justify-center mb-4 shadow-lg shadow-brand-green/30">
                    {s.step}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                  <p className="text-gray-500 text-sm">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="stories" className="py-20 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-14 tracking-tight">Real traders, real results</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="bg-brand-light/40 rounded-2xl p-6 border border-brand-green/15">
                  <p className="text-gray-700 italic mb-4 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  <p className="font-bold text-brand-dark">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.biz}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 px-6 bg-gray-50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">Honest pricing, no surprises</h2>
            <p className="text-gray-500 mb-14">Start free for 14 days. No credit card required.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              {[
                { name: "Basic", price: "R149", features: ["24/7 WhatsApp bot","AI language detection","Order management","Appointments + reminders","Morning summary reports"], popular: false },
                { name: "Growth", price: "R299", features: ["Everything in Basic","Payment integration","Advanced analytics","Unlimited messages","Priority support"], popular: true },
              ].map((plan) => (
                <div key={plan.name} className={`relative bg-white rounded-2xl border-2 ${plan.popular ? "border-brand-dark" : "border-brand-green/30"} p-8 shadow-sm`}>
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-dark text-white text-xs font-bold px-4 py-1 rounded-full">Most Popular</span>
                  )}
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <div className="flex items-end gap-1 mb-6">
                    <span className="text-4xl font-extrabold text-brand-dark">{plan.price}</span>
                    <span className="text-gray-400 mb-1">/month</span>
                  </div>
                  <ul className="space-y-3 text-sm text-gray-600 text-left mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="text-brand-green mt-0.5 font-bold">✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setStep("signup")}
                    className="block w-full text-center bg-brand-green text-white font-bold py-3 rounded-full hover:bg-brand-dark transition-colors"
                  >
                    Start Free Trial
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-brand-dark text-white py-20 px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to grow your business?</h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">Get your free 24/7 AI shop bot in under 8 minutes.</p>
          <button
            onClick={() => setStep("signup")}
            className="bg-brand-green text-white font-extrabold px-10 py-4 rounded-full text-lg hover:bg-green-400 transition-all hover:scale-105"
          >
            Get My Free Shop Bot →
          </button>
        </section>

        {/* Footer */}
        <footer className="py-8 px-6 border-t border-gray-100 text-center text-sm text-gray-400">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-lg">💰</span>
            <span className="font-semibold text-gray-600">MoolaBiz</span>
          </div>
          <p>© 2026 MoolaBiz. Built with ❤️ in South Africa.</p>
        </footer>
      </div>
    );
  }

  // ─── SIGNUP FORM ────────────────────────────────────────────────────────
  if (step === "signup") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark via-[#0E8A75] to-brand-green flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <span className="text-5xl animate-float inline-block">💰</span>
            <h1 className="text-3xl font-extrabold text-white mt-4 tracking-tight">Get Your Free Shop Bot</h1>
            <p className="text-white/70 mt-2">Just 3 quick questions — takes 30 seconds</p>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-black/20 animate-slide-up">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4">
                {error}
              </div>
            )}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Business Name</label>
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Zanele's Braids, Sipho's Spaza"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">WhatsApp Number</label>
                <input
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+27 82 123 4567"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all"
                />
                <p className="text-xs text-gray-400 mt-1">The number your customers will message</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Preferred Payment</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "yoco", label: "💳 Yoco", sub: "Card" },
                    { id: "ozow", label: "🏦 Ozow", sub: "EFT" },
                    { id: "payfast", label: "⚡ PayFast", sub: "All" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPaymentProvider(p.id)}
                      className={`border-2 rounded-xl py-3 px-2 text-center text-sm font-semibold transition-all ${
                        paymentProvider === p.id
                          ? "border-brand-green bg-brand-light text-brand-dark"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <div>{p.label}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{p.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={handleSignup}
              className="w-full mt-6 bg-brand-green text-white font-extrabold py-4 rounded-xl text-lg hover:bg-brand-dark transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-green/30"
            >
              Create My Bot Now →
            </button>
            <p className="text-center text-xs text-gray-400 mt-4">Free 14-day trial · No credit card · Cancel anytime</p>
          </div>
          <button onClick={() => setStep("landing")} className="block mx-auto mt-6 text-white/50 text-sm hover:text-white transition-colors">
            ← Back to homepage
          </button>
        </div>
      </div>
    );
  }

  // ─── DEPLOYING ──────────────────────────────────────────────────────────
  if (step === "deploying") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark to-brand-green flex items-center justify-center px-4">
        <div className="text-center text-white animate-slide-up">
          <div className="relative inline-block mb-8">
            <span className="text-7xl animate-float inline-block">🚀</span>
            <span className="absolute inset-0 rounded-full bg-brand-green/30 animate-pulse-ring" />
          </div>
          <h2 className="text-3xl font-extrabold mb-3">Setting up your bot...</h2>
          <p className="text-white/70 max-w-sm mx-auto">Spinning up your private AI server. This takes about 30 seconds.</p>
          <div className="mt-8 w-64 mx-auto bg-white/20 rounded-full h-2 overflow-hidden">
            <div className="bg-white h-full rounded-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: "70%", animation: "loading 2s ease-in-out infinite" }} />
          </div>
          <style>{`@keyframes loading { 0% { width: 10%; } 50% { width: 80%; } 100% { width: 95%; } }`}</style>
        </div>
      </div>
    );
  }

  // ─── WHATSAPP CONFIG WIZARD ─────────────────────────────────────────────
  if (step === "wizard") {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success banner */}
          <div className="bg-brand-green text-white rounded-2xl p-6 text-center mb-8 shadow-lg shadow-brand-green/20 animate-slide-up">
            <span className="text-4xl">🎉</span>
            <h2 className="text-2xl font-extrabold mt-2">Setup Complete!</h2>
            <p className="text-white/80 mt-1">Your bot for <strong>{businessName}</strong> is ready. Just connect your WhatsApp number below.</p>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-8 justify-center">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  wizardStep >= s ? "bg-brand-green text-white" : "bg-gray-200 text-gray-500"
                }`}>{s}</div>
                {s < 3 && <div className={`w-12 h-0.5 ${wizardStep > s ? "bg-brand-green" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 animate-slide-up">
            {wizardStep === 1 && (
              <div>
                <h3 className="text-xl font-bold mb-4">Step 1: Create WhatsApp Business App</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-800 font-medium mb-2">Open this link in your browser:</p>
                  <a
                    href="https://developers.facebook.com/apps/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline font-bold text-sm break-all"
                  >
                    https://developers.facebook.com/apps/
                  </a>
                </div>
                <ol className="space-y-3 text-sm text-gray-600">
                  <li className="flex gap-3"><span className="bg-brand-green/10 text-brand-dark font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs">1</span>Click &ldquo;Create App&rdquo; → choose &ldquo;Other&rdquo; → &ldquo;Business&rdquo;</li>
                  <li className="flex gap-3"><span className="bg-brand-green/10 text-brand-dark font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs">2</span>Add &ldquo;WhatsApp&rdquo; product to your app</li>
                  <li className="flex gap-3"><span className="bg-brand-green/10 text-brand-dark font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs">3</span>Go to WhatsApp → Getting Started → use number: <strong>{whatsappNumber}</strong></li>
                  <li className="flex gap-3"><span className="bg-brand-green/10 text-brand-dark font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs">4</span>Verify your phone number via SMS code</li>
                </ol>
                <button onClick={() => setWizardStep(2)} className="mt-6 w-full bg-brand-green text-white font-bold py-3 rounded-xl hover:bg-brand-dark transition-colors">
                  I&apos;ve done this → Next
                </button>
              </div>
            )}

            {wizardStep === 2 && (
              <div>
                <h3 className="text-xl font-bold mb-4">Step 2: Copy your WhatsApp keys</h3>
                <p className="text-sm text-gray-500 mb-6">In your Meta app dashboard, find these two values and paste them below:</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number ID</label>
                    <input
                      value={phoneId}
                      onChange={(e) => setPhoneId(e.target.value)}
                      placeholder="e.g. 123456789012345"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                    <p className="text-xs text-gray-400 mt-1">Found in WhatsApp → Getting Started → Phone Number ID</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Temporary Access Token</label>
                    <input
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="EAAxxxxxxx..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                    <p className="text-xs text-gray-400 mt-1">Found in WhatsApp → Getting Started → Temporary access token</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setWizardStep(1)} className="flex-1 border border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors">
                    ← Back
                  </button>
                  <button
                    onClick={() => setWizardStep(3)}
                    disabled={!phoneId || !accessToken}
                    className="flex-1 bg-brand-green text-white font-bold py-3 rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div>
                <h3 className="text-xl font-bold mb-4">Step 3: Set your webhook URL</h3>
                <p className="text-sm text-gray-500 mb-6">In your Meta app, go to WhatsApp → Configuration → Webhook and paste:</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Callback URL</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 font-mono break-all">
                        {tenantData?.webhookUrl ?? "https://your-bot.moolabiz.app/api/webhook"}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(tenantData?.webhookUrl ?? "")}
                        className="bg-brand-green text-white px-3 py-3 rounded-xl text-sm font-bold hover:bg-brand-dark transition-colors flex-shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Verify Token</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 font-mono break-all">
                        {tenantData?.webhookVerifyToken ?? "your-verify-token"}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(tenantData?.webhookVerifyToken ?? "")}
                        className="bg-brand-green text-white px-3 py-3 rounded-xl text-sm font-bold hover:bg-brand-dark transition-colors flex-shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
                    <strong>Subscribe</strong> to the &ldquo;messages&rdquo; webhook field after saving.
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setWizardStep(2)} className="flex-1 border border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors">
                    ← Back
                  </button>
                  <button
                    onClick={handleWizardComplete}
                    className="flex-1 bg-brand-green text-white font-bold py-3 rounded-xl hover:bg-brand-dark transition-colors"
                  >
                    My Bot is Connected! 🎉
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── DONE ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark to-brand-green flex items-center justify-center px-4">
      <div className="text-center text-white max-w-lg animate-slide-up">
        <span className="text-7xl inline-block animate-float">🎉</span>
        <h1 className="text-4xl font-extrabold mt-6 mb-4">Your Bot is LIVE!</h1>
        <p className="text-white/80 text-lg mb-8">
          Customers can now message <strong>{whatsappNumber}</strong> and your AI assistant will handle orders, bookings, payments, and more — 24/7 in their language.
        </p>
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-left space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-white/60">Bot URL</span><span className="font-mono">{tenantData?.subdomain}</span></div>
          <div className="flex justify-between"><span className="text-white/60">Dashboard</span><span className="font-mono">{tenantData?.subdomain}/dashboard</span></div>
          <div className="flex justify-between"><span className="text-white/60">AI</span><span>Free Ollama (llama3.2)</span></div>
          <div className="flex justify-between"><span className="text-white/60">Payment</span><span className="capitalize">{paymentProvider}</span></div>
        </div>
        <p className="mt-8 text-white/50 text-sm">💰 MoolaBiz — Built with ❤️ in South Africa</p>
      </div>
    </div>
  );
}
