# HASIVU Platform API Documentation

Complete API documentation for the HASIVU Platform - A comprehensive school meal delivery system with AWS Lambda-based microservices architecture.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [API Endpoints Summary](#api-endpoints-summary)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [SDK and Integration Examples](#sdk-and-integration-examples)
- [Webhooks](#webhooks)
- [Testing](#testing)

## Overview

The HASIVU Platform API provides a comprehensive suite of endpoints for managing a school meal delivery system. The API is built on AWS Lambda functions with serverless architecture, ensuring high scalability and reliability.

### Key Features

- **Authentication**: JWT-based authentication with AWS Cognito integration
- **Payment Processing**: Razorpay integration for secure payments
- **RFID Integration**: Real-time delivery verification
- **Subscription Management**: Flexible billing and subscription plans
- **Analytics**: AI-powered insights and reporting
- **Multi-tenant**: Support for multiple schools and organizations

### Base URLs

| Environment | Base URL                         |
| ----------- | -------------------------------- |
| Production  | `https://api.hasivu.com`         |
| Staging     | `https://api-staging.hasivu.com` |
| Development | `https://api-dev.hasivu.com`     |

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the JWT token in the Authorization header:

```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### Getting Started

1. **Register**: Create a new account using the registration endpoint
2. **Login**: Authenticate to receive JWT tokens
3. **Access**: Use the access token for API calls
4. **Refresh**: Use refresh token to get new access tokens

### Example Authentication Flow

```javascript
// 1. Login
const loginResponse = await fetch('https://api.hasivu.com/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: process.env.API_API_DOCUMENTATION_PASSWORD_1,
  }),
});

const { tokens, user } = await loginResponse.json();

// 2. Use access token for API calls
const apiResponse = await fetch('https://api.hasivu.com/users/me', {
  headers: {
    Authorization: `Bearer ${tokens.accessToken}`,
    'Content-Type': 'application/json',
  },
});

// 3. Refresh token when needed
const refreshResponse = await fetch('https://api.hasivu.com/auth/refresh', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    refreshToken: tokens.refreshToken,
  }),
});
```

## API Endpoints Summary

### Core Endpoints (93+ total endpoints)

#### Authentication (8 endpoints)

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/verify-email` - Email verification
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Password reset confirmation
- `GET /auth/me` - Get current user profile

#### User Management (6 endpoints)

- `GET /users` - List users
- `POST /users` - Create user
- `GET /users/{userId}` - Get user details
- `PUT /users/{userId}` - Update user
- `DELETE /users/{userId}` - Delete user
- `GET /users/{userId}/profile` - Get user profile

#### Payment Processing (27 endpoints)

**Core Payment (5 endpoints)**

- `POST /payments/orders` - Create payment order
- `POST /payments/verify` - Verify payment
- `POST /payments/webhook` - Payment webhook
- `POST /payments/refund` - Process refund
- `GET /payments/status/{orderId}` - Get payment status

**Advanced Payment Features (4 endpoints)**

- `GET /payments/methods` - List payment methods
- `POST /payments/methods` - Add payment method
- `PUT /payments/methods/{methodId}` - Update payment method
- `DELETE /payments/methods/{methodId}` - Delete payment method

**Advanced Payment Processing (4 endpoints)**

- `POST /payments/advanced/create` - Advanced payment creation
- `POST /payments/advanced/validate` - Payment validation
- `POST /payments/advanced/installment` - Installment payments
- `GET /payments/advanced/{paymentId}` - Get advanced payment details

**Payment Retry & Recovery (5 endpoints)**

- `POST /payments/retry` - Retry failed payment
- `POST /payments/retry/schedule` - Schedule payment retry
- `POST /payments/retry/process-scheduled` - Process scheduled retries
- `GET /payments/retry/{paymentId}` - Get retry status
- `DELETE /payments/retry/{retryId}` - Cancel retry

**Reconciliation (6 endpoints)**

- `POST /payments/reconciliation/generate` - Generate reconciliation
- `POST /payments/reconciliation/manual-adjustment` - Manual adjustment
- `POST /payments/reconciliation/auto-reconcile` - Auto reconciliation
- `GET /payments/reconciliation/{recordId}` - Get reconciliation record
- `PUT /payments/reconciliation/{recordId}` - Update reconciliation
- `GET /payments/reconciliation` - List reconciliations

**Webhook Handler (1 endpoint)**

- `POST /payments/webhooks/razorpay` - Razorpay webhook handler

**Analytics (2 endpoints)**

- `GET /payments/analytics/dashboard` - Payment analytics dashboard
- `GET /payments/analytics/trends` - Payment trends analysis

#### Subscription Management (20+ endpoints)

**Subscriptions (7 endpoints)**

- `GET /subscriptions` - List subscriptions
- `POST /subscriptions` - Create subscription
- `GET /subscriptions/{id}` - Get subscription details
- `PUT /subscriptions/{id}` - Update subscription
- `POST /subscriptions/{id}/pause` - Pause subscription
- `POST /subscriptions/{id}/resume` - Resume subscription
- `POST /subscriptions/{id}/cancel` - Cancel subscription

**Subscription Plans (8 endpoints)**

- `GET /subscription-plans` - List subscription plans
- `POST /subscription-plans` - Create subscription plan
- `GET /subscription-plans/{id}` - Get plan details
- `PUT /subscription-plans/{id}` - Update plan
- `DELETE /subscription-plans/{id}` - Delete plan
- `POST /subscription-plans/compare` - Compare plans
- `GET /subscription-plans/{id}/analytics` - Plan analytics
- `GET /subscription-plans/analytics` - All plans analytics

**Billing Automation (3 endpoints)**

- `POST /billing/process` - Process billing
- `POST /billing/process/{id}` - Process specific billing
- `GET /billing/status` - Get billing status

**Dunning Management (4 endpoints)**

- `POST /dunning/process` - Process dunning
- `POST /payments/{paymentId}/retry` - Retry payment
- `GET /dunning/status` - Get dunning status
- `GET /payments/{paymentId}/retry-history` - Get retry history

**Subscription Analytics (6 endpoints)**

- `GET /subscription-analytics` - Subscription analytics
- `GET /subscription-analytics/dashboard` - Analytics dashboard
- `POST /subscription-analytics/cohort` - Cohort analysis
- `GET /subscription-analytics/revenue` - Revenue analytics
- `GET /subscription-analytics/churn` - Churn analysis
- `GET /subscription-analytics/clv` - Customer lifetime value

#### RFID Management (8 endpoints)

- `GET /rfid/readers` - List RFID readers
- `POST /rfid/readers` - Add RFID reader
- `PUT /rfid/readers/{readerId}` - Update RFID reader
- `POST /rfid/readers/{readerId}/test` - Test RFID reader
- `POST /rfid/cards` - Register RFID card
- `PUT /rfid/cards/{cardId}` - Update RFID card
- `POST /rfid/verify-delivery` - Verify delivery
- `POST /rfid/verify-bulk` - Bulk verify deliveries

#### Menu Management (12 endpoints)

- `GET /menus/plans` - List menu plans
- `POST /menus/plans` - Create menu plan
- `GET /menus/plans/{planId}` - Get menu plan
- `PUT /menus/plans/{planId}` - Update menu plan
- `POST /menus/approve/{planId}` - Approve menu plan
- `GET /menus/daily` - Get daily menu
- `GET /menus/items` - List menu items
- `POST /menus/items` - Create menu item
- `GET /menus/items/{itemId}` - Get menu item
- `PUT /menus/items/{itemId}` - Update menu item
- `DELETE /menus/items/{itemId}` - Delete menu item
- `POST /menus/items/bulk-update` - Bulk update menu items

#### Order Processing (8 endpoints)

- `GET /orders` - List orders
- `POST /orders` - Create order
- `GET /orders/{orderId}` - Get order details
- `PUT /orders/{orderId}` - Update order
- `DELETE /orders/{orderId}` - Cancel order
- `GET /orders/history/{userId}` - Get order history
- `POST /orders/{orderId}/confirm` - Confirm order
- `POST /orders/{orderId}/deliver` - Mark as delivered

#### Analytics (6 endpoints)

- `GET /analytics/dashboard` - Main analytics dashboard
- `GET /analytics/payments` - Payment analytics
- `GET /analytics/orders` - Order analytics
- `GET /analytics/users` - User analytics
- `GET /analytics/performance` - Performance metrics
- `POST /analytics/generate-report` - Generate custom report

#### Health Monitoring (8 endpoints)

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health status
- `GET /health/database` - Database health
- `GET /health/external-services` - External services health
- `GET /health/metrics` - System metrics
- `GET /health/dependencies` - Dependency status
- `POST /health/test-connectivity` - Test connectivity
- `GET /health/version` - API version info

#### Notification System (6 endpoints)

- `GET /notifications` - List notifications
- `POST /notifications` - Send notification
- `GET /notifications/{id}` - Get notification details
- `PUT /notifications/{id}` - Update notification
- `POST /notifications/bulk-send` - Bulk send notifications
- `GET /notifications/templates` - List notification templates

#### Invoice System (12+ endpoints)

**Invoice Generation (4 endpoints)**

- `POST /invoices/generate` - Generate invoice
- `POST /invoices/{id}/regenerate` - Regenerate invoice
- `POST /invoices/batch-generate` - Batch generate invoices
- `GET /invoices/{id}` - Get invoice details

**PDF Generation (3 endpoints)**

- `POST /pdf/generate` - Generate PDF
- `GET /pdf/invoice/{id}` - Get invoice PDF
- `POST /pdf/bulk-download` - Bulk download PDFs

**Invoice Templates (5 endpoints)**

- `GET /invoice-templates` - List templates
- `POST /invoice-templates` - Create template
- `GET /invoice-templates/{id}` - Get template
- `PUT /invoice-templates/{id}` - Update template
- `DELETE /invoice-templates/{id}` - Delete template

**Invoice Mailer (4 endpoints)**

- `POST /invoices/email` - Send invoice email
- `POST /invoices/email/batch` - Batch send emails
- `POST /invoices/email/schedule` - Schedule email sending
- `GET /invoices/email/status` - Get email status

**Invoice Analytics (5 endpoints)**

- `GET /invoice-analytics/dashboard` - Invoice dashboard
- `GET /invoice-analytics/payment-status` - Payment status analytics
- `GET /invoice-analytics/overdue` - Overdue invoice analytics
- `GET /invoice-analytics/collections` - Collection analytics
- `POST /invoice-analytics/generate-report` - Generate analytics report

#### AI-Powered Analytics (8+ endpoints)

**ML Payment Insights (7 endpoints)**

- `GET /ml-insights/predictive` - Predictive analytics
- `GET /ml-insights/anomaly` - Anomaly detection
- `GET /ml-insights/churn` - Churn prediction
- `GET /ml-insights/revenue-forecast` - Revenue forecasting
- `GET /ml-insights` - All ML insights
- `POST /ml-insights/train-model` - Train ML models
- `POST /ml-insights/generate-insights` - Generate new insights

**Advanced Payment Intelligence (8 endpoints)**

- `GET /intelligence/pattern-recognition` - Pattern recognition
- `GET /intelligence/fraud-detection` - Fraud detection
- `GET /intelligence/optimization` - Payment optimization
- `GET /intelligence/behavioral-analysis` - Behavioral analysis
- `GET /intelligence` - All intelligence insights
- `POST /intelligence/analyze-transaction` - Analyze transaction
- `POST /intelligence/generate-intelligence-report` - Generate intelligence report
- `POST /intelligence/update-intelligence-models` - Update models

## Error Handling

The API uses standard HTTP status codes and provides detailed error responses in JSON format following RFC 7807.

### Error Response Format

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_ERROR_CODE",
  "details": [
    {
      "field": "email",
      "message": "Please provide a valid email address",
      "value": "invalid-email"
    }
  ],
  process.env.API_API_DOCUMENTATION_PASSWORD_2: process.env.API_API_DOCUMENTATION_PASSWORD_3,
  process.env.API_API_DOCUMENTATION_PASSWORD_4: process.env.API_API_DOCUMENTATION_PASSWORD_5
}
```

### Common HTTP Status Codes

| Status Code | Description           | When Used                         |
| ----------- | --------------------- | --------------------------------- |
| 200         | OK                    | Successful GET, PUT requests      |
| 201         | Created               | Successful POST requests          |
| 204         | No Content            | Successful DELETE requests        |
| 400         | Bad Request           | Invalid request data              |
| 401         | Unauthorized          | Invalid or missing authentication |
| 403         | Forbidden             | Insufficient permissions          |
| 404         | Not Found             | Resource doesn't exist            |
| 409         | Conflict              | Resource already exists           |
| 429         | Too Many Requests     | Rate limit exceeded               |
| 500         | Internal Server Error | Server-side error                 |
| 503         | Service Unavailable   | Service temporarily down          |

### Error Codes

| Error Code             | Description                     |
| ---------------------- | ------------------------------- |
| `VALIDATION_ERROR`     | Request validation failed       |
| `UNAUTHORIZED`         | Authentication required         |
| `FORBIDDEN`            | Access denied                   |
| `NOT_FOUND`            | Resource not found              |
| `EMAIL_ALREADY_EXISTS` | Email already registered        |
| `USER_NOT_FOUND`       | User account not found          |
| `PAYMENT_FAILED`       | Payment processing failed       |
| `INSUFFICIENT_FUNDS`   | Insufficient account balance    |
| `RATE_LIMIT_EXCEEDED`  | Too many requests               |
| `SERVICE_UNAVAILABLE`  | Service temporarily unavailable |

## Rate Limiting

The API implements rate limiting to ensure fair usage and system stability.

### Rate Limits

- **Default**: 1000 requests per minute per IP address
- **Burst Limit**: 2000 requests per minute
- **Authenticated**: 2000 requests per minute per user
- **Premium**: 5000 requests per minute per user

### Rate Limit Headers

The API includes rate limit information in response headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
X-RateLimit-Retry-After: 60
```

### Rate Limit Response

When rate limit is exceeded (HTTP 429):

```json
{
  "error": "Rate limit exceeded. Please try again later.",
  "code": "TOO_MANY_REQUESTS",
  process.env.API_API_DOCUMENTATION_PASSWORD_6: 60,
  process.env.API_API_DOCUMENTATION_PASSWORD_7: process.env.API_API_DOCUMENTATION_PASSWORD_8,
  process.env.API_API_DOCUMENTATION_PASSWORD_9: process.env.API_API_DOCUMENTATION_PASSWORD_10
}
```

## SDK and Integration Examples

### JavaScript/TypeScript SDK

```javascript
// Installation
npm install @hasivu/api-sdk

// Basic usage
import { HasivuAPI } from '@hasivu/api-sdk';

const api = new HasivuAPI({
  baseURL: 'https://api.hasivu.com',
  apiKey: 'your-api-key'
});

// Authentication
const user = await api.auth.login({
  email: 'user@example.com',
  password: 'password'
});

// Create payment order
const paymentOrder = await api.payments.createOrder({
  userId: user.id,
  amount: 250.00,
  currency: 'INR',
  description: 'Lunch payment'
});

// Get user orders
const orders = await api.orders.list({
  userId: user.id,
  status: 'completed'
});
```

### Python SDK

```python
# Installation
pip install hasivu-api

# Basic usage
from hasivu_api import HasivuAPI

api = HasivuAPI(
    base_url='https://api.hasivu.com',
    api_key='your-api-key'
)

# Authentication
user = api.auth.login(
    email='user@example.com',
    password='password'
)

# Create subscription
subscription = api.subscriptions.create({
    process.env.API_API_DOCUMENTATION_PASSWORD_11: process.env.API_API_DOCUMENTATION_PASSWORD_12,
    'user_id': user['id'],
    process.env.API_API_DOCUMENTATION_PASSWORD_13: '2024-01-15'
})

# Get analytics
analytics = api.analytics.get_dashboard(
    school_id=process.env.API_API_DOCUMENTATION_PASSWORD_14,
    start_date='2024-01-01',
    end_date='2024-01-31'
)
```

### cURL Examples

#### Login

```bash
curl -X POST https://api.hasivu.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    process.env.API_API_DOCUMENTATION_PASSWORD_15: process.env.API_API_DOCUMENTATION_PASSWORD_16
  }'
```

#### Create Payment Order

```bash
curl -X POST https://api.hasivu.com/payments/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -d '{
    "userId": process.env.API_API_DOCUMENTATION_PASSWORD_17,
    "amount": 250.00,
    "currency": "INR",
    "description": "Lunch payment for John Doe"
  }'
```

#### Get Daily Menu

```bash
curl -X GET process.env.API_API_DOCUMENTATION_PASSWORD_18 \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

#### Verify Delivery

```bash
curl -X POST https://api.hasivu.com/rfid/verify-delivery \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -d '{
    process.env.API_API_DOCUMENTATION_PASSWORD_19: process.env.API_API_DOCUMENTATION_PASSWORD_20,
    process.env.API_API_DOCUMENTATION_PASSWORD_21: process.env.API_API_DOCUMENTATION_PASSWORD_22,
    "orderId": process.env.API_API_DOCUMENTATION_PASSWORD_23
  }'
```

### React Integration Example

```jsx
import React, { useState, useEffect } from 'react';
import { HasivuAPI } from '@hasivu/api-sdk';

const OrderHistory = ({ userId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const api = new HasivuAPI({
    baseURL: 'https://api.hasivu.com',
    token: localStorage.getItem('hasivu_token'),
  });

  useEffect(() => {
    fetchOrders();
  }, [userId]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.orders.getHistory(userId, {
        page: 1,
        limit: 20,
      });
      setOrders(response.orders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Order History</h2>
      {orders.map(order => (
        <div key={order.id} className="order-card">
          <h3>Order #{order.orderNumber}</h3>
          <p>Status: {order.status}</p>
          <p>Amount: ₹{order.totalAmount}</p>
          <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
};

export default OrderHistory;
```

## Webhooks

The API supports webhooks for real-time event notifications.

### Webhook Events

| Event                    | Description                    | Payload                   |
| ------------------------ | ------------------------------ | ------------------------- |
| `payment.success`        | Payment completed successfully | Payment object            |
| `payment.failed`         | Payment failed                 | Payment object with error |
| `order.created`          | New order created              | Order object              |
| `order.completed`        | Order delivered                | Order object              |
| `subscription.created`   | New subscription               | Subscription object       |
| `subscription.cancelled` | Subscription cancelled         | Subscription object       |
| `delivery.verified`      | RFID delivery verified         | Verification object       |

### Webhook Configuration

```javascript
// Configure webhook endpoint
const webhookConfig = {
  url: 'https://yoursite.com/webhooks/hasivu',
  events: ['payment.success', 'order.completed'],
  secret: 'your-webhook-secret',
};

await api.webhooks.create(webhookConfig);
```

### Webhook Validation

```javascript
// Validate webhook signature
const crypto = require('crypto');

const validateWebhook = (payload, signature, secret) => {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const digest = hmac.digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
};

// Express.js webhook handler
app.post('/webhooks/hasivu', (req, res) => {
  const signature = req.headers['x-hasivu-signature'];
  const payload = JSON.stringify(req.body);

  if (!validateWebhook(payload, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Unauthorized');
  }

  const event = req.body;

  switch (event.type) {
    case 'payment.success':
      handlePaymentSuccess(event.data);
      break;
    case 'order.completed':
      handleOrderCompleted(event.data);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.status(200).send('OK');
});
```

## Testing

### Test Environment

Use the development environment for testing:

```javascript
const api = new HasivuAPI({
  baseURL: 'https://api-dev.hasivu.com',
  apiKey: 'test_api_key',
});
```

### Test Data

Test data is available in the development environment:

```javascript
// Test user credentials
const testUser = {
  email: 'test@hasivu.com',
  password: process.env.API_API_DOCUMENTATION_PASSWORD_24,
};

// Test school ID
const testSchoolId = process.env.API_API_DOCUMENTATION_PASSWORD_25;

// Test payment amounts (use specific amounts for different responses)
const testAmounts = {
  success: 100.0, // Will succeed
  failure: 200.0, // Will fail
  pending: 300.0, // Will remain pending
};
```

### Postman Collection

Import the Postman collection for easy testing:

```bash
# Download collection
curl -o hasivu-api.postman_collection.json \
  https://api.hasivu.com/docs/postman/collection.json

# Import environment
curl -o hasivu-api.postman_environment.json \
  https://api.hasivu.com/docs/postman/environment.json
```

### Testing Payment Flows

```javascript
// Test payment flow
const testPaymentFlow = async () => {
  try {
    // 1. Login
    const user = await api.auth.login({
      email: 'test@hasivu.com',
      password: process.env.API_API_DOCUMENTATION_PASSWORD_26,
    });

    // 2. Create order
    const order = await api.orders.create({
      items: [
        {
          menuItemId: process.env.API_API_DOCUMENTATION_PASSWORD_27,
          quantity: 1,
        },
      ],
    });

    // 3. Create payment
    const payment = await api.payments.createOrder({
      userId: user.id,
      orderId: order.id,
      amount: order.totalAmount,
    });

    // 4. Simulate payment success
    const verification = await api.payments.verify({
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: process.env.API_API_DOCUMENTATION_PASSWORD_28,
      razorpaySignature: process.env.API_API_DOCUMENTATION_PASSWORD_29,
    });

    console.log('Payment flow completed:', verification);
  } catch (error) {
    console.error('Payment flow failed:', error);
  }
};
```

### Unit Testing Examples

```javascript
// Jest test example
describe('HASIVU API Integration', () => {
  let api;

  beforeAll(() => {
    api = new HasivuAPI({
      baseURL: process.env.HASIVU_API_URL,
      apiKey: process.env.HASIVU_API_KEY,
    });
  });

  test('should authenticate user', async () => {
    const user = await api.auth.login({
      email: 'test@hasivu.com',
      password: process.env.API_API_DOCUMENTATION_PASSWORD_30,
    });

    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(user.email).toBe('test@hasivu.com');
  });

  test('should create payment order', async () => {
    const order = await api.payments.createOrder({
      userId: process.env.API_API_DOCUMENTATION_PASSWORD_31,
      amount: 250.0,
      currency: 'INR',
    });

    expect(order).toHaveProperty('id');
    expect(order).toHaveProperty('razorpayOrderId');
    expect(order.amount).toBe(25000); // Amount in paise
  });

  test('should handle validation errors', async () => {
    await expect(
      api.payments.createOrder({
        // Missing required fields
      })
    ).rejects.toThrow('Validation failed');
  });
});
```

---

## Support

For API support and questions:

- **Email**: api-support@hasivu.com
- **Documentation**: https://docs.hasivu.com
- **Status Page**: https://status.hasivu.com
- **GitHub Issues**: https://github.com/hasivu/platform/issues

## Changelog

### Version 1.0.0 (Latest)

- Initial API release
- Complete authentication system
- Payment processing with Razorpay
- RFID delivery verification
- Subscription management
- Analytics and reporting
- AI-powered insights

### Upcoming Features

- GraphQL API support
- Real-time WebSocket notifications
- Advanced fraud detection
- Multi-language support
- Enhanced analytics dashboard
