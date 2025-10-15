#!/bin/bash
# audit-auth.sh - Quick authentication audit for HASIVU platform
# Usage: ./scripts/audit-auth.sh

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     HASIVU Platform - Authentication Security Audit           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📅 Audit Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo "📁 Working Directory: $(pwd)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "src/functions" ]; then
  echo "${RED}❌ Error: src/functions directory not found${NC}"
  echo "Please run this script from the project root directory"
  exit 1
fi

echo "─────────────────────────────────────────────────────────────────"
echo "📊 AUTHENTICATION MIDDLEWARE USAGE"
echo "─────────────────────────────────────────────────────────────────"
echo ""

# Count NEW JWT middleware usage
NEW_JWT_COUNT=$(grep -r "jwt-auth.middleware" src/functions/ --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
echo "${GREEN}✅ Files using NEW JWT middleware:${NC} $NEW_JWT_COUNT"
if [ "$NEW_JWT_COUNT" -gt 0 ]; then
  echo "   Files:"
  grep -r "jwt-auth.middleware" src/functions/ --include="*.ts" -l 2>/dev/null | sed 's/^/   - /'
fi
echo ""

# Count LEGACY auth middleware usage
LEGACY_AUTH_COUNT=$(grep -r "lambda-auth.middleware" src/functions/ --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
echo "${YELLOW}🔶 Files using LEGACY authentication:${NC} $LEGACY_AUTH_COUNT"
if [ "$LEGACY_AUTH_COUNT" -gt 0 ]; then
  echo "   Files:"
  grep -r "lambda-auth.middleware" src/functions/ --include="*.ts" -l 2>/dev/null | sed 's/^/   - /'
fi
echo ""

echo "─────────────────────────────────────────────────────────────────"
echo "⚠️  POTENTIALLY UNSECURED ENDPOINTS"
echo "─────────────────────────────────────────────────────────────────"
echo ""

UNSECURED_COUNT=0
find src/functions/ -name "*.ts" -type f | while read file; do
  # Skip .bak files
  if [[ "$file" == *.bak ]]; then
    continue
  fi
  
  # Skip example files
  if [[ "$file" == *example* ]]; then
    continue
  fi
  
  # Check if file has authentication
  if ! grep -q "authenticateLambda\|withAuth\|jwt-auth" "$file" 2>/dev/null; then
    echo "${RED}   ❌ $file${NC}"
    UNSECURED_COUNT=$((UNSECURED_COUNT + 1))
  fi
done

if [ "$UNSECURED_COUNT" -eq 0 ]; then
  echo "${GREEN}   ✅ No unsecured endpoints found!${NC}"
fi
echo ""

echo "─────────────────────────────────────────────────────────────────"
echo "🔍 WEBHOOK ENDPOINTS (Should NOT use JWT auth)"
echo "─────────────────────────────────────────────────────────────────"
echo ""

WEBHOOK_FILES=$(find src/functions/payments/ -name "*webhook*.ts" -type f 2>/dev/null | grep -v ".bak$" || true)
if [ -z "$WEBHOOK_FILES" ]; then
  echo "   ${YELLOW}⚠️  No webhook files found${NC}"
else
  echo "$WEBHOOK_FILES" | while read webhook_file; do
    echo "   Checking: $webhook_file"
    
    # Check if webhook uses JWT auth (bad)
    if grep -q "withAuth\|jwt-auth" "$webhook_file" 2>/dev/null; then
      echo "   ${RED}❌ WARNING: Webhook is using JWT authentication (should use signature verification)${NC}"
    fi
    
    # Check if webhook has signature verification (good)
    if grep -q "signature\|hmac\|crypto.createHmac" "$webhook_file" 2>/dev/null; then
      echo "   ${GREEN}✅ Has signature verification${NC}"
    else
      echo "   ${YELLOW}⚠️  No signature verification found${NC}"
    fi
    echo ""
  done
fi

echo "─────────────────────────────────────────────────────────────────"
echo "📋 ENDPOINT SUMMARY BY CATEGORY"
echo "─────────────────────────────────────────────────────────────────"
echo ""

# Payment endpoints
PAYMENT_COUNT=$(find src/functions/payments/ -name "*.ts" -type f 2>/dev/null | grep -v ".bak$" | grep -v "example" | wc -l | tr -d ' ')
echo "${BLUE}💳 Payment Endpoints:${NC} $PAYMENT_COUNT total"

# RFID endpoints
if [ -d "src/functions/rfid" ]; then
  RFID_COUNT=$(find src/functions/rfid/ -name "*.ts" -type f 2>/dev/null | grep -v ".bak$" | wc -l | tr -d ' ')
  echo "${BLUE}🔖 RFID Endpoints:${NC} $RFID_COUNT total"
fi

# Other endpoints
OTHER_DIRS=$(find src/functions/ -mindepth 1 -maxdepth 1 -type d | grep -v "payments\|rfid" 2>/dev/null || true)
if [ ! -z "$OTHER_DIRS" ]; then
  echo "${BLUE}📦 Other Endpoints:${NC}"
  echo "$OTHER_DIRS" | while read dir; do
    COUNT=$(find "$dir" -name "*.ts" -type f 2>/dev/null | grep -v ".bak$" | wc -l | tr -d ' ')
    if [ "$COUNT" -gt 0 ]; then
      echo "   - $(basename $dir): $COUNT files"
    fi
  done
fi
echo ""

echo "─────────────────────────────────────────────────────────────────"
echo "🔒 ADMIN-ONLY ENDPOINTS CHECK"
echo "─────────────────────────────────────────────────────────────────"
echo ""

ADMIN_KEYWORDS="analytics|reconciliation|bulk-import|admin"
echo "Searching for admin endpoints (analytics, reconciliation, bulk operations):"
echo ""

find src/functions/ -name "*.ts" -type f | grep -E "$ADMIN_KEYWORDS" | grep -v ".bak$" | grep -v "example" | while read admin_file; do
  echo "   📄 $admin_file"
  
  # Check for role restrictions
  if grep -q "admin\|super_admin\|school_admin" "$admin_file" 2>/dev/null; then
    echo "      ${GREEN}✅ Has admin role check${NC}"
  else
    echo "      ${RED}❌ WARNING: No admin role check found${NC}"
  fi
  echo ""
done

echo "─────────────────────────────────────────────────────────────────"
echo "📊 SECURITY SCORE CALCULATION"
echo "─────────────────────────────────────────────────────────────────"
echo ""

TOTAL_ENDPOINTS=$(find src/functions/ -name "*.ts" -type f | grep -v ".bak$" | grep -v "example" | wc -l | tr -d ' ')
SECURED_ENDPOINTS=$((NEW_JWT_COUNT + LEGACY_AUTH_COUNT))
SECURITY_PERCENTAGE=$((SECURED_ENDPOINTS * 100 / TOTAL_ENDPOINTS))

echo "Total Endpoints: $TOTAL_ENDPOINTS"
echo "Secured Endpoints: $SECURED_ENDPOINTS"
echo ""

if [ "$SECURITY_PERCENTAGE" -ge 80 ]; then
  echo "${GREEN}🎉 Security Score: $SECURITY_PERCENTAGE% - EXCELLENT${NC}"
elif [ "$SECURITY_PERCENTAGE" -ge 60 ]; then
  echo "${YELLOW}⚠️  Security Score: $SECURITY_PERCENTAGE% - GOOD (needs improvement)${NC}"
else
  echo "${RED}❌ Security Score: $SECURITY_PERCENTAGE% - POOR (urgent action needed)${NC}"
fi
echo ""

echo "─────────────────────────────────────────────────────────────────"
echo "💡 RECOMMENDATIONS"
echo "─────────────────────────────────────────────────────────────────"
echo ""

if [ "$NEW_JWT_COUNT" -lt "$LEGACY_AUTH_COUNT" ]; then
  echo "1. ${YELLOW}⚠️  More endpoints use legacy auth than new JWT middleware${NC}"
  echo "   → Consider gradual migration to new JWT middleware"
  echo ""
fi

if [ "$UNSECURED_COUNT" -gt 0 ]; then
  echo "2. ${RED}❌ Found $UNSECURED_COUNT potentially unsecured endpoints${NC}"
  echo "   → Review and add authentication to these endpoints"
  echo ""
fi

echo "3. ${BLUE}ℹ️  Review webhook endpoints for proper signature verification${NC}"
echo "   → Webhooks should NOT use JWT authentication"
echo ""

echo "4. ${GREEN}✅ Continue with Phase 1.3.2+ in the implementation plan${NC}"
echo "   → See docs/AUTHENTICATION_PHASE1_PROGRESS.md for details"
echo ""

echo "─────────────────────────────────────────────────────────────────"
echo "📝 AUDIT REPORT GENERATED"
echo "─────────────────────────────────────────────────────────────────"
echo ""
echo "For detailed findings, see:"
echo "   - docs/AUTHENTICATION_PHASE1_PROGRESS.md"
echo "   - docs/SECURITY_AUDIT_REPORT.md"
echo ""
echo "To run this audit again: ./scripts/audit-auth.sh"
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    Audit Complete                              ║"
echo "╚════════════════════════════════════════════════════════════════╝"