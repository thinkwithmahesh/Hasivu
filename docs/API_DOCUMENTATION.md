# HASIVU Platform - API Documentation

**Priority 9: Documentation & Training Materials**
_Complete API reference and developer guide for production readiness_

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Core Endpoints](#core-endpoints)
4. [RFID System Integration](#rfid-system-integration)
5. [Menu Management APIs](#menu-management-apis)
6. [Order Management APIs](#order-management-apis)
7. [User Management APIs](#user-management-apis)
8. [Payment Processing APIs](#payment-processing-apis)
9. [Analytics & Reporting APIs](#analytics--reporting-apis)
10. [Enterprise & Multi-Tenant APIs](#enterprise--multi-tenant-apis)
11. [Nutrition & Compliance APIs](#nutrition--compliance-apis)
12. [Notification & Communication APIs](#notification--communication-apis)
13. [Mobile & Device APIs](#mobile--device-apis)
14. [Template & Personalization APIs](#template--personalization-apis)
15. [Health & Monitoring APIs](#health--monitoring-apis)
16. [WebSocket Events](#websocket-events)
17. [Error Handling](#error-handling)
18. [Rate Limiting](#rate-limiting)
19. [Testing Guide](#testing-guide)
20. [SDK & Integration Examples](#sdk--integration-examples)

---

## API Overview

### Architecture Overview

HASIVU Platform uses a **serverless architecture** built on AWS Lambda functions, providing scalable, cost-effective API endpoints. The platform consists of multiple Lambda functions deployed behind API Gateway, with each function handling specific business domains.

### Base URLs

- **Production**: Lambda functions accessed via API Gateway URLs
- **Staging**: Lambda functions accessed via API Gateway URLs
- **Development**: Lambda functions accessed via API Gateway URLs

### Lambda Function URLs

Each API endpoint is served by dedicated Lambda functions with the following URL pattern:

```
https://{api-gateway-id}.execute-api.{region}.amazonaws.com/{stage}/{function-path}
```

### Content Types

- **Request**: `application/json`
- **Response**: `application/json`
- **File Upload**: `multipart/form-data`

### HTTP Methods

- `GET` - Retrieve resources
- `POST` - Create new resources
- `PUT` - Update entire resources
- `PATCH` - Partial resource updates
- `DELETE` - Remove resources

### Standard Response Format

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123abc",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "code": "INVALID_EMAIL"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123abc"
}
```

### Lambda Function Mapping

| Domain            | Lambda Function                     | Environment Variable         | File Count |
| ----------------- | ----------------------------------- | ---------------------------- | ---------- |
| Authentication    | `hasivu-platform-api-auth`          | `LAMBDA_AUTH_*_URL`          | 8          |
| Orders            | `hasivu-platform-api-orders`        | `LAMBDA_ORDERS_*_URL`        | 5          |
| Menus             | `hasivu-platform-api-menus`         | `LAMBDA_MENUS_*_URL`         | -          |
| Payments          | `hasivu-platform-api-payments`      | `LAMBDA_PAYMENTS_*_URL`      | 10         |
| RFID              | `hasivu-platform-api-rfid`          | `LAMBDA_RFID_*_URL`          | 9          |
| Users             | `hasivu-platform-api-users`         | `LAMBDA_USERS_*_URL`         | 5          |
| Analytics         | `hasivu-platform-api-analytics`     | `LAMBDA_ANALYTICS_*_URL`     | 11         |
| Enterprise        | `hasivu-platform-api-enterprise`    | `LAMBDA_ENTERPRISE_*_URL`    | 6          |
| Nutrition         | `hasivu-platform-api-nutrition`     | `LAMBDA_NUTRITION_*_URL`     | 6          |
| Templates         | `hasivu-platform-api-templates`     | `LAMBDA_TEMPLATES_*_URL`     | 6          |
| Mobile            | `hasivu-platform-api-mobile`        | `LAMBDA_MOBILE_*_URL`        | 3          |
| Schools           | `hasivu-platform-api-schools`       | `LAMBDA_SCHOOLS_*_URL`       | 1          |
| Monitoring        | `hasivu-platform-api-monitoring`    | `LAMBDA_MONITORING_*_URL`    | 1          |
| Notifications     | `hasivu-platform-api-notifications` | `LAMBDA_NOTIFICATIONS_*_URL` | -          |
| Health/Monitoring | `hasivu-platform-api-health`        | `LAMBDA_HEALTH_URL`          | -          |
| **Total**         | **80 Lambda Functions**             |                              | **80**     |

---

## Authentication & Authorization

### JWT Token Authentication

All API requests require a valid JWT token in the Authorization header.

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Login Endpoint

**Lambda Function**: `hasivu-platform-api-auth`
**Environment Variable**: `LAMBDA_AUTH_LOGIN_URL`

```http
POST {LAMBDA_AUTH_LOGIN_URL}
Content-Type: application/json

{
  "email": "student@school.edu.in",
  "password": "securepassword",
  "schoolId": "school_123",
  "rememberMe": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "student@school.edu.in",
      "firstName": "John",
      "lastName": "Doe",
      "role": "STUDENT",
      "schoolId": "school_123",
      "dietaryRestrictions": ["VEGETARIAN"],
      "allergens": ["NUTS"],
      "rfidTag": "RFID123456"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600,
      "tokenType": "Bearer"
    }
  },
  "message": "Login successful"
}
```

### Token Refresh

**Lambda Function**: `hasivu-platform-api-auth`
**Environment Variable**: `LAMBDA_AUTH_REFRESH_URL`

```http
POST {LAMBDA_AUTH_REFRESH_URL}
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### User Roles & Permissions

- **SUPER_ADMIN**: Full system access
- **SCHOOL_ADMIN**: School-specific administration
- **TEACHER**: Student management and monitoring
- **NUTRITIONIST**: Menu planning and nutritional oversight
- **KITCHEN_STAFF**: Order management and fulfillment
- **STUDENT**: Order placement and account management
- **PARENT**: Child account oversight

---

## Core Endpoints

### Health Check

**Lambda Function**: `hasivu-platform-api-health`
**Environment Variable**: `LAMBDA_HEALTH_URL`

```http
GET {LAMBDA_HEALTH_URL}

Response:
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.2.0",
    "environment": "production",
    "services": {
      "database": "healthy",
      "redis": "healthy",
      "rfid": "healthy"
    }
  }
}
```

### System Status

**Lambda Function**: `hasivu-platform-api-health`
**Environment Variable**: `LAMBDA_MONITORING_STATUS_URL`

```http
GET {LAMBDA_MONITORING_STATUS_URL}
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "data": {
    "uptime": 86400,
    "activeUsers": 1234,
    "todayOrders": 567,
    "systemLoad": {
      "cpu": 45.6,
      "memory": 62.3,
      "disk": 23.1
    },
    "cacheHitRate": 94.2,
    "apiResponseTime": 89
  }
}
```

---

## RFID System Integration

### RFID Tag Verification

**Lambda Function**: `hasivu-platform-api-rfid`
**Environment Variable**: `LAMBDA_RFID_VERIFY_CARD_URL`

```http
POST {LAMBDA_RFID_VERIFY_CARD_URL}
Content-Type: application/json

{
  "tagId": "RFID123456",
  "readerId": "READER_001",
  "timestamp": "2024-01-15T10:30:00Z",
  "location": "MAIN_CAFETERIA"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "verified": true,
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "class": "10-A",
      "dietaryRestrictions": ["VEGETARIAN"],
      "allergens": ["NUTS"]
    },
    "activeOrder": {
      "id": "order_456",
      "status": "READY",
      "items": [
        {
          "name": "Vegetable Biryani",
          "quantity": 1,
          "nutritionInfo": {
            "calories": 450,
            "protein": 12,
            "carbs": 65,
            "fat": 15
          }
        }
      ],
      "totalAmount": 80,
      "estimatedDeliveryTime": "2024-01-15T11:00:00Z"
    }
  }
}
```

### RFID Order Delivery

**Lambda Function**: `hasivu-platform-api-rfid`
**Environment Variable**: `LAMBDA_RFID_DELIVERY_VERIFICATION_URL`

```http
POST {LAMBDA_RFID_DELIVERY_VERIFICATION_URL}
Content-Type: application/json

{
  "tagId": "RFID123456",
  "orderId": "order_456",
  "readerId": "READER_001",
  "deliveredBy": "kitchen_staff_789",
  "timestamp": "2024-01-15T10:45:00Z",
  "verificationPhoto": "base64_image_data"
}
```

### RFID Reader Management

**Lambda Function**: `hasivu-platform-api-rfid`
**Environment Variable**: `LAMBDA_RFID_MANAGE_READERS_URL`

```http
GET {LAMBDA_RFID_MANAGE_READERS_URL}
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "data": [
    {
      "id": "READER_001",
      "name": "Main Cafeteria Reader",
      "location": "MAIN_CAFETERIA",
      "status": "ONLINE",
      "lastHeartbeat": "2024-01-15T10:44:30Z",
      "batteryLevel": 78,
      "configuration": {
        "readRange": 10,
        "frequency": "920-925 MHz",
        "powerLevel": 30
      }
    }
  ]
}
```

---

## Menu Management APIs

### Get School Menu

**Lambda Function**: `hasivu-platform-api-menus`
**Environment Variable**: `LAMBDA_MENUS_DAILY_URL`

```http
GET {LAMBDA_MENUS_DAILY_URL}?date=2024-01-15&mealType=LUNCH
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "id": "menu_123",
    "schoolId": "school_123",
    "date": "2024-01-15",
    "mealType": "LUNCH",
    "items": [
      {
        "id": "item_456",
        "name": "Vegetable Biryani",
        "description": "Aromatic basmati rice with mixed vegetables and spices",
        "category": "MAIN_COURSE",
        "price": 80,
        "available": true,
        "estimatedPrepTime": 15,
        "nutritionInfo": {
          "calories": 450,
          "protein": 12,
          "carbohydrates": 65,
          "fat": 15,
          "fiber": 8,
          "sugar": 5,
          "sodium": 800
        },
        "allergens": ["GLUTEN"],
        "dietaryTags": ["VEGETARIAN", "VEGAN"],
        "ingredients": [
          {
            "name": "Basmati Rice",
            "quantity": "150g",
            "allergens": []
          },
          {
            "name": "Mixed Vegetables",
            "quantity": "100g",
            "allergens": []
          }
        ],
        "compliance": {
          "governmentApproved": true,
          "nutritionistVerified": true,
          "safetyScore": 95,
          "lastReviewed": "2024-01-10T00:00:00Z"
        }
      }
    ],
    "nutritionalSummary": {
      "totalCalories": 450,
      "macronutrients": {
        "protein": 12,
        "carbohydrates": 65,
        "fat": 15
      },
      "meetsGuidelines": true,
      "complianceScore": 95
    }
  }
}
```

### Create Menu Item

**Lambda Function**: `hasivu-platform-api-menus`
**Environment Variable**: `LAMBDA_MENUS_CREATE_PLAN_URL`

```http
POST {LAMBDA_MENUS_CREATE_PLAN_URL}
Authorization: Bearer {nutritionist_token}
Content-Type: application/json

{
  "name": "Paneer Tikka",
  "description": "Grilled cottage cheese with spices",
  "category": "MAIN_COURSE",
  "price": 120,
  "estimatedPrepTime": 20,
  "nutritionInfo": {
    "calories": 320,
    "protein": 18,
    "carbohydrates": 12,
    "fat": 22,
    "fiber": 3,
    "sugar": 8,
    "sodium": 650
  },
  "allergens": ["DAIRY"],
  "dietaryTags": ["VEGETARIAN"],
  "ingredients": [
    {
      "name": "Paneer",
      "quantity": "100g",
      "allergens": ["DAIRY"]
    },
    {
      "name": "Bell Peppers",
      "quantity": "50g",
      "allergens": []
    }
  ],
  "images": ["image1.jpg", "image2.jpg"],
  "availableDays": ["MONDAY", "WEDNESDAY", "FRIDAY"],
  "schoolIds": ["school_123", "school_456"]
}
```

---

## Order Management APIs

### Create Order

**Lambda Function**: `hasivu-platform-api-orders`
**Environment Variable**: `LAMBDA_ORDERS_CREATE_URL`

```http
POST {LAMBDA_ORDERS_CREATE_URL}
Authorization: Bearer {student_token}
Content-Type: application/json

{
  "schoolId": "school_123",
  "mealType": "LUNCH",
  "deliveryDate": "2024-01-15",
  "deliveryTime": "12:30",
  "items": [
    {
      "itemId": "item_456",
      "quantity": 1,
      "customizations": {
        "spiceLevel": "MEDIUM",
        "extraSalad": true
      },
      "specialInstructions": "Less oil please"
    }
  ],
  "paymentMethod": "WALLET",
  "deliveryLocation": "CLASS_10A"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "order_789",
    "orderNumber": "ORD-2024-0115-0001",
    "status": "CONFIRMED",
    "totalAmount": 80,
    "estimatedPrepTime": 15,
    "estimatedDeliveryTime": "2024-01-15T12:30:00Z",
    "items": [
      {
        "itemId": "item_456",
        "name": "Vegetable Biryani",
        "quantity": 1,
        "price": 80,
        "customizations": {
          "spiceLevel": "MEDIUM",
          "extraSalad": true
        }
      }
    ],
    "payment": {
      "method": "WALLET",
      "status": "COMPLETED",
      "transactionId": "txn_123",
      "amount": 80
    },
    "tracking": {
      "currentStatus": "CONFIRMED",
      "estimatedStages": [
        {
          "stage": "PREPARING",
          "estimatedTime": "2024-01-15T12:15:00Z"
        },
        {
          "stage": "READY",
          "estimatedTime": "2024-01-15T12:25:00Z"
        },
        {
          "stage": "DELIVERED",
          "estimatedTime": "2024-01-15T12:30:00Z"
        }
      ]
    }
  }
}
```

### Get Order Status

**Lambda Function**: `hasivu-platform-api-orders`
**Environment Variable**: `LAMBDA_ORDERS_GET_URL`

```http
GET {LAMBDA_ORDERS_GET_URL}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "id": "order_789",
    "orderNumber": "ORD-2024-0115-0001",
    "status": "PREPARING",
    "currentStage": {
      "name": "PREPARING",
      "startTime": "2024-01-15T12:10:00Z",
      "estimatedEndTime": "2024-01-15T12:25:00Z",
      "progress": 60
    },
    "statusHistory": [
      {
        "status": "CONFIRMED",
        "timestamp": "2024-01-15T12:05:00Z",
        "updatedBy": "system"
      },
      {
        "status": "PREPARING",
        "timestamp": "2024-01-15T12:10:00Z",
        "updatedBy": "kitchen_staff_789"
      }
    ],
    "liveTracking": {
      "kitchenLoad": 75,
      "queuePosition": 3,
      "estimatedDelay": 5
    }
  }
}
```

---

## User Management APIs

### User Registration

**Lambda Function**: `hasivu-platform-api-users`
**Environment Variable**: `LAMBDA_USERS_LIST_URL` (with POST method)

```http
POST {LAMBDA_USERS_LIST_URL}/register
Content-Type: application/json

{
  "email": "new.student@school.edu.in",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "STUDENT",
  "schoolId": "school_123",
  "class": "9-B",
  "rollNumber": "9B025",
  "dateOfBirth": "2009-05-15",
  "gender": "FEMALE",
  "parentContact": {
    "motherName": "Mary Smith",
    "fatherName": "John Smith",
    "primaryPhone": "+91-9876543210",
    "emergencyPhone": "+91-9876543211",
    "email": "parent@example.com"
  },
  "dietaryRestrictions": ["VEGETARIAN"],
  "allergens": ["NUTS", "DAIRY"],
  "medicalConditions": ["DIABETES"],
  "address": {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India"
  }
}
```

### Get User Profile

**Lambda Function**: `hasivu-platform-api-users`
**Environment Variable**: `LAMBDA_USERS_GET_URL` (replace {id} with 'profile')

```http
GET {LAMBDA_USERS_GET_URL}/profile
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "student@school.edu.in",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STUDENT",
    "school": {
      "id": "school_123",
      "name": "ABC International School",
      "location": "Mumbai"
    },
    "studentInfo": {
      "class": "10-A",
      "rollNumber": "10A015",
      "admissionNumber": "ADM2022001",
      "academicYear": "2023-24"
    },
    "dietaryProfile": {
      "restrictions": ["VEGETARIAN"],
      "allergens": ["NUTS"],
      "preferences": ["SPICY", "NO_ONION"],
      "medicalConditions": []
    },
    "nutritionalNeeds": {
      "dailyCalories": 2200,
      "protein": 55,
      "carbohydrates": 300,
      "fat": 70,
      "recommendations": [
        "Increase protein intake",
        "Include more leafy greens"
      ]
    },
    "rfidTag": "RFID123456",
    "wallet": {
      "balance": 500,
      "currency": "INR"
    },
    "statistics": {
      "totalOrders": 45,
      "favoriteItems": ["item_456", "item_789"],
      "avgOrderValue": 85,
      "lastOrderDate": "2024-01-14"
    }
  }
}
```

---

## Payment Processing APIs

### Create Payment Order

**Lambda Function**: `hasivu-platform-api-payments`
**Environment Variable**: `LAMBDA_PAYMENTS_CREATE_ORDER_URL`

```http
POST {LAMBDA_PAYMENTS_CREATE_ORDER_URL}
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 250,
  "currency": "INR",
  "orderId": "order_123",
  "paymentMethod": "RAZORPAY",
  "customerDetails": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91-9876543210"
  },
  "notes": {
    "orderType": "school_meal",
    "schoolId": "school_123"
  }
}
```

### Verify Payment

**Lambda Function**: `hasivu-platform-api-payments`
**Environment Variable**: `LAMBDA_PAYMENTS_VERIFY_URL`

```http
POST {LAMBDA_PAYMENTS_VERIFY_URL}
Authorization: Bearer {token}
Content-Type: application/json

{
  "paymentId": "pay_1234567890",
  "orderId": "order_123",
  "signature": "signature_from_razorpay_webhook",
  "paymentData": {
    "razorpay_payment_id": "pay_1234567890",
    "razorpay_order_id": "order_123",
    "razorpay_signature": "signature..."
  }
}
```

### Payment Retry

**Lambda Function**: `src/functions/payment/retry-payment.ts`
**Endpoint**: `POST /payments/retry`

```http
POST /payments/retry
Authorization: Bearer {token}
Content-Type: application/json

{
  "paymentId": "pay_1234567890",
  "reason": "payment_failed"
}
```

### Process Refund

**Lambda Function**: `src/functions/payment/process-refund.ts`
**Endpoint**: `POST /payments/refund`

```http
POST /payments/refund
Authorization: Bearer {token}
Content-Type: application/json

{
  "paymentId": "pay_1234567890",
  "amount": 250,
  "reason": "customer_request"
}
```

### Get Payment Status

**Lambda Function**: `src/functions/payment/get-payment-status.ts`
**Endpoint**: `GET /payments/{paymentId}/status`

```http
GET /payments/{paymentId}/status
Authorization: Bearer {token}
```

### Payment Analytics

**Lambda Function**: `src/functions/payment/payment-analytics.ts`
**Endpoint**: `GET /payments/analytics`
**Required Role**: Admin only

```http
GET /payments/analytics?period=30d&schoolId=school_123
Authorization: Bearer {admin_token}
```

### Subscription Payment

**Lambda Function**: `src/functions/payment/subscription-payment.ts`
**Endpoint**: `POST /payments/subscription`

```http
POST /payments/subscription
Authorization: Bearer {token}
Content-Type: application/json

{
  "subscriptionId": "sub_123",
  "amount": 500,
  "billingCycle": "monthly"
}
```

### Invoice Generation

**Lambda Function**: `src/functions/payment/invoice-generation.ts`
**Endpoint**: `POST /payments/invoice`

```http
POST /payments/invoice
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderId": "order_123",
  "customerDetails": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Webhook Handler

**Lambda Function**: `src/functions/payment/webhook-handler.ts`
**Endpoint**: `POST /payments/webhook`
**Note**: No JWT authentication required - uses signature verification

```http
POST /payments/webhook
Content-Type: application/json
X-Razorpay-Signature: {signature}

{
  "event": "payment.captured",
  "payment": {
    "id": "pay_1234567890",
    "amount": 25000
  }
}
```

---

## Analytics & Reporting APIs

### Get Dashboard Metrics

**Lambda Function**: `hasivu-platform-api-analytics`
**Environment Variable**: `LAMBDA_ANALYTICS_DASHBOARD_URL`

```http
GET {LAMBDA_ANALYTICS_DASHBOARD_URL}?period=TODAY&schoolId=school_123
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "data": {
    "overview": {
      "totalStudents": 1250,
      "activeStudents": 987,
      "todayOrders": 456,
      "revenue": {
        "today": 45600,
        "thisWeek": 234500,
        "thisMonth": 987650
      }
    },
    "orderStatistics": {
      "pending": 12,
      "preparing": 45,
      "ready": 23,
      "delivered": 376,
      "cancelled": 8
    },
    "popularItems": [
      {
        "itemId": "item_456",
        "name": "Vegetable Biryani",
        "ordersCount": 89,
        "revenue": 7120
      }
    ],
    "nutritionalCompliance": {
      "score": 94,
      "issues": 2,
      "recommendations": 5
    },
    "kitchenPerformance": {
      "avgPrepTime": 16.5,
      "onTimeDelivery": 94.2,
      "qualityScore": 4.6
    }
  }
}
```

### Real-time Benchmarking

**Lambda Function**: `src/functions/analytics/real-time-benchmarking.ts`
**Endpoint**: `GET /analytics/benchmarking/realtime`

```http
GET /analytics/benchmarking/realtime?schoolId=school_123
Authorization: Bearer {admin_token}
```

### Executive Dashboard Engine

**Lambda Function**: `src/functions/analytics/executive-dashboard-engine.ts`
**Endpoint**: `GET /analytics/dashboard/executive`

```http
GET /analytics/dashboard/executive?period=quarterly
Authorization: Bearer {admin_token}
```

### Revenue Optimization Analyzer

**Lambda Function**: `src/functions/analytics/revenue-optimization-analyzer.ts`
**Endpoint**: `GET /analytics/revenue/optimization`

```http
GET /analytics/revenue/optimization?schoolId=school_123
Authorization: Bearer {admin_token}
```

### Federated Learning Engine

**Lambda Function**: `src/functions/analytics/federated-learning-engine.ts`
**Endpoint**: `POST /analytics/federated-learning/train`

```http
POST /analytics/federated-learning/train
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "modelType": "demand_prediction",
  "schools": ["school_123", "school_456"],
  "privacyLevel": "high"
}
```

### Strategic Insights Generator

**Lambda Function**: `src/functions/analytics/strategic-insights-generator.ts`
**Endpoint**: `GET /analytics/insights/strategic`

```http
GET /analytics/insights/strategic?category=trends
Authorization: Bearer {admin_token}
```

### Payments Dashboard

**Lambda Function**: `src/functions/analytics/payments-dashboard.ts`
**Endpoint**: `GET /analytics/dashboard/payments`

```http
GET /analytics/dashboard/payments?period=monthly
Authorization: Bearer {admin_token}
```

### Performance Benchmarking

**Lambda Function**: `src/functions/analytics/performance-benchmarking.ts`
**Endpoint**: `GET /analytics/benchmarking/performance`

```http
GET /analytics/benchmarking/performance?metric=throughput
Authorization: Bearer {admin_token}
```

### Cross-school Analytics

**Lambda Function**: `src/functions/analytics/cross-school-analytics.ts`
**Endpoint**: `GET /analytics/cross-school`

```http
GET /analytics/cross-school?metric=nutrition_compliance
Authorization: Bearer {admin_token}
```

### Business Intelligence Aggregator

**Lambda Function**: `src/functions/analytics/business-intelligence-aggregator.ts`
**Endpoint**: `GET /analytics/bi/aggregate`

```http
GET /analytics/bi/aggregate?reportType=weekly_summary
Authorization: Bearer {admin_token}
```

### Predictive Insights Engine

**Lambda Function**: `src/functions/analytics/predictive-insights-engine.ts`
**Endpoint**: `GET /analytics/predictive/insights`

```http
GET /analytics/predictive/insights?predictionType=demand
Authorization: Bearer {admin_token}
```

---

## Enterprise & Multi-Tenant APIs

### Tenant Manager

**Lambda Function**: `src/functions/enterprise/tenant-manager.ts`
**Endpoint**: `POST /enterprise/tenants`

```http
POST /enterprise/tenants
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "name": "ABC Schools Group",
  "domain": "abc-schools.edu.in",
  "subscriptionPlan": "enterprise",
  "maxSchools": 50
}
```

### District Admin

**Lambda Function**: `src/functions/enterprise/district-admin.ts`
**Endpoint**: `GET /enterprise/districts/{districtId}/admin`

```http
GET /enterprise/districts/{districtId}/admin
Authorization: Bearer {district_admin_token}
```

### Multi-school Orchestrator

**Lambda Function**: `src/functions/enterprise/multi-school-orchestrator.ts`
**Endpoint**: `POST /enterprise/orchestrator/deploy`

```http
POST /enterprise/orchestrator/deploy
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "schools": ["school_123", "school_456"],
  "action": "update_menu",
  "parameters": {
    "menuVersion": "2.1"
  }
}
```

### School Hierarchy Manager

**Lambda Function**: `src/functions/enterprise/school-hierarchy-manager.ts`
**Endpoint**: `GET /enterprise/hierarchy`

```http
GET /enterprise/hierarchy
Authorization: Bearer {admin_token}
```

### Enterprise Billing Consolidation

**Lambda Function**: `src/functions/enterprise/enterprise-billing-consolidation.ts`
**Endpoint**: `GET /enterprise/billing/consolidated`

```http
GET /enterprise/billing/consolidated?period=monthly
Authorization: Bearer {super_admin_token}
```

### Cross-school Analytics (Enterprise)

**Lambda Function**: `src/functions/enterprise/cross-school-analytics.ts`
**Endpoint**: `GET /enterprise/analytics/cross-school`

```http
GET /enterprise/analytics/cross-school?metric=performance
Authorization: Bearer {super_admin_token}
```

---

## Nutrition & Compliance APIs

### Nutritional Trend Analyzer

**Lambda Function**: `src/functions/nutrition/nutritional-trend-analyzer.ts`
**Endpoint**: `GET /nutrition/trends`

```http
GET /nutrition/trends?schoolId=school_123&period=30d
Authorization: Bearer {nutritionist_token}
```

### Nutrition Compliance Checker

**Lambda Function**: `src/functions/nutrition/nutrition-compliance-checker.ts`
**Endpoint**: `POST /nutrition/compliance/check`

```http
POST /nutrition/compliance/check
Authorization: Bearer {nutritionist_token}
Content-Type: application/json

{
  "menuItems": ["item_123", "item_456"],
  "schoolId": "school_123",
  "standards": ["FSSAI", "ICMR"]
}
```

### Dietary Recommendation Engine

**Lambda Function**: `src/functions/nutrition/dietary-recommendation-engine.ts`
**Endpoint**: `GET /nutrition/recommendations`

```http
GET /nutrition/recommendations?studentId=student_123&restrictions=vegetarian
Authorization: Bearer {nutritionist_token}
```

### Meal Planner AI

**Lambda Function**: `src/functions/nutrition/meal-planner-ai.ts`
**Endpoint**: `POST /nutrition/meal-planner/plan`

```http
POST /nutrition/meal-planner/plan
Authorization: Bearer {nutritionist_token}
Content-Type: application/json

{
  "schoolId": "school_123",
  "grade": "8",
  "mealType": "lunch",
  "constraints": {
    "calories": { "min": 400, "max": 600 },
    "protein": { "min": 15 },
    "vegetarian": true
  }
}
```

### Meal Optimization AI

**Lambda Function**: `src/functions/nutrition/meal-optimization-ai.ts`
**Endpoint**: `POST /nutrition/meal-optimization/optimize`

```http
POST /nutrition/meal-optimization/optimize
Authorization: Bearer {nutritionist_token}
Content-Type: application/json

{
  "currentMenu": ["item_123", "item_456"],
  "optimizationGoal": "cost_reduction",
  "constraints": {
    "budget": 1000,
    "nutritionTargets": { "protein": 20 }
  }
}
```

### Nutrition Analyzer

**Lambda Function**: `src/functions/nutrition/nutrition-analyzer.ts`
**Endpoint**: `POST /nutrition/analyzer/analyze`

```http
POST /nutrition/analyzer/analyze
Authorization: Bearer {nutritionist_token}
Content-Type: application/json

{
  "ingredients": [
    { "name": "Rice", "quantity": "100g" },
    { "name": "Dal", "quantity": "50g" }
  ],
  "analysisType": "nutritional_breakdown"
}
```

---

## Notification & Communication APIs

### Parent Notifications

**Lambda Function**: `src/functions/mobile/parent-notifications.ts`
**Endpoint**: `POST /notifications/parent`

```http
POST /notifications/parent
Authorization: Bearer {teacher_token}
Content-Type: application/json

{
  "studentId": "student_123",
  "type": "order_ready",
  "message": "Your child's order is ready for pickup",
  "channels": ["push", "sms"]
}
```

### Device Registration

**Lambda Function**: `src/functions/mobile/device-registration.ts`
**Endpoint**: `POST /mobile/devices/register`

```http
POST /mobile/devices/register
Authorization: Bearer {token}
Content-Type: application/json

{
  "deviceId": "device_123",
  "platform": "ios",
  "pushToken": "push_token_here",
  "userId": "user_123"
}
```

### Delivery Tracking

**Lambda Function**: `src/functions/mobile/delivery-tracking.ts`
**Endpoint**: `GET /mobile/delivery/{orderId}/track`

```http
GET /mobile/delivery/{orderId}/track
Authorization: Bearer {token}
```

---

## Mobile & Device APIs

### Mobile Card Management

**Lambda Function**: `src/functions/rfid/mobile-card-management.ts`
**Endpoint**: `POST /mobile/cards/manage`

```http
POST /mobile/cards/manage
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "block",
  "cardId": "card_123",
  "reason": "lost_card"
}
```

### Mobile Tracking

**Lambda Function**: `src/functions/rfid/mobile-tracking.ts`
**Endpoint**: `GET /mobile/tracking/{cardId}`

```http
GET /mobile/tracking/{cardId}
Authorization: Bearer {token}
```

---

## Template & Personalization APIs

### Behavioral Analytics

**Lambda Function**: `src/functions/templates/behavioral-analytics.ts`
**Endpoint**: `GET /templates/analytics/behavioral`

```http
GET /templates/analytics/behavioral?userId=user_123
Authorization: Bearer {admin_token}
```

### Recommendation Engine

**Lambda Function**: `src/functions/templates/recommendation-engine.ts`
**Endpoint**: `GET /templates/recommendations`

```http
GET /templates/recommendations?userId=user_123&context=menu_browsing
Authorization: Bearer {token}
```

### Cultural Adapter

**Lambda Function**: `src/functions/templates/cultural-adapter.ts`
**Endpoint**: `POST /templates/cultural/adapt`

```http
POST /templates/cultural/adapt
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "content": "Menu description",
  "targetCulture": "regional_indian",
  "region": "south_india"
}
```

### Content Generator

**Lambda Function**: `src/functions/templates/content-generator.ts`
**Endpoint**: `POST /templates/content/generate`

```http
POST /templates/content/generate
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "type": "menu_description",
  "ingredients": ["rice", "vegetables", "spices"],
  "style": "appealing"
}
```

### AI Personalization

**Lambda Function**: `src/functions/templates/ai-personalization.ts`
**Endpoint**: `POST /templates/personalization/train`

```http
POST /templates/personalization/train
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "userId": "user_123",
  "preferences": ["spicy", "vegetarian"],
  "behaviorData": [...]
}
```

### Template Optimizer

**Lambda Function**: `src/functions/templates/template-optimizer.ts`
**Endpoint**: `POST /templates/optimizer/optimize`

```http
POST /templates/optimizer/optimize
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "templateId": "template_123",
  "optimizationGoal": "engagement",
  "targetAudience": "students"
}
```

---

## Health & Monitoring APIs

### Dashboard

**Lambda Function**: `src/functions/monitoring/dashboard.ts`
**Endpoint**: `GET /monitoring/dashboard`

```http
GET /monitoring/dashboard
Authorization: Bearer {admin_token}
```

### School Onboarding

**Lambda Function**: `src/functions/schools/school-onboarding.ts`
**Endpoint**: `POST /schools/onboard`

```http
POST /schools/onboard
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "name": "New School",
  "address": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra"
  },
  "adminEmail": "admin@school.edu.in"
}
```

---

## Analytics & Reporting APIs

### Get Dashboard Metrics

**Lambda Function**: `hasivu-platform-api-analytics`
**Environment Variable**: `LAMBDA_ANALYTICS_DASHBOARD_URL`

```http
GET {LAMBDA_ANALYTICS_DASHBOARD_URL}?period=TODAY&schoolId=school_123
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "data": {
    "overview": {
      "totalStudents": 1250,
      "activeStudents": 987,
      "todayOrders": 456,
      "revenue": {
        "today": 45600,
        "thisWeek": 234500,
        "thisMonth": 987650
      }
    },
    "orderStatistics": {
      "pending": 12,
      "preparing": 45,
      "ready": 23,
      "delivered": 376,
      "cancelled": 8
    },
    "popularItems": [
      {
        "itemId": "item_456",
        "name": "Vegetable Biryani",
        "ordersCount": 89,
        "revenue": 7120
      }
    ],
    "nutritionalCompliance": {
      "score": 94,
      "issues": 2,
      "recommendations": 5
    },
    "kitchenPerformance": {
      "avgPrepTime": 16.5,
      "onTimeDelivery": 94.2,
      "qualityScore": 4.6
    }
  }
}
```

---

## WebSocket Events

### Connection

```javascript
const socket = io('wss://ws.hasivu.com', {
  auth: {
    token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },
});
```

### Order Status Updates

```javascript
// Subscribe to order updates
socket.emit('subscribe', {
  channel: 'order_updates',
  orderId: 'order_789',
});

// Listen for status changes
socket.on('order_status_changed', data => {
  console.log('Order status updated:', data);
  /*
  {
    orderId: 'order_789',
    oldStatus: 'PREPARING',
    newStatus: 'READY',
    timestamp: '2024-01-15T12:25:00Z',
    estimatedDeliveryTime: '2024-01-15T12:30:00Z',
    message: 'Your order is ready for pickup!'
  }
  */
});
```

---

## Error Handling

### Error Codes

| Code                   | Description                     | HTTP Status |
| ---------------------- | ------------------------------- | ----------- |
| `VALIDATION_ERROR`     | Input validation failed         | 400         |
| `AUTHENTICATION_ERROR` | Invalid or expired token        | 401         |
| `AUTHORIZATION_ERROR`  | Insufficient permissions        | 403         |
| `NOT_FOUND`            | Resource not found              | 404         |
| `CONFLICT`             | Resource conflict               | 409         |
| `RATE_LIMIT_EXCEEDED`  | Too many requests               | 429         |
| `SERVER_ERROR`         | Internal server error           | 500         |
| `SERVICE_UNAVAILABLE`  | Service temporarily unavailable | 503         |

---

## Rate Limiting

### Rate Limits by Lambda Function

| Function         | Limit         | Window   |
| ---------------- | ------------- | -------- |
| Authentication   | 5 requests    | 1 minute |
| Order Creation   | 10 requests   | 1 minute |
| Menu Browsing    | 100 requests  | 1 minute |
| Profile Updates  | 20 requests   | 1 minute |
| RFID Operations  | 1000 requests | 1 minute |
| Admin Operations | 200 requests  | 1 minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1642251600
X-RateLimit-Window: 60
```

---

## Testing Guide

### Lambda Function Testing

Each Lambda function can be tested independently using the AWS Console or CLI:

```bash
# Test authentication function
aws lambda invoke --function-name hasivu-platform-api-auth \
  --payload '{"email":"test@example.com","password":"test123"}' \
  response.json

# Test order creation
aws lambda invoke --function-name hasivu-platform-api-orders \
  --payload '{"schoolId":"school_123","items":[{"itemId":"item_456","quantity":1}]}' \
  response.json
```

### Environment Variables for Testing

```json
{
  "base_url": "https://your-api-gateway-id.execute-api.ap-south-1.amazonaws.com/dev",
  "staging_url": "https://your-api-gateway-id.execute-api.ap-south-1.amazonaws.com/staging",
  "production_url": "https://your-api-gateway-id.execute-api.ap-south-1.amazonaws.com/production",
  "access_token": "{{access_token}}",
  "refresh_token": "{{refresh_token}}",
  "school_id": "school_123",
  "user_id": "user_123"
}
```

---

## SDK & Integration Examples

### JavaScript/TypeScript SDK

#### Installation

```bash
npm install @hasivu/lambda-sdk
```

#### Basic Usage

```typescript
import { HasivuLambdaAPI } from '@hasivu/lambda-sdk';

const client = new HasivuLambdaAPI({
  authUrl: process.env.LAMBDA_AUTH_LOGIN_URL,
  ordersUrl: process.env.LAMBDA_ORDERS_CREATE_URL,
  menusUrl: process.env.LAMBDA_MENUS_DAILY_URL,
  environment: 'production',
});

// Login
const auth = await client.auth.login({
  email: 'student@school.edu.in',
  password: 'password',
  schoolId: 'school_123',
});

// Get menu
const menu = await client.menus.getDailyMenu('school_123', {
  date: '2024-01-15',
  mealType: 'LUNCH',
});

// Place order
const order = await client.orders.create({
  schoolId: 'school_123',
  items: [
    {
      itemId: 'item_456',
      quantity: 1,
    },
  ],
  paymentMethod: 'WALLET',
});
```

---

## Support & Resources

### Developer Portal

- **Documentation**: https://developers.hasivu.edu.in
- **API Explorer**: https://api-explorer.hasivu.edu.in
- **Lambda Console**: https://console.aws.amazon.com/lambda/home
- **Status Page**: https://status.hasivu.edu.in

### Support Channels

- **Technical Support**: tech-support@hasivu.edu.in
- **API Issues**: api-support@hasivu.edu.in
- **Lambda Integration**: lambda-support@hasivu.edu.in
- **Emergency**: +91-22-1234-5678

### Lambda Function Limits

- **Execution Time**: 30 seconds (can be increased to 15 minutes)
- **Memory**: 128 MB to 3008 MB
- **Concurrent Executions**: 1000 per region (configurable)
- **Payload Size**: 6 MB (synchronous), 256 KB (asynchronous)

### Cost Optimization

- **Provisioned Concurrency**: Reduce cold start latency
- **Memory Allocation**: Right-size for cost efficiency
- **Request Batching**: Reduce Lambda invocations
- **Caching**: Use API Gateway caching

---

**🎉 This comprehensive API documentation ensures developers can integrate with HASIVU's serverless Lambda-based platform efficiently and effectively, supporting our 10/10 production readiness goal!**
