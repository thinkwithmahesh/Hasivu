# Epic 5: Payment Processing & Billing System

## Overview
Epic 5 extends the basic payment functionality from Epic 2 to create a comprehensive billing and subscription management system. This enables schools to offer flexible meal plans, automated billing, and comprehensive payment analytics.

## Business Value
- **Revenue Growth**: Enable subscription meal plans and recurring billing
- **Operational Efficiency**: Automate invoice generation and payment processing
- **Financial Compliance**: GST compliance and audit trail management
- **Parent Experience**: Flexible payment options and transparent billing
- **School Administration**: Comprehensive payment analytics and reporting

## Technical Foundation
Builds on the existing Razorpay integration from Epic 2 with enhanced features for:
- Subscription management
- Automated billing cycles
- Invoice generation and delivery
- Advanced payment analytics

---

## Story 5.1: Advanced Payment Features

### Acceptance Criteria
- [ ] Parents can save multiple payment methods (cards, UPI, wallets)
- [ ] Support for partial payments and installment plans
- [ ] Automatic retry mechanism for failed payments
- [ ] Multi-currency support with INR as primary
- [ ] Payment reconciliation system for schools

### Technical Implementation

#### Enhanced Payment Models
```prisma
model PaymentMethod {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  
  methodType    String   // card, upi, wallet, bank_account
  provider      String   // razorpay, gpay, phonepe, paytm
  providerMethodId String // Razorpay payment method ID
  
  // Card details (masked)
  cardLast4     String?
  cardBrand     String?
  cardNetwork   String?
  cardType      String?  // credit, debit
  
  // UPI details
  upiHandle     String?
  
  // Wallet details
  walletProvider String?
  
  isDefault     Boolean  @default(false)
  isActive      Boolean  @default(true)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  payments      Payment[]
  subscriptions Subscription[]
  
  @@map("payment_methods")
}

model PaymentPlan {
  id            String   @id @default(cuid())
  schoolId      String
  school        School   @relation(fields: [schoolId], references: [id])
  
  name          String
  description   String?
  planType      String   // installment, partial, full
  
  // Installment configuration
  installmentCount    Int?
  installmentInterval String? // daily, weekly, monthly
  minPaymentAmount    Decimal?
  
  // Partial payment configuration
  partialPaymentEnabled Boolean @default(false)
  minimumPartialAmount  Decimal?
  
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  orders        Order[]
  
  @@map("payment_plans")
}

model PaymentRetry {
  id            String   @id @default(cuid())
  paymentId     String
  payment       Payment  @relation(fields: [paymentId], references: [id])
  
  attemptNumber Int
  retryAt       DateTime
  retryReason   String
  retryMethod   String?  // auto, manual
  
  status        String   // scheduled, attempted, success, failed, cancelled
  failureReason String?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@map("payment_retries")
}

model ReconciliationRecord {
  id            String   @id @default(cuid())
  schoolId      String
  school        School   @relation(fields: [schoolId], references: [id])
  
  recordDate    DateTime
  recordType    String   // daily, weekly, monthly
  
  // Financial summary
  totalPayments      Decimal
  totalRefunds       Decimal
  totalFees          Decimal
  netSettlement      Decimal
  
  // Transaction counts
  paymentCount       Int
  refundCount        Int
  failedPaymentCount Int
  
  // Status
  reconciliationStatus String // pending, processing, completed, discrepancy
  discrepancyAmount    Decimal?
  discrepancyReason    String?
  
  // Settlement details
  settlementId         String?
  settlementDate       DateTime?
  settlementAmount     Decimal?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@map("reconciliation_records")
}
```

#### Lambda Functions

**1. Payment Method Management**
```typescript
// src/functions/payments/manage-payment-methods.ts
export const managePaymentMethodsHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Implementation for CRUD operations on payment methods
  // - Save new payment method via Razorpay
  // - List user's saved payment methods
  // - Set default payment method
  // - Delete payment method
};
```

**2. Advanced Payment Processing**
```typescript
// src/functions/payments/advanced-payment.ts
export const advancedPaymentHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Implementation for:
  // - Partial payment processing
  // - Installment plan creation
  // - Multi-currency conversion
  // - Payment method validation
};
```

**3. Payment Retry System**
```typescript
// src/functions/payments/retry-payment.ts
export const retryPaymentHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Implementation for:
  // - Automatic retry scheduling
  // - Manual retry processing
  // - Retry attempt tracking
  // - Failure reason analysis
};
```

---

## Story 5.2: Subscription Billing Management

### Acceptance Criteria
- [ ] Schools can create recurring meal plan subscriptions
- [ ] Parents can subscribe to daily/weekly/monthly meal plans
- [ ] Automatic renewal with dunning management
- [ ] Subscription pause/resume functionality
- [ ] Proration handling for plan changes

### Technical Implementation

#### Subscription Models
```prisma
model Subscription {
  id            String   @id @default(cuid())
  schoolId      String
  school        School   @relation(fields: [schoolId], references: [id])
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  studentId     String?
  student       User?    @relation("StudentSubscriptions", fields: [studentId], references: [id])
  
  subscriptionPlanId String
  subscriptionPlan   SubscriptionPlan @relation(fields: [subscriptionPlanId], references: [id])
  
  paymentMethodId    String?
  paymentMethod      PaymentMethod? @relation(fields: [paymentMethodId], references: [id])
  
  // Subscription details
  status        String   // active, paused, cancelled, expired, suspended
  startDate     DateTime
  endDate       DateTime?
  nextBillingDate DateTime?
  
  // Billing configuration
  billingCycle  String   // daily, weekly, monthly
  billingAmount Decimal
  currency      String   @default("INR")
  
  // Proration and adjustments
  prorationEnabled Boolean @default(true)
  prorationAmount  Decimal @default(0)
  
  // Grace period and dunning
  gracePeriodDays    Int     @default(3)
  dunningAttempts    Int     @default(0)
  maxDunningAttempts Int     @default(3)
  suspendedAt        DateTime?
  
  // Trial period
  trialPeriodDays Int     @default(0)
  trialEndDate    DateTime?
  isTrialActive   Boolean @default(false)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  billingCycles BillingCycle[]
  orders        Order[]
  
  @@map("subscriptions")
}

model SubscriptionPlan {
  id            String   @id @default(cuid())
  schoolId      String
  school        School   @relation(fields: [schoolId], references: [id])
  
  name          String
  description   String?
  planType      String   // meal_plan, full_service, basic
  
  // Pricing configuration
  price         Decimal
  currency      String   @default("INR")
  billingCycle  String   // daily, weekly, monthly
  
  // Plan features
  mealsPerDay   Int      @default(1)
  mealsPerWeek  Int?
  mealsPerMonth Int?
  
  // Plan benefits
  benefits      Json?    // Free delivery, priority service, etc.
  
  // Availability
  isActive      Boolean  @default(true)
  availableFrom DateTime?
  availableTo   DateTime?
  
  // Trial configuration
  trialPeriodDays Int     @default(0)
  trialPrice      Decimal @default(0)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  subscriptions Subscription[]
  
  @@map("subscription_plans")
}

model BillingCycle {
  id            String   @id @default(cuid())
  subscriptionId String
  subscription  Subscription @relation(fields: [subscriptionId], references: [id])
  
  cycleNumber   Int
  cycleStart    DateTime
  cycleEnd      DateTime
  
  // Billing details
  billingAmount Decimal
  prorationAmount Decimal @default(0)
  totalAmount   Decimal
  currency      String   @default("INR")
  
  // Status tracking
  status        String   // pending, processing, paid, failed, cancelled
  billingDate   DateTime
  dueDate       DateTime
  paidDate      DateTime?
  
  // Payment tracking
  paymentId     String?
  payment       Payment? @relation(fields: [paymentId], references: [id])
  
  // Dunning management
  dunningAttempts Int      @default(0)
  lastDunningAt   DateTime?
  nextDunningAt   DateTime?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@map("billing_cycles")
}
```

#### Lambda Functions

**1. Subscription Management**
```typescript
// src/functions/billing/manage-subscriptions.ts
export const manageSubscriptionsHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Implementation for:
  // - Create new subscription
  // - Update subscription details
  // - Pause/resume subscription
  // - Cancel subscription
  // - Handle plan changes with proration
};
```

**2. Billing Cycle Processing**
```typescript
// src/functions/billing/process-billing-cycle.ts
export const processBillingCycleHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Implementation for:
  // - Generate billing cycles
  // - Process recurring payments
  // - Handle payment failures
  // - Update subscription status
};
```

**3. Dunning Management**
```typescript
// src/functions/billing/dunning-management.ts
export const dunningManagementHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Implementation for:
  // - Failed payment retry logic
  // - Grace period management
  // - Subscription suspension
  // - Dunning email notifications
};
```

---

## Story 5.3: Automated Invoice Generation

### Acceptance Criteria
- [ ] Automated PDF invoice generation with school branding
- [ ] Email delivery of invoices to parents
- [ ] GST calculation and tax compliance
- [ ] Invoice numbering and audit trails
- [ ] Bulk invoice processing for schools

### Technical Implementation

#### Invoice Models
```prisma
model Invoice {
  id            String   @id @default(cuid())
  schoolId      String
  school        School   @relation(fields: [schoolId], references: [id])
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  
  // Invoice identification
  invoiceNumber String   @unique
  invoiceDate   DateTime @default(now())
  dueDate       DateTime
  
  // Financial details
  subtotal      Decimal
  taxAmount     Decimal  @default(0)
  discountAmount Decimal @default(0)
  totalAmount   Decimal
  currency      String   @default("INR")
  
  // Tax compliance
  gstNumber     String?
  gstRate       Decimal  @default(0)
  hsnCode       String?
  placeOfSupply String?
  
  // Status
  status        String   // draft, sent, paid, overdue, cancelled
  sentDate      DateTime?
  paidDate      DateTime?
  
  // Payment tracking
  paymentId     String?
  payment       Payment? @relation(fields: [paymentId], references: [id])
  
  // File management
  pdfUrl        String?
  pdfGeneratedAt DateTime?
  
  // Email tracking
  emailSent     Boolean  @default(false)
  emailSentAt   DateTime?
  emailDelivered Boolean @default(false)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  invoiceItems  InvoiceItem[]
  emailLogs     InvoiceEmailLog[]
  
  @@map("invoices")
}

model InvoiceItem {
  id            String   @id @default(cuid())
  invoiceId     String
  invoice       Invoice  @relation(fields: [invoiceId], references: [id])
  
  orderId       String?
  order         Order?   @relation(fields: [orderId], references: [id])
  
  description   String
  quantity      Int      @default(1)
  unitPrice     Decimal
  totalPrice    Decimal
  
  // Tax details
  taxRate       Decimal  @default(0)
  taxAmount     Decimal  @default(0)
  
  // Item categorization
  itemType      String   // meal, delivery_fee, service_charge
  itemCode      String?
  hsnCode       String?
  
  createdAt     DateTime @default(now())
  
  @@map("invoice_items")
}

model InvoiceEmailLog {
  id            String   @id @default(cuid())
  invoiceId     String
  invoice       Invoice  @relation(fields: [invoiceId], references: [id])
  
  emailType     String   // invoice, reminder, overdue
  recipientEmail String
  
  // Email status
  status        String   // sent, delivered, opened, failed
  sentAt        DateTime
  deliveredAt   DateTime?
  openedAt      DateTime?
  
  // Error tracking
  errorMessage  String?
  retryCount    Int      @default(0)
  
  // Email content
  subject       String
  emailProvider String   // ses, sendgrid
  providerMessageId String?
  
  createdAt     DateTime @default(now())
  
  @@map("invoice_email_logs")
}

model InvoiceTemplate {
  id            String   @id @default(cuid())
  schoolId      String
  school        School   @relation(fields: [schoolId], references: [id])
  
  templateName  String
  templateType  String   // standard, custom, branded
  
  // Branding configuration
  logoUrl       String?
  headerColor   String?
  accentColor   String?
  footerText    String?
  
  // Template content
  htmlTemplate  String
  cssStyles     String?
  
  // Settings
  isDefault     Boolean  @default(false)
  isActive      Boolean  @default(true)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@map("invoice_templates")
}
```

#### Lambda Functions

**1. Invoice Generation**
```typescript
// src/functions/billing/generate-invoice.ts
export const generateInvoiceHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Implementation for:
  // - Create invoice from order/subscription
  // - Calculate taxes and fees
  // - Generate unique invoice number
  // - Create invoice items
};
```

**2. PDF Generation**
```typescript
// src/functions/billing/generate-invoice-pdf.ts
export const generateInvoicePdfHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Implementation for:
  // - Generate PDF from invoice data
  // - Apply school branding
  // - Upload PDF to S3
  // - Update invoice with PDF URL
};
```

**3. Invoice Email Delivery**
```typescript
// src/functions/billing/send-invoice-email.ts
export const sendInvoiceEmailHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Implementation for:
  // - Email invoice PDF to parent
  // - Track email delivery status
  // - Handle email failures
  // - Log email communication
};
```

---

## Story 5.4: Payment Analytics & Reporting

### Acceptance Criteria
- [ ] Real-time payment dashboard for schools
- [ ] Revenue analytics and trends
- [ ] Failed payment tracking and recovery
- [ ] Settlement reports and reconciliation
- [ ] Parent payment behavior analytics

### Technical Implementation

#### Analytics Models
```prisma
model PaymentAnalytics {
  id            String   @id @default(cuid())
  schoolId      String
  school        School   @relation(fields: [schoolId], references: [id])
  
  reportDate    DateTime
  reportType    String   // daily, weekly, monthly
  
  // Payment metrics
  totalPayments      Decimal
  totalRefunds       Decimal
  netRevenue         Decimal
  averageOrderValue  Decimal
  
  // Volume metrics
  paymentCount       Int
  refundCount        Int
  uniqueCustomers    Int
  newCustomers       Int
  
  // Success metrics
  paymentSuccessRate Decimal
  refundRate         Decimal
  chargebackCount    Int
  
  // Payment method breakdown
  cardPayments       Decimal
  upiPayments        Decimal
  walletPayments     Decimal
  bankTransfers      Decimal
  
  // Subscription metrics
  activeSubscriptions    Int
  newSubscriptions       Int
  cancelledSubscriptions Int
  subscriptionRevenue    Decimal
  
  // Growth metrics
  revenueGrowthRate  Decimal?
  customerGrowthRate Decimal?
  
  createdAt     DateTime @default(now())
  
  @@unique([schoolId, reportDate, reportType])
  @@map("payment_analytics")
}

model PaymentFailureAnalytics {
  id            String   @id @default(cuid())
  schoolId      String
  school        School   @relation(fields: [schoolId], references: [id])
  
  reportDate    DateTime
  
  // Failure breakdown
  totalFailures        Int
  insufficientFunds    Int
  cardDeclined         Int
  networkErrors        Int
  authenticationFailed Int
  otherFailures        Int
  
  // Recovery metrics
  recoveredPayments    Int
  recoveredAmount      Decimal
  recoveryRate         Decimal
  
  // Failure impact
  lostRevenue          Decimal
  affectedCustomers    Int
  
  createdAt     DateTime @default(now())
  
  @@unique([schoolId, reportDate])
  @@map("payment_failure_analytics")
}

model CustomerPaymentBehavior {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  schoolId      String
  school        School   @relation(fields: [schoolId], references: [id])
  
  // Behavior analysis
  lastPaymentDate      DateTime?
  averageOrderValue    Decimal
  totalOrderValue      Decimal
  orderFrequency       Decimal  // orders per month
  
  // Payment preferences
  preferredPaymentMethod String?
  preferredOrderTime     String?
  preferredOrderDays     String? // JSON array
  
  // Risk assessment
  paymentSuccessRate   Decimal
  failureCount         Int
  chargebackCount      Int
  riskScore           Decimal  // 0-1 scale
  
  // Loyalty metrics
  customerSince        DateTime
  totalOrders          Int
  loyaltyTier          String?  // bronze, silver, gold
  
  // Subscription behavior
  hasActiveSubscription Boolean @default(false)
  subscriptionValue     Decimal @default(0)
  subscriptionStartDate DateTime?
  
  lastUpdated   DateTime @default(now())
  
  @@unique([userId, schoolId])
  @@map("customer_payment_behavior")
}
```

#### Lambda Functions

**1. Payment Analytics Dashboard**
```typescript
// src/functions/analytics/payment-dashboard.ts
export const paymentDashboardHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Implementation for:
  // - Real-time payment metrics
  // - Revenue trends and charts
  // - Payment method breakdown
  // - Subscription analytics
};
```

**2. Payment Reports Generation**
```typescript
// src/functions/analytics/generate-payment-reports.ts
export const generatePaymentReportsHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Implementation for:
  // - Generate settlement reports
  // - Export payment data
  // - Reconciliation reports
  // - Tax compliance reports
};
```

**3. Analytics Data Processing**
```typescript
// src/functions/analytics/process-analytics.ts
export const processAnalyticsHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Implementation for:
  // - Calculate daily analytics
  // - Update payment behavior data
  // - Generate failure analytics
  // - Process customer insights
};
```

---

## Implementation Timeline

### Phase 1: Advanced Payment Features (Week 1)
- [ ] Update Prisma schema with new payment models
- [ ] Implement payment method management
- [ ] Create advanced payment processing functions
- [ ] Implement payment retry system
- [ ] Add payment reconciliation functionality

### Phase 2: Subscription Billing (Week 2)
- [ ] Implement subscription models and plans
- [ ] Create subscription management functions
- [ ] Build billing cycle processing
- [ ] Implement dunning management
- [ ] Add proration and plan change handling

### Phase 3: Invoice Generation (Week 2-3)
- [ ] Create invoice models and templates
- [ ] Implement PDF generation with branding
- [ ] Build email delivery system
- [ ] Add GST calculation and compliance
- [ ] Create bulk invoice processing

### Phase 4: Analytics & Reporting (Week 3)
- [ ] Implement analytics data models
- [ ] Create payment dashboard functions
- [ ] Build reporting and export functionality
- [ ] Add customer behavior analytics
- [ ] Implement real-time metrics processing

---

## Testing Strategy

### Unit Tests
- [ ] Payment method CRUD operations
- [ ] Subscription lifecycle management
- [ ] Invoice generation and calculation
- [ ] Analytics data processing

### Integration Tests
- [ ] End-to-end payment flows
- [ ] Subscription billing cycles
- [ ] Invoice email delivery
- [ ] Analytics dashboard queries

### Performance Tests
- [ ] Bulk invoice generation
- [ ] High-volume payment processing
- [ ] Analytics query performance
- [ ] Real-time dashboard updates

---

## Deployment Considerations

### Database Migration
- New tables: payment_methods, payment_plans, subscriptions, invoices, analytics
- Indexes for performance optimization
- Data migration from existing payment records

### Environment Variables
- PDF generation service configuration
- Email service credentials
- Analytics processing intervals
- Invoice template storage location

### Security Compliance
- PCI DSS compliance for stored payment methods
- Data encryption for sensitive financial information
- Audit logging for all payment operations
- GDPR compliance for customer data

---

## Success Metrics

### Business Metrics
- **Subscription Adoption**: 40% of parents on recurring plans
- **Payment Success Rate**: >95% for recurring payments
- **Invoice Automation**: 100% automated invoice generation
- **Revenue Growth**: 25% increase in monthly recurring revenue

### Technical Metrics
- **API Response Time**: <200ms for payment operations
- **PDF Generation**: <5 seconds per invoice
- **Email Delivery**: >98% successful delivery rate
- **Analytics Processing**: Real-time dashboard updates

### User Experience Metrics
- **Payment Completion**: <3 clicks for saved payment methods
- **Invoice Clarity**: <2% support queries about invoices
- **Subscription Management**: Self-service rate >90%
- **Failed Payment Recovery**: >60% automatic recovery rate