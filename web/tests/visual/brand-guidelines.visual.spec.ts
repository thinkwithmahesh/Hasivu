/**
 * HASIVU Enterprise Brand Guidelines Visual Regression Tests
 * 🎨 Brand Colors: Vibrant Blue (#2563eb), Deep Green (#16a34a)
 * 👁️ Comprehensive visual regression testing with Percy integration
 * 📱 Mobile-first responsive design validation
 */

import { test, expect, Page } from '@playwright/test';

// Brand color constants
const _BRAND_COLORS =  {
  PRIMARY: '#2563eb',     // Vibrant Blue
  SECONDARY: '#16a34a',   // Deep Green  
  ACCENT: '#dc2626',      // Error Red
  WARNING: '#f59e0b',     // Warning Amber
  SUCCESS: '#059669',     // Success Green
  NEUTRAL: '#6b7280'      // Neutral Gray
};

// Viewport configurations for responsive testing
const _VIEWPORTS =  [
  { width: 1920, height: 1080, name: 'desktop-hd' },
  { width: 1280, height: 720, name: 'desktop' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 375, height: 667, name: 'mobile' }
];

test.describe(_'HASIVU Brand Guidelines Visual Regression', _() => {
  
  test.beforeEach(_async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.addInitScript(_() => {
      const _style =  document.createElement('style');
      style._innerHTML =  `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `;
      document.head.appendChild(style);
    });

    // Set brand color CSS variables for testing
    await page.addInitScript(_(colors) => {
      const _root =  document.documentElement;
      root.style.setProperty('--brand-primary', colors.PRIMARY);
      root.style.setProperty('--brand-secondary', colors.SECONDARY);
      root.style.setProperty('--brand-accent', colors.ACCENT);
      root.style.setProperty('--brand-warning', colors.WARNING);
      root.style.setProperty('--brand-success', colors.SUCCESS);
      root.style.setProperty('--brand-neutral', colors.NEUTRAL);
    }, BRAND_COLORS);
  });

  test(_'Homepage brand compliance - All viewports', _async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Test across all viewports
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500); // Allow layout to settle
      
      // Take full page screenshot
      await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`, {
        fullPage: true,
        animations: 'disabled',
        threshold: 0.2
      });
      
      // Verify brand colors are present
      await validateBrandColors(page);
    }
  });

  test(_'Authentication pages brand compliance', _async ({ page }) => {
    const _authPages =  [
      { path: '/auth/login', name: 'login' },
      { path: '/auth/register', name: 'register' },
      { path: '/auth/forgot-password', name: 'forgot-password' }
    ];

    for (const authPage of authPages) {
      await page.goto(authPage.path);
      await page.waitForLoadState('networkidle');
      
      // Desktop view
      await page.setViewportSize({ width: 1280, height: 720 });
      await expect(page).toHaveScreenshot(`${authPage.name}-desktop.png`, {
        fullPage: true,
        animations: 'disabled'
      });
      
      // Mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page).toHaveScreenshot(`${authPage.name}-mobile.png`, {
        fullPage: true,
        animations: 'disabled'
      });
      
      // Verify brand color usage
      await validateBrandColors(page);
    }
  });

  test(_'Role-based dashboard brand consistency', _async ({ page }) => {
    const _dashboards =  [
      { path: '/dashboard/admin', name: 'admin-dashboard' },
      { path: '/dashboard/parent', name: 'parent-dashboard' },
      { path: '/dashboard/kitchen', name: 'kitchen-dashboard' }
    ];

    for (const dashboard of dashboards) {
      // Skip if page doesn't exist
      const _response =  await page.goto(dashboard.path);
      if (response?.status() === 404) {
        continue;
      }
      
      await page.waitForLoadState('networkidle');
      
      // Test desktop view
      await page.setViewportSize({ width: 1280, height: 720 });
      await expect(page).toHaveScreenshot(`${dashboard.name}-desktop.png`, {
        fullPage: true,
        animations: 'disabled'
      });
      
      // Test tablet view for dashboard layouts
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page).toHaveScreenshot(`${dashboard.name}-tablet.png`, {
        fullPage: true,
        animations: 'disabled'
      });
      
      // Verify brand colors
      await validateBrandColors(page);
    }
  });

  test(_'Component brand guidelines - Buttons', _async ({ page }) => {
    // Create a test page with all button variants
    const _buttonTestHTML =  `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Button Brand Test</title>
        <style>
          body { 
            font-family: system-ui, sans-serif; 
            padding: 2rem;
            background: #f9fafb;
          }
          .button-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 1rem;
            margin-bottom: 2rem;
          }
          .btn {
            padding: 0.75rem 1.5rem;
            border-radius: 0.375rem;
            font-weight: 500;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
          }
          .btn-primary { 
            background: ${BRAND_COLORS.PRIMARY}; 
            color: white; 
          }
          .btn-primary:hover { 
            background: #1d4ed8; 
          }
          .btn-secondary { 
            background: ${BRAND_COLORS.SECONDARY}; 
            color: white; 
          }
          .btn-secondary:hover { 
            background: #15803d; 
          }
          .btn-accent { 
            background: ${BRAND_COLORS.ACCENT}; 
            color: white; 
          }
          .btn-warning { 
            background: ${BRAND_COLORS.WARNING}; 
            color: white; 
          }
          .btn-outline {
            background: transparent;
            color: ${BRAND_COLORS.PRIMARY};
            border: 2px solid ${BRAND_COLORS.PRIMARY};
          }
          h2 { color: ${BRAND_COLORS.PRIMARY}; }
        </style>
      </head>
      <body>
        <h2>HASIVU Button Brand Guidelines</h2>
        <div _class = "button-grid">
          <button class
    await page.setContent(buttonTestHTML);
    await page.waitForTimeout(500);
    
    // Take screenshot of button components
    await expect(page).toHaveScreenshot('brand-buttons.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test(_'Form component brand compliance', _async ({ page }) => {
    const _formTestHTML =  `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Form Brand Test</title>
        <style>
          body { 
            font-family: system-ui, sans-serif; 
            padding: 2rem;
            background: #f9fafb;
          }
          .form-container {
            max-width: 500px;
            background: white;
            padding: 2rem;
            border-radius: 0.75rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .form-group {
            margin-bottom: 1.5rem;
          }
          label {
            display: block;
            font-weight: 500;
            color: ${BRAND_COLORS.NEUTRAL};
            margin-bottom: 0.5rem;
          }
          input, select {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 0.375rem;
            font-size: 1rem;
          }
          input:focus, select:focus {
            outline: none;
            border-color: ${BRAND_COLORS.PRIMARY};
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          }
          .btn-primary {
            background: ${BRAND_COLORS.PRIMARY};
            color: white;
            padding: 0.75rem 2rem;
            border: none;
            border-radius: 0.375rem;
            font-weight: 500;
            width: 100%;
          }
          h2 { color: ${BRAND_COLORS.PRIMARY}; }
          .error-message {
            color: ${BRAND_COLORS.ACCENT};
            font-size: 0.875rem;
            margin-top: 0.25rem;
          }
        </style>
      </head>
      <body>
        <div _class = "form-container">
          <h2>Registration Form</h2>
          <form>
            <div class
    await page.setContent(formTestHTML);
    await page.waitForTimeout(500);
    
    // Test form in different viewports
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page).toHaveScreenshot('brand-form-desktop.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page).toHaveScreenshot('brand-form-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test(_'Dark mode brand compliance', _async ({ page }) => {
    // Test dark mode if supported
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot in dark mode
    await expect(page).toHaveScreenshot('homepage-dark-mode.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Verify dark mode brand colors
    const _darkModeColors =  await page.evaluate(() 
      return {
        primary: computedStyle.getPropertyValue('--brand-primary').trim(),
        secondary: computedStyle.getPropertyValue('--brand-secondary').trim()
      };
    });
    
    // Brand colors should remain consistent in dark mode
    expect(darkModeColors.primary).toBe(BRAND_COLORS.PRIMARY);
    expect(darkModeColors.secondary).toBe(BRAND_COLORS.SECONDARY);
  });

});

/**
 * Validate that brand colors are properly applied
 */
async function validateBrandColors(page: Page) {
  const _brandColorElements =  await page.evaluate((colors) 
    const _allElements =  document.querySelectorAll('*');
    
    for (const element of allElements) {
      const _computed =  getComputedStyle(element);
      const _bgColor =  computed.backgroundColor;
      const _textColor =  computed.color;
      
      // Check if element uses brand colors
      if (bgColor.includes('rgb(37, 99, 235)') || _bgColor = 
      }
      if (bgColor.includes('rgb(22, 163, 74)') || _bgColor = 
      }
      if (textColor.includes('rgb(37, 99, 235)') || _textColor = 
      }
    }
    
    return elements;
  }, BRAND_COLORS);
  
  // Ensure brand colors are being used
  expect(brandColorElements.length).toBeGreaterThan(0);
}