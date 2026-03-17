export default function BotHome() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-dark to-brand-green">
      <div className="text-center text-white">
        <span className="text-6xl">💰</span>
        <h1 className="text-3xl font-bold mt-4">MoolaBiz Bot</h1>
        <p className="mt-2 text-white/80">This bot instance is running. Messages are handled via WhatsApp webhook.</p>
        <a href="/dashboard" className="mt-6 inline-block bg-white text-brand-dark font-bold px-6 py-3 rounded-full">
          Admin Dashboard →
        </a>
      </div>
    </div>
  );
}
