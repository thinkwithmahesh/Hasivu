# Securing Lambda Endpoints with JWT Authentication

## 🎯 Quick Start Guide

This guide shows how to secure Lambda endpoints using the JWT authentication middleware we created.

---

## 📋 **Step-by-Step Implementation**

### **Step 1: Import the Middleware**

At the top of your Lambda function file, add:

```typescript
import {
  withAuth,
  AuthenticatedEvent,
} from '../../middleware/jwt-auth.middleware';
```

### **Step 2: Update Handler Signature**

Change your handler from:

```typescript
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Your code
};
```

To:

```typescript
const handlerFunction = async (
  event: AuthenticatedEvent, // Changed type
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Now you have access to event.user
  const userId = event.user!.userId;
  const userRole = event.user!.role;

  // Your code
};

// Wrap with authentication
export const handler = withAuth(handlerFunction, {
  required: true,
  roles: ['admin', 'parent', 'student'], // Specify allowed roles
});
```

---

## 🔧 **Implementation Examples**

### **Example 1: Create Order Endpoint (Parent/Student Only)**

```typescript
// src/functions/payments/create-order-fixed.ts

import {
  withAuth,
  AuthenticatedEvent,
  createAuthResponse,
} from '../../middleware/jwt-auth.middleware';
import { Context } from 'aws-lambda';

const createOrderHandlerFunction = async (
  event: AuthenticatedEvent,
  context: Context
) => {
  // User is guaranteed to be authenticated
  const userId = event.user!.userId;
  const userRole = event.user!.role;

  // Parse request body
  const body = JSON.parse(event.body || '{}');

  // Create order logic...
  const order = await createOrder({
    ...body,
    userId,
    createdBy: userId,
  });

  return createAuthResponse(200, {
    success: true,
    order,
  });
};

// Export with authentication
export const handler = withAuth(createOrderHandlerFunction, {
  required: true,
  roles: ['admin', 'parent', 'student'],
});
```

### **Example 2: Payment Analytics (Admin Only)**

```typescript
// src/functions/payments/payment-analytics.ts

import {
  withAdminAuth,
  AuthenticatedEvent,
  createAuthResponse,
} from '../../middleware/jwt-auth.middleware';
import { Context } from 'aws-lambda';

const analyticsHandlerFunction = async (
  event: AuthenticatedEvent,
  context: Context
) => {
  // Only admins can access this
  const analytics = await getPaymentAnalytics();

  return createAuthResponse(200, {
    success: true,
    data: analytics,
  });
};

// Admin-only access
export const handler = withAdminAuth(analyticsHandlerFunction);
```

### **Example 3: Webhook Handler (No Authentication)**

```typescript
// src/functions/payments/webhook-handler.ts

// Webhooks don't use JWT - they use signature verification
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
) => {
  // Verify webhook signature instead
  const signature = event.headers['x-razorpay-signature'];
  const isValid = verifyWebhookSignature(signature, event.body);

  if (!isValid) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid signature' }),
    };
  }

  // Process webhook...
};
```

### **Example 4: Optional Authentication**

```typescript
// src/functions/payments/public-pricing.ts

import {
  withOptionalAuth,
  AuthenticatedEvent,
} from '../../middleware/jwt-auth.middleware';

const pricingHandlerFunction = async (
  event: AuthenticatedEvent,
  context: Context
) => {
  // Works with or without authentication
  if (event.user) {
    // Show personalized pricing for authenticated users
    return getPersonalizedPricing(event.user.userId);
  } else {
    // Show public pricing
    return getPublicPricing();
  }
};

export const handler = withOptionalAuth(pricingHandlerFunction);
```

---

## 📝 **Files to Update (Phase 1.3-1.5)**

### **Phase 1.3: Payment Endpoints** ✅

| File                                           | Status  | Roles                  | Priority |
| ---------------------------------------------- | ------- | ---------------------- | -------- |
| `src/functions/payments/create-order-fixed.ts` | ⏳ Todo | parent, student, admin | HIGH     |
| `src/functions/payments/verify-payment.ts`     | ⏳ Todo | parent, student, admin | HIGH     |
| `src/functions/payments/refund.ts`             | ⏳ Todo | admin, school_admin    | HIGH     |
| `src/functions/payments/payment-analytics.ts`  | ⏳ Todo | admin                  | MEDIUM   |
| `src/functions/payments/webhook-handler.ts`    | ⏳ Skip | N/A (uses signature)   | N/A      |

### **Phase 1.4: RFID Endpoints** ✅

| File                                          | Status  | Roles                        | Priority |
| --------------------------------------------- | ------- | ---------------------------- | -------- |
| `src/functions/rfid/delivery-verification.ts` | ⏳ Todo | vendor, kitchen_staff, admin | HIGH     |
| `src/functions/rfid/card-registration.ts`     | ⏳ Todo | admin, school_admin          | HIGH     |
| `src/functions/rfid/rfid-tracking.ts`         | ⏳ Todo | parent, student, admin       | MEDIUM   |

### **Phase 1.5: Subscription Endpoints** ✅

| File                                                | Status  | Roles         | Priority |
| --------------------------------------------------- | ------- | ------------- | -------- |
| `src/functions/payments/subscription-management.ts` | ⏳ Todo | parent, admin | HIGH     |
| `src/functions/payments/billing-automation.ts`      | ⏳ Todo | admin         | MEDIUM   |
| `src/functions/payments/dunning-management.ts`      | ⏳ Todo | admin         | MEDIUM   |
| `src/functions/payments/subscription-analytics.ts`  | ⏳ Todo | admin         | LOW      |

---

## 🛠️ **Implementation Pattern**

For each file, follow this pattern:

### **1. Add Import**

```typescript
import {
  withAuth,
  AuthenticatedEvent,
} from '../../middleware/jwt-auth.middleware';
```

### **2. Rename Handler**

```typescript
// Before
export const handler = async (event, context) => {
  /* ... */
};

// After
const handlerFunction = async (event: AuthenticatedEvent, context) => {
  const userId = event.user!.userId; // Now available!
  // ... rest of code
};
```

### **3. Export with Auth**

```typescript
export const handler = withAuth(handlerFunction, {
  required: true,
  roles: ['admin', 'parent'], // Adjust roles as needed
});
```

---

## 🎨 **Pre-built Middleware Options**

### **1. Basic Authentication**

```typescript
withAuth(handlerFunction, {
  required: true,
  roles: ['admin', 'parent'],
});
```

### **2. Admin Only**

```typescript
withAdminAuth(handlerFunction);
// Equivalent to: withAuth(handlerFunction, { required: true, roles: ['admin'] })
```

### **3. School Admin**

```typescript
withSchoolAdminAuth(handlerFunction);
// Equivalent to: withAuth(handlerFunction, { required: true, roles: ['admin', 'school_admin'] })
```

### **4. Parent/Student**

```typescript
withParentAuth(handlerFunction);
// Equivalent to: withAuth(handlerFunction, { required: true, roles: ['admin', 'parent', 'student'] })
```

### **5. Vendor/Kitchen**

```typescript
withVendorAuth(handlerFunction);
// Equivalent to: withAuth(handlerFunction, { required: true, roles: ['admin', 'vendor', 'kitchen_staff'] })
```

### **6. Optional Auth**

```typescript
withOptionalAuth(handlerFunction);
// Works with or without authentication
```

---

## 🔐 **Security Best Practices**

### **1. Always Use Appropriate Roles**

```typescript
// ❌ BAD: Too permissive
withAuth(handler, { required: true, roles: [] });

// ✅ GOOD: Specific roles
withAuth(handler, { required: true, roles: ['admin', 'parent'] });
```

### **2. Validate User Access**

```typescript
const handler = async (event: AuthenticatedEvent) => {
  const userId = event.user!.userId;
  const requestedUserId = JSON.parse(event.body).userId;

  // Verify user can only access their own data
  if (userId !== requestedUserId && event.user!.role !== 'admin') {
    return createAuthResponse(403, {
      success: false,
      error: 'Access denied',
    });
  }

  // Continue with request...
};
```

### **3. Log Authentication Events**

```typescript
const handler = async (event: AuthenticatedEvent) => {
  logger.info('Authenticated request', {
    userId: event.user!.userId,
    role: event.user!.role,
    action: 'create_payment',
  });

  // Your code...
};
```

---

## 🧪 **Testing Authentication**

### **Test 1: Valid Token**

```bash
curl -X POST https://api.hasivu.com/payments/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "orderId": "order-123"}'

# Expected: 200 OK with payment order
```

### **Test 2: No Token**

```bash
curl -X POST https://api.hasivu.com/payments/orders \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "orderId": "order-123"}'

# Expected: 401 Unauthorized
# Response: { "success": false, "error": "Authentication required" }
```

### **Test 3: Wrong Role**

```bash
# Student token trying to access admin endpoint
curl -X GET https://api.hasivu.com/analytics/admin \
  -H "Authorization: Bearer STUDENT_JWT_TOKEN"

# Expected: 403 Forbidden
# Response: { "success": false, "error": "Access denied" }
```

### **Test 4: Expired Token**

```bash
curl -X POST https://api.hasivu.com/payments/orders \
  -H "Authorization: Bearer EXPIRED_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'

# Expected: 401 Unauthorized
# Response: { "success": false, "error": "Invalid or expired token" }
```

---

## 📊 **Implementation Checklist**

### **For Each Endpoint:**

- [ ] Import JWT middleware
- [ ] Change handler signature to use `AuthenticatedEvent`
- [ ] Access `event.user` for user information
- [ ] Wrap handler with appropriate auth middleware
- [ ] Test with valid token
- [ ] Test without token
- [ ] Test with wrong role
- [ ] Update serverless.yml if needed

### **Example Completion:**

```typescript
// ✅ BEFORE
export const handler = async (event, context) => {
  // No authentication, anyone can access
  const data = await processPayment();
  return { statusCode: 200, body: JSON.stringify(data) };
};

// ✅ AFTER
import {
  withAuth,
  AuthenticatedEvent,
} from '../../middleware/jwt-auth.middleware';

const handlerFunction = async (event: AuthenticatedEvent, context) => {
  const userId = event.user!.userId; // Authenticated user ID
  const data = await processPayment(userId);
  return createAuthResponse(200, { success: true, data });
};

export const handler = withAuth(handlerFunction, {
  required: true,
  roles: ['admin', 'parent', 'student'],
});
```

---

## 🚀 **Quick Implementation Script**

For rapid implementation, use this template:

```bash
# 1. Open the Lambda function file
# 2. Add these lines at the top:

import { withAuth, AuthenticatedEvent, createAuthResponse } from '../../middleware/jwt-auth.middleware';

# 3. Find the handler export
# 4. Change from:
export const handler = async (event, context) => {

# 5. To:
const handlerFunction = async (event: AuthenticatedEvent, context) => {
  const userId = event.user!.userId;

# 6. Add at the end of file:
export const handler = withAuth(handlerFunction, {
  required: true,
  roles: ['admin', 'parent', 'student']
});

# 7. Save and test!
```

---

## 📈 **Progress Tracking**

### **Current Status:**

- ✅ JWT Middleware Created
- ✅ Authentication Working on Frontend
- ⏳ Payment Endpoints (0/4 secured)
- ⏳ RFID Endpoints (0/3 secured)
- ⏳ Subscription Endpoints (0/4 secured)

### **Estimated Time:**

- Payment Endpoints: 30-45 minutes (7-10 min each)
- RFID Endpoints: 15-20 minutes (5-7 min each)
- Subscription Endpoints: 20-30 minutes (5-7 min each)

**Total Estimated Time: 1-1.5 hours**

---

## 💡 **Tips & Tricks**

1. **Use Pre-built Middlewares:** Save time with `withAdminAuth`, `withParentAuth`, etc.

2. **Keep Webhooks Separate:** Don't add JWT auth to webhook handlers - they use signature verification

3. **Test Incrementally:** Secure and test one endpoint at a time

4. **Use TypeScript:** The `AuthenticatedEvent` type gives you intellisense for `event.user`

5. **Log Everything:** Add logging for authentication events to track usage

---

## 🎉 **Success Indicators**

You'll know it's working when:

- ✅ Requests without tokens return 401
- ✅ Requests with invalid tokens return 401
- ✅ Requests with wrong role return 403
- ✅ Valid requests work and have access to `event.user`
- ✅ All protected data requires authentication
- ✅ Role-based access control functions correctly

---

**Next Steps:**

1. Choose an endpoint to start with
2. Follow the implementation pattern
3. Test thoroughly
4. Move to the next endpoint
5. Repeat until all endpoints are secured

**Need help? The JWT middleware handles all the complexity - you just wrap your handler!** 🚀
