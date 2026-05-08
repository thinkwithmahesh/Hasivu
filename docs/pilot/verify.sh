#!/usr/bin/env bash
set +e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT" || exit 1

PASS=0
FAIL=0
PENDING=0

gate() {
  local name="$1"
  local command="$2"

  if ( cd "$ROOT" && eval "$command" ) >/tmp/hasivu-pilot-gate.out 2>&1; then
    printf "PASS %-46s\n" "$name"
    PASS=$((PASS + 1))
  else
    printf "FAIL %-46s\n" "$name"
    sed -n '1,8p' /tmp/hasivu-pilot-gate.out | sed 's/^/  /'
    FAIL=$((FAIL + 1))
  fi
}

pending() {
  printf "PENDING %-43s human action required\n" "$1"
  PENDING=$((PENDING + 1))
}

echo "Hasivu Pilot Launch - Final Acceptance Gates"
echo

echo "Security"
gate "0 npm vulnerabilities (root)" \
  "npm audit --omit=dev --audit-level=moderate"
gate "0 npm vulnerabilities (web)" \
  "cd web && npm audit --omit=dev --audit-level=moderate"
gate "No .env secrets in Git index" \
  "[ \$(git ls-files -- '.env*' | grep -v example | grep -v integration | wc -l | tr -d ' ') -eq 0 ]"
gate "Razorpay in CSP (source)" \
  "grep -q 'checkout.razorpay.com' web/next.config.js"
gate "Cookie-only auth" \
  "[ \$(grep -rn 'localStorage.*[Tt]oken' web/src/ --include='*.ts' --include='*.tsx' | grep -v .test. | wc -l | tr -d ' ') -eq 0 ]"
gate "No wildcard CORS" \
  "[ \$(grep -rn \"origin.*'\\\\*'\" src/config/cors.config.ts 2>/dev/null | wc -l | tr -d ' ') -eq 0 ]"
pending "Secrets rotated"
pending "Git history scrubbed"

echo
echo "Runtime"
gate "Backend /health/live" \
  "curl -sf http://localhost:3000/health/live"
gate "Backend /health/ready" \
  "curl -sf http://localhost:3000/health/ready"
gate "Backend /metrics" \
  "curl -sf http://localhost:3000/metrics"
gate "Frontend /api/status" \
  "curl -sf http://localhost:3001/api/status"
gate "Role and core routes reachable" \
  "curl -sfL http://localhost:3001/dashboard/parent >/dev/null && curl -sfL http://localhost:3001/dashboard/admin >/dev/null && curl -sfL http://localhost:3001/dashboard/kitchen >/dev/null && curl -sfL http://localhost:3001/dashboard/student >/dev/null && curl -sfL http://localhost:3001/dashboard/vendor >/dev/null && curl -sfL http://localhost:3001/menu >/dev/null && curl -sfL http://localhost:3001/cart >/dev/null && curl -sfL http://localhost:3001/orders >/dev/null && curl -sfL http://localhost:3001/notifications >/dev/null && curl -sfL http://localhost:3001/settings >/dev/null && curl -sfL http://localhost:3001/analytics >/dev/null && curl -sfL http://localhost:3001/rfid-verification >/dev/null && curl -sfL http://localhost:3001/kitchen-management >/dev/null && curl -sfL http://localhost:3001/inventory-management >/dev/null && curl -sfL http://localhost:3001/daily-menu >/dev/null"

echo
echo "Code Quality"
gate "Root TypeScript strict" \
  "npm run type-check"
gate "Web TypeScript strict" \
  "cd web && npm run type-check"
gate "Required tests" \
  "npm run test:required"
gate "No circular deps (root)" \
  "npx madge --circular --extensions ts,tsx src/ 2>&1 | grep -q 'No circular'"
gate "No circular deps (web)" \
  "cd web && npx madge --circular --extensions ts,tsx src/ 2>&1 | grep -q 'No circular'"

echo
echo "PRD Coverage"
gate "All five dashboards exist" \
  "ls web/src/app/dashboard/parent/page.tsx web/src/app/dashboard/admin/page.tsx web/src/app/dashboard/kitchen/page.tsx web/src/app/dashboard/student/page.tsx web/src/app/dashboard/vendor/page.tsx"
gate "Checkout and cart pages exist" \
  "ls 'web/src/app/(parent)/checkout/page.tsx' web/src/app/cart/page.tsx"
gate "RFID verification page exists" \
  "ls web/src/app/rfid-verification/page.tsx"
gate "Service quarantine documented" \
  "ls docs/pilot/SERVICE_QUARANTINE.md"
gate "Scope decisions documented" \
  "ls docs/scope-decisions.md"

echo
echo "DevOps"
gate "Production compose valid" \
  "docker compose -f docker-compose.yml config"
gate "Sentry wired (backend)" \
  "ls src/utils/sentry.ts"
gate "All runbooks present" \
  "ls docs/runbooks/DEPLOY.md docs/runbooks/ROLLBACK.md docs/runbooks/SECRETS_ROTATION.md docs/runbooks/OBSERVABILITY.md docs/runbooks/INCIDENT_RESPONSE.md"
gate "README updated" \
  "[ \$(wc -c < README.md | tr -d ' ') -gt 2000 ]"

echo
echo "E2E"
PLAYWRIGHT_OUT=$(
  cd "$ROOT/web" && \
    PLAYWRIGHT_BASE_URL=http://localhost:3001 \
    API_BASE_URL=http://localhost:3000 \
    TEST_PARENT_EMAIL=parent.demo@hasivu.local \
    TEST_PARENT_PASSWORD="Hasivu123!" \
    TEST_ADMIN_EMAIL=admin.demo@hasivu.local \
    TEST_ADMIN_PASSWORD="Hasivu123!" \
    TEST_KITCHEN_EMAIL=kitchen.demo@hasivu.local \
    TEST_KITCHEN_PASSWORD="Hasivu123!" \
    CI=1 npx playwright test --project="Desktop Chrome" --reporter=line 2>&1 | tail -5
)
echo "$PLAYWRIGHT_OUT"
if [[ "$PLAYWRIGHT_OUT" == *"41 passed"* ]]; then
  printf "PASS %-46s\n" "Playwright 41/41"
  PASS=$((PASS + 1))
else
  printf "FAIL %-46s\n" "Playwright 41/41"
  FAIL=$((FAIL + 1))
fi

echo
TOTAL=$((PASS + FAIL))
PCT=$(python3 -c "print(round($PASS / $TOTAL * 100))" 2>/dev/null || echo "0")
echo "Automated gates: $PASS/$TOTAL (${PCT}%)"
echo "Operational pending: $PENDING"

if [ "$FAIL" -eq 0 ]; then
  echo "Verdict: CONDITIONAL GO FOR PILOT"
  echo "Reason: all automated gates passed; human secret rotation and history scrub remain."
  exit 0
fi

echo "Verdict: NO-GO until failed automated gates are fixed."
exit 1
