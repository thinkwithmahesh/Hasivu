# Parent Order Journey UI Implementation Plan (Wave 2 Phase 2)

**Date**: 2025-10-19
**Status**: Ready to Execute
**Prerequisites**: ✅ Epic 3 Backend Verified Complete (5 Lambda functions operational)

---

## Context from Previous Work

### What We've Completed

**Wave 1**: Multi-tenant authentication service layer (Auth, Tenant, User services)
**Wave 2 Phase 1**: Remaining service layers (Menu, RFID, Analytics services)

**Current Status**: Backend services are complete, but frontend UI components are missing for parent ordering journey.

### Critical Discovery: Epic 3 Backend Already Exists

**User's belief**: Epic 3 at 0%, zero Lambda functions found
**Actual evidence**: 5 Lambda functions with 2,045 lines of code exist in `src/functions/orders/`

**See**: `EPIC_3_VERIFICATION_EVIDENCE.md` for complete evidence

**Implication**: We can now build the UI directly against existing backend APIs.

---

## Wave 2 Phase 2 Objectives

Build the complete parent ordering journey UI with 3 major components:

### 1. MenuBrowser Component
**Purpose**: Browse available meals, view details, filter options
**Integration**: GET /menu/items API endpoint

### 2. ShoppingCart Component
**Purpose**: Manage selected items, quantities, delivery dates
**State Management**: React Context or Zustand for cart state

### 3. Checkout Component
**Purpose**: Review order, payment, confirmation
**Integration**: POST /orders, POST /payments APIs

---

## Component Architecture

### Parent Order Journey Flow

```
┌─────────────────┐
│  MenuBrowser    │ → Browse meals, add to cart
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ShoppingCart   │ → Review items, adjust quantities
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Checkout       │ → Payment, confirmation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Confirmation    │ → Order summary, tracking
└─────────────────┘
```

### Technology Stack

**Frontend Framework**: Next.js 14 with App Router
**UI Components**: Shadcn/ui + Tailwind CSS
**State Management**: React Context API or Zustand
**API Integration**: TanStack Query (React Query) for data fetching
**Form Handling**: React Hook Form + Zod validation
**Payment Integration**: Razorpay SDK

---

## Implementation Plan

### Phase 2.1: MenuBrowser Component (4-6 hours)

**Files to Create**:
- `app/(parent)/menu/page.tsx` - Menu browsing page
- `components/menu/MenuCard.tsx` - Individual menu item card
- `components/menu/MenuFilters.tsx` - Category/dietary filters
- `components/menu/MenuSearch.tsx` - Search functionality
- `lib/api/menu.ts` - API client for menu endpoints
- `hooks/useMenu.ts` - React Query hooks for menu data

**API Endpoints**:
- `GET /menu/items` - List all menu items with filters
- `GET /menu/items/{id}` - Get menu item details
- `GET /menu/categories` - Get available categories

**Features**:
- Meal card display with images, nutrition info, pricing
- Category filtering (breakfast, lunch, snacks, dinner)
- Dietary preferences (vegetarian, vegan, gluten-free, etc.)
- Search by meal name or ingredients
- "Add to Cart" button with quantity selector
- Responsive grid layout

**Success Criteria**:
- [ ] Display all available menu items from backend
- [ ] Filter by category and dietary preferences
- [ ] Search functionality working
- [ ] Add items to cart state
- [ ] Responsive design (mobile, tablet, desktop)

### Phase 2.2: ShoppingCart Component (3-4 hours)

**Files to Create**:
- `components/cart/CartProvider.tsx` - Cart context provider
- `components/cart/CartSidebar.tsx` - Slide-out cart panel
- `components/cart/CartItem.tsx` - Individual cart item
- `components/cart/CartSummary.tsx` - Total calculation
- `lib/cart/cartUtils.ts` - Cart calculation utilities
- `types/cart.ts` - TypeScript interfaces for cart

**Features**:
- Global cart state accessible from any page
- Add/remove items functionality
- Quantity adjustment (+ / - buttons)
- Delivery date selection for each order
- Special instructions per item
- Allergy information input
- Subtotal, tax, delivery fee calculation
- "Proceed to Checkout" button

**Success Criteria**:
- [ ] Persistent cart state across page navigation
- [ ] Accurate total calculation
- [ ] Delivery date validation (min 24h advance notice)
- [ ] Special instructions and allergy info capture
- [ ] Empty cart state handling
- [ ] Cart item count badge in header

### Phase 2.3: Checkout Component (5-7 hours)

**Files to Create**:
- `app/(parent)/checkout/page.tsx` - Checkout page
- `components/checkout/OrderReview.tsx` - Order summary
- `components/checkout/PaymentForm.tsx` - Payment details
- `components/checkout/DeliveryDetails.tsx` - Delivery info
- `lib/api/orders.ts` - Order API client
- `lib/api/payments.ts` - Payment API client
- `lib/razorpay/razorpay-client.ts` - Razorpay integration

**API Endpoints**:
- `POST /orders` - Create order (Epic 3 - already exists)
- `POST /payments/create-order` - Create payment order
- `POST /payments/verify-payment` - Verify payment signature

**Features**:
- Order review with item list and totals
- Student selection (if parent has multiple children)
- Delivery location confirmation
- Contact phone number input
- Payment method selection
- Razorpay payment integration
- Order confirmation page with order number
- Email confirmation (trigger notification service)

**Success Criteria**:
- [ ] Order submission creates database record
- [ ] Payment integration with Razorpay working
- [ ] Payment verification and order status update
- [ ] Confirmation page with order details
- [ ] Error handling for failed payments
- [ ] Loading states during submission

---

## Data Flow

### MenuBrowser → Cart

```typescript
// User clicks "Add to Cart" on MenuCard
addToCart({
  menuItemId: string,
  name: string,
  price: number,
  quantity: number,
  deliveryDate: Date,
  customizations?: Record<string, any>
})

// Cart state updates
cart.items.push(newItem)
cart.total = calculateTotal(cart.items)
```

### Cart → Checkout

```typescript
// User clicks "Proceed to Checkout"
const orderPayload = {
  studentId: selectedStudent.id,
  deliveryDate: selectedDeliveryDate,
  orderItems: cart.items.map(item => ({
    menuItemId: item.menuItemId,
    quantity: item.quantity,
    specialInstructions: item.specialInstructions,
    customizations: item.customizations
  })),
  deliveryInstructions: form.deliveryInstructions,
  contactPhone: form.contactPhone,
  allergyInfo: form.allergyInfo
}

// POST /orders
const order = await createOrder(orderPayload)

// Create payment order
const paymentOrder = await createPaymentOrder({
  orderId: order.id,
  amount: order.totalAmount,
  currency: 'INR'
})

// Razorpay checkout
const razorpay = new Razorpay({
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
  order_id: paymentOrder.razorpayOrderId,
  handler: async (response) => {
    // Verify payment
    await verifyPayment({
      orderId: order.id,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpayOrderId: response.razorpay_order_id,
      razorpaySignature: response.razorpay_signature
    })

    // Redirect to confirmation
    router.push(`/orders/${order.id}/confirmation`)
  }
})

razorpay.open()
```

---

## TypeScript Interfaces

### Cart Types

```typescript
interface CartItem {
  id: string; // Client-side generated ID
  menuItemId: string; // From backend
  name: string;
  price: number;
  quantity: number;
  deliveryDate: Date;
  specialInstructions?: string;
  customizations?: Record<string, any>;
  allergyInfo?: string;
}

interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
}

interface CartContextType {
  cart: Cart;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateDeliveryDate: (itemId: string, date: Date) => void;
  clearCart: () => void;
}
```

### Order Types (from Epic 3 backend)

```typescript
interface OrderItemRequest {
  menuItemId: string;
  quantity: number;
  specialInstructions?: string;
  customizations?: Record<string, any>;
}

interface CreateOrderRequest {
  studentId: string;
  deliveryDate: string; // ISO date string
  orderItems: OrderItemRequest[];
  deliveryInstructions?: string;
  contactPhone?: string;
  specialInstructions?: string;
  allergyInfo?: string;
}

interface OrderResponse {
  id: string;
  orderNumber: string;
  studentId: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    schoolId: string;
  };
  school: {
    id: string;
    name: string;
  };
  deliveryDate: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  orderItems: Array<{
    id: string;
    menuItemId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  createdAt: string;
  updatedAt: string;
}
```

---

## File Structure

```
app/
├── (parent)/
│   ├── menu/
│   │   └── page.tsx (MenuBrowser)
│   ├── checkout/
│   │   └── page.tsx (Checkout)
│   └── orders/
│       └── [orderId]/
│           └── confirmation/
│               └── page.tsx (Confirmation)
components/
├── menu/
│   ├── MenuCard.tsx
│   ├── MenuFilters.tsx
│   └── MenuSearch.tsx
├── cart/
│   ├── CartProvider.tsx
│   ├── CartSidebar.tsx
│   ├── CartItem.tsx
│   └── CartSummary.tsx
└── checkout/
    ├── OrderReview.tsx
    ├── PaymentForm.tsx
    └── DeliveryDetails.tsx
lib/
├── api/
│   ├── menu.ts
│   ├── orders.ts
│   └── payments.ts
├── cart/
│   └── cartUtils.ts
└── razorpay/
    └── razorpay-client.ts
hooks/
├── useMenu.ts
├── useCart.ts
└── useOrders.ts
types/
├── cart.ts
├── menu.ts
└── order.ts
```

---

## Testing Strategy

### Unit Tests

```typescript
// lib/cart/cartUtils.test.ts
describe('Cart Utilities', () => {
  test('calculateSubtotal sums item prices correctly', () => {
    const items = [
      { price: 100, quantity: 2 },
      { price: 150, quantity: 1 }
    ]
    expect(calculateSubtotal(items)).toBe(350)
  })

  test('calculateTax applies 5% tax', () => {
    expect(calculateTax(100)).toBe(5)
  })
})
```

### Integration Tests

```typescript
// components/cart/CartProvider.test.tsx
describe('CartProvider', () => {
  test('addItem adds item to cart', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider
    })

    act(() => {
      result.current.addItem({
        menuItemId: '123',
        name: 'Meal',
        price: 100,
        quantity: 1,
        deliveryDate: new Date()
      })
    })

    expect(result.current.cart.items).toHaveLength(1)
  })
})
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/parent-order-journey.spec.ts
test('complete order journey', async ({ page }) => {
  // Navigate to menu
  await page.goto('/menu')

  // Add item to cart
  await page.click('[data-testid="menu-item-add-btn"]')

  // Verify cart count
  await expect(page.locator('[data-testid="cart-count"]')).toContainText('1')

  // Proceed to checkout
  await page.click('[data-testid="checkout-btn"]')

  // Fill delivery details
  await page.fill('[name="contactPhone"]', '9876543210')

  // Submit order
  await page.click('[data-testid="submit-order-btn"]')

  // Verify confirmation
  await expect(page).toHaveURL(/\/orders\/.*\/confirmation/)
})
```

---

## Razorpay Integration Details

### Environment Variables

```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxxxxx
```

### Payment Flow

```typescript
// lib/razorpay/razorpay-client.ts
export const initializeRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export const createRazorpayOrder = async (orderData: {
  orderId: string
  amount: number
  currency: string
}) => {
  const response = await fetch('/api/payments/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  })
  return response.json()
}

export const openRazorpayCheckout = (options: {
  key: string
  order_id: string
  amount: number
  name: string
  description: string
  handler: (response: any) => void
  prefill: {
    name: string
    email: string
    contact: string
  }
}) => {
  const razorpay = new (window as any).Razorpay(options)
  razorpay.open()
}
```

---

## Success Metrics

### Functional Metrics

- [ ] All menu items display correctly from backend API
- [ ] Cart state persists across page navigation
- [ ] Order submission successfully creates database record
- [ ] Payment integration completes end-to-end transaction
- [ ] Confirmation page displays order details correctly

### Performance Metrics

- [ ] Menu page loads in <2s on 3G
- [ ] Cart operations (add/remove) execute in <100ms
- [ ] Checkout form validation provides instant feedback
- [ ] Payment redirect completes within 5s

### UX Metrics

- [ ] Mobile-first responsive design works on all screen sizes
- [ ] Accessibility: WCAG 2.1 AA compliance
- [ ] Error messages are clear and actionable
- [ ] Loading states prevent user confusion

---

## Next Steps After Phase 2

Once parent order journey UI is complete:

### Phase 3: Admin & Kitchen Dashboards

**Admin Dashboard**: Order management, menu management, analytics
**Kitchen Dashboard**: Real-time order queue, preparation workflow, delivery coordination

**See**: Next planning document for Phase 3 details

---

## Deployment Checklist

Before deploying to production:

- [ ] All components built and tested
- [ ] API integration verified with backend Lambda functions
- [ ] Razorpay test mode payments working
- [ ] Razorpay production credentials configured
- [ ] E2E tests passing
- [ ] Accessibility audit complete
- [ ] Performance benchmarks met
- [ ] Error tracking configured (Sentry)
- [ ] Analytics tracking implemented (Google Analytics or Mixpanel)
- [ ] User acceptance testing completed

---

**Status**: Ready to begin implementation
**Start with**: Phase 2.1 - MenuBrowser Component
**Estimated Time**: 12-17 hours total for all 3 phases
