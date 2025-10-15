# Payment System - Quick Reference Guide

## File Locations

### Payment Functions

```
/Users/mahesha/Downloads/hasivu-platform/src/functions/payment/
├── create-payment-order.ts      # Create Razorpay order
├── verify-payment.ts            # Verify signature & update status
├── webhook-handler.ts           # Process Razorpay webhooks (ENHANCED)
├── process-refund.ts            # Full/partial refunds
├── get-payment-status.ts        # Query payment status
├── retry-payment.ts             # Retry failed payments (NEW)
├── subscription-payment.ts      # Subscription billing (NEW)
├── invoice-generation.ts        # GST invoices (NEW)
├── payment-analytics.ts         # Payment metrics
└── manage-payment-methods.ts    # Card/UPI/wallet management
```

### Shared Services

```
/Users/mahesha/Downloads/hasivu-platform/src/functions/shared/
└── razorpay.service.ts          # Razorpay SDK wrapper
```

### Tests

```
/Users/mahesha/Downloads/hasivu-platform/tests/unit/functions/payment/
└── webhook-handler-enhanced.test.ts  # 13 comprehensive tests
```

---

## Quick Command Reference

### Run Tests

```bash
cd /Users/mahesha/Downloads/hasivu-platform
npm test -- tests/unit/functions/payment/webhook-handler-enhanced.test.ts
```

### Check TypeScript Compilation

```bash
npx tsc --noEmit src/functions/payment/*.ts
```

### Run Database Migrations

```bash
npx prisma migrate deploy
```

### Generate Prisma Client

```bash
npx prisma generate
```

---

## Environment Variables

```bash
# Required for all payment functions
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx

# Database
DATABASE_URL="file:./dev.db"
```

---

## API Endpoints

| Endpoint                 | Method              | Description                 |
| ------------------------ | ------------------- | --------------------------- |
| `/payments/orders`       | POST                | Create payment order        |
| `/payments/verify`       | POST                | Verify payment signature    |
| `/payments/webhook`      | POST                | Razorpay webhook (no auth)  |
| `/payments/refund`       | POST                | Process refund              |
| `/payments/status/{id}`  | GET                 | Get payment status          |
| `/payments/retry/{id}`   | POST                | Retry failed payment        |
| `/payments/subscription` | POST                | Create subscription payment |
| `/payments/invoice/{id}` | POST                | Generate invoice            |
| `/payments/analytics`    | GET                 | Payment analytics           |
| `/payments/methods`      | GET/POST/PUT/DELETE | Manage payment methods      |

---

## Common Request Examples

### 1. Create Payment Order

```typescript
POST /payments/orders
{
  "orderId": "order_123",
  "amount": 500,        // Optional override
  "currency": "INR"     // Optional override
}
```

### 2. Verify Payment

```typescript
POST /payments/verify
{
  "razorpayOrderId": "order_xyz",
  "razorpayPaymentId": "pay_xyz",
  "razorpaySignature": "signature_xyz"
}
```

### 3. Process Refund

```typescript
POST /payments/refund
{
  "paymentId": "payment_123",
  "amount": 500,        // Optional partial refund
  "reason": "Customer request",
  "notes": "Additional notes"
}
```

### 4. Retry Payment

```typescript
POST /payments/retry/{paymentId}
{
  "paymentMethodId": "pm_123",  // Optional new method
  "retryReason": "Network issue"
}
```

### 5. Subscription Payment

```typescript
POST /payments/subscription
{
  "subscriptionId": "sub_123",
  "billingCycleId": "cycle_123"  // Optional
}
```

### 6. Generate Invoice

```typescript
POST / payments / invoice / { paymentId };
{
} // No body required
```

---

## Database Schema Quick Reference

### Key Models

```typescript
PaymentOrder {
  id: string
  razorpayOrderId: string (unique)
  amount: int
  currency: string
  status: string
  userId: string
  orderId: string?
  subscriptionId: string?
}

PaymentTransaction {
  id: string
  razorpayPaymentId: string (unique)
  paymentOrderId: string
  amount: int
  status: string
  method: string
  capturedAt: DateTime?
  refundedAt: DateTime?
}

PaymentRefund {
  id: string
  razorpayRefundId: string (unique)
  paymentId: string
  amount: int
  status: string
  reason: string
}

Invoice {
  id: string
  invoiceNumber: string (unique)
  userId: string
  schoolId: string
  paymentId: string?
  subtotal: float
  taxAmount: float
  totalAmount: float
  status: string
}
```

---

## Security Checklist

### Before Deployment

- [ ] Environment variables configured
- [ ] Webhook secret matches Razorpay dashboard
- [ ] HTTPS enforced on all endpoints
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Monitoring setup
- [ ] Backup procedures tested

### Webhook Security

- [x] Signature verification implemented
- [x] Replay attack protection added
- [x] Comprehensive logging enabled
- [x] Error handling complete
- [ ] Distributed cache for production

---

## Common Issues & Solutions

### Issue: "Invalid webhook signature"

**Solution**: Verify `RAZORPAY_WEBHOOK_SECRET` matches Razorpay dashboard

### Issue: "Payment not found"

**Solution**: Ensure payment order was created before verification

### Issue: "Cannot retry payment"

**Solution**: Check payment status is 'failed' and not already refunded

### Issue: "Subscription not found"

**Solution**: Verify subscription is active and billing cycle is due

### Issue: "Invoice already exists"

**Solution**: This is expected behavior - invoice is idempotent

---

## Performance Tips

1. **Use connection pooling**: Prisma handles this automatically
2. **Enable caching**: Implement Redis for webhook replay protection
3. **Batch operations**: Use `updateMany` instead of multiple `update` calls
4. **Index properly**: All foreign keys are indexed in schema
5. **Monitor Lambda cold starts**: Consider provisioned concurrency for critical functions

---

## Monitoring Metrics

### Key Metrics to Track

- Payment success rate (target: >99%)
- Average response time (target: <500ms)
- Webhook processing time (target: <1s)
- Failed payment count (alert threshold: >10/hour)
- Refund processing time (target: <2s)

### CloudWatch Alarms

```
- Payment failure rate > 1%
- Webhook signature failures > 5/minute
- Lambda errors > 10/hour
- Database connection failures
- Razorpay API timeout rate > 5%
```

---

## Testing Checklist

### Unit Tests

- [x] Webhook signature verification
- [x] Replay attack protection
- [x] Payment captured events
- [x] Payment failed events
- [x] Refund creation
- [ ] Invoice generation (TODO)
- [ ] Subscription payment (TODO)
- [ ] Payment retry logic (TODO)

### Integration Tests

- [ ] End-to-end payment flow
- [ ] Subscription billing cycle
- [ ] Refund processing
- [ ] Invoice generation with PDF
- [ ] Payment method management

### Load Tests

- [ ] 100 concurrent payment creations
- [ ] 1000 webhook events/minute
- [ ] 50 simultaneous refund requests

---

## Troubleshooting Commands

### Check Payment Status

```bash
# Via API
curl -X GET https://api.hasivu.com/payments/status/{paymentId} \
  -H "Authorization: Bearer {token}"

# Via Database
npx prisma studio
# Navigate to PaymentTransaction table
```

### View Audit Logs

```bash
# Query audit logs for payment events
npx prisma studio
# Navigate to AuditLog table
# Filter by entityType = 'PaymentTransaction'
```

### Test Webhook Locally

```bash
# Generate test signature
node -e "
const crypto = require('crypto');
const body = JSON.stringify({ event: 'payment.captured', id: 'test_123' });
const signature = crypto.createHmac('sha256', 'webhook_secret').update(body).digest('hex');
console.log(signature);
"

# Send test webhook
curl -X POST http://localhost:3000/payments/webhook \
  -H "X-Razorpay-Signature: {signature}" \
  -H "Content-Type: application/json" \
  -d '{event:"payment.captured",id:"test_123"}'
```

---

## Support Contacts

### Razorpay Support

- Email: support@razorpay.com
- Phone: +91-80-71189999
- Dashboard: https://dashboard.razorpay.com

### Internal Team

- Backend Lead: [Contact Info]
- DevOps: [Contact Info]
- Security: [Contact Info]

---

## Additional Resources

- [Full Implementation Report](./PAYMENT-SYSTEM-IMPLEMENTATION.md)
- [Razorpay API Documentation](https://razorpay.com/docs/api/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)

---

**Last Updated**: 2025-01-11
**Maintained By**: Backend Team
**Version**: 1.0.0
