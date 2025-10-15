# Parallel TypeScript Error Fix Plan

**Total Application Errors**: 69 errors in src/
**Strategy**: Fix in 3 parallel waves using direct tool calls

---

## Wave 1: Core Infrastructure (33 errors) - Execute in Parallel

### Group A: Logger System (15 errors)

**Files**: `src/utils/logger.ts`, `src/services/logger.service.ts`, `src/functions/shared/cognito.service.ts`

**Fixes**:

1. Add `integration()` method to Logger class (11 fixes)
2. Export Logger class from utils/logger.ts (2 fixes)
3. Fix error type conversion in cognito.service.ts (2 fixes)

### Group B: Service Exports (7 errors)

**Files**: Various service files with singleton naming issues

**Fixes**:

1. nutrition.service.ts: Fix singleton export (1 error)
2. production.service.ts: Fix singleton export (1 error)
3. quality-control.service.ts: Fix singleton export (1 error)
4. staff-management.service.ts: Fix singleton export (1 error)
5. subscription.service.ts: Fix singleton export (1 error)
6. wallet.service.ts: Fix singleton export (1 error)
7. websocket.service.ts: Fix singleton export (1 error)

### Group C: MenuItem & Notification Services (11 errors)

**Files**: `src/services/menuItem.service.ts`, `src/services/notification.service.ts`

**Fixes**:

1. MenuItemService allergens type (6 errors)
2. NotificationService isRead field (5 errors)

---

## Wave 2: Type Definitions & Services (26 errors) - Execute in Parallel

### Group D: Type System (15 errors)

**Files**: `src/types/*.ts`, `src/utils/errors.ts`

**Fixes**:

1. Analytics types - TrendDirection (2 errors)
2. Error utilities - missing classes (6 errors)
3. Missing service modules (2 errors)
4. ML types - HyperparameterValue, MetricValue, etc. (5 preview)

### Group E: Service Infrastructure (11 errors)

**Files**: Service files with constructor/method issues

**Fixes**:

1. OrderService constructor access (1 error)
2. RedisService static methods (2 errors)
3. PaymentAnalytics config import (1 error)
4. ValidationService ZodError (2 errors)
5. ML service instance naming (5 errors)

---

## Wave 3: ML Services (10 errors) - Execute Sequentially

### Group F: ML Type Definitions

**Files**: `src/services/ml/*.ts`

**Fixes**:

1. Create comprehensive ML types file
2. Fix undefined variables (roundId, pipelineId)
3. Fix instance property naming

---

## Execution Order

**Phase 1** (Parallel): Groups A + B + C → 33 errors fixed
**Phase 2** (Parallel): Groups D + E → 26 errors fixed
**Phase 3** (Sequential): Group F → 10 errors fixed

**Total Expected**: 69 → 0 errors
**Estimated Time**: 25-30 minutes
