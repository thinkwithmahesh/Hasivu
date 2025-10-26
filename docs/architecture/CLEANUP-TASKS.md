# Architecture Cleanup Tasks

**Date**: October 26, 2025
**Status**: Optional Cleanup (Architecture is Correct)

## Overview

After comprehensive architecture analysis, the HASIVU Platform backend is using the correct hybrid architecture patterns. However, there are some minor cleanup tasks to improve code clarity.

## Cleanup Task 1: Remove Menu Lambda Prototypes

**Priority**: Low
**Effort**: 5 minutes

**Context**:
Menu management uses Next.js Native pattern (Pattern 3). The `.bak` files in `src/functions/menu/` are from early prototyping and are no longer needed.

**Files to Remove**:

```bash
rm /Users/mahesha/Downloads/hasivu-platform/src/functions/menu/createMenuItem.ts.bak
rm /Users/mahesha/Downloads/hasivu-platform/src/functions/menu/deleteMenuItem.ts.bak
rm /Users/mahesha/Downloads/hasivu-platform/src/functions/menu/getMenuItemById.ts.bak
rm /Users/mahesha/Downloads/hasivu-platform/src/functions/menu/getMenuItems.ts.bak
rm /Users/mahesha/Downloads/hasivu-platform/src/functions/menu/searchMenuItems.ts.bak
rm /Users/mahesha/Downloads/hasivu-platform/src/functions/menu/updateMenuItem.ts.bak
```

**Justification**:

- Menu intentionally uses Next.js API routes with Prisma
- These Lambda prototypes were never deployed
- Keeping them causes confusion about the architecture

## Cleanup Task 2: Update Environment Variable Examples

**Priority**: Medium
**Effort**: 10 minutes

**Context**:
The `.env.example` files should document the BFF proxy pattern more clearly.

**Update Required** in `/web/.env.example`:

```bash
# Frontend API Configuration
# For BFF Proxy Pattern: Use Next.js domain (e.g., https://app.hasivu.com/api)
# This routes through Next.js proxy to Lambda functions
NEXT_PUBLIC_API_URL=https://your-app-domain.com/api

# Lambda Function URLs (for Next.js proxy routes)
# Nutrition Lambda endpoints
LAMBDA_NUTRITION_ANALYZE_URL=https://api-gateway-id.execute-api.region.amazonaws.com/prod/nutrition/analyze
LAMBDA_DIETARY_RECOMMENDATIONS_URL=https://api-gateway-id.execute-api.region.amazonaws.com/prod/nutrition/recommendations/generate
LAMBDA_MEAL_OPTIMIZATION_URL=https://api-gateway-id.execute-api.region.amazonaws.com/prod/nutrition/meal-optimization/optimize
LAMBDA_COMPLIANCE_CHECKER_URL=https://api-gateway-id.execute-api.region.amazonaws.com/prod/nutrition/compliance/check

# Analytics Lambda endpoints
LAMBDA_EXECUTIVE_DASHBOARD_URL=https://api-gateway-id.execute-api.region.amazonaws.com/prod/analytics/executive/dashboard
LAMBDA_BUSINESS_INTELLIGENCE_URL=https://api-gateway-id.execute-api.region.amazonaws.com/prod/analytics/business-intelligence/dashboard
# ... (add all 11 analytics endpoints)
```

**Justification**:

- Developers need to understand the BFF proxy pattern
- Clear documentation prevents confusion
- Lambda URLs must be configured for proxy routes to work

## Cleanup Task 3: Add Architecture Comments to Proxy Routes

**Priority**: Medium
**Effort**: 15 minutes

**Context**:
Add header comments to all Next.js proxy routes explaining the BFF pattern.

**Example Update** for `/web/src/app/api/nutrition/analyze/route.ts`:

```typescript
/**
 * Nutrition Analysis API Route (BFF Proxy Pattern)
 *
 * Architecture: Pattern 2 - BFF Proxy
 * Flow: Frontend → Next.js Proxy → Lambda → Database/ML
 *
 * This route provides:
 * - httpOnly cookie authentication
 * - Request validation
 * - Error transformation for frontend
 * - Potential caching layer (future)
 *
 * Lambda Backend: nutrition-analyzer (src/functions/nutrition/nutrition-analyzer.ts)
 * Endpoint: POST /nutrition/analyze
 *
 * See: docs/architecture/ADR-001-hybrid-backend-architecture.md
 */
import { NextRequest, NextResponse } from 'next/server';
// ... rest of code
```

**Files to Update**:

- `/web/src/app/api/nutrition/analyze/route.ts`
- `/web/src/app/api/nutrition/recommendations/route.ts`
- `/web/src/app/api/nutrition/compliance/route.ts`
- `/web/src/app/api/nutrition/optimize-meal/route.ts`
- `/web/src/app/api/nutrition/trends/route.ts`
- All 11 analytics proxy routes

**Justification**:

- Self-documenting code
- New developers understand the pattern immediately
- Links to ADR for detailed explanation

## Cleanup Task 4: Add Architecture Diagram

**Priority**: High
**Effort**: 30 minutes

**Context**:
Create a visual diagram showing all three architecture patterns.

**Create File**: `/docs/architecture/architecture-diagram.md`

```markdown
# HASIVU Platform Backend Architecture Diagram

## Pattern 1: Direct Lambda (Microservices)
```

┌──────────┐ ┌─────────────┐ ┌────────┐ ┌──────────┐
│ Mobile │────▶│ API Gateway │────▶│ Lambda │────▶│ Database │
│ App │ │ (AWS) │ │ Function│ │ RDS │
└──────────┘ └─────────────┘ └────────┘ └──────────┘
│
▼
┌──────────┐
│ ML Model │
│ SageMaker│
└──────────┘

Epics: Authentication, Payments, RFID, Mobile Backend

```

## Pattern 2: BFF Proxy (Lambda + Next.js)

```

┌──────────┐ ┌──────────────┐ ┌─────────────┐ ┌────────┐ ┌──────────┐
│ Web │────▶│ Next.js │────▶│ API Gateway │────▶│ Lambda │────▶│ Database │
│ Frontend │ │ Proxy Routes │ │ (AWS) │ │ Function│ │ RDS │
└──────────┘ └──────────────┘ └─────────────┘ └────────┘ └──────────┘
│ │
(httpOnly cookies) ▼
(auth, validation) ┌──────────┐
│ ML Model │
│ Bedrock │
└──────────┘

Epics: Analytics, Nutrition
Benefits: Cookie security, error handling, request transformation

```

## Pattern 3: Next.js Native (Monolithic)

```

┌──────────┐ ┌──────────────┐ ┌──────────┐
│ Web │────▶│ Next.js │────▶│ Database │
│ Frontend │ │ API Routes + │ │ RDS │
└──────────┘ │ Prisma │ │ (Prisma)│
└──────────────┘ └──────────┘
│
(SSR, caching,
direct queries)

Epic: Menu Management
Benefits: Simplicity, caching, no Lambda overhead

```

**Justification**:
- Visual understanding of architecture
- Onboarding new developers
- Reference for architectural decisions

## Non-Issues (Architecture is Correct)

### ✅ Nutrition Endpoints
**Status**: CORRECT (No action needed)
- Next.js routes are proxy routes (BFF pattern)
- Lambda functions handle compute
- Frontend correctly uses Next.js proxy

### ✅ Analytics Endpoints
**Status**: CORRECT (No action needed)
- Next.js routes are proxy routes (BFF pattern)
- 11 Lambda functions configured in serverless.yml
- Frontend correctly uses Next.js proxy

### ✅ Menu Endpoints
**Status**: CORRECT (No action needed)
- Intentionally uses Next.js Native pattern
- No Lambda functions (correct decision)
- Direct Prisma database access

## Summary

**Total Cleanup Tasks**: 4
**Required Tasks**: 0 (architecture is correct)
**Recommended Tasks**: 4 (improve documentation)
**Estimated Total Effort**: 60 minutes

**Priority Order**:
1. Task 4: Architecture diagram (30 min) - High priority
2. Task 2: Environment variable docs (10 min) - Medium priority
3. Task 3: Proxy route comments (15 min) - Medium priority
4. Task 1: Remove `.bak` files (5 min) - Low priority

---

**Next Steps**:
1. Review ADR-001 with development team
2. Complete cleanup tasks (optional)
3. Use decision framework for future epics
4. Monitor performance of BFF proxy pattern
```
