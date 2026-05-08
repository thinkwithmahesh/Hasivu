#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.production}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Env file not found: ${ENV_FILE}"
  echo "Usage: ./scripts/deploy-vps.sh [.env.production]"
  exit 1
fi

export $(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "${ENV_FILE}" | xargs)

required_vars=(
  DATABASE_URL
  DIRECT_DATABASE_URL
  JWT_SECRET
  JWT_REFRESH_SECRET
  CORS_ORIGINS
  NEXT_PUBLIC_API_URL
  HASIVU_DOMAIN
)

for key in "${required_vars[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    echo "Missing required variable: ${key}"
    exit 1
  fi
done

echo "Pulling latest images..."
docker compose -f docker-compose.prod.yml --env-file "${ENV_FILE}" pull

echo "Applying Prisma migrations against Supabase (direct URL)..."
DIRECT_DATABASE_URL="${DIRECT_DATABASE_URL}" DATABASE_URL="${DATABASE_URL}" npx prisma migrate deploy

echo "Starting application stack..."
docker compose -f docker-compose.prod.yml --env-file "${ENV_FILE}" up -d

echo "Running local health verification..."
curl -fsS "http://localhost/health" >/dev/null || {
  echo "Health check failed after deploy."
  exit 1
}

echo "VPS deployment completed successfully."
