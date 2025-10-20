# Hasivu Platform - Payment Flow Diagram

## Complete Payment Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        HASIVU CHECKOUT & PAYMENT FLOW                       │
│                     (Razorpay Integration Architecture)                     │
└─────────────────────────────────────────────────────────────────────────────┘


┌──────────────┐
│   PHASE 1    │  PAGE INITIALIZATION
│   IDLE       │
└──────────────┘
       │
       ├──► Load Razorpay SDK
       │    └─► paymentAPIService.loadRazorpayScript()
       │        └─► <script src="https://checkout.razorpay.com/v1/checkout.js">
       │
       ├──► Load User Profile
       │    └─► GET /users/profile (mock)
       │        └─► Returns: { name, email, phone, students[] }
       │
       ├──► Pre-fill Form
       │    └─► setValue('contactPhone', profile.phone)
       │    └─► setValue('studentId', students[0].id) [if single child]
       │
       └──► Load Cart Data
            └─► useCart() hook
                └─► Returns: { items, total, subtotal, tax, deliveryFee }


┌──────────────┐
│   PHASE 2    │  FORM VALIDATION
│   IDLE       │
└──────────────┘
       │
       ▼
   User Reviews Order
       │
       ├──► Review Cart Items
       │    └─► {itemCount} items in cart
       │    └─► Subtotal: ₹{subtotal}
       │    └─► Tax: ₹{tax}
       │    └─► Delivery: ₹{deliveryFee}
       │    └─► Total: ₹{total}
       │
       ├──► Select Student
       │    └─► dropdown.onChange(studentId)
       │    └─► Validation: required
       │
       ├──► Enter Contact Phone
       │    └─► input.onChange(phone)
       │    └─► Validation: regex /^[0-9+\-\s()]+$/
       │
       ├──► Optional Fields
       │    ├─► Delivery Instructions (textarea)
       │    └─► Allergy Information (textarea)
       │
       └──► Click "Pay ₹{total}"
            └─► Triggers: handleSubmit(onSubmit)


┌──────────────┐
│   PHASE 3    │  ORDER CREATION
│  CREATING    │
│   ORDER      │
└──────────────┘
       │
       ├──► Validate Form
       │    └─► Zod Schema Validation
       │        ├─► studentId: required
       │        ├─► contactPhone: regex + min length
       │        └─► Returns: FormData or ValidationErrors
       │
       ├──► Transform Cart to Order
       │    └─► orderItems = cart.items.map(item => ({
       │              menuItemId: item.menuItemId,
       │              quantity: item.quantity,
       │              specialInstructions: item.specialInstructions,
       │              customizations: item.customizations
       │          }))
       │
       ├──► Create Order Request
       │    └─► POST /orders
       │        └─► Payload: {
       │              studentId,
       │              deliveryDate,
       │              orderItems[],
       │              deliveryInstructions,
       │              contactPhone,
       │              allergyInfo
       │            }
       │
       └──► Receive Order Response
            └─► Response: {
                  id: "order_123abc",
                  orderNumber: "ORD-20250119-001",
                  totalAmount: 450.00,
                  status: "pending",
                  paymentStatus: "pending",
                  ...orderDetails
                }


┌──────────────┐
│   PHASE 4    │  PAYMENT ORDER CREATION
│ PROCESSING   │
│   PAYMENT    │
└──────────────┘
       │
       ├──► Create Payment Order
       │    └─► POST /payments/orders
       │        └─► Payload: {
       │              orderId: "order_123abc",
       │              amount: 45000, // in paisa (₹450.00)
       │              currency: "INR",
       │              description: "Payment for order order_123abc"
       │            }
       │
       ├──► Razorpay Order Created
       │    └─► Response: {
       │              razorpayOrderId: "order_razorpay_xyz789",
       │              amount: 45000,
       │              currency: "INR",
       │              status: "created",
       │              createdAt: "2025-01-19T10:30:00Z"
       │            }
       │
       └──► Prepare Razorpay Options
            └─► {
                  key: "rzp_test_xxxxx",
                  amount: 45000,
                  currency: "INR",
                  name: "Hasivu Platform",
                  description: "Meal Order Payment",
                  order_id: "order_razorpay_xyz789",
                  prefill: {
                    name: "John Doe",
                    email: "john@example.com",
                    contact: "+919876543210"
                  },
                  theme: { color: "#22c55e" }
                }


┌──────────────┐
│   PHASE 5    │  RAZORPAY CHECKOUT MODAL
│ PROCESSING   │
│   PAYMENT    │
└──────────────┘
       │
       ├──► Open Razorpay Modal
       │    └─► new Razorpay(options).open()
       │        └─► Displays Razorpay Checkout UI
       │
       ├──► User Interaction
       │    ├─► Select Payment Method
       │    │   ├─► Card (Credit/Debit)
       │    │   ├─► UPI
       │    │   ├─► Net Banking
       │    │   ├─► Wallet
       │    │   └─► EMI
       │    │
       │    ├─► Enter Payment Details
       │    │   └─► (Handled by Razorpay - PCI compliant)
       │    │
       │    └─► Confirm Payment
       │        └─► Click "Pay ₹450.00"
       │
       └──► Razorpay Processing
            ├─► Bank Authorization
            ├─► 3D Secure / OTP Verification
            └─► Payment Status Determination


┌──────────────┐
│   PHASE 6A   │  PAYMENT SUCCESS PATH
│  VERIFYING   │
└──────────────┘
       │
       ├──► Razorpay Success Callback
       │    └─► handler(response) receives:
       │        {
       │          razorpay_payment_id: "pay_xyz123",
       │          razorpay_order_id: "order_razorpay_xyz789",
       │          razorpay_signature: "abc456def789..."
       │        }
       │
       ├──► Verify Payment Signature
       │    └─► POST /payments/verify
       │        └─► Payload: {
       │              orderId: "order_123abc",
       │              razorpayPaymentId: "pay_xyz123",
       │              razorpayOrderId: "order_razorpay_xyz789",
       │              razorpaySignature: "abc456def789..."
       │            }
       │
       ├──► Backend Signature Verification
       │    └─► Crypto Signature Check:
       │        expected_signature = hmac_sha256(
       │          secret_key,
       │          razorpay_order_id + "|" + razorpay_payment_id
       │        )
       │        └─► if (expected === razorpay_signature) ✅ Valid
       │
       └──► Verification Response
            └─► Response: {
                  success: true,
                  orderId: "order_123abc",
                  paymentId: "pay_xyz123",
                  amount: 45000,
                  status: "verified",
                  message: "Payment verified successfully"
                }


┌──────────────┐
│   PHASE 7    │  SUCCESS HANDLING
│   SUCCESS    │
└──────────────┘
       │
       ├──► Update UI State
       │    └─► setPaymentState(PaymentState.SUCCESS)
       │    └─► Display: "Payment successful! Redirecting..."
       │
       ├──► Clear Shopping Cart
       │    └─► clearCart()
       │        └─► localStorage.removeItem('hasivu_shopping_cart')
       │
       ├──► Navigate to Confirmation
       │    └─► router.push(`/orders/${orderId}/confirmation`)
       │
       └──► Confirmation Page Loads
            ├─► GET /orders/:orderId
            ├─► Display Order Details
            ├─► Show Payment Receipt
            └─► Next Steps Guide


┌──────────────┐
│  PHASE 6B    │  PAYMENT FAILURE PATH
│    ERROR     │
└──────────────┘
       │
       ├──► Razorpay Failure Callback
       │    └─► payment.failed event receives:
       │        {
       │          error: {
       │            code: "BAD_REQUEST_ERROR",
       │            description: "Payment failed",
       │            reason: "payment_failed",
       │            metadata: {...}
       │          }
       │        }
       │
       ├──► Error Handling
       │    └─► Categorize Error:
       │        ├─► Payment Cancelled → "Payment was cancelled. You can try again."
       │        ├─► Payment Failed → "Payment failed. Please check details."
       │        ├─► Network Error → "Connection lost. Please retry."
       │        └─► Unknown Error → "An error occurred. Please try again."
       │
       ├──► Update UI State
       │    └─► setPaymentState(PaymentState.ERROR)
       │    └─► setPaymentError(userFriendlyMessage)
       │    └─► Display Alert with Retry Option
       │
       └──► Retry Flow
            ├─► Keep form data intact
            ├─► Keep cart items intact
            └─► User clicks "Pay" again → Restart from Phase 4


┌──────────────┐
│  PHASE 6C    │  PAYMENT CANCELLATION PATH
│    ERROR     │
└──────────────┘
       │
       ├──► User Closes Modal
       │    └─► modal.ondismiss() triggered
       │
       ├──► Cancellation Handling
       │    └─► reject(new Error('Payment cancelled by user'))
       │
       ├──► Update UI State
       │    └─► setPaymentState(PaymentState.ERROR)
       │    └─► setPaymentError('Payment was cancelled. You can try again.')
       │
       └──► Retry Available
            ├─► Order still exists (not deleted)
            ├─► Cart still intact
            └─► User can retry immediately


═════════════════════════════════════════════════════════════════════════════
                            STATE MANAGEMENT FLOW
═════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────┐
│                          PAYMENT STATE MACHINE                          │
└─────────────────────────────────────────────────────────────────────────┘

    IDLE
      │
      │ (loadRazorpayScript)
      ▼
  LOADING_SCRIPT ────► ERROR
      │                  ▲
      │ (script loaded)  │
      ▼                  │
    IDLE                 │
      │                  │
      │ (handleSubmit)   │
      ▼                  │
  CREATING_ORDER ────────┤
      │                  │
      │ (order created)  │
      ▼                  │
  PROCESSING_PAYMENT ────┤
      │                  │
      │ (razorpay done)  │
      ▼                  │
   VERIFYING ────────────┤
      │                  │
      │ (verified)       │
      ▼                  │
    SUCCESS              │
                         │
         (any error) ────┘


═════════════════════════════════════════════════════════════════════════════
                         SERVICE LAYER ARCHITECTURE
═════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────┐
│                      PAYMENT API SERVICE METHODS                        │
└─────────────────────────────────────────────────────────────────────────┘

paymentAPIService
  │
  ├─► loadRazorpayScript(): Promise<boolean>
  │   └─► Loads Razorpay SDK from CDN
  │
  ├─► createPaymentOrder(request): Promise<PaymentOrderResponse>
  │   └─► POST /payments/orders
  │       └─► Creates Razorpay order
  │
  ├─► initiateRazorpayCheckout(options): Promise<void>
  │   └─► Opens Razorpay modal
  │       └─► Handles payment completion
  │
  ├─► verifyPayment(verification): Promise<PaymentVerificationResponse>
  │   └─► POST /payments/verify
  │       └─► Verifies payment signature
  │
  └─► processPayment(orderId, amount, userInfo): Promise<PaymentVerificationResponse>
      └─► Orchestrates complete flow:
          ├─► createPaymentOrder()
          ├─► initiateRazorpayCheckout()
          └─► verifyPayment()


┌─────────────────────────────────────────────────────────────────────────┐
│                       ORDER API SERVICE METHODS                         │
└─────────────────────────────────────────────────────────────────────────┘

orderAPIService
  │
  ├─► createOrder(request): Promise<Order>
  │   └─► POST /orders
  │       └─► Creates order with items
  │
  ├─► getOrder(orderId): Promise<Order>
  │   └─► GET /orders/:orderId
  │       └─► Retrieves order details
  │
  ├─► updateOrderStatus(orderId, status): Promise<Order>
  │   └─► PUT /orders/:orderId/status
  │       └─► Updates order status
  │
  └─► trackOrder(orderId): Promise<OrderTracking>
      └─► GET /orders/:orderId/track
          └─► Gets tracking information


═════════════════════════════════════════════════════════════════════════════
                              ERROR SCENARIOS
═════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────┐
│                           ERROR HANDLING MATRIX                         │
└─────────────────────────────────────────────────────────────────────────┘

Scenario 1: Razorpay SDK Fails to Load
  ├─► Detection: loadRazorpayScript() returns false
  ├─► State: LOADING_SCRIPT → ERROR
  ├─► Message: "Failed to load payment gateway. Please refresh the page."
  └─► Recovery: User refreshes page

Scenario 2: Order Creation Fails
  ├─► Detection: createOrder() throws error
  ├─► State: CREATING_ORDER → ERROR
  ├─► Message: "Failed to create order. Please try again."
  └─► Recovery: User retries checkout

Scenario 3: Payment Modal Cancelled
  ├─► Detection: modal.ondismiss() triggered
  ├─► State: PROCESSING_PAYMENT → ERROR
  ├─► Message: "Payment was cancelled. You can try again."
  └─► Recovery: User retries payment immediately

Scenario 4: Payment Fails
  ├─► Detection: payment.failed event
  ├─► State: PROCESSING_PAYMENT → ERROR
  ├─► Message: "Payment failed. Please check your payment details."
  └─► Recovery: User retries with different payment method

Scenario 5: Signature Verification Fails
  ├─► Detection: verifyPayment() returns success: false
  ├─► State: VERIFYING → ERROR
  ├─► Message: "Payment verification failed. Contact support."
  └─► Recovery: Admin investigation required

Scenario 6: Network Error
  ├─► Detection: Axios interceptor catches 500/503
  ├─► State: Any → ERROR
  ├─► Message: "Network error. Please check connection and retry."
  └─► Recovery: User retries after network restored


═════════════════════════════════════════════════════════════════════════════
                           DATA FLOW SUMMARY
═════════════════════════════════════════════════════════════════════════════

Cart Items (CartContext)
  └─► Transform to OrderItems
      └─► POST /orders (Backend creates order)
          └─► Return Order ID
              └─► POST /payments/orders (Backend creates Razorpay order)
                  └─► Return Razorpay Order ID
                      └─► Open Razorpay Modal
                          └─► User completes payment
                              └─► Razorpay returns payment details
                                  └─► POST /payments/verify (Backend verifies)
                                      └─► Update order payment status
                                          └─► Clear cart
                                              └─► Redirect to confirmation


═════════════════════════════════════════════════════════════════════════════
                         SECURITY CONSIDERATIONS
═════════════════════════════════════════════════════════════════════════════

✅ HTTPS Only - All communication encrypted
✅ PCI Compliance - Razorpay handles card data (no card data touches our servers)
✅ Signature Verification - Backend verifies Razorpay signature using HMAC-SHA256
✅ Token Authentication - Bearer token in all API requests
✅ Input Validation - Client (Zod) + Server validation
✅ XSS Protection - React auto-escaping
✅ CSRF Protection - Token-based authentication
✅ Rate Limiting - Backend API rate limits (assumed)
✅ Payment Amount Verification - Backend validates amount matches order
✅ Idempotency - Order ID prevents duplicate orders


═════════════════════════════════════════════════════════════════════════════
                       PERFORMANCE OPTIMIZATIONS
═════════════════════════════════════════════════════════════════════════════

🚀 Razorpay SDK - Loaded once on mount, cached
🚀 Form Validation - Debounced validation on input
🚀 Cart State - Memoized calculations
🚀 Component Rendering - React.memo for expensive components
🚀 API Calls - Parallel requests where possible
🚀 Loading States - Optimistic UI updates
🚀 Error Handling - Graceful degradation
🚀 User Experience - Progressive enhancement


═════════════════════════════════════════════════════════════════════════════
                            TESTING STRATEGY
═════════════════════════════════════════════════════════════════════════════

Unit Tests
  ├─► Form validation schema
  ├─► Price calculations
  ├─► State transitions
  └─► Error message formatting

Integration Tests
  ├─► Order creation flow
  ├─► Payment processing flow
  ├─► Error handling paths
  └─► Cart clearing

E2E Tests
  ├─► Complete checkout journey
  ├─► Payment success scenario
  ├─► Payment failure scenario
  ├─► Payment cancellation scenario
  └─► Confirmation page display

Manual Testing
  ├─► Razorpay test cards
  ├─► Mobile responsiveness
  ├─► Accessibility (screen reader)
  └─► Cross-browser compatibility


═════════════════════════════════════════════════════════════════════════════
                           END OF FLOW DIAGRAM
═════════════════════════════════════════════════════════════════════════════
