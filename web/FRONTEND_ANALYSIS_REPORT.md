# HASIVU Platform - Frontend Codebase Analysis Report

**Generated**: October 22, 2025  
**Codebase Directory**: `/Users/mahesha/Downloads/hasivu-platform/web`  
**Framework**: Next.js 13.4.12 with TypeScript  
**UI Library**: Radix UI (shadcn/ui components)

---

## 1. PROJECT STRUCTURE ANALYSIS

### Directory Organization

```
src/
├── app/                          # Next.js 13 App Router
│   ├── (parent)/                # Parent portal routes
│   ├── admin/                    # Admin dashboard routes
│   ├── api/                      # API routes (44 endpoints)
│   ├── auth/                     # Authentication routes (login, register, password reset)
│   ├── dashboard/                # Role-specific dashboards (6+ variants)
│   ├── kitchen/                  # Kitchen management routes
│   ├── orders/                   # Order management routes
│   ├── menu/                     # Menu browsing page
│   └── [other-features]/         # Additional feature routes
│
├── components/                   # React components (254 .tsx files)
│   ├── meal-ordering/            # Core meal ordering components
│   ├── ui/                       # shadcn/ui components (70 components)
│   ├── layout/                   # Layout components
│   ├── mobile/                   # Mobile-specific optimizations
│   ├── notifications/            # Notification system
│   ├── auth/                     # Authentication components
│   ├── dashboard/                # Dashboard components
│   ├── orders/                   # Order management UI
│   ├── payment/                  # Payment components
│   └── [domain-specific]/        # Feature-specific components
│
├── types/                        # TypeScript type definitions (2215 lines)
│   ├── auth.ts                   # Authentication types
│   ├── orders.ts                 # Order types
│   ├── menu.ts                   # Menu types
│   ├── cart.ts                   # Shopping cart types
│   ├── dashboard.ts              # Dashboard types
│   └── [domain-types]/           # Feature-specific types
│
├── hooks/                        # Custom React hooks (9+ hooks)
│   ├── useAuth.ts               # Authentication hook
│   ├── useApiIntegration.ts      # API integration hook
│   ├── useMobileLayout.ts        # Mobile layout hook
│   ├── useFeatureFlag.ts         # Feature flags hook
│   └── [other-hooks]/
│
├── services/                     # Business logic & API services (15+ services)
│   ├── api/                      # API client configuration
│   ├── auth-api.service.ts       # Authentication API
│   ├── menu-api.service.ts       # Menu API
│   ├── order-api.service.ts      # Order API
│   ├── payment.service.ts        # Payment integration
│   └── [domain-services]/
│
├── contexts/                     # React Context providers
│   ├── AuthContext.tsx           # Authentication context
│   ├── CartContext.tsx           # Shopping cart context
│   ├── SocketContext.tsx         # WebSocket context
│   └── [provider-contexts]/
│
├── lib/                          # Utility libraries
│   ├── api/                      # API utilities
│   ├── middleware/               # Middleware functions
│   ├── security/                 # Security utilities
│   ├── monitoring/               # Monitoring & logging
│   └── utils.ts
│
├── store/                        # Redux store configuration
│   └── slices/                   # Redux slices
│
├── styles/                       # Global styles
│
├── utils/                        # General utilities
│
└── middleware/                   # Next.js middleware
```

### Key Pages & Routes

| Route                  | File                                                                            | Purpose                   |
| ---------------------- | ------------------------------------------------------------------------------- | ------------------------- |
| `/`                    | `src/app/page.tsx`                                                              | Home page                 |
| `/auth/login`          | `src/app/auth/login/page.tsx`                                                   | General login             |
| `/auth/login/[role]`   | `src/app/auth/login/{admin,parent,kitchen,vendor}/page.tsx`                     | Role-specific login       |
| `/auth/register`       | `src/app/auth/register/page.tsx`                                                | Registration              |
| `/dashboard`           | `src/app/dashboard/page.tsx`                                                    | Generic dashboard         |
| `/dashboard/[role]`    | `src/app/dashboard/{admin,parent,school-admin,kitchen,vendor,student}/page.tsx` | Role-specific dashboards  |
| `/menu`                | `src/app/menu/page.tsx`                                                         | Menu browsing             |
| `/orders`              | `src/app/orders/page.tsx`                                                       | Order management          |
| `/(parent)/checkout`   | `src/app/(parent)/checkout/page.tsx`                                            | Checkout flow             |
| `/admin/feature-flags` | `src/app/admin/feature-flags/page.tsx`                                          | Feature flag management   |
| `/api/*`               | `src/app/api/*/route.ts`                                                        | API endpoints (44 routes) |

---

## 2. COMPONENT INVENTORY

### Meal Ordering Components (Core Feature)

| Component               | File                                                     | Purpose                                  | Status      |
| ----------------------- | -------------------------------------------------------- | ---------------------------------------- | ----------- |
| `MealCard`              | `src/components/meal-ordering/MealCard.tsx`              | Individual meal display with add-to-cart | ✅ Complete |
| `MealOrderingInterface` | `src/components/meal-ordering/MealOrderingInterface.tsx` | Main meal ordering UI                    | ✅ Complete |
| `CategoryTabs`          | `src/components/meal-ordering/CategoryTabs.tsx`          | Meal category navigation                 | ✅ Complete |
| `QuantitySelector`      | `src/components/meal-ordering/QuantitySelector.tsx`      | Quantity adjustment control              | ✅ Complete |
| `OrderSummary`          | `src/components/meal-ordering/OrderSummary.tsx`          | Order summary display                    | ✅ Complete |
| `RFIDInterface`         | `src/components/meal-ordering/RFIDInterface.tsx`         | RFID card scanning                       | ✅ Complete |
| `RFIDVerification`      | `src/components/meal-ordering/RFIDVerification.tsx`      | RFID verification logic                  | ✅ Complete |
| `MealSearchCommand`     | `src/components/meal-ordering/MealSearchCommand.tsx`     | Search interface                         | ✅ Complete |
| `EnhancedMealList`      | `src/components/meal-ordering/EnhancedMealList.tsx`      | Optimized meal list rendering            | ✅ Complete |
| `NotificationSystem`    | `src/components/meal-ordering/NotificationSystem.tsx`    | In-app notifications                     | ✅ Complete |

### UI Components (shadcn/ui Library - 70 Components)

| Category           | Components                                                      | Count |
| ------------------ | --------------------------------------------------------------- | ----- |
| Form Elements      | Input, Button, Label, Select, Textarea, Checkbox, Radio, Toggle | 8     |
| Data Display       | Table, Card, Badge, Progress, Avatar, Separator                 | 6     |
| Navigation         | Tabs, Pagination, Breadcrumb, Menubar, NavigationMenu           | 5     |
| Dialogs & Overlays | Dialog, AlertDialog, Popover, HoverCard, Tooltip, Sheet, Drawer | 7     |
| Feedback           | Toast (via Sonner), Alert, LoadingStates                        | 3     |
| Layout             | ScrollArea, ResizablePanels, Accordion, Collapsible             | 4     |
| Advanced           | CommandPalette, SmartPopover, DateRangePicker, MealOrderDrawer  | 4     |
| Specialized        | Chart, InputOTP, SlideShow, MobileOptimized                     | 4     |
| Utilities          | Utils (cn function for Tailwind merging)                        | 1     |

**Total shadcn/ui Components**: 70 files

### Mobile-Specific Components

| Component             | File                                            | Features                               |
| --------------------- | ----------------------------------------------- | -------------------------------------- |
| `MobileLayout`        | `src/components/mobile/MobileLayout.tsx`        | Safe area handling, responsive layout  |
| `MobileNavigation`    | `src/components/mobile/MobileNavigation.tsx`    | Mobile nav bar                         |
| `MobileNavSheet`      | `src/components/mobile/MobileNavSheet.tsx`      | Bottom sheet navigation                |
| `MobileOptimizations` | `src/components/mobile/MobileOptimizations.tsx` | Network optimization, device detection |
| `TouchGestures`       | `src/components/mobile/TouchGestures.tsx`       | Swipe & gesture support                |
| `PWAEnhanced`         | `src/components/mobile/PWAEnhanced.tsx`         | PWA features (offline, installation)   |
| `PWAFeatures`         | `src/components/mobile/PWAFeatures.tsx`         | Service worker integration             |
| `OfflineQueue`        | `src/components/mobile/OfflineQueue.tsx`        | Offline request queuing                |
| `NativeFeatures`      | `src/components/mobile/NativeFeatures.tsx`      | Camera, geolocation, vibration         |

### Notification Components

| Component                | File                                                      | Type                     |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| `NotificationCenter`     | `src/components/notifications/NotificationCenter.tsx`     | Central notification hub |
| `RealTimeNotifications`  | `src/components/notifications/RealTimeNotifications.tsx`  | Live updates             |
| `CommunicationAnalytics` | `src/components/notifications/CommunicationAnalytics.tsx` | Analytics dashboard      |
| `EmailCommunication`     | `src/components/notifications/EmailCommunication.tsx`     | Email notifications      |
| `SMSCommunication`       | `src/components/notifications/SMSCommunication.tsx`       | SMS notifications        |
| `WhatsAppIntegration`    | `src/components/notifications/WhatsAppIntegration.tsx`    | WhatsApp integration     |

### Dashboard Components

| Type              | Components                                        |
| ----------------- | ------------------------------------------------- |
| Admin Dashboard   | AdminDashboard, AdminStats, AdminCharts           |
| Parent Dashboard  | ParentDashboard, ChildOrderHistory, BalanceWidget |
| Kitchen Dashboard | KitchenQueue, OrderTracking, PrepStatusMonitor    |
| School Admin      | SchoolStats, SchoolReports, StudentManagement     |
| Vendor Dashboard  | VendorInventory, VendorAnalytics, MenuManagement  |

### Other Domain Components

- **Auth**: LoginForm, RegisterForm, PasswordResetForm, MFASetup
- **Orders**: OrderCard, OrderDetails, OrderTracking, OrderHistory, OrderCancellation
- **Payment**: PaymentForm, PaymentMethods, PaymentHistory, RefundManagement
- **Cart**: CartPreview, CartSummary, CartCheckout
- **Kitchen**: KitchenQueue, OrderPrep, ReadyOrders, DeliveryQueue
- **RFID**: RFIDScanner, RFIDVerification, CardManagement
- **Accessibility**: AccessibilityChecker, A11yAlerts, ScreenReaderOptimized
- **Error Handling**: ErrorBoundary, ErrorPage, LoadingFallback, NotFound
- **Landing**: HeroSection, Features, Testimonials, Pricing

---

## 3. TYPE SYSTEM ANALYSIS

### Type Definition Files (2215 total lines)

| File                       | Content                                        | Lines |
| -------------------------- | ---------------------------------------------- | ----- |
| `auth.ts`                  | User roles (8), permissions (21), RBAC system  | 430   |
| `orders.ts`                | Order interfaces, cancellation, payment status | 85    |
| `menu.ts`                  | MenuItem, NutritionalInfo, MenuFilters, search | 126   |
| `cart.ts`                  | Cart item, checkout types                      | ~80   |
| `dashboard.ts`             | Dashboard metrics, charts, widgets             | ~100  |
| `administration.ts`        | Admin management types                         | ~150  |
| `navigation.ts`            | Route definitions, navigation types            | ~60   |
| `feature-flags.ts`         | Feature flag types                             | ~50   |
| `business-intelligence.ts` | Analytics, reporting types                     | ~300  |
| `json-types.ts`            | JSON schema utilities                          | ~40   |
| `menu.types.ts`            | Alternative menu type definitions              | ~80   |

### Key Type Systems

#### Authentication System

- **8 User Roles**: Admin, School Admin, Teacher, Parent, Student, Vendor, Kitchen Staff, Super Admin
- **21 Permissions**: Read/Write/Delete for Users, Orders, Menu, Payments; Analytics; System Settings
- **Role-Based Access Control (RBAC)**: Implemented via `ROLE_PERMISSIONS` mapping
- **Utility Classes**: `PermissionChecker` with methods for permission validation

#### Order System

- **Order Status**: pending, confirmed, preparing, ready, delivered, cancelled, out_for_delivery
- **Payment Status**: pending, completed, failed, refunded
- **Order Structure**: Student info, items, totals, status history, delivery details
- **Cancellation**: Refund eligibility tracking

#### Menu System

- **Dietary Attributes**: Vegetarian, Vegan, Gluten-Free, Dairy-Free, Nut-Free
- **Spice Levels**: Mild, Medium, Hot, None
- **Nutritional Info**: Calories, macros, fiber, sodium, vitamins, minerals
- **Availability**: Time slots, day-of-week scheduling
- **Filters**: Category, dietary, spice level, price range, availability

---

## 4. BUILD & CONFIGURATION ANALYSIS

### package.json Overview

**Node.js Requirements**: >= 16.0.0  
**npm Requirements**: >= 8.0.0  
**React Version**: 18.2.0  
**Next.js Version**: 13.4.12 (with experimental appDir)

### Key Dependencies

#### UI & Styling

- `@mantine/core@8.2.8` - Mantine UI components
- `@mui/material@5.14.1` - Material-UI components
- `@radix-ui/*@latest` - Radix UI primitives (20+ packages)
- `tailwindcss@3.4.17` - Utility-first CSS
- `@emotion/react@11.11.1` - CSS-in-JS
- `lucide-react@0.539.0` - Icon library
- `framer-motion@10.12.18` - Animation library

#### Form & State Management

- `react-hook-form@7.62.0` - Form management
- `@hookform/resolvers@3.10.0` - Form validation resolvers
- `zod@4.1.5` - Schema validation
- `yup@1.2.0` - Schema validation (legacy)
- `@reduxjs/toolkit@1.9.5` - Redux state management
- `react-redux@8.1.1` - Redux bindings
- `redux-persist@6.0.0` - Redux persistence

#### Data & Visualization

- `chart.js@4.3.0` - Charting library
- `recharts@2.15.4` - React charting
- `@mui/x-data-grid@6.10.1` - Data tables
- `@mui/x-date-pickers@6.10.1` - Date/time pickers

#### Real-time & Communication

- `socket.io-client@4.7.2` - WebSocket client
- `next-auth@4.22.1` - Authentication

#### PWA & Performance

- `next-pwa@5.6.0` - PWA integration
- `web-vitals@5.1.0` - Core Web Vitals monitoring
- `axios@1.4.0` - HTTP client
- `swr@2.2.0` - Data fetching

#### Dev Tools & Testing

- `@playwright/test@1.55.0` - E2E testing
- `jest@29.6.1` - Unit testing
- `@testing-library/react@13.4.0` - React testing utilities
- `@axe-core/playwright@4.10.2` - Accessibility testing
- `@percy/playwright@1.0.9` - Visual regression testing
- `@storybook/react@7.1.0` - Component documentation

### TypeScript Configuration

```json
{
  "strict": true,
  "strictNullChecks": true,
  "noImplicitAny": true,
  "esModuleInterop": true,
  "moduleResolution": "node",
  "jsx": "preserve",
  "target": "ES2017",
  "module": "esnext"
}
```

**Path Alias**: `@/*` → `./src/*`

### Next.js Configuration

**Key Features**:

- ✅ React Strict Mode
- ✅ SWC Minification
- ✅ Image Optimization (WebP, AVIF formats)
- ✅ Security Headers (CSP, X-Frame-Options, HSTS)
- ✅ API Rewriting to backend (`NEXT_PUBLIC_API_URL`)
- ✅ ETags for caching

**Security Headers Configured**:

- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security: 1 year
- Content-Security-Policy: Restrictive (self + GoogleAnalytics)

### Jest Configuration

**Coverage Thresholds**:

- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

**Test Discovery**:

- `src/**/__tests__/**/*.{js,jsx,ts,tsx}`
- `src/**/*.{test,spec}.{js,jsx,ts,tsx}`
- `tests/**/*.{test,spec}.{js,jsx,ts,tsx}`

### Playwright Configuration

**Test Scripts Available**:

- `test:playwright` - Full test suite
- `test:ui` - Interactive UI
- `test:debug` - Debug mode
- `test:smoke` - Smoke tests
- `test:regression` - Regression tests
- `test:accessibility` - A11y testing
- `test:mobile` - Mobile device testing
- `test:visual` - Visual regression
- `test:performance` - Performance testing

---

## 5. CURRENT ISSUES & PROBLEMS

### Critical TypeScript Errors: 586 Total

#### Error Distribution by Code

| Code    | Error Type              | Count | Severity  |
| ------- | ----------------------- | ----- | --------- |
| TS2339  | Property does not exist | 177   | 🔴 High   |
| TS2724  | No exported member      | 88    | 🔴 High   |
| TS2322  | Type mismatch           | 75    | 🔴 High   |
| TS2484  | Parameter type mismatch | 57    | 🟡 Medium |
| TS2307  | Cannot find module      | 52    | 🔴 High   |
| TS2345  | Argument type mismatch  | 35    | 🟡 Medium |
| TS2614  | Member does not exist   | 14    | 🟡 Medium |
| TS2305  | No exported member      | 14    | 🟡 Medium |
| TS18046 | Implicit any            | 13    | 🟡 Medium |
| TS7006  | Missing parameter type  | 9     | 🟢 Low    |
| TS2552  | Cannot find name        | 9     | 🟡 Medium |
| Other   | Various                 | 43    | 🟡 Medium |

### Component-Level Issues

#### Mobile Components (14 issues)

- **File**: `src/components/mobile/MobileLayout.tsx`
  - Missing `safeArea` property on `UseMobileLayoutReturn` type
- **File**: `src/components/mobile/MobileNavigation.tsx`
  - Missing `asPath` property on Next.js router
- **File**: `src/components/mobile/MobileNavSheet.tsx`
  - Nullable `pathname` error
- **File**: `src/components/mobile/MobileOptimizations.tsx`
  - Missing `connection`, `mozConnection`, `webkitConnection` on Navigator API (6 errors)
- **File**: `src/components/mobile/NativeFeatures.tsx`
  - Spread types not from object (1)
  - Invalid `torch` property on MediaTrackConstraintSet (1)
  - Missing clipboard API type (1)
- **File**: `src/components/mobile/OfflineQueue.tsx`
  - Missing `Sync` export from lucide-react
- **File**: `src/components/mobile/PWAEnhanced.tsx`
  - Network API type issues (3)
  - Unknown type assignment (1)
- **File**: `src/components/mobile/PWAFeatures.tsx`
  - Missing clipboard API type (1)
- **File**: `src/components/mobile/TouchGestures.tsx`
  - Direction type incompatibility (callback expects 'down' only, receives 'up'|'down'|'left'|'right')
- **File**: `src/components/mobile/TouchOptimized.tsx`
  - Missing `isTouchDevice` on return type

#### Icon Import Issues (53 errors across multiple files)

**Pattern**: Underscore-prefixed icon imports missing from lucide-react

- `_TrendingDown` should be `TrendingDown`
- `_TrendingUp` should be `TrendingUp`
- `_Clock` should be `Clock`
- `_Volume2`, `_VolumeX`, `_Filter`, `_Phone`, `_Users`, `_BarChart3`, `_Settings`, `_Check`, `_Download`, `_Zap`, `_Sync` (11 different underscore patterns)

**Affected Files**:

- `src/components/notifications/CommunicationAnalytics.tsx` (6 errors)
- `src/components/notifications/RealTimeNotifications.tsx` (5 errors)
- `src/components/notifications/WhatsAppIntegration.tsx` (7 errors)

#### Missing Module/Component Imports (52 errors)

| Missing                           | File(s)                    | Issue               |
| --------------------------------- | -------------------------- | ------------------- |
| `@/services/notification.service` | 3 notification components  | Service not created |
| `./CommunicationPreferences`      | NotificationDashboard      | Component missing   |
| `./steps/ConfigurationStep`       | EnhancedOnboardingFlow     | Component missing   |
| `'Eye'` from lucide-react         | MobileResponsiveNavigation | Icon not imported   |
| `'_Textarea'` from ui/textarea    | WhatsAppIntegration        | Type export issue   |
| `'_Avatar'` exports               | RealTimeNotifications      | Type export issue   |
| FEATURE_FLAGS constant            | WhatsAppIntegration        | Export mismatch     |

#### Type Mismatch Issues (75 errors)

**Common Patterns**:

1. **Lucide React Component Type Mismatch** (18 errors)
   - Icon components being assigned to incompatible component types
   - Issue: Icons accept `string | number` for size, but custom types expect `number` only

2. **UI Component Props Mismatch** (12 errors)
   - Button/UI components expecting specific prop structures
   - Receivers getting incompatible prop objects

3. **Callback/Function Type Mismatches** (15 errors)
   - Promise vs synchronous function return types
   - Parameter type incompatibilities

4. **Context/Provider Type Issues** (10 errors)
   - Context hook return types incomplete
   - Provider prop types misaligned

5. **Toast/Notification API Issues** (8 errors)
   - Missing `info()` method on toast API
   - Return type mismatches (Promise<boolean> vs boolean)

#### Network API Type Gaps (6 errors)

**Issue**: TypeScript doesn't have standard types for:

- `navigator.connection` (Network Information API)
- `navigator.mozConnection` (Firefox)
- `navigator.webkitConnection` (Chrome/Safari)

**Impact**: Mobile optimizations component can't detect network type

#### MediaStream API Type Gaps (2 errors)

**Issue**: TypeScript MediaTrackConstraintSet doesn't include:

- `torch` property for flashlight control
- These are vendor-specific extensions not in standard typing

#### Route Type Mismatches (2 errors)

**Issue**: Next.js 13 App Router doesn't have `asPath` property

- Old Pages Router had `asPath`
- App Router only has `pathname`
- Components written for Pages Router

### Missing Components & Services

| Item                       | Status     | Impact                            |
| -------------------------- | ---------- | --------------------------------- |
| `NotificationService`      | ❌ Missing | 3 components can't work           |
| `CommunicationPreferences` | ❌ Missing | Notification dashboard incomplete |
| `ConfigurationStep`        | ❌ Missing | Onboarding flow incomplete        |

### Feature Flag Issues

**Problem**: FEATURE_FLAGS export inconsistency in `src/types/feature-flags.ts`

- Components expect named export `FEATURE_FLAGS`
- Type file exports `_FEATURE_FLAGS` (underscore prefix)
- Results in boolean `isEnabled` property check failing (Boolean type, not object)

### Missing Exports from UI Library

**Issue**: Icons and components exported with underscore prefix in some files:

- `_Avatar`, `_AvatarFallback`, `_AvatarImage`
- `_Textarea`

These appear to be incorrectly imported or exported.

---

## 6. API ROUTES ANALYSIS

### Authentication (6 routes)

- POST `/api/auth/login` - User login
- POST `/api/auth/register` - User registration
- POST `/api/auth/logout` - User logout
- POST `/api/auth/verify-email` - Email verification
- POST `/api/auth/forgot-password` - Password reset request
- POST `/api/auth/reset-password` - Password reset completion
- GET `/api/auth/check` - Session check
- POST `/api/auth/change-password` - Password change

### Orders (2 routes)

- GET/POST `/api/orders` - List/create orders
- GET/PATCH/DELETE `/api/orders/[orderId]` - Order details/update/cancel

### Payments (5 routes)

- POST `/api/payments/orders` - Create payment order
- POST `/api/payments/verify` - Verify payment
- POST `/api/payments/webhook` - Payment webhook
- POST `/api/payments/refund` - Process refund
- GET `/api/payments/analytics` - Payment analytics

### Kitchen (1 route)

- GET `/api/kitchen` - Kitchen orders queue

### Menu (Not explicitly listed, likely proxied)

### Analytics (11 routes)

- GET `/api/analytics/business-intelligence` - BI dashboard
- GET `/api/analytics/executive-dashboard` - Executive summary
- GET `/api/analytics/cross-school` - Multi-school analysis
- GET `/api/analytics/performance-benchmarking` - Performance metrics
- GET `/api/analytics/real-time-benchmarking` - Real-time metrics
- GET `/api/analytics/payments-dashboard` - Payment analytics
- GET `/api/analytics/revenue-optimization` - Revenue analysis
- GET `/api/analytics/predictive-insights` - ML predictions
- GET `/api/analytics/strategic-insights` - Strategic analysis
- GET `/api/analytics/federated-learning` - Federated learning
- GET `/api/analytics/orchestrator` - Analytics orchestrator

### RFID (4 routes)

- GET `/api/rfid/verify` - RFID verification
- GET `/api/rfid/cards` - List RFID cards
- POST `/api/rfid/bulk-import` - Bulk import cards
- POST `/api/rfid/delivery-verification` - Delivery verification

### Schools (2 routes)

- GET/POST `/api/schools` - List/create schools
- GET/PATCH `/api/schools/[schoolId]` - School details/update

### Nutrition (5 routes)

- GET `/api/nutrition/analyze` - Analyze nutrition
- GET `/api/nutrition/optimize-meal` - Meal optimization
- GET `/api/nutrition/trends` - Nutrition trends
- GET `/api/nutrition/recommendations` - Recommendations
- GET `/api/nutrition/compliance` - Compliance check

### Feature Flags (1 route)

- GET `/api/feature-flags/[key]` - Get feature flag value

### Mobile (2 routes)

- POST `/api/mobile/device-registration` - Register mobile device
- POST `/api/mobile/parent-notifications` - Push notifications

### Status & Docs (2 routes)

- GET `/api/status` - Health check
- GET `/api/docs` - API documentation

**Total: 44 API routes**

---

## 7. CUSTOM HOOKS (9 hooks)

| Hook                  | Location                         | Purpose               | Status         |
| --------------------- | -------------------------------- | --------------------- | -------------- |
| `useAuth()`           | `src/hooks/useAuth.ts`           | Auth state & methods  | ✅ Complete    |
| `useApiIntegration()` | `src/hooks/useApiIntegration.ts` | API communication     | ✅ Complete    |
| `useMobileLayout()`   | `src/hooks/useMobileLayout.ts`   | Mobile responsiveness | ⚠️ Type issues |
| `useFeatureFlag()`    | `src/hooks/useFeatureFlag.ts`    | Feature flag queries  | ✅ Complete    |
| `useDailyMenu()`      | `src/hooks/useDailyMenu.ts`      | Menu data fetching    | ✅ Complete    |
| `useVendorSearch()`   | `src/hooks/useVendorSearch.ts`   | Vendor search         | ✅ Complete    |
| `useSocket()`         | `src/hooks/useSocket.ts`         | WebSocket connection  | ✅ Complete    |
| `useAnalytics()`      | `src/hooks/useAnalytics.ts`      | Analytics tracking    | ✅ Complete    |
| `use-toast()`         | `src/hooks/use-toast.ts`         | Toast notifications   | ✅ Complete    |

---

## 8. SERVICES & API CLIENTS (15+ services)

### Core Services

| Service         | File                                     | Responsibility            |
| --------------- | ---------------------------------------- | ------------------------- |
| API Client      | `src/services/api/api-client.ts`         | HTTP request handling     |
| HASIVU API      | `src/services/api/hasivu-api.service.ts` | API integration           |
| Auth API        | `src/services/auth-api.service.ts`       | Authentication endpoints  |
| Menu API        | `src/services/menu-api.service.ts`       | Menu management endpoints |
| Order API       | `src/services/order-api.service.ts`      | Order endpoints           |
| Payment API     | `src/services/payment-api.service.ts`    | Payment endpoints         |
| RFID Service    | `src/services/rfid.service.ts`           | RFID operations           |
| Analytics       | `src/services/analytics.service.ts`      | Analytics endpoints       |
| Nutrition       | `src/services/nutrition.service.ts`      | Nutrition calculations    |
| Menu Service    | `src/services/menu.service.ts`           | Menu business logic       |
| Order Service   | `src/services/order.service.ts`          | Order business logic      |
| Payment Service | `src/services/payment.service.ts`        | Payment logic             |
| Feature Flags   | `src/services/feature-flag.service.ts`   | Feature flag management   |

---

## 9. CONTEXT PROVIDERS (7 providers)

| Context              | File                                       | Purpose                |
| -------------------- | ------------------------------------------ | ---------------------- |
| AuthContext          | `src/contexts/AuthContext.tsx`             | Authentication state   |
| Auth (Enhanced)      | `src/contexts/enhanced-auth-context.tsx`   | Extended auth features |
| Auth (Secure)        | `src/contexts/secure-auth-context.tsx`     | Security-focused auth  |
| Auth (Production)    | `src/contexts/production-auth-context.tsx` | Production auth setup  |
| CartContext          | `src/contexts/CartContext.tsx`             | Shopping cart state    |
| SocketContext        | `src/contexts/SocketContext.tsx`           | WebSocket connection   |
| ShoppingCart         | `src/contexts/shopping-cart-context.tsx`   | Cart management        |
| Integration Provider | `src/contexts/integration-provider.tsx`    | Multi-provider setup   |

---

## 10. TESTING INFRASTRUCTURE

### Jest Setup

- **Framework**: Jest 29.6.1
- **Environment**: jsdom (browser simulation)
- **Coverage Target**: 80% (lines, branches, functions, statements)
- **Test Files**: `src/**/__tests__/**/*.test.tsx` or `src/**/*.test.tsx`

### Playwright Setup

- **Version**: 1.55.0
- **Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Support**: Chrome mobile, Safari mobile
- **Plugins**:
  - axe-core for accessibility testing
  - @percy/playwright for visual regression

### Test Suites Available

1. Unit tests (Jest)
2. Component tests (Jest + Testing Library)
3. E2E tests (Playwright)
4. Accessibility tests (jest-axe + Playwright + axe-core)
5. Visual regression tests (Percy)
6. Performance tests (Lighthouse)
7. Contract tests (Dredd)

---

## 11. COMPLETE TYPE STRUCTURE SUMMARY

### User & Auth Types

- **Roles**: 8 distinct roles with RBAC
- **Permissions**: 21 granular permissions
- **User Profile**: Full user data with role-specific fields
- **Session**: Token management with expiry
- **Auth Response**: Standardized API response format

### Order Types

- **Order**: Complete order with items, totals, status history
- **OrderItem**: Individual meal in order
- **OrderStatus**: 7 possible states
- **PaymentStatus**: 4 payment states
- **Cancellation**: Refund tracking

### Menu Types

- **MenuItem**: Food item with nutritional data
- **NutritionalInfo**: Detailed nutrition facts
- **MenuCategory**: Meal categories with counts
- **MenuFilters**: Advanced filtering options
- **MenuSearch**: Search with faceted results

### Cart Types

- **CartItem**: Meal + quantity + modifications
- **CartState**: All items + totals + fees

### Dashboard Types

- **Dashboard Metrics**: KPIs and statistics
- **Charts Data**: Chart data structures
- **Widgets**: Dashboard widget definitions

### Advanced Types

- **Feature Flags**: Feature toggle system
- **Business Intelligence**: Analytics data structures
- **Navigation**: Route definitions
- **JSON Types**: Utility JSON schemas

---

## 12. KEY FINDINGS & RECOMMENDATIONS

### Critical Issues Requiring Immediate Attention

1. **586 TypeScript Errors** - Must fix before production
   - 177 property existence errors (missing type definitions)
   - 88 missing exports (incorrect import paths)
   - 75 type mismatches (component prop compatibility)
   - 52 missing modules (unimplemented services)

2. **Missing Core Services**
   - `NotificationService` needed by 3 components
   - Components can't function without this service

3. **Component Implementation Gaps**
   - `CommunicationPreferences` component missing
   - `ConfigurationStep` in onboarding missing

4. **Mobile Component Issues**
   - Navigation type incompatibilities with Next.js 13 App Router
   - Network API type gaps (non-standard APIs)
   - MediaStream API type gaps (vendor-specific features)

5. **Import Path Inconsistencies**
   - Underscore-prefixed icon imports (lucide-react)
   - Inconsistent UI component exports
   - Feature flag export name mismatch

### Codebase Strengths

✅ **Well-Structured Architecture**

- Clear separation of concerns
- Organized component hierarchy
- Dedicated services layer

✅ **Comprehensive Type System**

- Full RBAC implementation
- Rich domain types
- Permission utilities included

✅ **Feature-Rich UI**

- 254 React components
- 70+ shadcn/ui components
- Mobile-optimized versions
- Accessibility support built-in

✅ **Testing Infrastructure**

- Jest unit tests
- Playwright E2E tests
- Visual regression with Percy
- Accessibility testing with axe-core

✅ **Security & Performance**

- Security headers configured
- CSP in place
- Image optimization
- PWA support

### Areas Needing Remediation

🔴 **Type Safety**

- Must resolve 586 TypeScript errors
- Enable strict null checking
- Add missing type definitions

🔴 **Missing Implementations**

- Notification service needs creation
- 2 UI components incomplete
- 1 service module missing

🟡 **API Compatibility**

- Update for Next.js 13 App Router (remove Pages Router assumptions)
- Fix mobile API type gaps with polyfills or type augmentation
- Standardize API response formats

🟡 **Testing Coverage**

- Create unit tests for services
- Add integration tests
- Increase E2E test coverage

---

## 13. DEVELOPMENT SUMMARY

### Project Maturity

- **Stage**: Mature codebase with incomplete type safety
- **Complexity**: High (multiple domains, 254+ components)
- **Dependencies**: 50+ npm packages
- **Test Coverage**: Jest configured, Playwright setup, needs execution

### Team Considerations

- **Onboarding**: Requires understanding of 8 user roles, RBAC system
- **Maintenance**: Regular type checking needed
- **Scaling**: Architecture supports multi-domain (kitchen, orders, payments, analytics)
- **Testing**: Full E2E testing framework in place

### Technology Maturity

- **Next.js**: 13.4 (experimental appDir - should migrate from Pages Router references)
- **React**: 18.2 (stable, modern hooks support)
- **TypeScript**: 5.1.6 (strict mode enabled, needs error fixes)
- **Testing**: Mature stack (Jest, Playwright, Percy, axe-core)

---

**Document Generated**: 2025-10-22  
**Frontend Directory**: `/Users/mahesha/Downloads/hasivu-platform/web`  
**Total TypeScript Files**: 350+  
**Total Components**: 254  
**Total Type Definition Lines**: 2215  
**Critical Issues**: 586 TypeScript errors  
**Estimated Remediation Time**: 2-3 weeks (with focused team)
