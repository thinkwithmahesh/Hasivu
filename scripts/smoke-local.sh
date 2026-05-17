#!/usr/bin/env bash
set -euo pipefail

BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3001}"

echo "Smoke check: backend health"
curl -fsS "${BACKEND_URL}/health" >/dev/null
curl -fsS "${BACKEND_URL}/api/health" >/dev/null

echo "Smoke check: API health endpoint"
curl -fsS "${BACKEND_URL}/api/health" >/dev/null

echo "Smoke check: frontend"
curl -fsS "${FRONTEND_URL}" >/dev/null

echo "Smoke checks passed."
