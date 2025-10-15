# Test Infrastructure Quick Start Guide

## Current Status

- **Tests Passing**: 66/254 (26%)
- **Infrastructure**: ✓ Complete
- **Next Phase**: Test file migration

## Quick Wins (Do These First!)

### 1. Fix Import Paths (5 minutes)

```bash
cd /Users/mahesha/Downloads/hasivu-platform

# Standardize all imports to @/ prefix
find tests -name "*.test.ts" -exec sed -i '' \
  's|from "../../src/|from "@/|g; \
   s|from "../../../src/|from "@/|g; \
   s|from "../../../../src/|from "@/|g' {} \;
```

**Impact**: Fixes ~20 tests

### 2. Verify Basic Tests

```bash
npm test -- --testPathPattern="simple.test" --no-coverage
```

**Expected**: ✓ 3/3 tests passing

### 3. Update Your First Test File

Use this pattern in any failing test:

```typescript
// Import mock factories
import {
  MockedDailyMenuRepository,
  MockedMenuItemRepository,
  MockedCacheService,
  MockedLogger,
  resetAllMocks,
} from '../../mocks/repository.mock';

// Import test data generators
import {
  createTestMenuItem,
  createTestDailyMenu,
  getFutureDate,
} from '../../fixtures/test-data';

describe('Your Test Suite', () => {
  beforeEach(() => {
    resetAllMocks();
    jest.clearAllMocks();
  });

  it('should work with mocks', async () => {
    // Setup mock behavior
    MockedDailyMenuRepository.findById.mockResolvedValue(createTestDailyMenu());

    // Run your test
    const result = await YourService.someMethod('id-123');

    // Assert
    expect(result).toBeDefined();
    expect(MockedDailyMenuRepository.findById).toHaveBeenCalledWith('id-123');
  });
});
```

## Test Execution Commands

```bash
# Run all tests
npm test

# Run specific suite
npm test -- --testPathPattern=unit
npm test -- --testPathPattern=integration
npm test -- --testPathPattern=smoke

# Run single test file
npm test -- --testPathPattern="dailyMenu"

# Debug mode
npm test -- --verbose --runInBand --testPathPattern="your-test"

# Coverage report
npm run test:coverage
```

## Common Fixes

### Fix 1: Module Not Found

```typescript
// Change:
jest.mock('../../src/services/service');

// To:
jest.mock('@/services/service');
```

### Fix 2: Mock Not Working

```typescript
// Change:
const MockedRepo = jest.mocked(Repository);

// To:
import { MockedRepository } from '../../mocks/repository.mock';
```

### Fix 3: Type Error on Mock

```typescript
// Use test data generators:
import { createTestUser, createTestOrder } from '../../fixtures/test-data';

const mockUser = createTestUser({ email: 'test@example.com' });
const mockOrder = createTestOrder({ userId: mockUser.id });
```

## Files Created for You

### Mock Factories

- `/tests/mocks/repository.mock.ts` - All repository mocks
- `/tests/fixtures/test-data.ts` - Test data generators
- `/tests/__mocks__/repositories.ts` - Auto-mock setup

### Configuration

- `/jest.config.js` - Fixed ESM/CommonJS issues
- `/package.json` - Updated test scripts
- `/tests/setup.ts` - Global test setup

### Documentation

- `/TEST_INFRASTRUCTURE_REPORT.md` - Full analysis
- `/TEST_QUICK_START.md` - This file

## Priority Test Files to Fix

### High Priority (40 tests, 2 hours)

1. `tests/unit/menu/dailyMenu.service.test.ts`
2. `tests/unit/auth/auth.service.test.ts`
3. `tests/unit/orders/order.service.test.ts`
4. `tests/integration/menu-system.integration.test.ts`

### Medium Priority (40 tests, 2 hours)

5. `tests/unit/payments/payment.service.test.ts`
6. `tests/unit/rfid/rfid.service.test.ts`
7. `tests/integration/order-flow.integration.test.ts`

### Low Priority (30 tests, 1 hour)

8. `tests/smoke/**/*.test.ts`
9. `tests/unit/auth/auth.routes.test.ts`

## Success Metrics

**Target**: 200+/254 tests passing (80%+)

**Progress Tracker**:

- Phase 1 (Infrastructure): ✓ Complete
- Phase 2 (Migration): In Progress (26% → 80%)
- Phase 3 (Verification): Pending

## Need Help?

### Check Infrastructure

```bash
# Verify mocks exist
ls -la tests/mocks/
ls -la tests/fixtures/

# Check jest config
cat jest.config.js | grep -A 5 "preset"
```

### Run Diagnostics

```bash
# Test basic infrastructure
npm test -- --testPathPattern="simple.test"

# Check for import errors
npm test 2>&1 | grep "Cannot find module"

# Check for mock errors
npm test 2>&1 | grep "mockResolvedValue is not a function"
```

### Reference Working Test

See `/tests/unit/menu/dailyMenu-fixed.test.ts` for a complete example using the new infrastructure.

---

**Generated**: 2025-10-14
**Status**: Infrastructure Complete - Ready for Migration
**Next**: Apply bulk import fix, then migrate test files
