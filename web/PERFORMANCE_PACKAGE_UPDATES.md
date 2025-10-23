# Package.json Updates for Performance Optimization

## Required Dependency Changes

### 1. Add Performance Dependencies

```bash
# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Install web-vitals for performance monitoring
npm install web-vitals

# Install Lighthouse CI for automated testing
npm install --save-dev @lhci/cli

# Install debounce utility
npm install lodash.debounce
npm install --save-dev @types/lodash.debounce

# Optional: Vercel Analytics (if deploying to Vercel)
npm install @vercel/analytics
```

### 2. Update Scripts Section

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "_comment_performance": "=== PERFORMANCE TESTING ===",
    "analyze": "cross-env ANALYZE=true next build",
    "analyze:server": "cross-env BUNDLE_ANALYZE=server next build",
    "analyze:browser": "cross-env BUNDLE_ANALYZE=browser next build",

    "_comment_lighthouse": "=== LIGHTHOUSE TESTING ===",
    "lighthouse": "lighthouse http://localhost:3000/menu --view --output=html --output-path=./lighthouse-report.html",
    "lighthouse:checkout": "lighthouse http://localhost:3000/checkout --view --output=html --output-path=./lighthouse-checkout.html",
    "perf:test": "npm run build && npm run start & sleep 5 && npm run lighthouse",

    "_comment_lighthouse_ci": "=== LIGHTHOUSE CI ===",
    "lhci:collect": "lhci collect",
    "lhci:assert": "lhci assert",
    "lhci:upload": "lhci upload",
    "lhci": "npm run build && npm run lhci:collect && npm run lhci:assert",

    "_comment_bundle": "=== BUNDLE SIZE ===",
    "bundle:check": "npm run build && du -sh .next/static/chunks/* | sort -h",
    "bundle:stats": "next build --profile && open .next/analyze/client.html"
  }
}
```

### 3. Complete package.json Additions

```json
{
  "dependencies": {
    "web-vitals": "^3.5.0",
    "lodash.debounce": "^4.0.8"
  },
  "devDependencies": {
    "@next/bundle-analyzer": "^13.4.12",
    "@lhci/cli": "^0.13.0",
    "@types/lodash.debounce": "^4.0.9",
    "lighthouse": "^12.8.2"
  }
}
```

---

## Updated Next.js Configuration

### Replace next.config.js

```bash
# Backup current configuration
cp next.config.js next.config.backup.js

# Use optimized configuration
cp next.config.optimized.js next.config.js
```

Or manually update `next.config.js` with:

```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },

  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      'date-fns',
    ],
  },

  // ... rest of config from next.config.optimized.js
};

module.exports = withPWA(withBundleAnalyzer(nextConfig));
```

---

## Phase 3: Dependency Removal (UI Library Consolidation)

### Dependencies to Remove (After Migration)

```bash
# WARNING: Only run these commands AFTER completing Phase 3 migration

# Remove MUI packages (~2.5MB)
npm uninstall @mui/material @mui/icons-material @mui/system @mui/x-data-grid @mui/x-date-pickers

# Remove Mantine packages (~1.8MB)
npm uninstall @mantine/core @mantine/charts @mantine/dates @mantine/hooks @mantine/notifications

# Remove Emotion (used by MUI) (~800KB)
npm uninstall @emotion/react @emotion/styled @emotion/cache @emotion/server @emotion/utils @emotion/serialize

# Remove duplicate chart libraries (keep recharts OR chart.js, not both)
npm uninstall chart.js react-chartjs-2  # If using recharts
# OR
npm uninstall recharts  # If using chart.js

# Remove duplicate icon libraries (keep lucide-react only)
npm uninstall @mui/icons-material @tabler/icons-react
```

### Keep These Dependencies

```json
{
  "dependencies": {
    "@radix-ui/react-*": "Latest versions (tree-shakeable)",
    "lucide-react": "^0.539.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.1",
    "recharts": "^2.15.4"
  }
}
```

---

## Verification Commands

### 1. Check Installed Packages

```bash
# List all dependencies with sizes
npm list --depth=0

# Check specific package sizes
npm info @mui/material dist.tarball
npm info @mantine/core dist.tarball

# Total node_modules size
du -sh node_modules
```

### 2. Run Bundle Analysis

```bash
# Build with analyzer
npm run analyze

# Check bundle sizes
npm run bundle:check
```

### 3. Run Performance Tests

```bash
# Full performance test suite
npm run build
npm run start  # In separate terminal
npm run lighthouse

# Run Lighthouse CI
npm run lhci
```

---

## Expected Results

### Before Optimization

```
node_modules size: 1.8GB
Bundle size (initial): ~850KB
Dependencies count: ~1500 packages
```

### After Phase 1 (Quick Wins)

```
node_modules size: 1.8GB (unchanged)
Bundle size (initial): ~650KB (-24%)
Dependencies count: ~1500 packages
Performance improvements: +40%
```

### After Phase 2 (Medium Optimizations)

```
node_modules size: 1.8GB (unchanged)
Bundle size (initial): ~550KB (-35%)
Dependencies count: ~1500 packages
Performance improvements: +60%
```

### After Phase 3 (Major Refactoring)

```
node_modules size: ~800MB (-56%) ✅
Bundle size (initial): ~480KB (-44%) ✅
Dependencies count: ~800 packages (-47%) ✅
Performance improvements: +65% ✅
```

---

## Installation Script

Create `scripts/install-performance-tools.sh`:

```bash
#!/bin/bash

echo "📦 Installing performance optimization dependencies..."

# Install performance dependencies
npm install --save-dev @next/bundle-analyzer @lhci/cli
npm install web-vitals lodash.debounce
npm install --save-dev @types/lodash.debounce

echo "✅ Dependencies installed successfully!"
echo ""
echo "Next steps:"
echo "1. Update next.config.js with optimized configuration"
echo "2. Add PerformanceMonitor to app/layout.tsx"
echo "3. Run: npm run analyze"
echo ""
echo "See PERFORMANCE_IMPLEMENTATION_GUIDE.md for detailed instructions"
```

Make executable:

```bash
chmod +x scripts/install-performance-tools.sh
./scripts/install-performance-tools.sh
```

---

## Gitignore Updates

Add to `.gitignore`:

```
# Performance analysis
.next/analyze/
lighthouse-report.html
lighthouse-checkout.html
.lighthouseci/
performance-report-*.json

# Bundle analyzer
stats.html
analyze/
```

---

## CI/CD Integration (GitHub Actions)

Create `.github/workflows/performance.yml`:

```yaml
name: Performance Check

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  performance:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run Lighthouse CI
        run: npm run lhci
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

      - name: Check bundle size
        run: |
          npm run bundle:check

      - name: Upload Lighthouse results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: lighthouse-results
          path: .lighthouseci
```

---

## Troubleshooting

### Issue: `@next/bundle-analyzer` not found

```bash
# Make sure it's in devDependencies
npm install --save-dev @next/bundle-analyzer

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Lighthouse CI failing

```bash
# Install globally
npm install -g @lhci/cli

# Test locally first
lhci collect --url=http://localhost:3000/menu
```

### Issue: Bundle analyzer not opening

```bash
# Manually open the generated files
open .next/analyze/client.html
open .next/analyze/server.html
```

---

## Monitoring Setup (Post-Deployment)

### 1. Vercel Analytics (Recommended)

```bash
npm install @vercel/analytics
```

Update `app/layout.tsx`:

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

### 2. Google Analytics Web Vitals

Already configured in `<PerformanceMonitor />` component.

Add to `.env.local`:

```
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## Summary

**Required Actions**:

1. ✅ Install performance dependencies: `npm install web-vitals lodash.debounce @next/bundle-analyzer @lhci/cli`
2. ✅ Update package.json scripts (see above)
3. ✅ Replace next.config.js with optimized version
4. ✅ Add PerformanceMonitor component to layout
5. ✅ Run initial bundle analysis: `npm run analyze`
6. ⏳ Follow implementation guide for optimizations
7. ⏳ Phase 3: Remove MUI and Mantine dependencies

**Expected Timeline**:

- Setup: 30 minutes
- Phase 1: 2-3 days
- Phase 2: 3-4 days
- Phase 3: 8-10 days

**Total Improvement**:

- Bundle size: -44% (850KB → 480KB)
- Load time: -40% (4.2s → 2.5s LCP)
- Dependencies: -47% (1500 → 800 packages)
