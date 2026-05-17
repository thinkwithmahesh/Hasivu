# Phase 1: Authentication Implementation Progress

## Overview

This document tracks the progress of implementing JWT authentication across all Lambda functions in the HASIVU platform.

## Completed Work

### Phase 1.1: Frontend Authentication System ✅

- **Status**: COMPLETE
- **File**: `web/src/contexts/auth-context.tsx`
- **Changes**:
  - Replaced demo authentication with production-ready API integration
  - Implemented initialization check with API call
  - Added proper token management with secure storage
  - Integrated login, registration, logout with real API
  - Added profile update, password change, forgot/reset password methods
  - Proper error handling and state management

### Phase 1.2: JWT Authentication Middleware ✅

- **Status**: COMPLETE
- **File**: `src/middleware/jwt-auth.middleware.ts`
- **Features**:
  - Token verification with JWT secret
  - Role-based access control (RBAC)
  - Helper functions: `withAuth()`, `withAdminAuth()`, `withOptionalAuth()`
  - Typed `AuthenticatedEvent` interface
  - Utility functions: `getAuthUser()`, `createAuthResponse()`
  - Comprehensive error handling with 401/403 responses

### Phase 1.3.1: Core Payment Endpoints ✅

- **Status**: COMPLETE
- **Secured Files**:
  1. ✅ `src/functions/payments/create-order.ts`
     - Added JWT middleware imports
     - Changed event type to `AuthenticatedEvent`
     - Access authenticated user via `getAuthUser(event)`
     - Wrapped handler with `withAuth()` for parent/student/admin roles
  2. ✅ `src/functions/payments/verify.ts`
     - Added JWT middleware imports
     - Changed event type to `AuthenticatedEvent`
     - Access authenticated user for audit trail
     - Wrapped handler with `withAuth()` for parent/student/admin roles
  3. ✅ `src/functions/payments/manage-payment-methods.ts`
     - Added JWT middleware imports
     - Updated `validateUserAccess()` to use JWT middleware
     - Changed event type to `AuthenticatedEvent`
     - Wrapped handler with `withAuth()` for parent/student/admin roles
  4. ✅ `src/functions/payments/payment-retry.ts`
     - Already has authentication middleware from different module
     - Uses `authenticateLambda()` from `../../shared/middleware/lambda-auth.middleware`
     - No changes needed (already secured)

### Example Implementation Created ✅

- **File**: `src/functions/payments/create-order-secured.example.ts`
- **Purpose**: Reference implementation showing:
  - Complete migration pattern
  - Step-by-step comments
  - Testing instructions
  - Best practices
  - Common pitfalls to avoid

## Remaining Work

### Phase 1.3.2: Admin Payment Endpoints

- **Status**: IN PROGRESS
- **Files to Secure**:
  - [ ] `src/functions/payments/payment-analytics.ts`
    - Already has role checking for admin/school_admin/super_admin
    - Uses `authenticateLambda` from different middleware
    - Consider migrating to new JWT middleware or leave as-is
  - [ ] `src/functions/payments/subscription-analytics.ts`
    - Check implementation and secure with admin-only access
  - [ ] `src/functions/payments/reconciliation.ts`
    - Financial reconciliation - requires admin-only access
  - [ ] `src/functions/payments/ml-payment-insights.ts`
    - ML insights - requires admin-only access

**Action Required**:

```bash
# For each file:
1. Check if already using authentication
2. If yes, verify role restrictions are correct (admin only)
3. If using old middleware, optionally migrate to new JWT middleware
4. If no auth, add JWT middleware with admin-only access
```

### Phase 1.3.3: Webhook Endpoints Review

- **Status**: PENDING
- **Files to Review**:
  - [ ] `src/functions/payments/webhook-handler.ts`
  - [ ] `src/functions/payments/webhook.ts`

**CRITICAL**: These should NOT use JWT authentication. They should use:

- Razorpay signature verification
- HMAC-SHA256 validation
- Request source IP whitelisting (optional)

**Action Required**:

```bash
# Review and ensure:
1. NO JWT authentication on webhooks
2. Proper signature verification is implemented
3. Replay attack prevention
4. Logging and monitoring for failed verifications
```

### Phase 1.4.1: RFID Card Management Endpoints

- **Status**: PENDING
- **Files to Secure**:
  - [ ] `src/functions/rfid/create-card.ts`
  - [ ] `src/functions/rfid/get-card.ts`
  - [ ] `src/functions/rfid/verify-card.ts`
  - [ ] `src/functions/rfid/mobile-card-management.ts`
  - [ ] `src/functions/rfid/mobile-tracking.ts`

**Roles**: parent, student, admin (users managing their own cards)

**Migration Pattern**:

```typescript
// 1. Import JWT middleware
import {
  withAuth,
  AuthenticatedEvent,
  getAuthUser,
} from '../../middleware/jwt-auth.middleware';

// 2. Change handler event type
const handler = async (
  event: AuthenticatedEvent, // Changed from APIGatewayProxyEvent
  context: Context
): Promise<APIGatewayProxyResult> => {
  // 3. Get authenticated user
  const user = getAuthUser(event);
  const userId = user!.userId;
  const userRole = user!.role;

  // ... rest of handler logic
};

// 4. Export with middleware
export const handler = withAuth(handlerFunction, {
  required: true,
  roles: ['admin', 'parent', 'student'],
});
```

### Phase 1.4.2: RFID Admin Endpoints

- **Status**: PENDING
- **Files to Secure**:
  - [ ] `src/functions/rfid/bulk-import-cards.ts`
  - [ ] `src/functions/rfid/manage-readers.ts`
  - [ ] `src/functions/rfid/photo-verification.ts`
  - [ ] `src/functions/rfid/delivery-verification.ts`

**Roles**: admin only

**Migration Pattern**:

```typescript
// Use withAdminAuth helper
import {
  withAdminAuth,
  AuthenticatedEvent,
  getAuthUser,
} from '../../middleware/jwt-auth.middleware';

// Export with admin-only middleware
export const handler = withAdminAuth(handlerFunction);
```

### Phase 1.5: Subscription Endpoints

- **Status**: PENDING
- **Files to Secure**:
  - [ ] `src/functions/payments/subscription-management.ts`
  - [ ] `src/functions/payments/subscription-plans.ts`

**Note**: These are in the payments folder. Check if they exist and secure appropriately.

**Roles**:

- View plans: all authenticated users
- Manage subscriptions: parent, student, admin
- Manage plans: admin only

### Phase 1.6: Testing

- **Status**: PENDING
- **Test Cases Required**:

#### Valid Token Tests

```bash
# Should return 200 with proper response
curl -X POST https://api.hasivu.com/payments/orders \
  -H "Authorization: Bearer VALID_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "INR", ...}'
```

#### Missing Token Tests

```bash
# Should return 401 Unauthorized
curl -X POST https://api.hasivu.com/payments/orders \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "INR", ...}'
```

#### Invalid Token Tests

```bash
# Should return 401 Unauthorized
curl -X POST https://api.hasivu.com/payments/orders \
  -H "Authorization: Bearer INVALID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "INR", ...}'
```

#### Wrong Role Tests

```bash
# Should return 403 Forbidden
# Try accessing admin endpoint with student token
curl -X GET https://api.hasivu.com/payments/analytics \
  -H "Authorization: Bearer STUDENT_JWT_TOKEN"
```

#### Expired Token Tests

```bash
# Should return 401 Unauthorized with "Token expired" message
curl -X POST https://api.hasivu.com/payments/orders \
  -H "Authorization: Bearer EXPIRED_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "INR", ...}'
```

## Implementation Checklist

### For Each Endpoint to Secure:

- [ ] **Step 1**: Read existing file and understand handler structure
- [ ] **Step 2**: Import JWT middleware components
  ```typescript
  import {
    withAuth,
    AuthenticatedEvent,
    getAuthUser,
  } from '../../middleware/jwt-auth.middleware';
  ```
- [ ] **Step 3**: Change handler event type from `APIGatewayProxyEvent` to `AuthenticatedEvent`
- [ ] **Step 4**: Update handler to access authenticated user
  ```typescript
  const user = getAuthUser(event);
  const userId = user!.userId;
  const userRole = user!.role;
  ```
- [ ] **Step 5**: Remove any old authentication code
- [ ] **Step 6**: Wrap handler export with `withAuth()` or `withAdminAuth()`
- [ ] **Step 7**: Test the endpoint with valid/invalid/missing tokens
- [ ] **Step 8**: Update any dependent code or tests

## File Reference

### JWT Middleware Location

```
src/middleware/jwt-auth.middleware.ts
```

### Example Implementation

```
src/functions/payments/create-order-secured.example.ts
```

### Secured Endpoints (So Far)

```
src/functions/payments/create-order.ts
src/functions/payments/verify.ts
src/functions/payments/manage-payment-methods.ts
```

## Common Issues and Solutions

### Issue 1: Import Path Errors

**Problem**: Cannot find module '../../middleware/jwt-auth.middleware'
**Solution**: Adjust the relative path based on file location

```typescript
// From src/functions/payments/*.ts
import { ... } from '../../middleware/jwt-auth.middleware';

// From src/functions/rfid/*.ts
import { ... } from '../../middleware/jwt-auth.middleware';
```

### Issue 2: Event Type Mismatch

**Problem**: Property 'user' does not exist on type 'APIGatewayProxyEvent'
**Solution**: Change event type to `AuthenticatedEvent`

```typescript
// Before
const handler = async (event: APIGatewayProxyEvent, context: Context)

// After
const handler = async (event: AuthenticatedEvent, context: Context)
```

### Issue 3: Handler Not Exported

**Problem**: Lambda cannot find handler
**Solution**: Ensure handler is exported after wrapping

```typescript
// Correct export
export const handler = withAuth(myHandlerFunction, {
  required: true,
  roles: ['admin', 'parent'],
});
```

### Issue 4: Middleware Not Invoked

**Problem**: Middleware doesn't run before handler
**Solution**: Ensure using AWS Lambda's handler invocation properly

```yaml
# In serverless.yml or SAM template
handler: src/functions/payments/create-order.handler # Not .createPaymentOrderHandler
```

## Next Steps

1. **Complete Phase 1.3.2**: Secure remaining admin payment endpoints
2. **Complete Phase 1.3.3**: Review webhook security (NO JWT auth)
3. **Complete Phase 1.4.1**: Secure RFID card management endpoints
4. **Complete Phase 1.4.2**: Secure RFID admin endpoints
5. **Complete Phase 1.5**: Secure subscription endpoints
6. **Complete Phase 1.6**: Comprehensive testing
7. **Move to Phase 2**: API fixes, RFID workflow, order management
8. **Move to Phase 3**: AWS S3 integration, DB schema fixes

## Testing Strategy

### Unit Tests

```typescript
// Test JWT middleware
describe('JWT Authentication Middleware', () => {
  it('should allow valid tokens', async () => { ... });
  it('should reject invalid tokens', async () => { ... });
  it('should reject expired tokens', async () => { ... });
  it('should enforce role restrictions', async () => { ... });
});
```

### Integration Tests

```typescript
// Test secured endpoints
describe('Secured Payment Endpoints', () => {
  it('should create order with valid auth', async () => { ... });
  it('should return 401 without token', async () => { ... });
  it('should return 403 with wrong role', async () => { ... });
});
```

### Manual Testing Checklist

- [ ] Test each endpoint with Postman/cURL
- [ ] Verify 401 responses for missing/invalid tokens
- [ ] Verify 403 responses for insufficient roles
- [ ] Verify 200 responses for valid requests
- [ ] Check logs for proper security auditing
- [ ] Test token expiration handling
- [ ] Test refresh token flow (if implemented)

## Security Best Practices

1. **Never Log Tokens**: Ensure JWT tokens are never logged in plain text
2. **Use HTTPS Only**: All API calls must use HTTPS in production
3. **Short Token Expiry**: Keep access token expiry short (15-30 minutes)
4. **Secure Token Storage**: Use httpOnly cookies or secure storage
5. **Rate Limiting**: Implement rate limiting on authentication endpoints
6. **Audit Logging**: Log all authentication attempts and access
7. **Secret Rotation**: Rotate JWT secrets regularly
8. **Environment Variables**: Never hardcode secrets

## Deployment Notes

### Environment Variables Required

```bash
# JWT Configuration
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRATION=30m
JWT_REFRESH_EXPIRATION=7d

# Database
DATABASE_URL=postgresql://...

# Razorpay (for webhooks)
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...
```

### Lambda Configuration

- Set appropriate timeouts (30s for most, 60s for analytics)
- Configure memory based on workload (512MB-1024MB)
- Enable X-Ray tracing for monitoring
- Set up CloudWatch alarms for authentication failures

## Monitoring and Alerting

### Metrics to Monitor

- Authentication success/failure rate
- Token expiration rate
- 401/403 error rates
- Unusual access patterns
- Failed login attempts per user
- Geographic anomalies

### CloudWatch Alarms

```yaml
# Example alarm for high authentication failures
AuthFailureAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: HighAuthenticationFailures
    MetricName: 401Errors
    Threshold: 10
    EvaluationPeriods: 1
    Period: 300
```

## Documentation Updates Needed

- [ ] Update API documentation with authentication requirements
- [ ] Update Postman collections with auth examples
- [ ] Update README with authentication setup instructions
- [ ] Create authentication troubleshooting guide
- [ ] Document token refresh flow
- [ ] Create security policy document

## Sign-off

### Phase 1.1 - Frontend Auth

- **Completed By**: [Your Name]
- **Date**: [Date]
- **Tested**: Yes / No

### Phase 1.2 - JWT Middleware

- **Completed By**: [Your Name]
- **Date**: [Date]
- **Tested**: Yes / No

### Phase 1.3.1 - Core Payment Endpoints

- **Completed By**: [Your Name]
- **Date**: [Date]
- **Tested**: Yes / No

---

## Quick Reference Commands

### Check Authentication Status

```bash
# List all Lambda functions
aws lambda list-functions --query 'Functions[*].[FunctionName,Runtime]' --output table

# Check specific function configuration
aws lambda get-function --function-name create-order
```

### Test Endpoints Locally

```bash
# Using SAM
sam local invoke CreateOrderFunction -e test/events/create-order.json

# Using Serverless
serverless invoke local -f createOrder -p test/events/create-order.json
```

### Deploy Changes

```bash
# Deploy specific function
aws lambda update-function-code --function-name create-order --zip-file fileb://function.zip

# Deploy with SAM
sam deploy --guided

# Deploy with Serverless
serverless deploy function -f createOrder
```

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Status**: Phase 1.3.1 Complete, Phase 1.3.2 In Progress
