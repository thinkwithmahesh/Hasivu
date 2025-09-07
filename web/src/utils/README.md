# HASIVU Platform - Utils Directory

Comprehensive utility functions for the HASIVU school food delivery platform frontend.

## Available Utilities

### Core Utilities

#### `createEmotionCache.ts`
- **Purpose**: Emotion.js SSR cache creation for Material-UI
- **Key Functions**: `createEmotionCache()`, `createEmotionSsrCache()`, `defaultEmotionCache`
- **Usage**: Ensures consistent styling across SSR and client-side rendering

#### `formatters.ts`
- **Purpose**: Data formatting utilities for dates, currency, time, and platform-specific data
- **Key Objects**: `currencyFormatter`, `dateFormatter`, `timeFormatter`, `numberFormatter`, `hasivuFormatter`
- **Features**: Indian currency formatting, RFID formatting, phone number formatting

#### `validators.ts`
- **Purpose**: Form validation schemas using Yup for consistent validation
- **Key Objects**: `authValidation`, `profileValidation`, `paymentValidation`, `orderValidation`
- **Features**: Authentication, payments, RFID, school registration validation

#### `api.ts`
- **Purpose**: Centralized API client with authentication, retry logic, and error handling
- **Key Objects**: `apiClient`, `api`, `API_CONFIG`
- **Features**: Token refresh, request/response interceptors, file uploads

#### `constants.ts`
- **Purpose**: Application constants, enums, and configuration
- **Key Objects**: `APP_CONFIG`, `USER_ROLES`, `ORDER_STATUS`, `PAYMENT_METHODS`
- **Features**: Type-safe constants, role-permission mapping, business configuration

#### `helpers.ts`
- **Purpose**: General-purpose utility functions
- **Key Objects**: `stringUtils`, `arrayUtils`, `objectUtils`, `dateUtils`, `permissionUtils`
- **Features**: String manipulation, array operations, permission checking, storage utilities

### Advanced Utilities

#### `notifications.ts`
- **Purpose**: Push notifications and browser notification management
- **Key Objects**: `notificationManager`, `notificationTemplates`, `notificationUtils`
- **Features**: Service worker integration, push subscriptions, predefined templates

#### `analytics.ts`
- **Purpose**: Event tracking and performance monitoring
- **Key Objects**: `analyticsManager`, `analytics`
- **Features**: Google Analytics, Mixpanel, custom endpoints, e-commerce tracking

## Quick Start

```typescript
// Import specific utilities
import { currencyFormatter, dateFormatter } from '@/utils/formatters';
import { authValidation } from '@/utils/validators';
import { api } from '@/utils/api';
import { USER_ROLES, PERMISSIONS } from '@/utils/constants';
import { cn, stringUtils, permissionUtils } from '@/utils/helpers';

// Or import everything
import { utils } from '@/utils';

// Usage examples
const price = currencyFormatter.format(1250); // ₹1,250.00
const date = dateFormatter.formatRelative(new Date()); // "2 hours ago"
const hasPermission = permissionUtils.hasPermission(USER_ROLES.PARENT, PERMISSIONS.ORDER_CREATE);

// API calls
const orders = await api.orders.getAll();
const profile = await api.users.getProfile();
```

## Dependencies

Some utilities require additional packages:

```bash
# Required dependencies (already in package.json)
npm install axios date-fns yup @emotion/react @emotion/styled

# Optional dependencies for enhanced functionality
npm install clsx tailwind-merge  # For advanced className utility
npm install web-vitals           # For performance monitoring
```

## TypeScript Support

All utilities are fully typed with TypeScript interfaces and type exports:

```typescript
import type {
  UserRole,
  Permission,
  OrderStatus,
  PaymentMethod,
  ApiResponse,
  ApiError,
  NotificationConfig,
  AnalyticsEventData
} from '@/utils';
```

## Best Practices

1. **Import Specificity**: Import only what you need to optimize bundle size
2. **Type Safety**: Use exported types for better development experience
3. **Error Handling**: API utilities include comprehensive error handling
4. **Caching**: Formatters and validators are optimized for repeated use
5. **SSR Compatibility**: All utilities work with Next.js SSR

## Contributing

When adding new utilities:

1. Follow existing patterns and naming conventions
2. Add comprehensive JSDoc comments
3. Include TypeScript types and interfaces
4. Add exports to `index.ts`
5. Update this README with new utilities
6. Consider SSR compatibility for Next.js

## File Structure

```
src/utils/
├── index.ts              # Central exports
├── createEmotionCache.ts  # Emotion SSR cache
├── formatters.ts         # Data formatting
├── validators.ts         # Form validation
├── api.ts               # API client
├── constants.ts         # App constants
├── helpers.ts           # General utilities
├── notifications.ts     # Push notifications
├── analytics.ts         # Event tracking
└── README.md           # This file
```