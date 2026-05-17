# Checkout Implementation - Quick Reference Card

## 🚀 Quick Start

### Files Created

```
web/src/app/(parent)/checkout/page.tsx
web/src/app/(parent)/orders/[orderId]/confirmation/page.tsx
```

### Prerequisites

```bash
# Environment Variables
NEXT_PUBLIC_API_URL=https://api.hasivu.com
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx

# Dependencies (already installed)
- react-hook-form
- @hookform/resolvers
- zod
- axios
```

---

## 📋 Checkout Page Components

### 1. Cart Summary (Right Column)

```typescript
// Displays from CartContext
- Subtotal: ₹{cart.subtotal}
- Tax (5%): ₹{cart.tax}
- Delivery: ₹{cart.deliveryFee}
- Total: ₹{cart.total}
```

### 2. Student Selection (Multi-child)

```typescript
// Auto-selects if single child
// Shows dropdown for multiple children
<Select onValueChange={(value) => setValue('studentId', value)}>
```

### 3. Contact Form

```typescript
// Required fields
- studentId: string (required)
- contactPhone: string (required, validated)

// Optional fields
- deliveryInstructions: string
- allergyInfo: string
```

### 4. Order Items Display

```typescript
// Shows each cart item with:
- Item name & emoji
- Quantity badge
- Delivery date badge
- Special instructions
- Price (unit & total)
```

---

## 🔐 Payment Flow (3 Simple Steps)

### Step 1: Create Order

```typescript
const order = await orderAPIService.createOrder({
  studentId,
  deliveryDate,
  orderItems: cart.items.map(...),
  deliveryInstructions,
  contactPhone,
  allergyInfo,
});
```

### Step 2: Process Payment

```typescript
const result = await paymentAPIService.processPayment(
  order.id,
  cart.total * 100, // Convert to paisa
  {
    name: userProfile?.name,
    email: userProfile?.email,
    phone: contactPhone,
  }
);
```

### Step 3: Handle Success

```typescript
if (result.success) {
  clearCart();
  router.push(`/orders/${order.id}/confirmation`);
}
```

---

## 🎯 Payment States

```typescript
enum PaymentState {
  IDLE                  // Ready for checkout
  LOADING_SCRIPT        // Loading Razorpay SDK
  CREATING_ORDER        // Creating order
  PROCESSING_PAYMENT    // Razorpay modal open
  VERIFYING            // Verifying payment
  SUCCESS              // Complete
  ERROR                // Error occurred
}
```

---

## 🛡️ Form Validation (Zod)

```typescript
const checkoutFormSchema = z.object({
  studentId: z.string().min(1, 'Please select a student'),

  contactPhone: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .regex(/^[0-9+\-\s()]+$/, 'Invalid phone format'),

  deliveryInstructions: z.string().optional(),
  allergyInfo: z.string().optional(),
});
```

---

## ❌ Error Handling

### Common Errors

```typescript
// Payment cancelled
'Payment was cancelled. You can try again.';

// Payment failed
'Payment failed. Please check your payment details.';

// Order creation failed
'Failed to create order. Please try again.';

// Razorpay not loaded
'Payment gateway not ready. Please refresh.';
```

### Error Recovery

- Form data preserved on error
- Cart items remain intact
- User can retry immediately
- Clear error messages displayed

---

## 📱 Confirmation Page Features

### Order Information Display

```typescript
- Order number & status
- Student details
- School information
- Delivery date
- Contact phone
- Delivery instructions
- Allergy information
```

### Order Items & Payment

```typescript
- Item list with quantities
- Price breakdown
- Payment summary
- Total amount paid
```

### Action Buttons

```typescript
- Download Receipt (Print)
- Share Order (Native share)
- Track Order (Navigate to tracking)
- View All Orders (Orders list)
- Back to Menu (Menu page)
```

### Next Steps Guide

```typescript
1. Order confirmation email
2. Kitchen preparation
3. Delivery on scheduled date
4. Tracking updates
```

---

## 🧪 Testing with Razorpay Test Cards

### Success Flow

```
Card: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date
Name: Any name
```

### Failure Flow

```
Card: 4000 0000 0000 0002
CVV: Any 3 digits
Expiry: Any future date
Name: Any name
```

---

## 🔧 API Endpoints Used

### Order Management

```
POST   /orders                    Create new order
GET    /orders/:orderId           Get order details
PUT    /orders/:orderId/status    Update order status
GET    /orders/:orderId/track     Track order
```

### Payment Processing

```
POST   /payments/orders           Create Razorpay order
POST   /payments/verify           Verify payment signature
GET    /payments/orders/:orderId/status   Get payment status
```

---

## 🎨 UI Components Used

```typescript
// shadcn/ui components
- Button (with loading state)
- Card, CardHeader, CardTitle, CardContent, CardFooter
- Input (with error handling)
- Label
- Textarea
- Select, SelectTrigger, SelectContent, SelectItem
- Alert, AlertTitle, AlertDescription
- Badge
- Separator
- Skeleton (loading states)

// Lucide icons
- ShoppingCart, User, Phone, MapPin
- Calendar, CreditCard, Loader2
- CheckCircle2, AlertCircle, Trash2
- Download, Share2, Home, ArrowRight
```

---

## 💡 Key Features

### Progressive Enhancement

- ✅ Loading states for all async operations
- ✅ Progress messages during checkout
- ✅ Skeleton loaders on page load
- ✅ Disabled states during processing
- ✅ Success/error alerts

### Accessibility (WCAG 2.1 AA)

- ✅ Keyboard navigation support
- ✅ Screen reader announcements
- ✅ ARIA labels and descriptions
- ✅ Focus indicators
- ✅ Error announcements (aria-live)
- ✅ Required field indicators

### Mobile Responsiveness

- ✅ Touch-friendly tap targets (44x44px)
- ✅ Responsive grid layout
- ✅ Mobile-first design
- ✅ Sticky order summary (desktop)
- ✅ Optimized font sizes (prevents zoom)

### Security

- ✅ HTTPS only
- ✅ PCI compliant (via Razorpay)
- ✅ Signature verification
- ✅ Token authentication
- ✅ Input validation (client + server)
- ✅ XSS protection
- ✅ No card data storage

---

## 🐛 Common Issues & Solutions

### Issue: Razorpay SDK not loading

**Solution**: Check `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set correctly

### Issue: Payment not processing

**Solution**: Verify Razorpay test mode is enabled and key is correct

### Issue: Order not created

**Solution**: Check API endpoint `/orders` is accessible and payload format

### Issue: Cart not clearing after payment

**Solution**: Ensure `clearCart()` is called in success handler

### Issue: Signature verification fails

**Solution**: Check backend HMAC signature calculation matches Razorpay docs

---

## 📊 Performance Targets

```
Page Load Time:      < 2s on 3G
Time to Interactive: < 3s
First Contentful Paint: < 1.5s
Largest Contentful Paint: < 2.5s
Cumulative Layout Shift: < 0.1
```

---

## 🔗 Important Links

### Code Files

- Checkout Page: `web/src/app/(parent)/checkout/page.tsx`
- Confirmation: `web/src/app/(parent)/orders/[orderId]/confirmation/page.tsx`
- Payment Service: `web/src/services/payment-api.service.ts`
- Order Service: `web/src/services/order-api.service.ts`
- Cart Context: `web/src/contexts/CartContext.tsx`

### Type Definitions

- Order Types: `web/src/types/order.ts`
- Cart Types: `web/src/types/cart.ts`

### Documentation

- Full Implementation: `web/CHECKOUT_IMPLEMENTATION_SUMMARY.md`
- Payment Flow: `web/PAYMENT_FLOW_DIAGRAM.md`
- This Quick Reference: `web/CHECKOUT_QUICK_REFERENCE.md`

### External Resources

- [Razorpay Checkout Docs](https://razorpay.com/docs/payments/payment-gateway/web-integration/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)

---

## ✅ Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] Razorpay test keys working
- [ ] API endpoints accessible
- [ ] Cart integration tested
- [ ] Form validation working
- [ ] Payment flow tested (success)
- [ ] Payment flow tested (failure)
- [ ] Payment flow tested (cancellation)
- [ ] Order creation verified
- [ ] Confirmation page working
- [ ] Mobile responsive tested
- [ ] Accessibility tested
- [ ] Error handling verified
- [ ] Loading states working
- [ ] Cart clearing on success

---

## 🎓 Developer Tips

### Debug Payment Issues

```typescript
// Enable debug logging
const DEBUG = process.env.NODE_ENV === 'development';
if (DEBUG) {
  console.log('Payment State:', paymentState);
  console.log('Cart Total:', cart.total);
  console.log('Order Created:', order);
}
```

### Test Different Scenarios

```bash
# Test with single child
# Test with multiple children
# Test with empty cart (should redirect)
# Test form validation errors
# Test payment cancellation
# Test payment failure
# Test network errors
```

### Monitor Performance

```typescript
// Add performance monitoring
performance.mark('checkout-start');
// ... checkout code ...
performance.mark('checkout-end');
performance.measure('checkout', 'checkout-start', 'checkout-end');
```

---

## 🚦 Status Indicators

### Payment State Colors

```css
IDLE: gray-500
LOADING_SCRIPT: blue-500
CREATING_ORDER: yellow-500
PROCESSING_PAYMENT: orange-500
VERIFYING: purple-500
SUCCESS: green-500
ERROR: red-500
```

### Badge Variants

```typescript
completed: default (green)
processing: secondary (blue)
pending: outline (gray)
failed: destructive (red)
refunded: secondary (blue)
```

---

## 📞 Support

For implementation questions:

1. Check code comments in page.tsx
2. Review CHECKOUT_IMPLEMENTATION_SUMMARY.md
3. See PAYMENT_FLOW_DIAGRAM.md
4. Check type definitions
5. Review API service documentation

---

**Last Updated**: 2025-01-19
**Version**: 1.0.0
**Status**: Ready for Testing
