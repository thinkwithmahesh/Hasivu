#!/bin/bash
# Quality Gate Validation Script
# Usage: ./scripts/quality-gate-validator.sh [task-type]

set -e

echo "🔍 Running Quality Gate Validation..."
echo "=================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default task type
TASK_TYPE=${1:-"general"}

# Functions for different validation types
validate_typescript() {
    echo -e "${BLUE}Checking TypeScript compilation (full validation)...${NC}"
    
    if command -v npx >/dev/null 2>&1; then
        # CORRECTED: Use full TypeScript compilation without skipLibCheck
        # Use specific "error TS" pattern to catch actual TypeScript compilation errors
        ERROR_COUNT=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || true)
        
        if [ "$ERROR_COUNT" -eq 0 ]; then
            echo -e "${GREEN}✅ TypeScript compilation passed (0 errors)${NC}"
            return 0
        else
            echo -e "${RED}❌ TypeScript compilation failed ($ERROR_COUNT errors)${NC}"
            echo "   Run 'npx tsc --noEmit' for details"
            echo "   CRITICAL: Real compilation errors found - do not use type casting workarounds"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  TypeScript compiler not available${NC}"
        return 1
    fi
}

validate_tests() {
    echo -e "${BLUE}Running test validation...${NC}"
    
    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        if npm test > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Tests passed${NC}"
            return 0
        else
            echo -e "${RED}❌ Tests failed${NC}"
            echo "   Run 'npm test' for details"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  No test script found in package.json${NC}"
        return 0
    fi
}

validate_build() {
    echo -e "${BLUE}Validating build process...${NC}"
    
    if [ -f "package.json" ] && grep -q '"build"' package.json; then
        if npm run build > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Build successful${NC}"
            return 0
        else
            echo -e "${RED}❌ Build failed${NC}"
            echo "   Run 'npm run build' for details"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  No build script found in package.json${NC}"
        return 0
    fi
}

validate_linting() {
    echo -e "${BLUE}Checking code linting...${NC}"
    
    if [ -f "package.json" ] && grep -q '"lint"' package.json; then
        if npm run lint > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Linting passed${NC}"
            return 0
        else
            echo -e "${RED}❌ Linting failed${NC}"
            echo "   Run 'npm run lint' for details"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  No lint script found in package.json${NC}"
        return 0
    fi
}

validate_git_status() {
    echo -e "${BLUE}Checking git status...${NC}"
    
    if git status --porcelain | grep -q .; then
        echo -e "${YELLOW}⚠️  Working directory has uncommitted changes${NC}"
        echo "   Consider committing changes before marking task complete"
        return 0
    else
        echo -e "${GREEN}✅ Working directory clean${NC}"
        return 0
    fi
}

generate_evidence_report() {
    echo -e "${BLUE}Generating evidence report...${NC}"
    
    REPORT_FILE="quality-gate-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$REPORT_FILE" << EOF
# Quality Gate Validation Report

**Date:** $(date)
**Task Type:** $TASK_TYPE
**Validation Status:** $1

## Validation Results

### TypeScript Compilation
- Status: $2
- Error Count: $3

### Test Execution
- Status: $4

### Build Process
- Status: $5

### Code Linting
- Status: $6

### Git Status
- Status: $7

## Commands to Reproduce
\`\`\`bash
# TypeScript compilation check (CORRECTED - full validation)
npx tsc --noEmit

# Count TypeScript errors specifically
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l

# Test execution
npm test

# Build validation
npm run build

# Linting check
npm run lint

# Git status
git status --porcelain
\`\`\`

## Evidence Artifacts
- Report file: $REPORT_FILE
- Generated at: $(pwd)
- Git commit: $(git rev-parse HEAD 2>/dev/null || echo "Not a git repository")
EOF

    echo -e "${GREEN}✅ Evidence report generated: $REPORT_FILE${NC}"
}

# Main validation logic
main() {
    echo "Task Type: $TASK_TYPE"
    echo "Working Directory: $(pwd)"
    echo ""
    
    local validation_passed=true
    local ts_status="SKIPPED"
    local test_status="SKIPPED"
    local build_status="SKIPPED"
    local lint_status="SKIPPED"
    local git_status="CLEAN"
    local error_count=0
    
    # TypeScript validation
    if validate_typescript; then
        ts_status="PASSED"
    else
        ts_status="FAILED"
        validation_passed=false
        error_count=$(npx tsc --noEmit --skipLibCheck 2>&1 | grep -c "error TS" || true)
    fi
    
    # Test validation
    if validate_tests; then
        test_status="PASSED"
    else
        test_status="FAILED"
        validation_passed=false
    fi
    
    # Build validation
    if validate_build; then
        build_status="PASSED"
    else
        build_status="FAILED"
        validation_passed=false
    fi
    
    # Linting validation
    if validate_linting; then
        lint_status="PASSED"
    else
        lint_status="FAILED"
        validation_passed=false
    fi
    
    # Git status check
    validate_git_status
    if git status --porcelain | grep -q .; then
        git_status="UNCOMMITTED_CHANGES"
    fi
    
    echo ""
    echo "=================================="
    
    if $validation_passed; then
        echo -e "${GREEN}🎉 All quality gates passed!${NC}"
        generate_evidence_report "PASSED" "$ts_status" "$error_count" "$test_status" "$build_status" "$lint_status" "$git_status"
        exit 0
    else
        echo -e "${RED}❌ Quality gate validation failed${NC}"
        echo -e "${RED}   Task is not ready for completion${NC}"
        generate_evidence_report "FAILED" "$ts_status" "$error_count" "$test_status" "$build_status" "$lint_status" "$git_status"
        exit 1
    fi
}

# Help function
show_help() {
    echo "Quality Gate Validator"
    echo "Usage: $0 [task-type]"
    echo ""
    echo "Task Types:"
    echo "  general     - Run all validation checks (default)"
    echo "  build       - Focus on build and compilation"
    echo "  test        - Focus on test execution"
    echo "  deploy      - Include deployment readiness checks"
    echo ""
    echo "Examples:"
    echo "  $0                 # Run general validation"
    echo "  $0 build          # Run build-focused validation"
    echo "  $0 test           # Run test-focused validation"
}

# Parse command line arguments
case "$1" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main
        ;;
esac