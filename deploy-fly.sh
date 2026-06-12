#!/usr/bin/env bash
# ============================================================
# Surqo — Deploy inicial a Fly.io
# Ejecutar UNA sola vez para crear la app.
# Después el CI/CD hace los deploys automáticos.
# ============================================================
set -e

echo "==> Verificando flyctl instalado..."
if ! command -v flyctl &> /dev/null; then
  echo "Instalando flyctl..."
  curl -L https://fly.io/install.sh | sh
  export PATH="$HOME/.fly/bin:$PATH"
fi

echo "==> Login en Fly.io (abre el navegador)..."
flyctl auth login

cd backend

echo "==> Creando la app en Fly.io (solo primera vez)..."
# Si la app ya existe, esto falla silenciosamente
flyctl apps create surqo-api --org personal 2>/dev/null || echo "App ya existe, continuando..."

echo ""
echo "==> Configurando secrets en Fly.io..."
echo "Necesitas los siguientes valores. Puedes pegarlos uno a uno:"
echo ""

read -p "GROQ_API_KEY (console.groq.com): " GROQ_API_KEY
read -p "SUPABASE_URL (https://xxx.supabase.co): " SUPABASE_URL
read -p "SUPABASE_KEY (service role key): " SUPABASE_KEY
read -p "SUPABASE_JWK_X: " SUPABASE_JWK_X
read -p "SUPABASE_JWK_Y: " SUPABASE_JWK_Y
read -p "SUPABASE_JWK_KID: " SUPABASE_JWK_KID
read -p "DATABASE_URL (postgresql+asyncpg://...): " DATABASE_URL
read -p "REDIS_URL (rediss://...): " REDIS_URL
read -p "HIVEMQ_HOST: " HIVEMQ_HOST
read -p "HIVEMQ_USERNAME: " HIVEMQ_USERNAME
read -p "HIVEMQ_PASSWORD: " HIVEMQ_PASSWORD
read -p "RESEND_API_KEY: " RESEND_API_KEY
read -p "CORS_ORIGINS [\"https://surqo.vercel.app\"]: " CORS_ORIGINS
CORS_ORIGINS=${CORS_ORIGINS:-'["https://surqo.vercel.app"]'}

flyctl secrets set \
  LLM_PROVIDER="groq" \
  GROQ_API_KEY="$GROQ_API_KEY" \
  GROQ_MODEL="llama-3.3-70b-versatile" \
  SUPABASE_URL="$SUPABASE_URL" \
  SUPABASE_KEY="$SUPABASE_KEY" \
  SUPABASE_JWK_X="$SUPABASE_JWK_X" \
  SUPABASE_JWK_Y="$SUPABASE_JWK_Y" \
  SUPABASE_JWK_KID="$SUPABASE_JWK_KID" \
  DATABASE_URL="$DATABASE_URL" \
  REDIS_URL="$REDIS_URL" \
  HIVEMQ_HOST="$HIVEMQ_HOST" \
  HIVEMQ_PORT="8883" \
  HIVEMQ_USERNAME="$HIVEMQ_USERNAME" \
  HIVEMQ_PASSWORD="$HIVEMQ_PASSWORD" \
  RESEND_API_KEY="$RESEND_API_KEY" \
  FROM_EMAIL="alertas@surqo.io" \
  CORS_ORIGINS="$CORS_ORIGINS" \
  APP_ENV="production"

echo ""
echo "==> Haciendo deploy..."
flyctl deploy --remote-only

echo ""
echo "============================================================"
echo "  Deploy completado!"
echo "  URL del backend: https://surqo-api.fly.dev"
echo "  Health check:    https://surqo-api.fly.dev/health"
echo "  Docs API:        https://surqo-api.fly.dev/docs"
echo "============================================================"
echo ""
echo "Pasos siguientes:"
echo "  1. Copia FLY_API_TOKEN a GitHub Secrets:"
echo "     flyctl auth token"
echo "  2. Ejecuta el SQL de data retention en Supabase:"
echo "     backend/migrations/data_retention.sql"
echo "  3. Actualiza NEXT_PUBLIC_API_URL en Vercel a:"
echo "     https://surqo-api.fly.dev"
