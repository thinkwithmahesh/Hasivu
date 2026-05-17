#!/bin/bash

# HASIVU Platform - Production Readiness Validation Script
# Quick validation of all production readiness components

set -e

echo "🚀 HASIVU Platform Production Readiness Validation"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if file exists
check_file() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $description${NC}"
        return 0
    else
        echo -e "${RED}❌ $description (Missing: $file)${NC}"
        return 1
    fi
}

# Function to check TypeScript syntax
check_typescript_syntax() {
    local file="$1"
    local component_name="$2"
    
    echo -n "   Checking TypeScript syntax... "
    
    # Simple syntax check using node
    if node -c "$file" 2>/dev/null; then
        echo -e "${GREEN}✅${NC}"
        return 0
    else
        echo -e "${RED}❌ Syntax error${NC}"
        return 1
    fi
}

echo -e "${BLUE}📋 Checking Core Production Readiness Components...${NC}"
echo

COMPONENTS_VALID=0
TOTAL_COMPONENTS=0

# Component 1: Production Integration Tests
TOTAL_COMPONENTS=$((TOTAL_COMPONENTS + 1))
if check_file "tests/integration/production-integration.test.ts" "Production Integration Test Suite"; then
    check_typescript_syntax "tests/integration/production-integration.test.ts" "Integration Tests"
    COMPONENTS_VALID=$((COMPONENTS_VALID + 1))
fi

# Component 2: Load Testing Framework
TOTAL_COMPONENTS=$((TOTAL_COMPONENTS + 1))
if check_file "tests/load/production-load-test.ts" "Production Load Testing Framework"; then
    check_typescript_syntax "tests/load/production-load-test.ts" "Load Tests"
    COMPONENTS_VALID=$((COMPONENTS_VALID + 1))
fi

# Component 3: Disaster Recovery Validator
TOTAL_COMPONENTS=$((TOTAL_COMPONENTS + 1))
if check_file "scripts/disaster-recovery-validator.ts" "Disaster Recovery Validator"; then
    check_typescript_syntax "scripts/disaster-recovery-validator.ts" "Disaster Recovery"
    COMPONENTS_VALID=$((COMPONENTS_VALID + 1))
fi

# Component 4: Incident Response Orchestrator
TOTAL_COMPONENTS=$((TOTAL_COMPONENTS + 1))
if check_file "scripts/incident-response-orchestrator.ts" "Incident Response Orchestrator"; then
    check_typescript_syntax "scripts/incident-response-orchestrator.ts" "Incident Response"
    COMPONENTS_VALID=$((COMPONENTS_VALID + 1))
fi

# Component 5: Business Continuity Dashboard
TOTAL_COMPONENTS=$((TOTAL_COMPONENTS + 1))
if check_file "scripts/business-continuity-dashboard.ts" "Business Continuity Dashboard"; then
    check_typescript_syntax "scripts/business-continuity-dashboard.ts" "Business Continuity"
    COMPONENTS_VALID=$((COMPONENTS_VALID + 1))
fi

# Component 6: Production Deployment Validation
TOTAL_COMPONENTS=$((TOTAL_COMPONENTS + 1))
if check_file "scripts/production-deployment-validation.ts" "Production Deployment Validator"; then
    check_typescript_syntax "scripts/production-deployment-validation.ts" "Deployment Validation"
    COMPONENTS_VALID=$((COMPONENTS_VALID + 1))
fi

# Component 7: System Health Monitor
TOTAL_COMPONENTS=$((TOTAL_COMPONENTS + 1))
if check_file "scripts/system-health-monitor.ts" "System Health Monitor"; then
    check_typescript_syntax "scripts/system-health-monitor.ts" "Health Monitor"
    COMPONENTS_VALID=$((COMPONENTS_VALID + 1))
fi

# Component 8: Master Orchestrator
TOTAL_COMPONENTS=$((TOTAL_COMPONENTS + 1))
if check_file "scripts/production-readiness-orchestrator.ts" "Production Readiness Orchestrator"; then
    check_typescript_syntax "scripts/production-readiness-orchestrator.ts" "Master Orchestrator"
    COMPONENTS_VALID=$((COMPONENTS_VALID + 1))
fi

echo
echo -e "${BLUE}📊 Checking Supporting Infrastructure...${NC}"

# Check package.json for required dependencies
if check_file "package.json" "Package.json with dependencies"; then
    echo -n "   Checking for critical dependencies... "
    
    if grep -q "typescript" package.json && grep -q "tsx" package.json; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${YELLOW}⚠️ Missing TypeScript execution dependencies${NC}"
        echo "   Run: npm install -g typescript tsx"
    fi
fi

# Check for existing deployment configuration
check_file "PRODUCTION-LAUNCH-STRATEGY.md" "Production Launch Strategy"
check_file "FINAL-DEPLOYMENT-CHECKLIST.md" "Final Deployment Checklist"

echo
echo "=================================================="
echo -e "${BLUE}📈 VALIDATION SUMMARY${NC}"
echo "=================================================="

READINESS_PERCENTAGE=$(( (COMPONENTS_VALID * 100) / TOTAL_COMPONENTS ))

if [ $COMPONENTS_VALID -eq $TOTAL_COMPONENTS ]; then
    echo -e "${GREEN}✅ ALL COMPONENTS READY${NC}"
    echo -e "${GREEN}📊 Readiness: $READINESS_PERCENTAGE% ($COMPONENTS_VALID/$TOTAL_COMPONENTS components)${NC}"
    echo
    echo -e "${GREEN}🚀 READY FOR PRODUCTION DEPLOYMENT!${NC}"
    echo
    echo "Next steps:"
    echo "1. Run: npm install (if not already done)"
    echo "2. Set environment variables (API_BASE_URL, etc.)"
    echo "3. Execute: npx tsx scripts/production-readiness-orchestrator.ts production"
    echo "4. Review generated reports in ./production-readiness-reports/"
    echo "5. Proceed with deployment if all validations pass"
    
    exit 0
    
elif [ $COMPONENTS_VALID -ge $(( TOTAL_COMPONENTS * 80 / 100 )) ]; then
    echo -e "${YELLOW}⚠️ MOSTLY READY${NC}"
    echo -e "${YELLOW}📊 Readiness: $READINESS_PERCENTAGE% ($COMPONENTS_VALID/$TOTAL_COMPONENTS components)${NC}"
    echo
    echo -e "${YELLOW}🔍 REVIEW REQUIRED - Some components are missing${NC}"
    echo "Consider deploying with additional monitoring and manual oversight."
    
    exit 1
    
else
    echo -e "${RED}❌ NOT READY${NC}"
    echo -e "${RED}📊 Readiness: $READINESS_PERCENTAGE% ($COMPONENTS_VALID/$TOTAL_COMPONENTS components)${NC}"
    echo
    echo -e "${RED}🚫 DO NOT DEPLOY - Critical components are missing${NC}"
    echo "Address all missing components before attempting production deployment."
    
    exit 2
fi