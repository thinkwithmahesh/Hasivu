# HASIVU Platform - Multi-Agent Orchestration Plan

## Frontend-Backend Gap Resolution Strategy

**Date**: 2025-10-06
**Status**: ✅ TypeScript/ESLint Clean - Ready for Orchestration
**Execution Mode**: Parallel Multi-Agent Processing

---

## Pre-Flight Checklist

### ✅ Environment Status

- **Backend TypeScript**: 0 errors (production ready)
- **Frontend TypeScript**: 0 errors (1 broken file moved aside)
- **Backend ESLint**: 0 errors (previously fixed)
- **Frontend ESLint**: Not blocking (to be checked by agents)
- **Prisma Schema**: Valid and comprehensive (50+ models)
- **Database**: SQLite (dev) with production-ready schema

### 📊 Gap Analysis Summary

- **Critical**: Order Management (5 functions missing)
- **Critical**: Payment Processing (10+ functions missing)
- **High**: RFID Extended Features (6 functions missing)
- **Medium**: Architecture standardization decision needed

---

## Multi-Agent Orchestration Architecture

### Agent Deployment Strategy

**Parallel Processing**: 4 agents working simultaneously
**Coordination**: Independent tasks with shared validation
**Communication**: Through completed file artifacts
**Timeline**: 4-6 hours for critical path completion

### Agent Specialization Matrix

| Agent   | Focus Area           | Priority | Functions     | Estimated Time |
| ------- | -------------------- | -------- | ------------- | -------------- |
| Agent 1 | Order Management     | CRITICAL | 5 functions   | 2-3 hours      |
| Agent 2 | Payment Processing   | CRITICAL | 10+ functions | 3-4 hours      |
| Agent 3 | RFID Extended        | HIGH     | 6 functions   | 2 hours        |
| Agent 4 | Validation & Testing | HIGH     | Testing suite | 1-2 hours      |

---

## Agent 1: Order Management Restoration

**Priority**: 🚨 CRITICAL
**Agent Type**: backend-architect
**Tools**: Read, Write, Edit, Bash, Glob, Grep

### Objective

Restore and update order management Lambda functions from backup files to match current Prisma schema.

### Tasks

#### 1.1 Restore Order Functions from Backup (90 minutes)

**Files to Process**:

```
src/functions/orders/create-order.ts.bak        → create-order.ts
src/functions/orders/get-order.ts.bak          → get-order.ts
src/functions/orders/get-orders.ts.bak         → get-orders.ts
src/functions/orders/update-order.ts.bak       → update-order.ts
src/functions/orders/update-status.ts.bak      → update-status.ts
```

**Restoration Process**:

1. **Read** each .bak file
2. **Analyze** against current Prisma Order model schema
3. **Update** field names and relationships
4. **Fix** TypeScript errors
5. **Add** proper error handling
6. **Validate** against Order/OrderItem models
7. **Write** corrected version without .bak extension

**Schema Alignment Checklist**:

- [ ] Order model fields match: userId, studentId, schoolId
- [ ] Order status enum: pending, confirmed, preparing, ready, out_for_delivery, delivered, cancelled
- [ ] Payment status: pending, paid, failed, refunded
- [ ] Relations: user, student, school, payments, orderItems properly referenced
- [ ] Indexes utilized: userId, studentId, schoolId, status, paymentStatus, deliveryDate

#### 1.2 Update API Contracts (30 minutes)

**Files to Review/Update**:

```
web/src/services/api/hasivu-api.service.ts     (Order endpoints already defined)
web/src/app/api/orders/[orderId]/route.ts      (May need Lambda integration)
```

**Actions**:

1. Verify frontend API service endpoints match restored functions
2. Ensure request/response types align with Prisma models
3. Add TypeScript interfaces if missing
4. Document API contracts

#### 1.3 Create Unit Tests (30 minutes)

**Test Files to Create**:

```
tests/unit/functions/orders/create-order.test.ts
tests/unit/functions/orders/get-order.test.ts
tests/unit/functions/orders/get-orders.test.ts
tests/unit/functions/orders/update-order.test.ts
tests/unit/functions/orders/update-status.test.ts
```

**Test Coverage**:

- [ ] Happy path: successful order creation
- [ ] Validation: missing required fields
- [ ] Authorization: user can only access own orders
- [ ] Status transitions: valid state machine
- [ ] Error handling: database errors, invalid IDs
- [ ] Edge cases: concurrent updates, duplicate orders

#### 1.4 Integration Validation (30 minutes)

**Validation Steps**:

1. Run TypeScript compiler on all order functions
2. Run ESLint checks
3. Execute unit tests
4. Verify Prisma client generation
5. Test database queries against schema

**Success Criteria**:

- [ ] All 5 functions compile without errors
- [ ] All unit tests pass
- [ ] Functions can be invoked locally
- [ ] Database queries execute successfully

### Deliverables

- ✅ 5 restored and updated order management functions
- ✅ Complete unit test suite with >80% coverage
- ✅ Updated API documentation
- ✅ Validation report confirming alignment

---

## Agent 2: Payment Processing Implementation

**Priority**: 🚨 CRITICAL
**Agent Type**: backend-architect + security
**Tools**: Read, Write, Edit, Bash, Glob, WebSearch (for Razorpay docs)

### Objective

Implement comprehensive payment processing system with Razorpay integration from scratch.

### Tasks

#### 2.1 Razorpay SDK Integration Setup (45 minutes)

**Setup Steps**:

1. Review Razorpay Node.js SDK documentation
2. Create environment configuration
3. Set up test/production credential management
4. Initialize Razorpay client singleton

**Configuration File**:

```typescript
// src/functions/shared/razorpay.service.ts
```

**Required**:

- API key management (test/prod)
- Webhook secret configuration
- Error handling wrapper
- Logging integration
- Retry logic configuration

#### 2.2 Core Payment Functions (120 minutes)

**Function 1: Create Payment Order** (30 min)

```
src/functions/payment/create-payment-order.ts
```

- Generate Razorpay order ID
- Store in PaymentOrder model
- Link to Order/Subscription
- Return order details for frontend
- Handle idempotency

**Function 2: Verify Payment** (30 min)

```
src/functions/payment/verify-payment.ts
```

- Verify Razorpay signature
- Update PaymentTransaction status
- Update Order payment status
- Trigger order confirmation
- Handle verification failures

**Function 3: Webhook Handler** (30 min)

```
src/functions/payment/webhook-handler.ts
```

- Validate webhook signature
- Process payment.captured event
- Process payment.failed event
- Process refund.processed event
- Update database accordingly
- Send notifications

**Function 4: Get Payment Status** (15 min)

```
src/functions/payment/get-payment-status.ts
```

- Retrieve payment details
- Return transaction history
- Include refund information

**Function 5: Process Refund** (15 min)

```
src/functions/payment/process-refund.ts
```

- Initiate Razorpay refund
- Create PaymentRefund record
- Update order status
- Send refund notifications

#### 2.3 Advanced Payment Functions (90 minutes)

**Function 6: Retry Failed Payment** (20 min)

```
src/functions/payment/retry-payment.ts
```

- Identify retry-eligible payments
- Create new payment order
- Link to original order
- Implement exponential backoff

**Function 7: Subscription Payment** (25 min)

```
src/functions/payment/subscription-payment.ts
```

- Handle recurring payments
- Process subscription renewals
- Update Subscription model
- Generate subscription invoices

**Function 8: Invoice Generation** (25 min)

```
src/functions/payment/invoice-generation.ts
```

- Generate PDF invoices
- Store in Invoice model
- Link InvoiceItems
- Send invoice to parent email

**Function 9: Payment Analytics** (20 min)

```
src/functions/payment/payment-analytics.ts
```

- Calculate payment metrics
- Update PaymentAnalytics model
- Track failure rates
- Revenue reporting

#### 2.4 Security & Compliance (30 minutes)

**Security Checklist**:

- [ ] Webhook signature verification implemented
- [ ] API keys stored securely (env variables)
- [ ] PCI compliance considerations documented
- [ ] Rate limiting on payment endpoints
- [ ] Input validation on all endpoints
- [ ] Audit logging for all payment actions
- [ ] HTTPS enforcement
- [ ] No sensitive data in logs

**Compliance Documentation**:

- Create PAYMENT_SECURITY.md with:
  - PCI-DSS considerations
  - Data retention policies
  - Encryption requirements
  - Access control guidelines

#### 2.5 Testing & Validation (45 minutes)

**Test Files to Create**:

```
tests/unit/functions/payment/create-payment-order.test.ts
tests/unit/functions/payment/verify-payment.test.ts
tests/unit/functions/payment/webhook-handler.test.ts
tests/unit/functions/payment/process-refund.test.ts
tests/unit/functions/payment/retry-payment.test.ts
tests/unit/functions/payment/subscription-payment.test.ts
tests/unit/functions/payment/invoice-generation.test.ts
```

**Integration Tests**:

- End-to-end payment flow (create → pay → verify)
- Webhook processing simulation
- Refund flow testing
- Subscription renewal testing
- Failure scenario handling

### Deliverables

- ✅ 9 payment processing functions fully implemented
- ✅ Razorpay SDK integration complete
- ✅ Comprehensive test suite
- ✅ Security documentation
- ✅ Payment flow diagram
- ✅ API contracts documented

---

## Agent 3: RFID Extended Features

**Priority**: ⚠️ HIGH
**Agent Type**: backend-architect
**Tools**: Read, Write, Edit, Bash, Glob

### Objective

Restore and complete RFID system extended features from backup files.

### Tasks

#### 3.1 Restore RFID Extended Functions (90 minutes)

**Files to Process**:

```
src/functions/rfid/bulk-import-cards.ts.bak    → bulk-import-cards.ts
src/functions/rfid/get-card.ts.bak            → get-card.ts
src/functions/rfid/manage-readers.ts.bak      → manage-readers.ts
src/functions/rfid/mobile-card-management.ts.bak → mobile-card-management.ts
src/functions/rfid/mobile-tracking.ts.bak     → mobile-tracking.ts
src/functions/rfid/photo-verification.ts.bak  → photo-verification.ts
```

**Restoration Process** (per function):

1. Read .bak file content
2. Analyze against current Prisma models:
   - RFIDCard: cardNumber, studentId, schoolId, status, isActive
   - RFIDReader: readerId, schoolId, location, status, lastHeartbeat
   - DeliveryVerification: cardId, readerId, verifiedAt, studentName
3. Update field names and relations
4. Fix TypeScript errors
5. Add validation and error handling
6. Remove .bak extension

#### 3.2 Bulk Import Enhancement (30 minutes)

**Function**: `bulk-import-cards.ts`

**Requirements**:

- CSV/JSON import support
- Validation for each card
- Duplicate detection
- Transaction support (all-or-nothing)
- Progress reporting
- Error logging with line numbers

**Schema Validation**:

- Required: cardNumber, studentId, schoolId
- Optional: notes, expiresAt
- Ensure student exists
- Ensure school exists
- Ensure cardNumber is unique

#### 3.3 Reader Management (20 minutes)

**Function**: `manage-readers.ts`

**Operations**:

- Create reader
- Update reader status
- Update heartbeat timestamp
- Get reader details
- List readers by school
- Deactivate reader

**Heartbeat Monitoring**:

- Track lastHeartbeat timestamp
- Alert if reader offline >5 minutes
- Update status automatically

#### 3.4 Mobile Integration (30 minutes)

**Function**: `mobile-card-management.ts`

- Parent views child's card
- Card activation/deactivation
- Card replacement workflow
- Card history retrieval

**Function**: `mobile-tracking.ts`

- Real-time delivery tracking
- Push notification on verification
- Delivery history
- Meal receipt confirmation

#### 3.5 Photo Verification (20 minutes)

**Function**: `photo-verification.ts`

**Features**:

- S3 photo upload integration
- Link photo to delivery verification
- Facial recognition placeholder (future)
- Photo retrieval for parents
- Photo deletion after retention period

#### 3.6 Testing (30 minutes)

**Test Files**:

```
tests/unit/functions/rfid/bulk-import-cards.test.ts
tests/unit/functions/rfid/get-card.test.ts
tests/unit/functions/rfid/manage-readers.test.ts
tests/unit/functions/rfid/mobile-card-management.test.ts
tests/unit/functions/rfid/mobile-tracking.test.ts
tests/unit/functions/rfid/photo-verification.test.ts
```

**Integration Tests**:

- Complete RFID workflow
- Bulk import with validation
- Reader heartbeat simulation
- Mobile app integration
- Photo upload and retrieval

### Deliverables

- ✅ 6 RFID extended functions restored and updated
- ✅ Bulk import capability fully functional
- ✅ Reader management complete
- ✅ Mobile integration ready
- ✅ Photo verification implemented
- ✅ Complete test suite

---

## Agent 4: Validation & Testing Orchestrator

**Priority**: ⚠️ HIGH
**Agent Type**: qa + test-writer-fixer
**Tools**: Read, Bash, Glob, Grep, Task

### Objective

Ensure all implemented functions meet quality standards through comprehensive testing and validation.

### Tasks

#### 4.1 Schema Validation (30 minutes)

**Prisma Schema Checks**:

1. Verify all models have proper indexes
2. Check foreign key constraints
3. Validate relationship configurations
4. Ensure onDelete behaviors are correct
5. Verify unique constraints
6. Check default values

**Actions**:

```bash
npx prisma validate
npx prisma format
npx prisma generate
```

**Database Migration Readiness**:

- Generate migration preview
- Review SQL statements
- Check for breaking changes
- Document migration steps

#### 4.2 TypeScript Validation (20 minutes)

**Backend Validation**:

```bash
npx tsc --noEmit 2>&1 | grep -E "^src/|^tests/" | grep -E "error TS"
```

- Target: 0 errors
- Fix any type errors found
- Ensure proper type imports

**Frontend Validation**:

```bash
cd web && npm run type-check
```

- Target: 0 errors
- Verify API types match backend
- Check component prop types

#### 4.3 ESLint Validation (20 minutes)

**Backend Linting**:

```bash
npx eslint src --ext .ts --max-warnings 0
```

- Fix code quality issues
- Ensure consistent formatting
- Remove unused imports

**Frontend Linting**:

```bash
cd web && npm run lint:fix
```

- Fix React best practices violations
- Ensure hook dependencies correct
- Remove console.logs

#### 4.4 Unit Test Execution (45 minutes)

**Backend Tests**:

```bash
npm test -- --coverage --ci
```

**Coverage Targets**:

- Statements: >80%
- Branches: >75%
- Functions: >80%
- Lines: >80%

**Test Categories**:

- Order management (5 test suites)
- Payment processing (7 test suites)
- RFID extended (6 test suites)
- User management (existing)
- Auth flows (existing)

**Actions**:

- Run all test suites
- Generate coverage report
- Identify untested code paths
- Add tests for critical paths

#### 4.5 Integration Testing (30 minutes)

**End-to-End Workflows**:

**Workflow 1: Order → Payment → Delivery**

1. Parent creates order
2. Payment initiated
3. Payment verified
4. Order confirmed
5. RFID delivery tracking
6. Parent notification

**Workflow 2: Bulk RFID Import**

1. Admin uploads CSV
2. System validates data
3. Cards created in batch
4. Success/failure report generated

**Workflow 3: Subscription Payment**

1. Subscription renewal triggered
2. Payment processed
3. Invoice generated
4. Email sent to parent

**Test Execution**:

```bash
npm run test:integration
```

#### 4.6 API Contract Testing (30 minutes)

**Contract Validation**:

```bash
cd web && npm run test:contract
```

**Checks**:

- Request schemas match backend expectations
- Response schemas match frontend expectations
- Status codes correct
- Error responses properly formatted
- Authentication headers validated

#### 4.7 Performance Testing (20 minutes)

**Load Testing Scenarios**:

- 100 concurrent order creations
- 50 concurrent payment verifications
- 500 concurrent RFID scans
- Database query performance

**Metrics to Collect**:

- Response time (p50, p95, p99)
- Throughput (requests/second)
- Error rate
- Database connection pool usage

**Tools**:

```bash
npm run test:performance
```

#### 4.8 Security Audit (30 minutes)

**Security Checks**:

- [ ] No secrets in code
- [ ] Environment variables properly used
- [ ] SQL injection prevention (Prisma handles this)
- [ ] XSS prevention in frontend
- [ ] CSRF tokens validated
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] Proper authentication checks

**Audit Tools**:

```bash
npm audit
npm run security:check
```

### Deliverables

- ✅ Complete validation report
- ✅ Test coverage report (>80%)
- ✅ Performance benchmark results
- ✅ Security audit summary
- ✅ API contract validation report
- ✅ Integration test results

---

## Agent Coordination Protocol

### Phase 1: Parallel Execution (Hours 1-3)

**Simultaneous Operations**:

- Agent 1 works on orders (src/functions/orders/)
- Agent 2 works on payments (src/functions/payment/)
- Agent 3 works on RFID (src/functions/rfid/)
- Agent 4 prepares test infrastructure

**No Dependencies**: Each agent works independently on separate directories.

### Phase 2: Initial Validation (Hour 3)

**Agent 4 Checks**:

1. Run TypeScript compiler on all new code
2. Run ESLint on all new code
3. Execute unit tests
4. Report issues back to respective agents

**Synchronization Point**:

- All agents pause
- Review validation results
- Fix critical issues
- Resume work

### Phase 3: Completion & Integration (Hours 4-6)

**Agent 1 Completion**:

- All order functions restored
- Tests passing
- Documentation complete

**Agent 2 Completion**:

- All payment functions implemented
- Razorpay integration working
- Security validated

**Agent 3 Completion**:

- All RFID functions restored
- Mobile integration ready
- Bulk import working

**Agent 4 Final Validation**:

- Run complete test suite
- Execute integration tests
- Generate final reports

### Phase 4: Production Readiness (Hour 6)

**Deployment Preparation**:

- Environment configuration check
- Database migration scripts ready
- Deployment documentation updated
- Rollback plan documented

---

## Success Criteria

### Critical Path (Must Complete)

#### Order Management

- [ ] All 5 functions operational
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration with payment system
- [ ] Frontend can create/retrieve orders

#### Payment Processing

- [ ] Razorpay integration complete
- [ ] Payment order creation working
- [ ] Payment verification functional
- [ ] Webhook handler operational
- [ ] Refund processing implemented
- [ ] All security checks pass

#### RFID Extended

- [ ] All 6 functions operational
- [ ] Bulk import working
- [ ] Reader management functional
- [ ] Mobile integration complete

### Quality Gates (Must Pass)

- [ ] TypeScript: 0 errors (backend + frontend)
- [ ] ESLint: 0 errors
- [ ] Unit Tests: >80% coverage
- [ ] Integration Tests: All critical workflows pass
- [ ] API Contracts: All validated
- [ ] Security Audit: No critical issues
- [ ] Performance: Response times <500ms (p95)

---

## Risk Management

### High-Risk Items

**Risk 1: .bak Files Outdated**

- Probability: Medium (60%)
- Impact: High
- Mitigation: Validate against schema first, update before restoring
- Fallback: Rewrite from scratch using schema as guide

**Risk 2: Razorpay Integration Issues**

- Probability: Medium (50%)
- Impact: Critical
- Mitigation: Use test mode, comprehensive error handling
- Fallback: Mock payment gateway for development, plan integration sprint

**Risk 3: Schema Mismatches**

- Probability: Low (30%)
- Impact: High
- Mitigation: Agent 4 validates schema before Agent 1-3 complete
- Fallback: Update schema or functions as needed

**Risk 4: Time Overrun**

- Probability: Medium (50%)
- Impact: Medium
- Mitigation: Prioritize critical path, defer nice-to-haves
- Fallback: Complete orders + basic payments first, RFID after

### Contingency Plans

**If Agent 1 Blocked**:

- Focus on create-order and get-orders first
- Update operations can wait
- Use frontend API routes temporarily

**If Agent 2 Blocked**:

- Implement basic payment order creation only
- Mock verification for development
- Full integration in follow-up sprint

**If Agent 3 Blocked**:

- Core RFID already works (3 functions)
- Extended features are enhancements
- Can be deferred if needed

---

## Post-Completion Tasks

### Documentation Updates

- [ ] Update API documentation
- [ ] Create payment integration guide
- [ ] Document RFID workflows
- [ ] Update deployment guide
- [ ] Create troubleshooting guide

### Monitoring & Observability

- [ ] Set up CloudWatch dashboards
- [ ] Configure payment alerts
- [ ] Monitor RFID reader health
- [ ] Track order completion rates
- [ ] Monitor payment success rates

### Production Deployment

- [ ] Run database migrations
- [ ] Deploy Lambda functions
- [ ] Update environment variables
- [ ] Test in staging environment
- [ ] Gradual rollout to production

---

## Agent Launch Commands

### Agent 1: Order Management

```bash
Launch with task:
- Restore 5 order management functions from .bak files
- Update to match current Prisma Order/OrderItem schema
- Create comprehensive unit tests
- Validate TypeScript and ESLint compliance
- Document API contracts
```

### Agent 2: Payment Processing

```bash
Launch with task:
- Implement 9 payment processing functions from scratch
- Integrate Razorpay SDK
- Create security documentation
- Implement comprehensive testing
- Validate PCI compliance considerations
```

### Agent 3: RFID Extended

```bash
Launch with task:
- Restore 6 RFID extended functions from .bak files
- Update to match current RFIDCard/RFIDReader schema
- Implement bulk import and reader management
- Complete mobile integration
- Create full test suite
```

### Agent 4: Validation & Testing

```bash
Launch with task:
- Validate Prisma schema integrity
- Run TypeScript and ESLint checks on all code
- Execute complete test suite with coverage
- Run integration tests for critical workflows
- Perform security audit
- Generate validation reports
```

---

## Execution Timeline

### Hour 1: Setup & Initial Work

- 0:00 - Launch all 4 agents simultaneously
- 0:15 - Agents complete initial analysis
- 0:30 - Agents begin implementation
- 0:60 - First checkpoint: progress review

### Hour 2-3: Core Implementation

- Agents work independently
- Agent 4 monitors progress
- Early validation of completed work

### Hour 4: Integration & Testing

- Agents complete primary tasks
- Agent 4 runs comprehensive validation
- Fix critical issues identified

### Hour 5-6: Finalization

- Complete remaining tests
- Generate documentation
- Prepare for production deployment
- Final validation and sign-off

---

## Communication Protocol

### Status Updates

- Every 30 minutes: Brief progress update
- On completion: Detailed deliverables report
- On blocker: Immediate escalation

### Deliverable Format

Each agent provides:

1. List of files created/modified
2. Test results summary
3. Known issues/limitations
4. Next steps recommendations

---

## Appendix: File Structure After Completion

### New/Restored Backend Files

```
src/functions/
├── orders/
│   ├── create-order.ts ✨
│   ├── get-order.ts ✨
│   ├── get-orders.ts ✨
│   ├── update-order.ts ✨
│   └── update-status.ts ✨
├── payment/
│   ├── create-payment-order.ts 🆕
│   ├── verify-payment.ts 🆕
│   ├── webhook-handler.ts 🆕
│   ├── process-refund.ts 🆕
│   ├── get-payment-status.ts 🆕
│   ├── retry-payment.ts 🆕
│   ├── subscription-payment.ts 🆕
│   ├── invoice-generation.ts 🆕
│   └── payment-analytics.ts 🆕
├── rfid/
│   ├── bulk-import-cards.ts ✨
│   ├── get-card.ts ✨
│   ├── manage-readers.ts ✨
│   ├── mobile-card-management.ts ✨
│   ├── mobile-tracking.ts ✨
│   └── photo-verification.ts ✨
└── shared/
    └── razorpay.service.ts 🆕

tests/unit/functions/
├── orders/ (5 test files) 🆕
├── payment/ (7 test files) 🆕
└── rfid/ (6 test files) 🆕
```

Legend:

- ✨ Restored from .bak and updated
- 🆕 Created from scratch

---

## Final Notes

**Estimated Total Effort**: 18-24 agent-hours
**Wall Clock Time**: 6 hours (with 4 parallel agents)
**Critical Path**: Order + Payment (Agents 1 & 2)
**Quality Gate**: Agent 4 validation
**Success Rate Target**: 100% completion of critical path

**Ready for Launch**: All agents have clear objectives, success criteria, and coordination protocol.
