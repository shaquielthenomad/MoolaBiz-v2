#!/bin/bash
set -e

echo "💰 MoolaBiz — Manual Bot Provisioning"
echo "======================================="
echo ""

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker required. Install: curl -fsSL https://get.docker.com | sh"; exit 1; }

read -p "Business name: " BIZ_NAME
read -p "WhatsApp number (+27...): " WA_NUMBER
read -p "Payment provider (yoco/ozow/payfast): " PAY_PROVIDER
read -p "Port for this bot (default 3001): " BOT_PORT
BOT_PORT=${BOT_PORT:-3001}

INSTANCE_ID="moolabiz-$(echo $BIZ_NAME | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9' | head -c 12)-$(date +%s | tail -c 6)"

echo ""
echo "Creating instance: $INSTANCE_ID on port $BOT_PORT"

# Generate secrets
WH_VERIFY=$(openssl rand -hex 16)
CRON_SEC=$(openssl rand -hex 16)
ADMIN_PW=$(openssl rand -hex 8)
PAY_KEY=$(openssl rand -hex 16)
ADV_KEY=$(openssl rand -hex 16)

# Create env file
cat > .env.bot.local << ENVEOF
OLLAMA_BASE_URL=http://ollama:11434
BUSINESS_NAME=$BIZ_NAME
NEXT_PUBLIC_APP_URL=http://$(curl -s ifconfig.me 2>/dev/null || echo "localhost"):$BOT_PORT
WHATSAPP_PHONE_NUMBER_ID=PLACEHOLDER
WHATSAPP_ACCESS_TOKEN=PLACEHOLDER
WHATSAPP_WEBHOOK_VERIFY_TOKEN=$WH_VERIFY
CRON_SECRET=$CRON_SEC
ADMIN_PASSWORD=$ADMIN_PW
ADVOCATE_API_KEY=$ADV_KEY
PAYMENTS_API_KEY=$PAY_KEY
PAYMENT_PROVIDER=$PAY_PROVIDER
NEXT_PUBLIC_SUPABASE_URL=FILL_ME
SUPABASE_SERVICE_ROLE_KEY=FILL_ME
ENVEOF

echo ""
echo "✅ Environment file created (.env.bot.local)"
echo ""
echo "=== Next: Connect WhatsApp ==="
echo "1. Go to https://developers.facebook.com/apps/"
echo "2. Create WhatsApp app → add number: $WA_NUMBER"
echo "3. Copy PHONE_NUMBER_ID and ACCESS_TOKEN"
echo ""

read -p "PHONE_NUMBER_ID: " PHONE_ID
read -p "ACCESS_TOKEN: " ACC_TOKEN

sed -i "s/WHATSAPP_PHONE_NUMBER_ID=PLACEHOLDER/WHATSAPP_PHONE_NUMBER_ID=$PHONE_ID/" .env.bot.local
sed -i "s/WHATSAPP_ACCESS_TOKEN=PLACEHOLDER/WHATSAPP_ACCESS_TOKEN=$ACC_TOKEN/" .env.bot.local

echo ""
echo "Starting bot + Ollama..."
BOT_PORT=$BOT_PORT docker compose -f deploy/docker-compose.bot.yml up -d --build

echo ""
echo "Pulling AI model (first time only, ~2 min)..."
sleep 10
docker exec $(docker ps -q -f name=ollama) ollama pull llama3.2:3b 2>/dev/null || echo "Will pull model on first message"

echo ""
echo "================================================"
echo "🎉 BOT IS LIVE!"
echo "Webhook URL: http://$(curl -s ifconfig.me):$BOT_PORT/api/webhook"
echo "Verify Token: $WH_VERIFY"
echo "Dashboard: http://$(curl -s ifconfig.me):$BOT_PORT/dashboard"
echo "Admin password: $ADMIN_PW"
echo "================================================"
echo ""
echo "Paste the webhook URL + verify token in your Meta app settings."
