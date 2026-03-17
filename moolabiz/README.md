# MoolaBiz Monorepo 💰

> Zero-tech 24/7 WhatsApp shop bot platform for African informal traders.
> Free AI forever via Ollama · Single-tenant Docker isolation · Proprietary SOUL.md character lock

## Architecture

```
moolabiz/
├── apps/
│   ├── hub/          # Public signup site + provisioning API (Next.js 15)
│   └── bot/          # WhatsApp bot instance (Next.js 15)
├── workspace/        # Proprietary character + skills (volume-mounted, never in image)
├── deploy/           # Docker, Coolify templates
└── scripts/          # Provisioning automation
```

## How It Works

1. Trader visits hub landing page → fills 3 fields → clicks one button
2. Server provisions isolated Docker container via Coolify API
3. Trader follows guided WhatsApp config wizard
4. Bot is live in under 8 minutes — free AI forever

## Development

```bash
ollama pull llama3.2:3b
cd apps/hub && npm install && npm run dev   # Hub on :3000
cd apps/bot && npm install && npm run dev   # Bot on :3001
```

## Production

See `deploy/` for Docker Compose and Coolify integration.
