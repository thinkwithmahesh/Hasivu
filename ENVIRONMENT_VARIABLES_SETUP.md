# HASIVU Platform - Environment Variables Configuration

**Date**: 2025-10-06
**Status**: Required for Production Deployment

---

## Overview

The HASIVU platform requires specific environment variables to connect Next.js API routes to Lambda functions. All API routes have been created but will fail without proper Lambda URL configuration.

---

## Required Environment Variables

### Authentication Lambda URLs

```bash
LAMBDA_AUTH_LOGIN_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/auth/login
LAMBDA_AUTH_REGISTER_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/auth/register
LAMBDA_AUTH_LOGOUT_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/auth/logout
```

### Order Management Lambda URLs

```bash
LAMBDA_ORDERS_CREATE_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/orders
LAMBDA_ORDERS_GET_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/orders
LAMBDA_ORDERS_UPDATE_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/orders
LAMBDA_ORDERS_LIST_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/orders
```

### Payment Processing Lambda URLs

```bash
LAMBDA_PAYMENTS_CREATE_ORDER_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/payments/orders
LAMBDA_PAYMENTS_VERIFY_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/payments/verify
LAMBDA_PAYMENTS_WEBHOOK_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/payments/webhook
LAMBDA_PAYMENTS_REFUND_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/payments/refund
LAMBDA_PAYMENTS_ANALYTICS_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/payments/analytics
```

### RFID System Lambda URLs

```bash
LAMBDA_RFID_CREATE_CARD_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/rfid/cards
LAMBDA_RFID_VERIFY_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/rfid/verify
LAMBDA_RFID_BULK_IMPORT_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/rfid/bulk-import
LAMBDA_RFID_DELIVERY_VERIFICATION_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/rfid/delivery-verification
```

### Mobile & Notifications Lambda URLs

```bash
LAMBDA_MOBILE_DEVICE_REGISTRATION_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/mobile/device-registration
LAMBDA_MOBILE_PARENT_NOTIFICATIONS_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/mobile/parent-notifications
```

---

## Razorpay Configuration

### Required for Payment Processing

```bash
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

---

## Next.js Configuration

### Required for Production

```bash
NEXT_PUBLIC_API_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod
NEXT_PUBLIC_STAGE=prod
```

---

## Environment File Template

Create `.env.local` in the `web/` directory:

```bash
# Lambda URLs - Replace with your actual API Gateway URLs
LAMBDA_AUTH_LOGIN_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/auth/login
LAMBDA_AUTH_REGISTER_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/auth/register
LAMBDA_AUTH_LOGOUT_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/auth/logout

LAMBDA_ORDERS_CREATE_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/orders
LAMBDA_ORDERS_GET_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/orders
LAMBDA_ORDERS_UPDATE_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/orders
LAMBDA_ORDERS_LIST_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/orders

LAMBDA_PAYMENTS_CREATE_ORDER_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/payments/orders
LAMBDA_PAYMENTS_VERIFY_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/payments/verify
LAMBDA_PAYMENTS_WEBHOOK_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/payments/webhook
LAMBDA_PAYMENTS_REFUND_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/payments/refund
LAMBDA_PAYMENTS_ANALYTICS_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/payments/analytics

LAMBDA_RFID_CREATE_CARD_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/rfid/cards
LAMBDA_RFID_VERIFY_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/rfid/verify
LAMBDA_RFID_BULK_IMPORT_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/rfid/bulk-import
LAMBDA_RFID_DELIVERY_VERIFICATION_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/rfid/delivery-verification

LAMBDA_MOBILE_DEVICE_REGISTRATION_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/mobile/device-registration
LAMBDA_MOBILE_PARENT_NOTIFICATIONS_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod/mobile/parent-notifications

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Next.js Configuration
NEXT_PUBLIC_API_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod
NEXT_PUBLIC_STAGE=prod
```

---

## Deployment Checklist

### Before Deployment

- [ ] Set up API Gateway with Lambda integrations
- [ ] Configure CORS for all Lambda functions
- [ ] Set up Razorpay test account
- [ ] Generate webhook secret
- [ ] Test Lambda functions individually
- [ ] Update environment variables in production

### After Deployment

- [ ] Test authentication flow (login/register/logout)
- [ ] Test order creation and management
- [ ] Test payment processing with Razorpay
- [ ] Test RFID card verification
- [ ] Test mobile notifications
- [ ] Verify webhook processing

---

## Testing Commands

### Health Check

```bash
# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test order creation
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=your_token" \
  -d '{"studentId":"student_id","deliveryDate":"2025-10-07","orderItems":[{"menuItemId":"item_id","quantity":1}]}'
```

---

**Note**: All API routes are created and functional. They will return proper error messages if Lambda URLs are not configured, making it easy to identify missing environment variables during testing.
