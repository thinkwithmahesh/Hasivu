# HASIVU Platform Fullstack Architecture Document

## Introduction

This document outlines the complete fullstack architecture for HASIVU Platform, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

### Starter Template or Existing Project

**N/A - Greenfield project**

HASIVU Platform is a greenfield development with unique requirements (RFID integration, multi-stakeholder interfaces, institutional scalability) that necessitate custom architecture rather than existing starter templates. The complexity of RFID hardware integration, payment processing compliance, and multi-role platform design requires purpose-built solutions.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-08-02 | 1.0 | Initial fullstack architecture creation | Winston (Architect) |

## High Level Architecture

### Technical Summary

HASIVU Platform employs a modern serverless-first architecture deployed on AWS, utilizing React Native for mobile applications and React for web portals, with Node.js Lambda functions providing scalable backend services. The system integrates with external RFID hardware through dedicated API layers, processes payments through PCI-compliant gateways, and maintains real-time communication via WebSocket connections for delivery verification. A PostgreSQL database with Redis caching ensures data consistency and performance, while CloudFront CDN and S3 storage optimize content delivery across India's premium school network. This architecture delivers the PRD's requirements for 99.9% uptime, sub-2-second response times, and seamless scaling to 100K+ concurrent users across 500+ institutions.

### Platform and Infrastructure Choice

**Platform:** AWS Full Stack
**Key Services:** Lambda, API Gateway, RDS (PostgreSQL), ElastiCache (Redis), S3, CloudFront, Cognito, SES, SNS
**Deployment Host and Regions:** Primary: ap-south-1 (Mumbai), Secondary: ap-southeast-1 (Singapore) for disaster recovery

**Rationale:** AWS provides comprehensive PCI DSS compliant infrastructure essential for payment processing, mature Lambda ecosystem for serverless scaling, and established presence in Indian market with local data residency compliance. Mumbai region ensures optimal latency for Bangalore schools while Singapore provides robust disaster recovery.

### Repository Structure

**Structure:** Monorepo with Turborepo
**Monorepo Tool:** Turborepo for optimized builds and caching
**Package Organization:** Apps (mobile, web-parent, web-admin, web-vendor), packages (shared types, UI components, API clients), services (backend Lambda functions), infrastructure (Terraform)

### High Level Architecture Diagram

```mermaid
graph TD
    A[Parent Mobile App] --> B[CloudFront CDN]
    C[School Admin Portal] --> B
    D[Vendor Portal] --> B
    E[RFID Readers] --> F[RFID Gateway API]
    
    B --> G[API Gateway]
    F --> G
    
    G --> H[Auth Service Lambda]
    G --> I[User Service Lambda]
    G --> J[Order Service Lambda]
    G --> K[Payment Service Lambda]
    G --> L[RFID Service Lambda]
    G --> M[Notification Service Lambda]
    
    H --> N[Cognito User Pool]
    I --> O[RDS PostgreSQL]
    J --> O
    K --> P[Razorpay API]
    K --> Q[Stripe API]
    L --> R[RFID Vendor APIs]
    M --> S[SNS/WhatsApp API]
    
    I --> T[ElastiCache Redis]
    J --> T
    
    U[S3 Storage] --> B
    V[CloudWatch] --> W[Monitoring Dashboard]
```

### Architectural Patterns

- **Serverless Microservices:** AWS Lambda functions for each domain service - _Rationale:_ Automatic scaling, pay-per-use cost model, and built-in high availability for variable school meal ordering patterns
- **API Gateway Pattern:** Single entry point with authentication, rate limiting, and monitoring - _Rationale:_ Centralized security, simplified client integration, and comprehensive request tracking
- **Event-Driven Architecture:** SNS/SQS for async processing of notifications and RFID events - _Rationale:_ Decoupled services, improved reliability, and ability to handle high-volume RFID scanning events
- **CQRS Pattern:** Separate read/write operations for order management and analytics - _Rationale:_ Optimized performance for high-read analytics while maintaining transactional integrity for orders
- **Repository Pattern:** Abstract data access with TypeScript interfaces - _Rationale:_ Testability, future database migration flexibility, and consistent data access patterns
- **Circuit Breaker:** Fault tolerance for external APIs (payment, RFID, WhatsApp) - _Rationale:_ System resilience when third-party services fail, graceful degradation of non-critical features
- **Progressive Web App:** Offline-first mobile experience with service workers - _Rationale:_ Reliable operation in school environments with variable network connectivity

## Tech Stack

### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.3+ | Type-safe development | Enhanced developer productivity, reduced runtime errors, shared types across stack |
| Frontend Framework | React Native | 0.72+ | Cross-platform mobile | Single codebase for iOS/Android, native performance, mature ecosystem |
| Web Framework | Next.js | 14+ | Server-side rendering | SEO optimization, performance, built-in API routes for admin portals |
| UI Component Library | NativeBase | 3.4+ | Cross-platform components | Consistent design across mobile/web, accessibility built-in, customizable theming |
| State Management | Zustand | 4.4+ | Lightweight state management | Simple API, TypeScript-first, no boilerplate compared to Redux |
| Backend Language | TypeScript | 5.3+ | Full-stack consistency | Shared types, reduced context switching, strong ecosystem |
| Backend Framework | AWS Lambda + Fastify | Lambda 20.x, Fastify 4.24+ | Serverless HTTP handling | Auto-scaling, cost-effective, fast startup times, TypeScript support |
| API Style | REST + WebSocket | OpenAPI 3.0 | RESTful services with real-time | Industry standard, excellent tooling, real-time RFID updates |
| Database | PostgreSQL | 15+ | ACID compliance, JSON support | Data integrity critical for payments, flexible schema for school configurations |
| Cache | Redis | 7+ | Session and data caching | Fast lookups for user sessions, order status, RFID verification results |
| File Storage | AWS S3 | - | Media and document storage | Scalable, cost-effective, CDN integration for meal images and receipts |
| Authentication | AWS Cognito | - | User management and auth | Built-in social login, MFA support, PCI compliant, scales automatically |
| Frontend Testing | Jest + React Testing Library | Jest 29+, RTL 13+ | Component and unit testing | Industry standard, excellent React integration, snapshot testing |
| Backend Testing | Jest + Supertest | Jest 29+, Supertest 6+ | API and integration testing | Consistent tooling with frontend, HTTP testing capabilities |
| E2E Testing | Playwright | 1.40+ | Cross-browser automation | Reliable, fast, excellent debugging tools, mobile testing support |
| Build Tool | Turborepo | 1.11+ | Monorepo build optimization | Fast builds, intelligent caching, dependency management |
| Bundler | Webpack (Next.js) / Metro (RN) | - | Code bundling and optimization | Built into chosen frameworks, optimized for each platform |
| IaC Tool | Terraform | 1.6+ | Infrastructure as code | Version control infrastructure, reproducible deployments, AWS provider maturity |
| CI/CD | GitHub Actions | - | Automated testing and deployment | Free for open source, excellent AWS integration, familiar workflow |
| Monitoring | CloudWatch + Sentry | - | Application monitoring and errors | Native AWS integration, excellent error tracking, performance insights |
| Logging | Winston + CloudWatch Logs | Winston 3.11+ | Structured logging | JSON logging, log levels, centralized log management |
| CSS Framework | Tailwind CSS | 3.3+ | Utility-first styling | Rapid development, consistent design system, excellent customization |

## Data Models

### User Model

**Purpose:** Represents all platform users (parents, school admins, vendors, students) with role-based access control and institutional relationships.

**Key Attributes:**
- id: UUID - Unique identifier across all systems
- email: string - Primary authentication identifier
- role: UserRole - PARENT, SCHOOL_ADMIN, VENDOR, STUDENT
- schoolId: UUID - Links user to specific institution
- profile: UserProfile - Role-specific profile information
- preferences: UserPreferences - Notification and UI preferences
- createdAt: timestamp - Account creation tracking
- lastLoginAt: timestamp - Security and analytics tracking

#### TypeScript Interface

```typescript
interface User {
  id: string;
  email: string;
  role: 'PARENT' | 'SCHOOL_ADMIN' | 'VENDOR' | 'STUDENT';
  schoolId: string;
  profile: UserProfile;
  preferences: UserPreferences;
  createdAt: Date;
  lastLoginAt: Date;
  isActive: boolean;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  // Role-specific fields added via union types
}

interface UserPreferences {
  language: 'en' | 'hi' | 'kn';
  notifications: NotificationPreferences;
  theme: 'light' | 'dark' | 'auto';
}
```

#### Relationships
- One-to-many with Child (for parents)
- Many-to-one with School
- One-to-many with Order (as customer)
- One-to-many with RFIDCard (for students)

### School Model

**Purpose:** Represents educational institutions with configuration for menus, vendors, and operational settings specific to each school's requirements.

**Key Attributes:**
- id: UUID - Unique school identifier
- name: string - Official school name
- code: string - Unique enrollment code for parents
- address: Address - Complete address information
- configuration: SchoolConfig - Operational settings and preferences
- subscriptionTier: string - Service level and feature access
- activeVendors: UUID[] - Currently contracted food vendors
- operatingHours: Schedule - Daily meal service windows
- contact: ContactInfo - Administrative contact information

#### TypeScript Interface

```typescript
interface School {
  id: string;
  name: string;
  code: string; // Unique enrollment code
  address: Address;
  configuration: SchoolConfig;
  subscriptionTier: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  activeVendors: string[];
  operatingHours: Schedule;
  contact: ContactInfo;
  isActive: boolean;
  createdAt: Date;
}

interface SchoolConfig {
  allowAdvanceOrdering: boolean;
  maxAdvanceDays: number;
  requireParentApproval: boolean;
  enableNutritionalTracking: boolean;
  customBranding?: BrandingConfig;
}
```

#### Relationships
- One-to-many with User (students, parents, admins)
- Many-to-many with Vendor
- One-to-many with Menu
- One-to-many with RFIDReader

### Order Model

**Purpose:** Central entity tracking meal orders from placement through RFID-verified delivery, maintaining complete audit trail for payments and compliance.

**Key Attributes:**
- id: UUID - Unique order identifier
- parentId: UUID - Ordering parent reference
- studentId: UUID - Student receiving meal
- schoolId: UUID - Institution context
- items: OrderItem[] - Ordered meals with customizations
- totalAmount: number - Final price including taxes and fees
- status: OrderStatus - Current fulfillment stage
- scheduledDate: Date - Intended delivery date
- deliveryWindow: TimeWindow - Pickup time preferences
- paymentInfo: PaymentInfo - Transaction details and status
- rfidVerification: RFIDVerification - Delivery confirmation data

#### TypeScript Interface

```typescript
interface Order {
  id: string;
  parentId: string;
  studentId: string;
  schoolId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  scheduledDate: Date;
  deliveryWindow: TimeWindow;
  paymentInfo: PaymentInfo;
  rfidVerification?: RFIDVerification;
  specialInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

type OrderStatus = 
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'IN_PREPARATION'
  | 'READY_FOR_PICKUP'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

interface OrderItem {
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  customizations?: string[];
  dietaryNotes?: string;
}
```

#### Relationships
- Many-to-one with User (parent)
- Many-to-one with User (student)
- Many-to-one with School
- One-to-many with OrderItem
- One-to-one with RFIDVerification
- One-to-many with PaymentTransaction

### MenuItem Model

**Purpose:** Represents food items available for ordering with comprehensive nutritional information, pricing, and availability scheduling.

**Key Attributes:**
- id: UUID - Unique menu item identifier
- name: string - Display name for parents and students
- description: string - Detailed item description
- category: MenuCategory - Meal type classification
- nutritionalInfo: NutritionalInfo - Complete dietary information
- pricing: PricingInfo - Cost structure and discounts
- allergens: string[] - Allergy and dietary restriction warnings
- availability: AvailabilitySchedule - When item can be ordered
- images: string[] - Product photos for selection interface
- vendorId: UUID - Supplier reference for preparation

#### TypeScript Interface

```typescript
interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: 'BREAKFAST' | 'LUNCH' | 'SNACK' | 'BEVERAGE';
  nutritionalInfo: NutritionalInfo;
  pricing: PricingInfo;
  allergens: string[];
  availability: AvailabilitySchedule;
  images: string[];
  vendorId: string;
  schoolId: string;
  isActive: boolean;
  createdAt: Date;
}

interface NutritionalInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  servingSize: string;
}
```

#### Relationships
- Many-to-one with Vendor
- Many-to-one with School
- One-to-many with OrderItem
- Many-to-many with DietaryRestriction

### RFIDVerification Model

**Purpose:** Captures real-time delivery verification events from RFID hardware, providing transparent confirmation of meal delivery to students.

**Key Attributes:**
- id: UUID - Unique verification record
- orderId: UUID - Associated order reference
- cardId: string - RFID card identifier
- readerId: string - Hardware device identifier
- verificationTime: timestamp - Exact scan moment
- verificationStatus: VerificationStatus - Success/failure indication
- photoEvidence: string - Optional delivery photo URL
- staffId: UUID - Cafeteria staff member reference
- location: string - Physical location of verification
- metadata: RFIDMetadata - Additional hardware and environmental data

#### TypeScript Interface

```typescript
interface RFIDVerification {
  id: string;
  orderId: string;
  cardId: string;
  readerId: string;
  verificationTime: Date;
  verificationStatus: 'SUCCESS' | 'FAILED' | 'MANUAL_OVERRIDE';
  photoEvidence?: string;
  staffId?: string;
  location: string;
  metadata: RFIDMetadata;
  createdAt: Date;
}

interface RFIDMetadata {
  signalStrength: number;
  readerFirmware: string;
  networkLatency?: number;
  retryCount: number;
  environmentalFactors?: string[];
}
```

#### Relationships
- One-to-one with Order
- Many-to-one with RFIDReader
- Many-to-one with RFIDCard
- Many-to-one with User (staff member)

## API Specification

### REST API Specification

```yaml
openapi: 3.0.0
info:
  title: HASIVU Platform API
  version: 1.0.0
  description: Comprehensive API for HASIVU school food service platform with RFID integration
servers:
  - url: https://api.hasivu.com/v1
    description: Production API
  - url: https://staging-api.hasivu.com/v1
    description: Staging API

paths:
  /auth/login:
    post:
      summary: User authentication
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  accessToken:
                    type: string
                  refreshToken:
                    type: string
                  user:
                    $ref: '#/components/schemas/User'

  /schools/{schoolId}/menus:
    get:
      summary: Get school menu for specific date
      tags: [Menu]
      security:
        - BearerAuth: []
      parameters:
        - name: schoolId
          in: path
          required: true
          schema:
            type: string
        - name: date
          in: query
          required: false
          schema:
            type: string
            format: date
      responses:
        '200':
          description: Menu items for the specified date
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/MenuItem'

  /orders:
    post:
      summary: Create new meal order
      tags: [Orders]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateOrderRequest'
      responses:
        '201':
          description: Order created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Order'

  /orders/{orderId}/rfid-verify:
    post:
      summary: RFID delivery verification
      tags: [RFID]
      security:
        - BearerAuth: []
      parameters:
        - name: orderId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RFIDVerificationRequest'
      responses:
        '200':
          description: Verification successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RFIDVerification'

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        role:
          type: string
          enum: [PARENT, SCHOOL_ADMIN, VENDOR, STUDENT]
        schoolId:
          type: string
          format: uuid
        profile:
          $ref: '#/components/schemas/UserProfile'

    MenuItem:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        description:
          type: string
        category:
          type: string
          enum: [BREAKFAST, LUNCH, SNACK, BEVERAGE]
        nutritionalInfo:
          $ref: '#/components/schemas/NutritionalInfo'
        pricing:
          $ref: '#/components/schemas/PricingInfo'
        allergens:
          type: array
          items:
            type: string

    Order:
      type: object
      properties:
        id:
          type: string
          format: uuid
        parentId:
          type: string
          format: uuid
        studentId:
          type: string
          format: uuid
        items:
          type: array
          items:
            $ref: '#/components/schemas/OrderItem'
        totalAmount:
          type: number
        status:
          type: string
          enum: [PENDING_PAYMENT, CONFIRMED, IN_PREPARATION, READY_FOR_PICKUP, DELIVERED, CANCELLED]
        scheduledDate:
          type: string
          format: date
```

## Components

### Authentication Service

**Responsibility:** Manages user authentication, authorization, and session management across all platform interfaces with role-based access control.

**Key Interfaces:**
- POST /auth/login - User login with email/password
- POST /auth/refresh - Token refresh for continued sessions
- GET /auth/me - Current user profile and permissions
- POST /auth/logout - Session termination and cleanup

**Dependencies:** AWS Cognito, User Service, Redis for session storage

**Technology Stack:** AWS Lambda (Node.js), Cognito User Pools, JWT tokens, bcrypt for password hashing

### Order Management Service

**Responsibility:** Handles complete order lifecycle from creation through RFID-verified delivery, including payment coordination and real-time status updates.

**Key Interfaces:**
- POST /orders - Create new meal orders with validation
- GET /orders/:id - Retrieve order details and status
- PUT /orders/:id/status - Update order progression states
- GET /orders/parent/:parentId - Parent order history
- GET /orders/school/:schoolId - School administrative view

**Dependencies:** Payment Service, RFID Service, Notification Service, Menu Service

**Technology Stack:** AWS Lambda (Node.js), PostgreSQL, Redis caching, SQS for async processing

### RFID Integration Service

**Responsibility:** Manages RFID hardware communication, delivery verification events, and real-time order confirmation with support for multiple vendor hardware.

**Key Interfaces:**
- POST /rfid/verify - Process RFID card scans
- GET /rfid/readers/:schoolId - School RFID reader status
- POST /rfid/readers/register - Hardware device registration
- GET /rfid/verification/:orderId - Delivery confirmation details

**Dependencies:** RFID Hardware APIs (Zebra, Impinj, Honeywell), Order Service, Notification Service

**Technology Stack:** AWS Lambda (Node.js), WebSocket API for real-time updates, vendor-specific SDKs

### Payment Processing Service

**Responsibility:** Handles secure payment processing, subscription management, and financial reporting with PCI DSS compliance through external gateways.

**Key Interfaces:**
- POST /payments/process - Process one-time payments
- POST /payments/subscribe - Set up recurring payments
- GET /payments/history/:userId - Payment transaction history
- POST /payments/refund - Process refunds and adjustments

**Dependencies:** Razorpay API, Stripe API, Order Service, User Service, AWS KMS for encryption

**Technology Stack:** AWS Lambda (Node.js), encrypted environment variables, webhook handlers

### Notification Service

**Responsibility:** Delivers multi-channel notifications including push, SMS, WhatsApp, and email with user preference management and delivery confirmation.

**Key Interfaces:**
- POST /notifications/send - Send immediate notifications
- POST /notifications/schedule - Schedule future notifications
- GET /notifications/preferences/:userId - User notification settings
- POST /notifications/bulk - Bulk notification delivery

**Dependencies:** AWS SNS, AWS SES, WhatsApp Business API, push notification services

**Technology Stack:** AWS Lambda (Node.js), SNS, SES, third-party messaging APIs

### Menu Management Service

**Responsibility:** Manages school menus, nutritional information, vendor coordination, and availability scheduling with support for dietary restrictions.

**Key Interfaces:**
- GET /menus/school/:schoolId - School-specific menu retrieval
- POST /menus/items - Create new menu items
- PUT /menus/items/:id - Update menu item details
- GET /menus/nutrition/:itemId - Detailed nutritional information

**Dependencies:** User Service (vendor access), File Storage (images), School Configuration

**Technology Stack:** AWS Lambda (Node.js), PostgreSQL, S3 for image storage, CloudFront CDN

### Component Diagrams

```mermaid
graph TD
    A[API Gateway] --> B[Auth Service]
    A --> C[Order Service]
    A --> D[RFID Service]
    A --> E[Payment Service]
    A --> F[Notification Service]
    A --> G[Menu Service]
    
    B --> H[Cognito]
    B --> I[Redis Cache]
    
    C --> J[PostgreSQL]
    C --> I
    C --> K[SQS Queue]
    
    D --> L[RFID Hardware APIs]
    D --> M[WebSocket API]
    
    E --> N[Razorpay API]
    E --> O[Stripe API]
    
    F --> P[SNS]
    F --> Q[SES]
    F --> R[WhatsApp API]
    
    G --> J
    G --> S[S3 Storage]
    G --> T[CloudFront CDN]
```

## External APIs

### Razorpay Payment Gateway

- **Purpose:** Primary payment processing for Indian market with UPI, cards, and digital wallets
- **Documentation:** https://razorpay.com/docs/
- **Base URL(s):** https://api.razorpay.com/v1/
- **Authentication:** Basic Auth with API key and secret
- **Rate Limits:** 600 requests per minute per API key

**Key Endpoints Used:**
- `POST /orders` - Create payment orders with amount and currency
- `POST /payments/{payment_id}/capture` - Capture authorized payments
- `GET /payments/{payment_id}` - Retrieve payment status and details
- `POST /refunds` - Process partial or full refunds

**Integration Notes:** Webhook integration for payment status updates, automatic retry logic for failed payments, compliance with Indian payment regulations

### Stripe Payment Gateway

- **Purpose:** Secondary payment processor for international payments and backup processing
- **Documentation:** https://stripe.com/docs/api
- **Base URL(s):** https://api.stripe.com/v1/
- **Authentication:** Bearer token with secret key
- **Rate Limits:** 100 requests per second per API key

**Key Endpoints Used:**
- `POST /payment_intents` - Create payment intents for secure processing
- `GET /payment_intents/{intent_id}` - Retrieve payment intent status
- `POST /refunds` - Process refunds with reason codes

**Integration Notes:** PCI DSS compliant token handling, webhook signature verification, multi-currency support for international schools

### WhatsApp Business API

- **Purpose:** Direct messaging for order confirmations, delivery updates, and customer support
- **Documentation:** https://developers.facebook.com/docs/whatsapp
- **Base URL(s):** https://graph.facebook.com/v18.0/
- **Authentication:** Bearer token with WhatsApp Business Account
- **Rate Limits:** 1000 messages per second, messaging window restrictions

**Key Endpoints Used:**
- `POST /{phone_number_id}/messages` - Send template and interactive messages
- `GET /{phone_number_id}/message_templates` - Retrieve approved message templates

**Integration Notes:** Template approval process required, 24-hour messaging window, opt-in compliance for marketing messages

### RFID Hardware Vendor APIs

- **Purpose:** Integration with RFID readers for real-time delivery verification
- **Documentation:** Vendor-specific documentation for Zebra, Impinj, Honeywell
- **Base URL(s):** Varies by vendor and deployment
- **Authentication:** Vendor-specific (API keys, certificates, or OAuth)
- **Rate Limits:** Hardware-dependent, typically 100-1000 scans per minute

**Key Endpoints Used:**
- `POST /scan/events` - Receive RFID scan events from hardware
- `GET /readers/status` - Monitor reader health and connectivity
- `POST /readers/configure` - Update reader settings and thresholds

**Integration Notes:** Hardware abstraction layer for multi-vendor support, fallback to QR codes for hardware failures, local caching for offline operation

## Core Workflows

### Parent Order Placement and RFID Verification Workflow

```mermaid
sequenceDiagram
    participant P as Parent App
    participant AG as API Gateway
    participant AUTH as Auth Service
    participant MENU as Menu Service
    participant ORDER as Order Service
    participant PAY as Payment Service
    participant RFID as RFID Service
    participant NOT as Notification Service
    participant READER as RFID Reader

    P->>AG: GET /menus/school/{schoolId}
    AG->>AUTH: Validate JWT token
    AUTH-->>AG: Token valid
    AG->>MENU: Get available menu items
    MENU-->>AG: Menu items with availability
    AG-->>P: Daily menu with nutritional info

    P->>AG: POST /orders (create order)
    AG->>AUTH: Validate JWT token
    AUTH-->>AG: Token valid
    AG->>ORDER: Create order with items
    ORDER->>PAY: Initiate payment processing
    PAY->>ORDER: Payment authorization
    ORDER-->>AG: Order created with payment pending
    AG-->>P: Order confirmation with payment URL

    P->>PAY: Complete payment (external flow)
    PAY->>ORDER: Payment confirmed webhook
    ORDER->>NOT: Send order confirmation
    NOT-->>P: Push notification + WhatsApp

    Note over READER: Student approaches with RFID card
    READER->>AG: POST /rfid/verify (scan event)
    AG->>RFID: Process verification
    RFID->>ORDER: Lookup active order
    ORDER-->>RFID: Order details and status
    RFID->>RFID: Validate delivery eligibility
    RFID-->>AG: Verification successful
    AG-->>READER: Display meal details to staff

    RFID->>ORDER: Update order status to DELIVERED
    RFID->>NOT: Send delivery confirmation
    NOT-->>P: Real-time delivery notification
    ORDER->>NOT: Send daily summary (scheduled)
```

## Database Schema

```sql
-- Core user management with role-based access
CREATE TYPE user_role AS ENUM ('PARENT', 'SCHOOL_ADMIN', 'VENDOR', 'STUDENT');
CREATE TYPE order_status AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'IN_PREPARATION', 'READY_FOR_PICKUP', 'DELIVERED', 'CANCELLED', 'REFUNDED');
CREATE TYPE verification_status AS ENUM ('SUCCESS', 'FAILED', 'MANUAL_OVERRIDE');

-- Users table with polymorphic profile support
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL,
    school_id UUID REFERENCES schools(id),
    profile JSONB NOT NULL,
    preferences JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schools with configuration and operational settings
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address JSONB NOT NULL,
    configuration JSONB DEFAULT '{}',
    subscription_tier VARCHAR(20) DEFAULT 'BASIC',
    operating_hours JSONB NOT NULL,
    contact JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu items with comprehensive nutritional data
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id),
    vendor_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    nutritional_info JSONB NOT NULL,
    pricing JSONB NOT NULL,
    allergens TEXT[],
    availability JSONB NOT NULL,
    images TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders with comprehensive tracking
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES users(id),
    student_id UUID NOT NULL REFERENCES users(id),
    school_id UUID NOT NULL REFERENCES schools(id),
    items JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status order_status DEFAULT 'PENDING_PAYMENT',
    scheduled_date DATE NOT NULL,
    delivery_window JSONB,
    payment_info JSONB,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RFID verification events
CREATE TABLE rfid_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    card_id VARCHAR(100) NOT NULL,
    reader_id VARCHAR(100) NOT NULL,
    verification_time TIMESTAMP WITH TIME ZONE NOT NULL,
    verification_status verification_status NOT NULL,
    photo_evidence TEXT,
    staff_id UUID REFERENCES users(id),
    location VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RFID cards assigned to students
CREATE TABLE rfid_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id VARCHAR(100) UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES users(id),
    school_id UUID NOT NULL REFERENCES schools(id),
    issued_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX idx_users_school_id ON users(school_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_parent_id ON orders(parent_id);
CREATE INDEX idx_orders_student_id ON orders(student_id);
CREATE INDEX idx_orders_scheduled_date ON orders(scheduled_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_menu_items_school_id ON menu_items(school_id);
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_rfid_verifications_order_id ON rfid_verifications(order_id);
CREATE INDEX idx_rfid_verifications_verification_time ON rfid_verifications(verification_time);
CREATE INDEX idx_rfid_cards_student_id ON rfid_cards(student_id);
CREATE INDEX idx_rfid_cards_card_id ON rfid_cards(card_id);

-- Functions for audit trails and automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Frontend Architecture

### Component Architecture

#### Component Organization

```
src/
├── components/
│   ├── common/               # Shared components across apps
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── RFIDStatusIndicator/
│   ├── forms/               # Form-specific components
│   │   ├── OrderForm/
│   │   ├── LoginForm/
│   │   └── ProfileForm/
│   ├── layout/              # Layout components
│   │   ├── Header/
│   │   ├── Navigation/
│   │   └── Sidebar/
│   └── domain/              # Business domain components
│       ├── order/
│       ├── menu/
│       ├── rfid/
│       └── payment/
├── screens/                 # Screen/page components
│   ├── auth/
│   ├── home/
│   ├── menu/
│   ├── orders/
│   └── profile/
├── hooks/                   # Custom React hooks
├── services/               # API client services
├── stores/                 # Zustand state stores
├── utils/                  # Utility functions
└── types/                  # TypeScript type definitions
```

#### Component Template

```typescript
import React from 'react';
import { Box, Button, Text } from 'native-base';
import { useOrderStore } from '@/stores/orderStore';
import { OrderService } from '@/services/orderService';
import type { Order, OrderStatus } from '@/types/order';

interface OrderCardProps {
  order: Order;
  onStatusUpdate?: (orderId: string, status: OrderStatus) => void;
  variant?: 'compact' | 'detailed';
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onStatusUpdate,
  variant = 'compact'
}) => {
  const { updateOrderStatus } = useOrderStore();
  
  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    try {
      await OrderService.updateStatus(order.id, newStatus);
      updateOrderStatus(order.id, newStatus);
      onStatusUpdate?.(order.id, newStatus);
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  return (
    <Box
      bg="white"
      p={4}
      rounded="lg"
      shadow={2}
      mb={3}
      testID={`order-card-${order.id}`}
    >
      <Text fontSize="lg" fontWeight="semibold">
        Order #{order.id.slice(-8)}
      </Text>
      <Text color=process.env.DOCS_ARCHITECTURE_PASSWORD_1>
        Status: {order.status}
      </Text>
      {variant === 'detailed' && (
        <Box mt={2}>
          <Text fontSize="sm">Items: {order.items.length}</Text>
          <Text fontSize="sm">Total: ₹{order.totalAmount}</Text>
        </Box>
      )}
    </Box>
  );
};
```

### State Management Architecture

#### State Structure

```typescript
// stores/orderStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Order, OrderStatus } from '@/types/order';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
}

interface OrderActions {
  fetchOrders: (parentId: string) => Promise<void>;
  createOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  clearError: () => void;
  setCurrentOrder: (order: Order | null) => void;
}

export const useOrderStore = create<OrderState & OrderActions>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        orders: [],
        currentOrder: null,
        loading: false,
        error: null,

        // Actions
        fetchOrders: async (parentId: string) => {
          set({ loading: true, error: null });
          try {
            const orders = await OrderService.getByParent(parentId);
            set({ orders, loading: false });
          } catch (error) {
            set({ error: error.message, loading: false });
          }
        },

        createOrder: async (orderData) => {
          set({ loading: true, error: null });
          try {
            const newOrder = await OrderService.create(orderData);
            set(state => ({
              orders: [...state.orders, newOrder],
              currentOrder: newOrder,
              loading: false
            }));
          } catch (error) {
            set({ error: error.message, loading: false });
          }
        },

        updateOrderStatus: (orderId: string, status: OrderStatus) => {
          set(state => ({
            orders: state.orders.map(order =>
              order.id === orderId ? { ...order, status } : order
            ),
            currentOrder: state.currentOrder?.id === orderId
              ? { ...state.currentOrder, status }
              : state.currentOrder
          }));
        },

        clearError: () => set({ error: null }),
        setCurrentOrder: (order) => set({ currentOrder: order })
      }),
      {
        name: 'order-store',
        partialize: (state) => ({
          orders: state.orders,
          currentOrder: state.currentOrder
        })
      }
    ),
    { name: 'OrderStore' }
  )
);
```

#### State Management Patterns

- **Domain-based stores:** Separate stores for orders, menu, auth, and RFID
- **Optimistic updates:** Immediate UI updates with rollback on failure
- **Persistence:** Critical data persisted with selective rehydration
- **DevTools integration:** Enhanced debugging in development
- **Computed selectors:** Derived state for complex UI requirements

### Routing Architecture

#### Route Organization

```
app/
├── (auth)/                 # Auth group layout
│   ├── login/
│   ├── register/
│   └── forgot-password/
├── (parent)/              # Parent app routes
│   ├── home/
│   ├── menu/
│   ├── orders/
│   └── profile/
├── (admin)/               # School admin routes
│   ├── dashboard/
│   ├── menu-management/
│   ├── orders/
│   └── users/
├── (vendor)/              # Vendor portal routes
│   ├── orders/
│   ├── inventory/
│   └── analytics/
└── _layout.tsx           # Root layout
```

#### Protected Route Pattern

```typescript
// components/auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-native';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types/user';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallback?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallback = '/login'
}) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to={fallback} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Usage in route configuration
<ProtectedRoute requiredRole="PARENT">
  <ParentDashboard />
</ProtectedRoute>
```

### Frontend Services Layer

#### API Client Setup

```typescript
// services/apiClient.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_URL || process.env.DOCS_ARCHITECTURE_PASSWORD_2,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for auth token
    this.client.interceptors.request.use((config) => {
      const { accessToken } = useAuthStore.getState();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });

    // Response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const { refreshToken, refreshAccessToken, logout } = useAuthStore.getState();
        
        if (error.response?.status === 401 && refreshToken) {
          try {
            await refreshAccessToken();
            // Retry original request
            return this.client(error.config);
          } catch (refreshError) {
            logout();
            throw refreshError;
          }
        }
        
        throw error;
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

#### Service Example

```typescript
// services/orderService.ts
import { apiClient } from './apiClient';
import type { Order, CreateOrderRequest, OrderStatus } from '@/types/order';

export class OrderService {
  static async getByParent(parentId: string): Promise<Order[]> {
    return apiClient.get<Order[]>(`/orders/parent/${parentId}`);
  }

  static async create(orderData: CreateOrderRequest): Promise<Order> {
    return apiClient.post<Order>('/orders', orderData);
  }

  static async updateStatus(orderId: string, status: OrderStatus): Promise<Order> {
    return apiClient.put<Order>(`/orders/${orderId}/status`, { status });
  }

  static async getById(orderId: string): Promise<Order> {
    return apiClient.get<Order>(`/orders/${orderId}`);
  }

  static async cancelOrder(orderId: string, reason?: string): Promise<void> {
    return apiClient.post(`/orders/${orderId}/cancel`, { reason });
  }

  // WebSocket connection for real-time updates
  static subscribeToOrderUpdates(orderId: string, callback: (order: Order) => void) {
    const ws = new WebSocket(`${process.env.EXPO_PUBLIC_WS_URL}/orders/${orderId}`);
    
    ws.onmessage = (event) => {
      const order = JSON.parse(event.data);
      callback(order);
    };

    return () => ws.close();
  }
}
```

## Backend Architecture

### Service Architecture

#### Function Organization

```
src/
├── functions/              # Lambda function handlers
│   ├── auth/
│   │   ├── login.ts
│   │   ├── refresh.ts
│   │   └── logout.ts
│   ├── orders/
│   │   ├── create.ts
│   │   ├── get.ts
│   │   ├── update.ts
│   │   └── list.ts
│   ├── rfid/
│   │   ├── verify.ts
│   │   ├── readers.ts
│   │   └── webhook.ts
│   └── payments/
│       ├── process.ts
│       ├── webhook.ts
│       └── refund.ts
├── services/              # Business logic services
│   ├── orderService.ts
│   ├── paymentService.ts
│   ├── rfidService.ts
│   └── notificationService.ts
├── repositories/          # Data access layer
│   ├── orderRepository.ts
│   ├── userRepository.ts
│   └── menuRepository.ts
├── middleware/            # Express/Lambda middleware
│   ├── auth.ts
│   ├── validation.ts
│   ├── errorHandler.ts
│   └── cors.ts
├── utils/                # Utility functions
│   ├── logger.ts
│   ├── encryption.ts
│   └── validators.ts
└── types/                # Shared TypeScript types
    ├── api.ts
    ├── database.ts
    └── external.ts
```

#### Function Template

```typescript
// functions/orders/create.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { validateRequest } from '@/middleware/validation';
import { authenticateUser } from '@/middleware/auth';
import { orderService } from '@/services/orderService';
import { logger } from '@/utils/logger';
import { CreateOrderRequest, CreateOrderResponse } from '@/types/api';

export const handler: APIGatewayProxyHandler = async (event, context) => {
  const correlationId = context.awsRequestId;
  logger.setContext({ correlationId });

  try {
    // Authentication
    const user = await authenticateUser(event);
    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    // Validation
    const orderData = validateRequest<CreateOrderRequest>(event.body, 'CreateOrder');

    // Business logic
    const order = await orderService.createOrder({
      ...orderData,
      parentId: user.id,
      schoolId: user.schoolId
    });

    logger.info('Order created successfully', { orderId: order.id, parentId: user.id });

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ order })
    };

  } catch (error) {
    logger.error('Failed to create order', { error: error.message, stack: error.stack });
    
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'Internal server error',
          correlationId
        }
      })
    };
  }
};
```

### Database Architecture

#### Schema Design

```sql
-- Already provided in Database Schema section above
-- Key design principles:
-- 1. UUID primary keys for distributed system compatibility
-- 2. JSONB for flexible configuration and metadata
-- 3. Enum types for controlled vocabularies
-- 4. Comprehensive indexing for query performance
-- 5. Audit trails with created_at/updated_at timestamps
-- 6. Foreign key constraints for data integrity
```

#### Data Access Layer

```typescript
// repositories/orderRepository.ts
import { Pool } from 'pg';
import { Order, OrderStatus, CreateOrderData } from '@/types/database';
import { logger } from '@/utils/logger';

export class OrderRepository {
  constructor(private db: Pool) {}

  async create(orderData: CreateOrderData): Promise<Order> {
    const query = `
      INSERT INTO orders (
        parent_id, student_id, school_id, items, 
        total_amount, scheduled_date, delivery_window
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      orderData.parentId,
      orderData.studentId,
      orderData.schoolId,
      JSON.stringify(orderData.items),
      orderData.totalAmount,
      orderData.scheduledDate,
      JSON.stringify(orderData.deliveryWindow)
    ];

    try {
      const result = await this.db.query(query, values);
      logger.info('Order created in database', { orderId: result.rows[0].id });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create order in database', { error: error.message });
      throw error;
    }
  }

  async findById(orderId: string): Promise<Order | null> {
    const query = 'SELECT * FROM orders WHERE id = $1';
    const result = await this.db.query(query, [orderId]);
    return result.rows[0] || null;
  }

  async findByParent(parentId: string, limit = 50, offset = 0): Promise<Order[]> {
    const query = `
      SELECT * FROM orders 
      WHERE parent_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    const result = await this.db.query(query, [parentId, limit, offset]);
    return result.rows;
  }

  async updateStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const query = `
      UPDATE orders 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await this.db.query(query, [status, orderId]);
    
    if (result.rows.length === 0) {
      throw new Error('Order not found');
    }
    
    return result.rows[0];
  }

  async findOrdersForDelivery(schoolId: string, date: string): Promise<Order[]> {
    const query = `
      SELECT o.*, u.profile as student_profile
      FROM orders o
      JOIN users u ON o.student_id = u.id
      WHERE o.school_id = $1 
        AND o.scheduled_date = $2 
        AND o.status IN ('CONFIRMED', 'IN_PREPARATION', 'READY_FOR_PICKUP')
      ORDER BY o.delivery_window->>'start'
    `;
    const result = await this.db.query(query, [schoolId, date]);
    return result.rows;
  }
}
```

### Authentication and Authorization

#### Auth Flow

```mermaid
sequenceDiagram
    participant Client as Client App
    participant AG as API Gateway
    participant AUTH as Auth Lambda
    participant COGNITO as AWS Cognito
    participant CACHE as Redis Cache

    Client->>AG: POST /auth/login
    AG->>AUTH: Forward request
    AUTH->>COGNITO: Validate credentials
    COGNITO-->>AUTH: User data + tokens
    AUTH->>CACHE: Store session data
    AUTH-->>AG: JWT access + refresh tokens
    AG-->>Client: Auth response

    Note over Client: Subsequent API calls
    Client->>AG: API request + JWT
    AG->>AUTH: Validate JWT
    AUTH->>CACHE: Check session validity
    CACHE-->>AUTH: Session status
    AUTH-->>AG: User context
    AG->>Service: Forward with user context
```

#### Middleware/Guards

```typescript
// middleware/auth.ts
import { APIGatewayProxyEvent } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { redisClient } from '@/utils/redis';
import { User } from '@/types/database';
import { logger } from '@/utils/logger';

const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: 'access',
  clientId: process.env.COGNITO_CLIENT_ID!,
});

export async function authenticateUser(event: APIGatewayProxyEvent): Promise<User | null> {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    // Verify JWT signature and claims
    const payload = await jwtVerifier.verify(token);
    
    // Check session validity in Redis
    const sessionKey = `session:${payload.sub}`;
    const sessionData = await redisClient.get(sessionKey);
    
    if (!sessionData) {
      logger.warn('Session not found or expired', { userId: payload.sub });
      return null;
    }

    const session = JSON.parse(sessionData);
    
    // Extend session TTL on active use
    await redisClient.expire(sessionKey, 3600); // 1 hour

    return {
      id: payload.sub,
      email: payload.email,
      role: session.role,
      schoolId: session.schoolId,
      ...session.profile
    };

  } catch (error) {
    logger.error('JWT verification failed', { error: error.message });
    return null;
  }
}

export function requireRole(requiredRole: string) {
  return (user: User | null) => {
    if (!user) {
      throw new Error('Authentication required');
    }
    
    if (user.role !== requiredRole) {
      throw new Error('Insufficient permissions');
    }
    
    return user;
  };
}

// Usage in Lambda functions
export const requireParent = requireRole('PARENT');
export const requireSchoolAdmin = requireRole('SCHOOL_ADMIN');
export const requireVendor = requireRole('VENDOR');
```

## Unified Project Structure

```
hasivu-platform/
├── .github/                    # CI/CD workflows
│   └── workflows/
│       ├── ci.yaml
│       ├── deploy-staging.yaml
│       └── deploy-production.yaml
├── apps/                       # Application packages
│   ├── mobile/                 # React Native parent app
│   │   ├── src/
│   │   │   ├── components/     # UI components
│   │   │   ├── screens/        # Screen components
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── services/       # API client services
│   │   │   ├── stores/         # Zustand state stores
│   │   │   ├── navigation/     # Navigation configuration
│   │   │   ├── styles/         # Themes and styling
│   │   │   └── utils/          # Mobile utilities
│   │   ├── android/            # Android-specific code
│   │   ├── ios/                # iOS-specific code
│   │   ├── __tests__/          # Mobile app tests
│   │   ├── app.json
│   │   └── package.json
│   ├── web-admin/              # Next.js school admin portal
│   │   ├── src/
│   │   │   ├── components/     # Admin UI components
│   │   │   ├── pages/          # Next.js pages
│   │   │   ├── hooks/          # Admin-specific hooks
│   │   │   ├── services/       # Admin API services
│   │   │   ├── stores/         # Admin state management
│   │   │   ├── styles/         # Admin styling
│   │   │   └── utils/          # Admin utilities
│   │   ├── public/             # Static assets
│   │   ├── __tests__/          # Admin portal tests
│   │   ├── next.config.js
│   │   └── package.json
│   ├── web-vendor/             # Next.js vendor portal
│   │   ├── src/
│   │   │   ├── components/     # Vendor UI components
│   │   │   ├── pages/          # Vendor pages
│   │   │   ├── hooks/          # Vendor hooks
│   │   │   ├── services/       # Vendor API services
│   │   │   ├── stores/         # Vendor state
│   │   │   └── utils/          # Vendor utilities
│   │   ├── __tests__/          # Vendor portal tests
│   │   └── package.json
│   └── api/                    # Backend Lambda functions
│       ├── src/
│       │   ├── functions/      # Lambda handlers
│       │   │   ├── auth/
│       │   │   ├── orders/
│       │   │   ├── menu/
│       │   │   ├── rfid/
│       │   │   ├── payments/
│       │   │   └── notifications/
│       │   ├── services/       # Business logic
│       │   ├── repositories/   # Data access layer
│       │   ├── middleware/     # Lambda middleware
│       │   ├── utils/          # Backend utilities
│       │   └── types/          # Backend types
│       ├── __tests__/          # Backend tests
│       ├── serverless.yml      # Serverless configuration
│       └── package.json
├── packages/                   # Shared packages
│   ├── shared/                 # Shared types/utilities
│   │   ├── src/
│   │   │   ├── types/          # TypeScript interfaces
│   │   │   │   ├── user.ts
│   │   │   │   ├── order.ts
│   │   │   │   ├── menu.ts
│   │   │   │   └── rfid.ts
│   │   │   ├── constants/      # Shared constants
│   │   │   ├── utils/          # Shared utilities
│   │   │   └── validation/     # Shared validation schemas
│   │   └── package.json
│   ├── ui/                     # Shared UI components
│   │   ├── src/
│   │   │   ├── components/     # Cross-platform components
│   │   │   ├── themes/         # Design system tokens
│   │   │   ├── icons/          # Custom icons
│   │   │   └── styles/         # Shared styling
│   │   └── package.json
│   └── config/                 # Shared configuration
│       ├── eslint/
│       │   └── index.js
│       ├── typescript/
│       │   ├── base.json
│       │   ├── react.json
│       │   └── node.json
│       └── jest/
│           └── jest.config.js
├── infrastructure/             # Terraform IaC
│   ├── environments/
│   │   ├── dev/
│   │   ├── staging/
│   │   └── production/
│   ├── modules/
│   │   ├── api-gateway/
│   │   ├── lambda/
│   │   ├── rds/
│   │   ├── cognito/
│   │   └── s3/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── scripts/                    # Build/deploy scripts
│   ├── build.sh
│   ├── test.sh
│   ├── deploy.sh
│   └── seed-db.js
├── docs/                       # Documentation
│   ├── brief.md
│   ├── prd.md
│   ├── front-end-spec.md
│   ├── architecture.md
│   ├── api-docs/
│   └── deployment-guide.md
├── .env.example                # Environment template
├── package.json                # Root package.json with workspaces
├── turbo.json                  # Turborepo configuration
├── tsconfig.json               # Root TypeScript config
├── .gitignore
└── README.md
```

## Development Workflow

### Local Development Setup

#### Prerequisites

```bash
# Install Node.js 18+ and npm
node --version  # Should be 18+
npm --version   # Should be 9+

# Install global dependencies
npm install -g @aws-cdk/cli
npm install -g serverless
npm install -g @expo/cli
npm install -g turbo

# Install PostgreSQL and Redis locally
brew install postgresql redis  # macOS
# or use Docker
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=dev postgres:15
docker run -d -p 6379:6379 redis:7
```

#### Initial Setup

```bash
# Clone repository
git clone https://github.com/your-org/hasivu-platform.git
cd hasivu-platform

# Install all dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your local database and API keys

# Initialize database
npm run db:setup
npm run db:migrate
npm run db:seed

# Build shared packages
turbo build --filter=@hasivu/shared
turbo build --filter=@hasivu/ui
```

#### Development Commands

```bash
# Start all services (mobile, web admin, web vendor, API)
npm run dev

# Start individual services
npm run dev:mobile      # React Native with Expo
npm run dev:admin       # Next.js admin portal on :3000
npm run dev:vendor      # Next.js vendor portal on :3001
npm run dev:api         # Serverless offline on :3002

# Run tests
npm run test            # All tests
npm run test:mobile     # Mobile app tests
npm run test:api        # Backend API tests
npm run test:e2e        # End-to-end tests

# Database operations
npm run db:reset        # Reset and reseed database
npm run db:migrate      # Run pending migrations
npm run db:seed         # Seed with test data
```

### Environment Configuration

#### Required Environment Variables

```bash
# Frontend (.env.local)
EXPO_PUBLIC_API_URL=http://localhost:3002
EXPO_PUBLIC_WS_URL=ws://localhost:3002
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn

# Backend (.env)
DATABASE_URL=postgresql://postgres:dev@localhost:5432/hasivu_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_min_32_chars
AWS_REGION=ap-south-1
COGNITO_USER_POOL_ID=your_cognito_pool_id
COGNITO_CLIENT_ID=your_cognito_client_id

# Payment gateways
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# External APIs
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# Shared
NODE_ENV=development
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,exp://192.168.1.100:8081
```

## Deployment Architecture

### Deployment Strategy

**Frontend Deployment:**
- **Platform:** Vercel for web portals, EAS Build + App Store/Play Store for mobile
- **Build Command:** `turbo build --filter=@hasivu/web-admin --filter=@hasivu/web-vendor`
- **Output Directory:** `apps/web-admin/dist`, `apps/web-vendor/dist`
- **CDN/Edge:** Vercel Edge Network with global CDN, CloudFront for mobile assets

**Backend Deployment:**
- **Platform:** AWS Lambda via Serverless Framework with API Gateway
- **Build Command:** `turbo build --filter=@hasivu/api`
- **Deployment Method:** Blue-green deployment with automatic rollback on failure

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build packages
        run: turbo build --filter=@hasivu/shared --filter=@hasivu/ui

      - name: Run tests
        run: turbo test
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379

      - name: Run E2E tests
        run: turbo test:e2e
        if: github.ref == 'refs/heads/main'

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to staging
        run: |
          npm run deploy:staging
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        run: |
          npm run deploy:production
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID_PROD }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY_PROD }}
```

### Environments

| Environment | Frontend URL | Backend URL | Purpose |
|-------------|--------------|-------------|---------|
| Development | http://localhost:3000 | http://localhost:3002 | Local development |
| Staging | https://staging-admin.hasivu.com | https://staging-api.hasivu.com | Pre-production testing |
| Production | https://admin.hasivu.com | https://api.hasivu.com | Live environment |

## Security and Performance

### Security Requirements

**Frontend Security:**
- CSP Headers: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.hasivu.com wss://api.hasivu.com`
- XSS Prevention: React's built-in XSS protection, input sanitization, Content Security Policy
- Secure Storage: Secure keystore for tokens on mobile, httpOnly cookies for web, no sensitive data in localStorage

**Backend Security:**
- Input Validation: Joi schema validation for all API inputs, SQL injection prevention with parameterized queries
- Rate Limiting: 100 requests per minute per IP, 1000 requests per hour per authenticated user
- CORS Policy: Restricted to known frontend origins, credentials allowed only for same-origin requests

**Authentication Security:**
- Token Storage: JWT access tokens (15min expiry), refresh tokens (7 days), secure httpOnly cookies for web
- Session Management: Redis-based session store, automatic session cleanup, concurrent session limits
- Password Policy: Minimum 8 characters, complexity requirements, bcrypt hashing with 12 rounds

### Performance Optimization

**Frontend Performance:**
- Bundle Size Target: <500KB initial bundle, <2MB total application size
- Loading Strategy: Route-based code splitting, lazy loading of non-critical components, progressive image loading
- Caching Strategy: Service worker for offline functionality, API response caching, static asset caching with versioning

**Backend Performance:**
- Response Time Target: <200ms for API endpoints, <100ms for health checks, <2s for complex RFID operations
- Database Optimization: Connection pooling, query optimization with EXPLAIN analysis, strategic indexing
- Caching Strategy: Redis for session data and frequently accessed data, CloudFront for static assets, API response caching

## Testing Strategy

### Testing Pyramid

```
                E2E Tests
               /        \
          Integration Tests
             /            \
        Frontend Unit  Backend Unit
```

### Test Organization

#### Frontend Tests

```
apps/mobile/__tests__/
├── components/          # Component unit tests
│   ├── OrderCard.test.tsx
│   ├── MenuList.test.tsx
│   └── RFIDStatus.test.tsx
├── screens/            # Screen integration tests
│   ├── HomeScreen.test.tsx
│   └── OrderScreen.test.tsx
├── services/           # API service tests
│   ├── orderService.test.ts
│   └── authService.test.ts
├── stores/             # State management tests
│   ├── orderStore.test.ts
│   └── authStore.test.ts
└── utils/              # Utility function tests
    ├── validation.test.ts
    └── formatting.test.ts
```

#### Backend Tests

```
apps/api/__tests__/
├── functions/          # Lambda function tests
│   ├── auth/
│   │   ├── login.test.ts
│   │   └── refresh.test.ts
│   ├── orders/
│   │   ├── create.test.ts
│   │   ├── get.test.ts
│   │   └── update.test.ts
│   └── rfid/
│       └── verify.test.ts
├── services/           # Business logic tests
│   ├── orderService.test.ts
│   ├── paymentService.test.ts
│   └── rfidService.test.ts
├── repositories/       # Data access tests
│   ├── orderRepository.test.ts
│   └── userRepository.test.ts
└── integration/        # API integration tests
    ├── orderFlow.test.ts
    └── authFlow.test.ts
```

#### E2E Tests

```
e2e/
├── specs/
│   ├── parent-order-flow.spec.ts
│   ├── admin-menu-management.spec.ts
│   ├── vendor-order-processing.spec.ts
│   └── rfid-delivery-flow.spec.ts
├── fixtures/
│   ├── users.json
│   ├── schools.json
│   └── menu-items.json
├── page-objects/
│   ├── LoginPage.ts
│   ├── HomePage.ts
│   └── OrderPage.ts
└── utils/
    ├── test-data.ts
    └── api-helpers.ts
```

### Test Examples

#### Frontend Component Test

```typescript
// apps/mobile/__tests__/components/OrderCard.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NativeBaseProvider } from 'native-base';
import { OrderCard } from '@/components/order/OrderCard';
import { Order } from '@hasivu/shared/types';

const mockOrder: Order = {
  id: process.env.DOCS_ARCHITECTURE_PASSWORD_3,
  parentId: process.env.DOCS_ARCHITECTURE_PASSWORD_4,
  studentId: process.env.DOCS_ARCHITECTURE_PASSWORD_5,
  schoolId: process.env.DOCS_ARCHITECTURE_PASSWORD_6,
  items: [
    {
      menuItemId: 'item-1',
      quantity: 1,
      unitPrice: 50,
      customizations: []
    }
  ],
  totalAmount: 50,
  status: 'CONFIRMED',
  scheduledDate: new Date('2025-08-03'),
  deliveryWindow: { start: '12:00', end: '13:00' },
  paymentInfo: { method: process.env.DOCS_ARCHITECTURE_PASSWORD_7, transactionId: 'txn-123' },
  createdAt: new Date(),
  updatedAt: new Date()
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <NativeBaseProvider>{component}</NativeBaseProvider>
  );
};

describe('OrderCard', () => {
  it('should display order information correctly', () => {
    const { getByText, getByTestId } = renderWithProviders(
      <OrderCard order={mockOrder} variant="detailed" />
    );

    expect(getByText('Order #74000')).toBeTruthy(); // Last 8 chars of ID
    expect(getByText('Status: CONFIRMED')).toBeTruthy();
    expect(getByText('Items: 1')).toBeTruthy();
    expect(getByText('Total: ₹50')).toBeTruthy();
    expect(getByTestId(`order-card-${mockOrder.id}`)).toBeTruthy();
  });

  it('should call onStatusUpdate when status changes', async () => {
    const mockOnStatusUpdate = jest.fn();
    const { getByText } = renderWithProviders(
      <OrderCard 
        order={mockOrder} 
        onStatusUpdate={mockOnStatusUpdate}
        variant="detailed" 
      />
    );

    // Assuming there's a status update button (would need to be added to component)
    const updateButton = getByText('Mark Delivered');
    fireEvent.press(updateButton);

    await waitFor(() => {
      expect(mockOnStatusUpdate).toHaveBeenCalledWith(mockOrder.id, 'DELIVERED');
    });
  });
});
```

#### Backend API Test

```typescript
// apps/api/__tests__/functions/orders/create.test.ts
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { handler } from '@/functions/orders/create';
import { orderService } from '@/services/orderService';
import { authenticateUser } from '@/middleware/auth';

// Mock dependencies
jest.mock('@/services/orderService');
jest.mock('@/middleware/auth');

const mockOrderService = orderService as jest.Mocked<typeof orderService>;
const mockAuthenticateUser = authenticateUser as jest.MockedFunction<typeof authenticateUser>;

describe('Create Order Lambda', () => {
  const mockEvent: APIGatewayProxyEvent = {
    httpMethod: 'POST',
    path: '/orders',
    headers: {
      'Authorization': 'Bearer valid-token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      studentId: process.env.DOCS_ARCHITECTURE_PASSWORD_8,
      items: [
        {
          menuItemId: 'item-1',
          quantity: 1,
          unitPrice: 50
        }
      ],
      scheduledDate: '2025-08-03',
      deliveryWindow: { start: '12:00', end: '13:00' }
    }),
    isBase64Encoded: false,
    pathParameters: null,
    queryStringParameters: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: ''
  };

  const mockContext: Context = {
    awsRequestId: 'test-request-id',
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'create-order',
    functionVersion: '1',
    invokedFunctionArn: process.env.DOCS_ARCHITECTURE_PASSWORD_9,
    logGroupName: '/aws/lambda/create-order',
    logStreamName: 'test-stream',
    memoryLimitInMB: '256',
    getRemainingTimeInMillis: () => 30000,
    done: jest.fn(),
    fail: jest.fn(),
    succeed: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create order successfully for authenticated user', async () => {
    // Setup mocks
    mockAuthenticateUser.mockResolvedValue({
      id: process.env.DOCS_ARCHITECTURE_PASSWORD_10,
      email: 'parent@example.com',
      role: 'PARENT',
      schoolId: process.env.DOCS_ARCHITECTURE_PASSWORD_11,
      profile: { firstName: 'John', lastName: 'Doe' },
      preferences: { language: 'en' },
      isActive: true,
      createdAt: new Date(),
      lastLoginAt: new Date()
    });

    mockOrderService.createOrder.mockResolvedValue({
      id: process.env.DOCS_ARCHITECTURE_PASSWORD_12,
      parentId: process.env.DOCS_ARCHITECTURE_PASSWORD_13,
      studentId: process.env.DOCS_ARCHITECTURE_PASSWORD_14,
      schoolId: process.env.DOCS_ARCHITECTURE_PASSWORD_15,
      items: [{ menuItemId: 'item-1', quantity: 1, unitPrice: 50, customizations: [] }],
      totalAmount: 50,
      status: 'PENDING_PAYMENT',
      scheduledDate: new Date('2025-08-03'),
      deliveryWindow: { start: '12:00', end: '13:00' },
      paymentInfo: { method: 'PENDING', transactionId: null },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Execute handler
    const result = await handler(mockEvent, mockContext, jest.fn());

    // Assertions
    expect(result.statusCode).toBe(201);
    expect(JSON.parse(result.body)).toHaveProperty('order');
    expect(mockOrderService.createOrder).toHaveBeenCalledWith({
      studentId: process.env.DOCS_ARCHITECTURE_PASSWORD_16,
      items: [{ menuItemId: 'item-1', quantity: 1, unitPrice: 50 }],
      scheduledDate: '2025-08-03',
      deliveryWindow: { start: '12:00', end: '13:00' },
      parentId: process.env.DOCS_ARCHITECTURE_PASSWORD_17,
      schoolId: process.env.DOCS_ARCHITECTURE_PASSWORD_18
    });
  });

  it('should return 401 for unauthenticated requests', async () => {
    mockAuthenticateUser.mockResolvedValue(null);

    const result = await handler(mockEvent, mockContext, jest.fn());

    expect(result.statusCode).toBe(401);
    expect(JSON.parse(result.body)).toEqual({ error: 'Unauthorized' });
    expect(mockOrderService.createOrder).not.toHaveBeenCalled();
  });
});
```

#### E2E Test

```typescript
// e2e/specs/parent-order-flow.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { HomePage } from '../page-objects/HomePage';
import { MenuPage } from '../page-objects/MenuPage';
import { OrderPage } from '../page-objects/OrderPage';

test.describe('Parent Order Flow', () => {
  let loginPage: LoginPage;
  let homePage: HomePage;
  let menuPage: MenuPage;
  let orderPage: OrderPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    homePage = new HomePage(page);
    menuPage = new MenuPage(page);
    orderPage = new OrderPage(page);

    await page.goto('/');
  });

  test('should complete full order flow from login to confirmation', async ({ page }) => {
    // Step 1: Login as parent
    await loginPage.login(process.env.DOCS_ARCHITECTURE_PASSWORD_19, process.env.DOCS_ARCHITECTURE_PASSWORD_20);
    await expect(page).toHaveURL('/home');

    // Step 2: Navigate to menu
    await homePage.goToMenu();
    await expect(page).toHaveURL('/menu');

    // Step 3: Browse and select items
    await menuPage.selectMenuItem('Chicken Biryani');
    await menuPage.selectMenuItem('Fresh Juice');

    // Step 4: Add to cart and proceed to checkout
    await menuPage.addToCart();
    await menuPage.goToCheckout();

    // Step 5: Complete order details
    await orderPage.selectDeliveryTime('12:30 PM');
    await orderPage.selectChild('Aditi Sharma');
    await orderPage.addSpecialInstructions('No spicy food');

    // Step 6: Process payment
    await orderPage.selectPaymentMethod('UPI');
    await orderPage.completePayment();

    // Step 7: Verify order confirmation
    await expect(page.locator('.order-confirmation')).toBeVisible();
    await expect(page.locator('.order-number')).toContainText('Order #');
    
    // Step 8: Verify order appears in order history
    await homePage.goToOrders();
    await expect(page.locator('.order-card').first()).toContainText('CONFIRMED');
  });

  test('should handle RFID delivery verification', async ({ page }) => {
    // This test would simulate the RFID verification flow
    // In a real scenario, this might involve API mocking or separate hardware simulation
    
    await loginPage.login(process.env.DOCS_ARCHITECTURE_PASSWORD_21, process.env.DOCS_ARCHITECTURE_PASSWORD_22);
    await homePage.goToOrders();
    
    const orderCard = page.locator('.order-card').first();
    await expect(orderCard).toContainText('READY_FOR_PICKUP');
    
    // Simulate RFID scan (this would typically be triggered by external hardware)
    await page.evaluate(() => {
      // Mock WebSocket message for RFID verification
      window.dispatchEvent(new CustomEvent('rfid-verified', {
        detail: { orderId: 'test-order-id', status: 'DELIVERED' }
      }));
    });

    // Verify UI updates
    await expect(orderCard).toContainText('DELIVERED');
    await expect(page.locator('.delivery-confirmation')).toBeVisible();
  });
});
```

## Coding Standards

### Critical Fullstack Rules

- **Type Sharing:** Always define types in packages/shared and import from there - prevents frontend/backend type drift
- **API Calls:** Never make direct HTTP calls - use the service layer to ensure consistent error handling and retry logic
- **Environment Variables:** Access only through config objects, never process.env directly - enables runtime validation and type safety
- **Error Handling:** All API routes must use the standard error handler - ensures consistent error response format across all endpoints
- **State Updates:** Never mutate state directly - use proper state management patterns to prevent React rendering issues
- **Database Access:** Always use repository pattern, never direct SQL in business logic - enables testing and future database changes
- **Authentication:** Every protected route must use middleware, never inline auth checks - ensures consistent security across all endpoints
- **File Uploads:** Always validate file types and sizes, use pre-signed URLs for direct S3 upload - prevents security vulnerabilities and reduces server load

### Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `UserProfile.tsx` |
| Hooks | camelCase with 'use' | - | `useAuth.ts` |
| API Routes | - | kebab-case | `/api/user-profile` |
| Database Tables | - | snake_case | `user_profiles` |
| Constants | SCREAMING_SNAKE_CASE | SCREAMING_SNAKE_CASE | `MAX_ORDER_ITEMS` |
| Files | kebab-case | kebab-case | `order-service.ts` |
| Variables | camelCase | camelCase | `currentUser` |
| Functions | camelCase | camelCase | `createOrder()` |

## Error Handling Strategy

### Error Flow

```mermaid
sequenceDiagram
    participant Client as Client App
    participant API as API Gateway
    participant Lambda as Lambda Function
    participant Service as Business Service
    participant DB as Database

    Client->>API: Request with invalid data
    API->>Lambda: Forward request
    Lambda->>Service: Process request
    Service->>DB: Query database
    DB-->>Service: Database error
    Service-->>Lambda: Throw BusinessError
    Lambda-->>API: Format error response
    API-->>Client: Standard error format

    Client->>Client: Handle error in UI
    Client->>Client: Show user-friendly message
    Client->>Client: Log error for debugging
```

### Error Response Format

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
}
```

### Frontend Error Handling

```typescript
// utils/errorHandler.ts
import { logger } from './logger';

export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: any): ApiError {
  if (error.response?.data?.error) {
    const { code, message, details } = error.response.data.error;
    return new ApiError(code, message, error.response.status, details);
  }

  if (error.code === 'NETWORK_ERROR') {
    return new ApiError(
      'NETWORK_ERROR',
      'Please check your internet connection',
      0
    );
  }

  return new ApiError(
    'UNKNOWN_ERROR',
    'An unexpected error occurred',
    500
  );
}

export function getErrorMessage(error: ApiError): string {
  const errorMessages: Record<string, string> = {
    UNAUTHORIZED: 'Please log in to continue',
    FORBIDDEN: 'You don\'t have permission to perform this action',
    ORDER_NOT_FOUND: 'Order not found',
    PAYMENT_FAILED: 'Payment could not be processed',
    RFID_SCAN_FAILED: 'Unable to verify delivery. Please try again.',
    NETWORK_ERROR: 'Please check your internet connection',
    VALIDATION_ERROR: 'Please check your input and try again'
  };

  return errorMessages[error.code] || error.message;
}

// Usage in components
export function useErrorHandler() {
  const showNotification = useNotificationStore(state => state.show);

  return (error: any) => {
    const apiError = handleApiError(error);
    const userMessage = getErrorMessage(apiError);
    
    logger.error('API Error', {
      code: apiError.code,
      message: apiError.message,
      statusCode: apiError.statusCode,
      details: apiError.details
    });

    showNotification({
      type: 'error',
      message: userMessage,
      duration: 5000
    });
  };
}
```

### Backend Error Handling

```typescript
// utils/errorHandler.ts
import { APIGatewayProxyResult } from 'aws-lambda';
import { logger } from './logger';

export class BusinessError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'BusinessError';
  }
}

export class ValidationError extends BusinessError {
  constructor(message: string, details?: Record<string, any>) {
    super(process.env.DOCS_ARCHITECTURE_PASSWORD_23, message, 400, details);
  }
}

export class NotFoundError extends BusinessError {
  constructor(resource: string, id?: string) {
    super(
      'NOT_FOUND',
      `${resource}${id ? ` with id ${id}` : ''} not found`,
      404
    );
  }
}

export class UnauthorizedError extends BusinessError {
  constructor(message: string = 'Authentication required') {
    super(process.env.DOCS_ARCHITECTURE_PASSWORD_24, message, 401);
  }
}

export class ForbiddenError extends BusinessError {
  constructor(message: string = 'Insufficient permissions') {
    super(process.env.DOCS_ARCHITECTURE_PASSWORD_25, message, 403);
  }
}

export function handleError(error: any, requestId: string): APIGatewayProxyResult {
  logger.error('Request failed', {
    error: error.message,
    stack: error.stack,
    requestId
  });

  if (error instanceof BusinessError) {
    return {
      statusCode: error.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          timestamp: new Date().toISOString(),
          requestId
        }
      })
    };
  }

  // Log unexpected errors but don't expose internal details
  return {
    statusCode: 500,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred',
        timestamp: new Date().toISOString(),
        requestId
      }
    })
  };
}

// Usage in Lambda functions
export const createOrderHandler = async (event: APIGatewayProxyEvent, context: Context) => {
  try {
    // Business logic here
    const result = await orderService.createOrder(orderData);
    
    return {
      statusCode: 201,
      body: JSON.stringify({ order: result })
    };
  } catch (error) {
    return handleError(error, context.awsRequestId);
  }
};
```

## Monitoring and Observability

### Monitoring Stack

- **Frontend Monitoring:** Sentry for error tracking, Vercel Analytics for web performance, Expo Analytics for mobile
- **Backend Monitoring:** CloudWatch for Lambda metrics, Sentry for error tracking, X-Ray for distributed tracing
- **Error Tracking:** Sentry across all applications with unified error reporting and alerting
- **Performance Monitoring:** CloudWatch for backend performance, Core Web Vitals tracking for frontend

### Key Metrics

**Frontend Metrics:**
- Core Web Vitals (LCP, FID, CLS)
- JavaScript errors and crash rates
- API response times from client perspective
- User interactions and conversion rates

**Backend Metrics:**
- Request rate (requests per second)
- Error rate (percentage of failed requests)
- Response time (95th percentile latency)
- Database query performance and connection pool utilization

---

*Generated using BMad Method - Architect Agent*
*Document Version: 1.0*
*Created: August 2, 2025*

## Next Steps

This comprehensive architecture document provides the complete technical foundation for HASIVU Platform development. All major system components, data models, APIs, and deployment strategies are defined with sufficient detail for AI-driven implementation.

**Ready for Development:** The architecture enables immediate development team kickoff with clear guidance on technology choices, coding standards, and implementation patterns.

**Key Implementation Priorities:**
1. **Backend Foundation** - Lambda functions, database schema, authentication
2. **Frontend Applications** - React Native mobile app, Next.js admin portals  
3. **RFID Integration** - Hardware abstraction layer and verification workflows
4. **Payment Processing** - PCI-compliant gateway integration
5. **DevOps Pipeline** - CI/CD automation and monitoring setup