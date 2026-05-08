#!/usr/bin/env bash
set -euo pipefail

VPS_BASE_URL="${VPS_BASE_URL:-}"
SERVERLESS_BASE_URL="${SERVERLESS_BASE_URL:-}"

if [[ -z "${VPS_BASE_URL}" || -z "${SERVERLESS_BASE_URL}" ]]; then
  echo "VPS_BASE_URL and SERVERLESS_BASE_URL must both be set."
  echo "Example:"
  echo "  VPS_BASE_URL=https://staging.api.hasivu.com SERVERLESS_BASE_URL=https://abc.execute-api.ap-south-1.amazonaws.com/staging ./scripts/smoke-hybrid.sh"
  exit 1
fi

check_endpoint() {
  local name="$1"
  local base_url="$2"
  local path="$3"
  local full_url="${base_url}${path}"

  echo "[${name}] GET ${full_url}"
  curl -fsS "${full_url}" >/dev/null
}

echo "Running shared smoke checks for VPS and Serverless targets..."

# Public health surfaces used to validate runtime parity.
for target in "VPS:${VPS_BASE_URL}" "SERVERLESS:${SERVERLESS_BASE_URL}"; do
  IFS=":" read -r name url <<<"${target}"
  check_endpoint "${name}" "${url}" "/health"
  check_endpoint "${name}" "${url}" "/api/health"
done

echo "Hybrid smoke checks passed."
