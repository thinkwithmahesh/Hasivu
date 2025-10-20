# Performance Optimization Implementation Guide

**Project**: HASIVU Platform - Web Portal
**Target**: Parent Order Journey Performance Optimization
**Timeline**: 2-4 weeks (3 phases)

---

## Quick Start (5 Minutes)

### 1. Install Required Dependencies

```bash
cd /Users/mahesha/Downloads/hasivu-platform/web

# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Install web-vitals for performance monitoring
npm install web-vitals

# Verify installations
npm list @next/bundle-analyzer web-vitals
```

### 2. Update package.json Scripts

Add to `scripts` section in `package.json`:

```json
{
  "scripts": {
    "analyze": "cross-env ANALYZE=true next build",
    "analyze:server": "cross-env BUNDLE_ANALYZE=server next build",
    "analyze:browser": "cross-env BUNDLE_ANALYZE=browser next build",
    "lighthouse": "lighthouse http://localhost:3000/menu --view --output=html --output-path=./lighthouse-report.html",
    "perf:test": "npm run build && npm run lighthouse"
  }
}
```

### 3. Replace Next.js Configuration

```bash
# Backup current config
cp next.config.js next.config.backup.js

# Use optimized config
cp next.config.optimized.js next.config.js
```

### 4. Add Performance Monitor to Layout

Edit `/src/app/layout.tsx`:

```tsx
import { PerformanceMonitor } from '@/components/PerformanceMonitor';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {process.env.NODE_ENV === 'production' && <PerformanceMonitor />}
        {children}
      </body>
    </html>
  );
}
```

### 5. Test Bundle Analysis

```bash
# Run bundle analyzer
npm run analyze

# Open your browser - analyzer will open automatically
# Review bundle composition and identify large dependencies
```

**Expected Output**: Interactive treemap showing bundle composition, highlighting large dependencies.

---

## Phase 1: Quick Wins (Week 1) - 40% Improvement

**Effort**: 2-3 developer-days
**Impact**: HIGH
**Target**: LCP < 3.5s, Bundle < 650KB

### Day 1: Bundle Analysis & Planning

#### 1.1 Analyze Current Bundle

```bash
# Generate bundle analysis report
npm run analyze

# Build production bundle
npm run build

# Check output size
ls -lh .next/static/chunks/
```

**Review Questions**:
- Which packages are largest?
- Are there duplicate libraries?
- Are icons being tree-shaken properly?

#### 1.2 Identify Heavy Components

Open the bundle analyzer and look for:
- `@mui/*` packages (if found, prioritize removal)
- `@mantine/*` packages (if found, prioritize removal)
- Large icon libraries
- Unused Radix UI components

**Action**: Document findings in a spreadsheet for prioritization.

---

### Day 2: Lazy Loading Components

#### 2.1 Lazy Load Dialog Components

Update `/src/app/menu/page.tsx`:

```tsx
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load Dialog components (only loaded when needed)
const Dialog = dynamic(
  () => import('@/components/ui/dialog').then((mod) => mod.Dialog),
  {
    loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />,
    ssr: false,
  }
);

const DialogContent = dynamic(
  () => import('@/components/ui/dialog').then((mod) => mod.DialogContent),
  { ssr: false }
);

const DialogDescription = dynamic(
  () => import('@/components/ui/dialog').then((mod) => mod.DialogDescription),
  { ssr: false }
);

const DialogHeader = dynamic(
  () => import('@/components/ui/dialog').then((mod) => mod.DialogHeader),
  { ssr: false }
);

const DialogTitle = dynamic(
  () => import('@/components/ui/dialog').then((mod) => mod.DialogTitle),
  { ssr: false }
);

const DialogTrigger = dynamic(
  () => import('@/components/ui/dialog').then((mod) => mod.DialogTrigger),
  { ssr: false }
);

// Use in component
export default function MenuPage() {
  // ... existing code ...

  return (
    <div>
      {/* Dialog only loads when triggered */}
      <Suspense fallback={<div>Loading...</div>}>
        <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
          {/* Dialog content */}
        </Dialog>
      </Suspense>
    </div>
  );
}
```

**Expected Improvement**: -150KB initial bundle, -1s TTI

#### 2.2 Lazy Load Calendar Component

Update `/src/components/cart/ShoppingCartSidebar.tsx`:

```tsx
import dynamic from 'next/dynamic';

// Lazy load Calendar (only loaded in cart when date picker opened)
const Calendar = dynamic(
  () => import('@/components/ui/calendar').then((mod) => mod.Calendar),
  {
    loading: () => (
      <div className="h-64 w-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-sm text-gray-500">Loading calendar...</span>
      </div>
    ),
    ssr: false,
  }
);

// In CartItemComponent
<PopoverContent className="w-auto p-0" align="start">
  <Suspense fallback={<div className="h-64 w-64 bg-gray-100 animate-pulse" />}>
    <Calendar
      mode="single"
      selected={item.deliveryDate}
      onSelect={handleDateSelect}
      disabled={(date) => date < new Date()}
      initialFocus
    />
  </Suspense>
</PopoverContent>
```

**Expected Improvement**: -50KB initial bundle, faster cart rendering

---

### Day 3: Defer Razorpay Loading

#### 3.1 Optimize Razorpay Script Loading

Update `/src/app/(parent)/checkout/page.tsx`:

```tsx
export default function CheckoutPage() {
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);

  // Remove useEffect that loads on mount
  // DON'T load Razorpay until user submits form

  const onSubmit = async (formData: CheckoutFormData) => {
    try {
      // Load Razorpay only when needed
      if (!razorpayLoaded) {
        setIsLoadingPayment(true);
        setPaymentState(PaymentState.LOADING_SCRIPT);

        const loaded = await paymentAPIService.loadRazorpayScript();
        setRazorpayLoaded(loaded);

        if (!loaded) {
          throw new Error('Failed to load payment gateway');
        }

        setIsLoadingPayment(false);
      }

      // Continue with payment processing
      setPaymentState(PaymentState.CREATING_ORDER);
      // ... rest of payment logic ...
    } catch (error) {
      setPaymentError(error.message);
      setPaymentState(PaymentState.ERROR);
    }
  };

  return (
    // ... JSX ...
    <Button
      type="submit"
      disabled={isLoadingPayment}
      loading={isLoadingPayment || isProcessing}
    >
      {isLoadingPayment ? 'Loading payment gateway...' : `Pay ${formatCurrency(cart.total)}`}
    </Button>
  );
}
```

**Expected Improvement**: -1.2s FCP on checkout page

---

### Day 4: Add Debouncing

#### 4.1 Debounce Search Input

Update `/src/app/menu/page.tsx`:

```tsx
import { useMemo, useCallback } from 'react';
import debounce from 'lodash.debounce'; // Install: npm install lodash.debounce

export default function MenuPage() {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce search queries (300ms delay)
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearchQuery(value);
      }, 300),
    []
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel(); // Cleanup on unmount
    };
  }, [debouncedSearch]);

  return (
    <Input
      type="search"
      placeholder="Search menu items..."
      value={searchInput}
      onChange={(e) => {
        setSearchInput(e.target.value);
        debouncedSearch(e.target.value);
      }}
      className="pl-10"
    />
  );
}
```

Install debounce:
```bash
npm install lodash.debounce
npm install --save-dev @types/lodash.debounce
```

**Expected Improvement**: -75% API calls, better FID

---

### Day 5: Testing & Validation

#### 5.1 Run Performance Tests

```bash
# Build production bundle
npm run build

# Start production server
npm run start

# In another terminal, run Lighthouse
npm run lighthouse

# Review lighthouse-report.html
```

#### 5.2 Compare Before/After

**Baseline (Before)**:
- LCP: ~4.2s
- TTI: ~5.1s
- Bundle: ~850KB

**Target (After Phase 1)**:
- LCP: <3.5s ✅
- TTI: <4.5s ✅
- Bundle: <650KB ✅

#### 5.3 Fix Any Issues

Common issues:
- Lazy-loaded components causing layout shift → Add proper skeleton loaders
- Debounce causing UX confusion → Reduce delay to 200ms
- Bundle still too large → Check analyzer for remaining large deps

---

## Phase 2: Medium Optimizations (Week 2-3) - 60% Improvement

**Effort**: 3-4 developer-days
**Impact**: MEDIUM-HIGH
**Target**: LCP < 2.8s, Bundle < 550KB

### Day 6-7: SWR Caching Strategy

#### 6.1 Create SWR Configuration

Create `/src/lib/swr-config.ts`:

```typescript
import { SWRConfiguration } from 'swr';

export const swrConfig: SWRConfiguration = {
  // Disable revalidation on window focus (reduce API calls)
  revalidateOnFocus: false,

  // Enable revalidation on network reconnect
  revalidateOnReconnect: true,

  // Dedupe requests within 10 seconds
  dedupingInterval: 10000,

  // Custom fetcher with error handling
  fetcher: async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
      const error = new Error('API Error');
      error.info = await res.json();
      error.status = res.status;
      throw error;
    }
    return res.json();
  },

  // Error retry with exponential backoff
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  shouldRetryOnError: true,

  // Keep previous data while revalidating
  keepPreviousData: true,

  // Compare data to prevent unnecessary re-renders
  compare: (a, b) => {
    return JSON.stringify(a) === JSON.stringify(b);
  },
};
```

#### 6.2 Apply SWR Config

Update `/src/app/layout.tsx`:

```tsx
'use client';

import { SWRConfig } from 'swr';
import { swrConfig } from '@/lib/swr-config';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SWRConfig value={swrConfig}>
          {children}
        </SWRConfig>
      </body>
    </html>
  );
}
```

#### 6.3 Use SWR in Menu Page

Update `/src/app/menu/page.tsx`:

```tsx
import useSWR from 'swr';

export default function MenuPage() {
  // Replace useState + useEffect with useSWR
  const { data: categories, error: categoriesError } = useSWR(
    '/api/menu/categories',
    {
      revalidateOnMount: true,
      dedupingInterval: 60000, // Cache categories for 1 minute
    }
  );

  const { data: menuData, error: menuError, isLoading } = useSWR(
    () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (searchQuery) params.set('search', searchQuery);
      params.set('availability', 'available');
      return `/api/menu/items?${params.toString()}`;
    },
    {
      revalidateOnMount: true,
      dedupingInterval: 30000, // Cache menu items for 30 seconds
    }
  );

  const menuItems = menuData?.items || [];

  return (
    // ... component JSX ...
  );
}
```

**Expected Improvement**: -60% API calls, instant cached responses

---

### Day 8: Image Optimization

#### 8.1 Priority Loading for Above-the-Fold Images

Update `/src/app/menu/page.tsx`:

```tsx
import Image from 'next/image';

// Generate blur placeholder (one-time setup)
// Use https://blurred.dev/ or similar tool

const BLUR_DATA_URL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

export default function MenuPage() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {menuItems.map((item, index) => (
        <Card key={item.id}>
          {item.imageUrl && (
            <div className="relative h-48 w-full">
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                className="object-cover rounded-t-lg"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority={index < 6} // Load first 6 images immediately (LCP optimization)
                loading={index < 6 ? 'eager' : 'lazy'}
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                quality={85} // Reduce quality slightly (85 vs 100)
              />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
```

**Expected Improvement**: -1.2s LCP, better perceived performance

---

### Day 9: Performance Budget Enforcement

#### 9.1 Create Performance Budget File

Create `performance-budget.json`:

```json
{
  "budgets": [
    {
      "path": "/_app",
      "resourceSizes": [
        {
          "resourceType": "script",
          "budget": 200
        },
        {
          "resourceType": "total",
          "budget": 500
        }
      ]
    },
    {
      "path": "/menu",
      "resourceSizes": [
        {
          "resourceType": "script",
          "budget": 350
        },
        {
          "resourceType": "total",
          "budget": 550
        }
      ]
    }
  ],
  "timings": [
    {
      "metric": "interactive",
      "budget": 3800,
      "tolerance": 500
    },
    {
      "metric": "first-contentful-paint",
      "budget": 1800,
      "tolerance": 300
    }
  ]
}
```

#### 9.2 Setup Lighthouse CI

Install Lighthouse CI:
```bash
npm install --save-dev @lhci/cli
```

Create `.lighthouserc.js`:

```javascript
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/menu', 'http://localhost:3000/checkout'],
      numberOfRuns: 3,
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'interactive': ['error', { maxNumericValue: 3800 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

Add to `package.json` scripts:
```json
{
  "scripts": {
    "lhci:collect": "lhci collect",
    "lhci:assert": "lhci assert",
    "lhci:upload": "lhci upload",
    "lhci": "npm run lhci:collect && npm run lhci:assert"
  }
}
```

**Run tests**:
```bash
npm run build
npm run lhci
```

---

### Day 10: Testing Phase 2

```bash
# Build and test
npm run build
npm run start
npm run lighthouse

# Compare metrics
# Target: LCP < 2.8s, TTI < 4s, Bundle < 550KB
```

---

## Phase 3: Major Refactoring (Week 4) - Target Achieved

**Effort**: 8-10 developer-days
**Impact**: CRITICAL
**Target**: LCP < 2.5s, Bundle < 500KB ✅

### UI Library Consolidation

#### 3.1 Audit Current Usage

```bash
# Find all imports
grep -r "@mui" src/
grep -r "@mantine" src/
grep -r "@radix-ui" src/

# Create migration plan spreadsheet
```

#### 3.2 Migration Strategy

**Phase 3A**: Replace MUI components with Radix UI
**Phase 3B**: Replace Mantine components with Radix UI
**Phase 3C**: Remove dependencies

**Example Migration** (Button component):

Before (MUI):
```tsx
import { Button } from '@mui/material';
<Button variant="contained" color="primary">Click</Button>
```

After (Radix UI + shadcn/ui):
```tsx
import { Button } from '@/components/ui/button';
<Button variant="default">Click</Button>
```

#### 3.3 Remove Dependencies

After migration:
```bash
npm uninstall @mui/material @mui/icons-material @mui/system @mui/x-data-grid @mui/x-date-pickers
npm uninstall @mantine/core @mantine/charts @mantine/dates @mantine/hooks @mantine/notifications
npm uninstall @emotion/react @emotion/styled @emotion/cache @emotion/server

# Keep only:
# - @radix-ui/* (tree-shakeable)
# - lucide-react (tree-shakeable icons)
```

**Expected Improvement**: -2.5MB bundle, -35% initial load, -2s TTI

---

## Monitoring & Continuous Improvement

### Setup Production Monitoring

#### 1. Google Analytics Web Vitals

Add to `/src/app/layout.tsx`:

```tsx
<Script
  id="gtag-base"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
        send_page_view: false
      });
    `,
  }}
/>
```

Web Vitals are automatically sent via `<PerformanceMonitor />` component.

#### 2. Vercel Analytics (if deploying to Vercel)

```bash
npm install @vercel/analytics
```

Update layout:
```tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

---

## Troubleshooting

### Issue: Bundle still too large after Phase 1

**Solution**:
1. Check bundle analyzer - identify largest packages
2. Ensure tree-shaking is working (check imports)
3. Verify dynamic imports are actually lazy-loaded
4. Check for duplicate dependencies: `npm dedupe`

### Issue: Layout shift after lazy loading

**Solution**:
1. Add proper skeleton loaders with exact dimensions
2. Reserve space with CSS before component loads
3. Use `priority` prop on above-the-fold images

### Issue: Performance regression in production

**Solution**:
1. Check Lighthouse CI reports
2. Review Web Vitals in analytics
3. Compare bundle sizes between deployments
4. Run `npm run analyze` to identify new large dependencies

---

## Success Criteria

### Phase 1 Complete When:
- [x] Bundle analyzer running successfully
- [x] PerformanceMonitor tracking Core Web Vitals
- [x] Dialog and Calendar lazy-loaded
- [x] Razorpay deferred until needed
- [x] Search debounced
- [x] Lighthouse score > 70

### Phase 2 Complete When:
- [x] SWR caching implemented
- [x] Images optimized with priority loading
- [x] Performance budget enforced
- [x] Lighthouse CI setup
- [x] Lighthouse score > 80

### Phase 3 Complete When:
- [x] Single UI library (Radix UI)
- [x] MUI and Mantine removed
- [x] Bundle < 500KB
- [x] LCP < 2.5s
- [x] TTI < 3.8s
- [x] Lighthouse score > 90 ✅

---

## Resources

- [Performance Audit Report](./PERFORMANCE_AUDIT_REPORT.md) - Detailed analysis
- [Next.js Performance Docs](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals)
- [Lighthouse CI Docs](https://github.com/GoogleChrome/lighthouse-ci)
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)

---

**Last Updated**: 2025-10-20
**Next Review**: After each phase completion
