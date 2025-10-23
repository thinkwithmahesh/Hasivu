# HASIVU Platform - Frontend Key Files Reference

## Quick Navigation Guide

This document provides direct paths to critical frontend codebase files for development and debugging.

---

## Core Configuration Files

| File                                                                | Purpose                                 |
| ------------------------------------------------------------------- | --------------------------------------- |
| `/Users/mahesha/Downloads/hasivu-platform/web/package.json`         | Project dependencies, scripts, metadata |
| `/Users/mahesha/Downloads/hasivu-platform/web/tsconfig.json`        | TypeScript compiler configuration       |
| `/Users/mahesha/Downloads/hasivu-platform/web/next.config.js`       | Next.js build & runtime configuration   |
| `/Users/mahesha/Downloads/hasivu-platform/web/jest.config.js`       | Jest testing framework configuration    |
| `/Users/mahesha/Downloads/hasivu-platform/web/playwright.config.ts` | Playwright E2E testing configuration    |
| `/Users/mahesha/Downloads/hasivu-platform/web/tailwind.config.js`   | Tailwind CSS configuration              |
| `/Users/mahesha/Downloads/hasivu-platform/web/postcss.config.js`    | PostCSS configuration                   |

---

## Type Definitions (Critical - 2215 lines total)

| File                                                                              | Lines | Key Types                              |
| --------------------------------------------------------------------------------- | ----- | -------------------------------------- |
| `/Users/mahesha/Downloads/hasivu-platform/web/src/types/auth.ts`                  | 430   | User roles (8), permissions (21), RBAC |
| `/Users/mahesha/Downloads/hasivu-platform/web/src/types/menu.ts`                  | 126   | MenuItem, Nutrition, MenuFilters       |
| `/Users/mahesha/Downloads/hasivu-platform/web/src/types/orders.ts`                | 85    | Order, OrderStatus, Payment statuses   |
| `/Users/mahesha/Downloads/hasivu-platform/web/src/types/cart.ts`                  | ~80   | Cart item, checkout types              |
| `/Users/mahesha/Downloads/hasivu-platform/web/src/types/dashboard.ts`             | ~100  | Dashboard metrics, charts              |
| `/Users/mahesha/Downloads/hasivu-platform/web/src/types/administration.ts`        | ~150  | Admin management types                 |
| `/Users/mahesha/Downloads/hasivu-platform/web/src/types/business-intelligence.ts` | ~300  | Analytics, reporting types             |
| `/Users/mahesha/Downloads/hasivu-platform/web/src/types/feature-flags.ts`         | ~50   | Feature flag types                     |
| `/Users/mahesha/Downloads/hasivu-platform/web/src/types/navigation.ts`            | ~60   | Route definitions                      |

---

## App Router Structure (44 Pages + API Routes)

### Authentication Routes

- `/Users/mahesha/Downloads/hasivu-platform/web/src/app/auth/login/page.tsx` - General login
- `/Users/mahesha/Downloads/hasivu-platform/web/src/app/auth/login/admin/page.tsx` - Admin login
- `/Users/mahesha/Downloads/hasivu-platform/web/src/app/auth/login/parent/page.tsx` - Parent login
- `/Users/mahesha/Downloads/hasivu-platform/web/src/app/auth/login/kitchen/page.tsx` - Kitchen login
- `/Users/mahesha/Downloads/hasivu-platform/web/src/app/auth/login/vendor/page.tsx` - Vendor login
- `/Users/mahesha/Downloads/hasivu-platform/web/src/app/auth/register/page.tsx` - Registration

### Dashboard Routes

- `/Users/mahesha/Downloads/hasivu-platform/web/src/app/dashboard/page.tsx` - Generic dashboard
- `/Users/mahesha/Downloads/hasivu-platform/web/src/app/dashboard/admin/page.tsx` - Admin dashboard
- `/Users/mahesha/Downloads/hasivu-platform/web/src/app/dashboard/parent/page.tsx` - Parent dashboard
- `/Users/mahesha/Downloads/hasivu-platform/web/src/app/dashboard/student/page.tsx` - Student dashboard
- `/Users/mahesha/Downloads/hasivu-platform/web/src/app/dashboard/kitchen/page.tsx` - Kitchen dashboard
- `/Users/mahesha/Downloads/hasivu-platform/web/src/app/dashboard/school-admin/page.tsx` - School admin dashboard
- `/Users/mahesha/Downloads/hasivu-platform/web/src/app/dashboard/vendor/page.tsx` - Vendor dashboard

### Core Feature Routes

- `/Users/mahesha/Downloads/hasivu-platform/web/src/app/menu/page.tsx` - Menu browsing
- `/Users/mahesha/Downloads/hasivu-platform/web/src/app/orders/page.tsx` - Order management
- `/Users/mahesha/Downloads/hasivu-platform/web/src/app/(parent)/checkout/page.tsx` - Checkout flow
- `/Users/mahesha/Downloads/hasivu-platform/web/src/app/rfid-verification/page.tsx` - RFID verification

### Admin Routes

- `/Users/mahesha/Downloads/hasivu-platform/web/src/app/admin/feature-flags/page.tsx` - Feature flags
- `/Users/mahesha/Downloads/hasivu-platform/web/src/app/admin/users/page.tsx` - User management
- `/Users/mahesha/Downloads/hasivu-platform/web/src/app/admin/schedule/page.tsx` - Schedule management

### API Routes (44 total)

- **Auth**: `/Users/mahesha/Downloads/hasivu-platform/web/src/app/api/auth/` (8 routes)
- **Orders**: `/Users/mahesha/Downloads/hasivu-platform/web/src/app/api/orders/` (2 routes)
- **Payments**: `/Users/mahesha/Downloads/hasivu-platform/web/src/app/api/payments/` (5 routes)
- **Analytics**: `/Users/mahesha/Downloads/hasivu-platform/web/src/app/api/analytics/` (11 routes)
- **RFID**: `/Users/mahesha/Downloads/hasivu-platform/web/src/app/api/rfid/` (4 routes)
- **Kitchen**: `/Users/mahesha/Downloads/hasivu-platform/web/src/app/api/kitchen/route.ts` (1 route)
- **Schools**: `/Users/mahesha/Downloads/hasivu-platform/web/src/app/api/schools/` (2 routes)
- **Nutrition**: `/Users/mahesha/Downloads/hasivu-platform/web/src/app/api/nutrition/` (5 routes)
- **Feature Flags**: `/Users/mahesha/Downloads/hasivu-platform/web/src/app/api/feature-flags/` (1 route)
- **Mobile**: `/Users/mahesha/Downloads/hasivu-platform/web/src/app/api/mobile/` (2 routes)

---

## Core Meal Ordering Components (10 files)

| Component             | File                                                                                                  | Purpose                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| MealCard              | `/Users/mahesha/Downloads/hasivu-platform/web/src/components/meal-ordering/MealCard.tsx`              | Individual meal display with add-to-cart |
| MealOrderingInterface | `/Users/mahesha/Downloads/hasivu-platform/web/src/components/meal-ordering/MealOrderingInterface.tsx` | Main meal ordering UI                    |
| CategoryTabs          | `/Users/mahesha/Downloads/hasivu-platform/web/src/components/meal-ordering/CategoryTabs.tsx`          | Meal category navigation                 |
| QuantitySelector      | `/Users/mahesha/Downloads/hasivu-platform/web/src/components/meal-ordering/QuantitySelector.tsx`      | Quantity adjustment                      |
| OrderSummary          | `/Users/mahesha/Downloads/hasivu-platform/web/src/components/meal-ordering/OrderSummary.tsx`          | Order summary display                    |
| RFIDInterface         | `/Users/mahesha/Downloads/hasivu-platform/web/src/components/meal-ordering/RFIDInterface.tsx`         | RFID card scanning                       |
| RFIDVerification      | `/Users/mahesha/Downloads/hasivu-platform/web/src/components/meal-ordering/RFIDVerification.tsx`      | RFID verification logic                  |
| MealSearchCommand     | `/Users/mahesha/Downloads/hasivu-platform/web/src/components/meal-ordering/MealSearchCommand.tsx`     | Search interface                         |
| EnhancedMealList      | `/Users/mahesha/Downloads/hasivu-platform/web/src/components/meal-ordering/EnhancedMealList.tsx`      | Optimized meal list                      |
| NotificationSystem    | `/Users/mahesha/Downloads/hasivu-platform/web/src/components/meal-ordering/NotificationSystem.tsx`    | In-app notifications                     |

---

## UI Components (shadcn/ui - 70 files)

**Location**: `/Users/mahesha/Downloads/hasivu-platform/web/src/components/ui/`

Key files:

- `card.tsx` - Card container component
- `button.tsx` - Button component
- `tabs.tsx` - Tabbed interface
- `dialog.tsx` - Modal dialogs
- `alert-dialog.tsx` - Alert dialogs
- `input.tsx` - Text input
- `select.tsx` - Select dropdown
- `checkbox.tsx` - Checkbox input
- `radio-group.tsx` - Radio buttons
- `slider.tsx` - Range slider
- `progress.tsx` - Progress indicator
- `badge.tsx` - Badge/label component
- `avatar.tsx` - User avatar
- `tooltip.tsx` - Tooltip
- `popover.tsx` - Popover overlay
- `sheet.tsx` - Slide-in drawer
- `pagination.tsx` - Pagination controls
- `table.tsx` - Data table
- `accordion.tsx` - Accordion/collapsible
- `chart.tsx` - Chart component
- `date-range-picker.tsx` - Date range picker
- And 50+ more...

---

## Mobile Components (9 files)

**Location**: `/Users/mahesha/Downloads/hasivu-platform/web/src/components/mobile/`

| Component           | File                      |
| ------------------- | ------------------------- |
| MobileLayout        | `MobileLayout.tsx`        |
| MobileNavigation    | `MobileNavigation.tsx`    |
| MobileNavSheet      | `MobileNavSheet.tsx`      |
| MobileOptimizations | `MobileOptimizations.tsx` |
| TouchGestures       | `TouchGestures.tsx`       |
| PWAEnhanced         | `PWAEnhanced.tsx`         |
| PWAFeatures         | `PWAFeatures.tsx`         |
| OfflineQueue        | `OfflineQueue.tsx`        |
| NativeFeatures      | `NativeFeatures.tsx`      |

---

## Notification Components (6 files)

**Location**: `/Users/mahesha/Downloads/hasivu-platform/web/src/components/notifications/`

| Component              | File                         |
| ---------------------- | ---------------------------- |
| NotificationCenter     | `NotificationCenter.tsx`     |
| RealTimeNotifications  | `RealTimeNotifications.tsx`  |
| CommunicationAnalytics | `CommunicationAnalytics.tsx` |
| EmailCommunication     | `EmailCommunication.tsx`     |
| SMSCommunication       | `SMSCommunication.tsx`       |
| WhatsAppIntegration    | `WhatsAppIntegration.tsx`    |

⚠️ **Issue**: Missing `NotificationService` at `/Users/mahesha/Downloads/hasivu-platform/web/src/services/notification.service.ts`

---

## Services Layer (15+ files)

**Location**: `/Users/mahesha/Downloads/hasivu-platform/web/src/services/`

| Service         | File                        |
| --------------- | --------------------------- |
| API Client      | `api/api-client.ts`         |
| HASIVU API      | `api/hasivu-api.service.ts` |
| Auth API        | `auth-api.service.ts`       |
| Menu API        | `menu-api.service.ts`       |
| Order API       | `order-api.service.ts`      |
| Payment API     | `payment-api.service.ts`    |
| RFID Service    | `rfid.service.ts`           |
| Analytics       | `analytics.service.ts`      |
| Nutrition       | `nutrition.service.ts`      |
| Menu Service    | `menu.service.ts`           |
| Order Service   | `order.service.ts`          |
| Payment Service | `payment.service.ts`        |
| Feature Flags   | `feature-flag.service.ts`   |

⚠️ **Missing**: `notification.service.ts` (referenced by 3 components but not implemented)

---

## Custom Hooks (9 files)

**Location**: `/Users/mahesha/Downloads/hasivu-platform/web/src/hooks/`

| Hook              | File                                    |
| ----------------- | --------------------------------------- |
| useAuth           | `useAuth.ts`                            |
| useApiIntegration | `useApiIntegration.ts`                  |
| useMobileLayout   | `useMobileLayout.ts` ⚠️ Has type issues |
| useFeatureFlag    | `useFeatureFlag.ts`                     |
| useDailyMenu      | `useDailyMenu.ts`                       |
| useVendorSearch   | `useVendorSearch.ts`                    |
| useSocket         | `useSocket.ts`                          |
| useAnalytics      | `useAnalytics.ts`                       |
| use-toast         | `use-toast.ts`                          |

---

## Context Providers (7 files)

**Location**: `/Users/mahesha/Downloads/hasivu-platform/web/src/contexts/`

| Context         | File                          |
| --------------- | ----------------------------- |
| AuthContext     | `AuthContext.tsx`             |
| Enhanced Auth   | `enhanced-auth-context.tsx`   |
| Secure Auth     | `secure-auth-context.tsx`     |
| Production Auth | `production-auth-context.tsx` |
| CartContext     | `CartContext.tsx`             |
| SocketContext   | `SocketContext.tsx`           |
| ShoppingCart    | `shopping-cart-context.tsx`   |

---

## Critical Issues to Fix

### 1. Missing Services (3 files)

- [ ] Create `/Users/mahesha/Downloads/hasivu-platform/web/src/services/notification.service.ts`
  - Required by: NotificationCenter, EmailCommunication, SMSCommunication, WhatsAppIntegration

### 2. Missing Components (2 files)

- [ ] Create `/Users/mahesha/Downloads/hasivu-platform/web/src/components/notifications/CommunicationPreferences.tsx`
  - Required by: NotificationDashboard
- [ ] Create `/Users/mahesha/Downloads/hasivu-platform/web/src/components/onboarding/steps/ConfigurationStep.tsx`
  - Required by: EnhancedOnboardingFlow

### 3. Icon Import Issues (53 errors)

Fix underscore-prefixed imports in:

- `/Users/mahesha/Downloads/hasivu-platform/web/src/components/notifications/CommunicationAnalytics.tsx`
- `/Users/mahesha/Downloads/hasivu-platform/web/src/components/notifications/RealTimeNotifications.tsx`
- `/Users/mahesha/Downloads/hasivu-platform/web/src/components/notifications/WhatsAppIntegration.tsx`
- `/Users/mahesha/Downloads/hasivu-platform/web/src/components/mobile/OfflineQueue.tsx`
- `/Users/mahesha/Downloads/hasivu-platform/web/src/components/MobileResponsiveNavigation.tsx`

### 4. Mobile Component Type Issues (14 errors)

Fix in `/Users/mahesha/Downloads/hasivu-platform/web/src/components/mobile/`:

- MobileLayout.tsx - Missing `safeArea` property
- MobileNavigation.tsx - Missing `asPath` (Pages Router → App Router)
- MobileNavSheet.tsx - Nullable pathname
- MobileOptimizations.tsx - Network API types (6 errors)
- NativeFeatures.tsx - MediaStream API types
- PWAEnhanced.tsx - Network API types
- TouchGestures.tsx - Direction type callback mismatch
- TouchOptimized.tsx - Missing `isTouchDevice`

### 5. Feature Flag Export Issue

Fix in `/Users/mahesha/Downloads/hasivu-platform/web/src/types/feature-flags.ts`:

- Change `_FEATURE_FLAGS` to `FEATURE_FLAGS` (remove underscore prefix)

---

## Testing Files

### Jest Configuration

- `/Users/mahesha/Downloads/hasivu-platform/web/jest.config.js`
- `/Users/mahesha/Downloads/hasivu-platform/web/jest.setup.js`
- `/Users/mahesha/Downloads/hasivu-platform/web/jest.polyfills.js`

### Playwright Configuration

- `/Users/mahesha/Downloads/hasivu-platform/web/playwright.config.ts`
- Test directory: `/Users/mahesha/Downloads/hasivu-platform/web/tests/`

### Test Scripts Available

```bash
npm run test                          # Jest unit tests
npm run test:watch                   # Jest watch mode
npm run test:coverage                # Coverage report
npm run test:playwright              # Playwright E2E
npm run test:accessibility           # A11y tests
npm run test:visual                  # Visual regression
npm run test:mobile                  # Mobile tests
npm run test:performance             # Performance tests
```

---

## Build & Development Scripts

```bash
npm run dev                          # Next.js dev server
npm run build                        # Production build
npm run start                        # Production server
npm run lint                         # ESLint
npm run lint:fix                     # Fix linting errors
npm run type-check                   # TypeScript check (586 errors currently)
npm run analyze                      # Bundle analysis
npm run quality:check                # Lint + TypeCheck + Smoke tests
npm run quality:full                 # Full QA suite
```

---

## Documentation & Analysis

- **Full Analysis Report**: `/Users/mahesha/Downloads/hasivu-platform/web/FRONTEND_ANALYSIS_REPORT.md` (787 lines)
- **This Reference File**: `/Users/mahesha/Downloads/hasivu-platform/web/KEY_FILES_REFERENCE.md`

---

## Quick Stats

| Metric                 | Count |
| ---------------------- | ----- |
| TypeScript Files       | 350+  |
| React Components       | 254   |
| UI Components (shadcn) | 70    |
| Type Definition Lines  | 2215  |
| API Routes             | 44    |
| Custom Hooks           | 9     |
| Services               | 15+   |
| Context Providers      | 7+    |
| TypeScript Errors      | 586   |
| Missing Components     | 2     |
| Missing Services       | 1     |
| Icon Import Issues     | 53    |
| Mobile Type Issues     | 14    |

---

**Generated**: October 22, 2025  
**Last Updated**: October 22, 2025

For complete details, see FRONTEND_ANALYSIS_REPORT.md
