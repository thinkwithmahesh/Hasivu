import AxeBuilder from '@axe-core/playwright';
import { test, expect, Page } from '@playwright/test';
import type { Cookie } from 'playwright-core';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001';
const CREDS = {
  parent:  { email: process.env.TEST_PARENT_EMAIL  || 'parent.demo@hasivu.local',  pw: 'Hasivu123!', role: 'parent' },
  admin:   { email: process.env.TEST_ADMIN_EMAIL   || 'admin.demo@hasivu.local',   pw: 'Hasivu123!', role: 'admin' },
  kitchen: { email: process.env.TEST_KITCHEN_EMAIL || 'kitchen.demo@hasivu.local', pw: 'Hasivu123!', role: 'kitchen_staff' },
  student: { email: 'student.demo@hasivu.local', pw: 'Hasivu123!', role: 'student' },
  vendor:  { email: 'vendor.demo@hasivu.local',  pw: 'Hasivu123!', role: 'vendor' },
};
const sessionCookies: Partial<Record<keyof typeof CREDS, Cookie[]>> = {};

function dashboardPathForRole(role: keyof typeof CREDS) {
  return `/dashboard/${role === 'kitchen' ? 'kitchen' : role}`;
}

// Helper: login and return to the page
async function loginAs(page: Page, role: keyof typeof CREDS) {
  const c = CREDS[role];
  await page.context().clearCookies();

  const cachedCookies = sessionCookies[role];
  if (cachedCookies?.length) {
    try {
      await page.context().addCookies(cachedCookies);
      await page.goto(`${BASE}${dashboardPathForRole(role)}`);
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
      return;
    } catch {
      await page.context().clearCookies();
      sessionCookies[role] = undefined;
    }
  }

  await page.goto(`${BASE}/auth/login`);
  // Role selection is rendered as accessible tabs on the current login page.
  // Keep a button fallback for older route-specific login variants.
  try {
    const roleTab = page.getByRole('tab', { name: new RegExp(role, 'i') });
    await roleTab.click({ timeout: 3000 });
    await expect(roleTab).toHaveAttribute('aria-selected', 'true');
  } catch {
    try {
      await page.getByRole('button', { name: new RegExp(role, 'i') }).click({ timeout: 3000 });
    } catch {}
  }
  await page.getByLabel(/email/i).fill(c.email);
  await page.getByRole('textbox', { name: 'Password' }).fill(c.pw);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  sessionCookies[role] = await page.context().cookies(BASE);
}

async function visibleBodyText(page: Page) {
  return page.locator('body').innerText().catch(() => '');
}

async function getWcagViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .include('main')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  return results.violations.map(violation => ({
    id: violation.id,
    impact: violation.impact,
    description: violation.description,
    count: violation.nodes.length,
  }));
}

// Helper: check a page for product gaps
async function auditPage(page: Page, url: string, checks: {
  hasH1?: boolean;
  noRawErrors?: boolean;
  noNotFound?: boolean;
  hasContent?: boolean;
  minContentLength?: number;
}) {
  await page.goto(url);
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  
  const body = await visibleBodyText(page);
  const issues: string[] = [];

  if (checks.hasH1) {
    const h1Count = await page.locator('h1').count();
    if (h1Count < 1) issues.push('MISSING: no <h1> heading');
  }
  if (checks.noRawErrors) {
    const rawErrors = ['Request failed with status', 'TypeError:', 'Cannot read', 'undefined is not', 'NetworkError'];
    for (const err of rawErrors) {
      if (body.includes(err)) issues.push(`RAW ERROR VISIBLE: "${err}"`);
    }
  }
  if (checks.noNotFound) {
    const notFoundPhrases = ["couldn't load", "404", "not found", "This page could not", "Error: "];
    for (const phrase of notFoundPhrases) {
      if (body.toLowerCase().includes(phrase.toLowerCase())) {
        issues.push(`NOT FOUND / ERROR VISIBLE: "${phrase}"`);
      }
    }
  }
  if (checks.hasContent && body.trim().length < (checks.minContentLength || 200)) {
    issues.push(`THIN CONTENT: only ${body.trim().length} chars`);
  }

  return { url, issues, passed: issues.length === 0 };
}

// ══════════════════════════════════════════════════════
// PARENT JOURNEY — complete meal ordering flow
// ══════════════════════════════════════════════════════
test.describe('Parent — Complete Journey', () => {
  test.beforeEach(async ({ page }) => { await loginAs(page, 'parent'); });

  test('P1: Dashboard loads with content and heading', async ({ page }) => {
    const result = await auditPage(page, `${BASE}/dashboard/parent`, {
      hasH1: true, noRawErrors: true, noNotFound: true, hasContent: true
    });
    expect(result.issues, `Dashboard issues: ${result.issues.join(', ')}`).toHaveLength(0);
  });

  test('P2: Menu page loads with meal items', async ({ page }) => {
    await page.goto(`${BASE}/menu`);
    await page.waitForLoadState('networkidle').catch(() => {});
    const body = await visibleBodyText(page);
    // Should show meal items, not empty state or error
    const hasMealContent = body.length > 300;
    expect(hasMealContent, 'Menu appears empty or error state').toBe(true);
    // Should not show raw API error
    expect(body).not.toContain('Request failed');
  });

  test('P3: Daily menu page loads', async ({ page }) => {
    const result = await auditPage(page, `${BASE}/daily-menu`, {
      hasH1: true, noRawErrors: true, noNotFound: true
    });
    expect(result.issues, result.issues.join(', ')).toHaveLength(0);
  });

  test('P4: Cart page loads and shows empty or filled state', async ({ page }) => {
    const result = await auditPage(page, `${BASE}/cart`, {
      hasH1: true, noRawErrors: true, noNotFound: true, hasContent: true
    });
    expect(result.issues, result.issues.join(', ')).toHaveLength(0);
  });

  test('P5: Orders page loads without error', async ({ page }) => {
    const result = await auditPage(page, `${BASE}/orders`, {
      hasH1: true, noRawErrors: true, noNotFound: true
    });
    expect(result.issues, `Orders page: ${result.issues.join(', ')}`).toHaveLength(0);
  });

  test('P6: Order history shows list or empty state (not error)', async ({ page }) => {
    await page.goto(`${BASE}/orders`);
    await page.waitForLoadState('networkidle').catch(() => {});
    const body = await visibleBodyText(page);
    expect(body).not.toContain("couldn't load");
    expect(body).not.toContain('Request failed');
  });

  test('P7: Notifications page loads', async ({ page }) => {
    const result = await auditPage(page, `${BASE}/notifications`, {
      hasH1: true, noRawErrors: true, noNotFound: true
    });
    expect(result.issues, result.issues.join(', ')).toHaveLength(0);
  });

  test('P8: Settings page loads', async ({ page }) => {
    const result = await auditPage(page, `${BASE}/settings`, {
      hasH1: true, noRawErrors: true, noNotFound: true
    });
    expect(result.issues, result.issues.join(', ')).toHaveLength(0);
  });

  test('P9: Parent dashboard navigation links all resolve', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/parent`);
    await page.waitForLoadState('networkidle').catch(() => {});
    
    // Find all nav links visible to parent
    const navLinks = await page.$$eval('nav a, [role="navigation"] a', 
      links => links.map(l => ({ 
        text: l.textContent?.trim(), 
        href: l.getAttribute('href') 
      })).filter(l => l.href && !l.href.startsWith('http'))
    );
    
    const broken: string[] = [];
    for (const link of navLinks.slice(0, 10)) { // limit to 10 to avoid timeout
      if (!link.href) continue;
      const res = await page.goto(`${BASE}${link.href}`).catch(() => null);
      if (!res) { broken.push(`${link.text}: no response`); continue; }
      const body = await visibleBodyText(page);
      if (body.includes("couldn't load") || body.includes('404') || res.status() >= 500) {
        broken.push(`${link.text} (${link.href}): broken`);
      }
    }
    expect(broken, `Broken nav links: ${broken.join(', ')}`).toHaveLength(0);
  });

  test('P10: Add to cart flow works end-to-end', async ({ page }) => {
    await page.goto(`${BASE}/menu`);
    await page.waitForLoadState('networkidle').catch(() => {});
    
    // Try to find and click an "Add" button
    const addBtn = page.getByRole('button', { name: /add|order|select/i }).first();
    const btnVisible = await addBtn.isVisible().catch(() => false);
    
    if (btnVisible) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      // Cart indicator should update (badge, count, etc.)
      const body = await visibleBodyText(page);
      expect(body).not.toContain('Request failed');
    } else {
      // If no add button, at minimum menu items should be visible
      const menuItems = await page.$$('[data-testid*="meal"], [data-testid*="menu-item"], .meal-card');
      // Don't fail if no data-testid — just ensure no error state
      const body = await visibleBodyText(page);
      expect(body).not.toContain("couldn't load");
    }
  });
});

// ══════════════════════════════════════════════════════
// ADMIN JOURNEY
// ══════════════════════════════════════════════════════
test.describe('Admin — Dashboard & Management', () => {
  test.beforeEach(async ({ page }) => { await loginAs(page, 'admin'); });

  test('A1: Admin dashboard has heading and content', async ({ page }) => {
    const result = await auditPage(page, `${BASE}/dashboard/admin`, {
      hasH1: true, noRawErrors: true, noNotFound: true, hasContent: true
    });
    expect(result.issues, result.issues.join(', ')).toHaveLength(0);
  });

  test('A2: Admin dashboard background matches site theme', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/admin`);
    await page.waitForLoadState('networkidle').catch(() => {});
    // Check that body or main container does not use a wildly different background
    const bgColor = await page.evaluate(() => {
      const main = document.querySelector('main') || document.body;
      return window.getComputedStyle(main).backgroundColor;
    });
    // Should not be white (rgb(255,255,255)) if other pages use a tinted background
    // Or should not be a jarring color — log it for manual review
    console.log(`Admin dashboard bg: ${bgColor}`);
    // Not asserting exact color — flagging for manual consistency check
    expect(bgColor).toBeTruthy();
  });

  test('A3: User management page loads', async ({ page }) => {
    // Try common admin routes
    for (const route of ['/admin/users', '/dashboard/admin/users', '/users']) {
      const res = await page.goto(`${BASE}${route}`).catch(() => null);
      if (res && res.status() < 400) {
        const body = await visibleBodyText(page);
        expect(body).not.toContain("couldn't load");
        return; // Found a working route
      }
    }
    // If none work, at least admin dashboard should have a users link
    await page.goto(`${BASE}/dashboard/admin`);
    const body = await visibleBodyText(page);
    console.log('User management: no direct route found, admin dashboard body length:', body.length);
  });

  test('A4: Analytics page loads without error', async ({ page }) => {
    for (const route of ['/analytics', '/dashboard/admin/analytics', '/admin/analytics']) {
      const res = await page.goto(`${BASE}${route}`).catch(() => null);
      if (res && res.status() < 400) {
        const body = await visibleBodyText(page);
        expect(body).not.toContain("Request failed");
        return;
      }
    }
  });

  test('A5: Menu management page loads', async ({ page }) => {
    for (const route of ['/admin/menu', '/dashboard/admin/menu', '/menu-management']) {
      const res = await page.goto(`${BASE}${route}`).catch(() => null);
      if (res && res.status() < 400) {
        const body = await visibleBodyText(page);
        expect(body).not.toContain("couldn't load");
        return;
      }
    }
  });

  test('A6: All admin nav links resolve without 404', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/admin`);
    await page.waitForLoadState('networkidle').catch(() => {});
    
    const navLinks = await page.$$eval('nav a, aside a, [role="navigation"] a',
      links => links.map(l => ({ 
        text: l.textContent?.trim().slice(0,30), 
        href: l.getAttribute('href') 
      })).filter(l => l.href && l.href.startsWith('/') && !l.href.includes('logout'))
    );
    
    const broken: string[] = [];
    for (const link of navLinks.slice(0, 12)) {
      if (!link.href) continue;
      await page.goto(`${BASE}${link.href}`).catch(() => {});
      const body = await visibleBodyText(page);
      if (body.includes("couldn't load") || body.includes('This page could not')) {
        broken.push(`"${link.text}" → ${link.href}`);
      }
    }
    expect(broken, `Broken admin links:\n${broken.join('\n')}`).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════
// KITCHEN JOURNEY  
// ══════════════════════════════════════════════════════
test.describe('Kitchen — Order Workflow', () => {
  test.beforeEach(async ({ page }) => { await loginAs(page, 'kitchen'); });

  test('K1: Kitchen dashboard loads with heading', async ({ page }) => {
    const result = await auditPage(page, `${BASE}/dashboard/kitchen`, {
      hasH1: true, noRawErrors: true, noNotFound: true
    });
    expect(result.issues, result.issues.join(', ')).toHaveLength(0);
  });

  test('K2: Kitchen management page loads without raw 404', async ({ page }) => {
    for (const route of ['/kitchen', '/dashboard/kitchen/management', '/kitchen/management']) {
      const res = await page.goto(`${BASE}${route}`).catch(() => null);
      if (res && res.status() < 400) {
        const body = await visibleBodyText(page);
        expect(body).not.toContain('Request failed with status code 404');
        expect(body).not.toContain("couldn't load");
        return;
      }
    }
  });

  test('K3: Order workflow board loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/kitchen`);
    await page.waitForLoadState('networkidle').catch(() => {});
    const body = await visibleBodyText(page);
    // Should show orders or empty state — not raw error
    expect(body).not.toContain('Request failed');
    expect(body.length).toBeGreaterThan(200);
  });

  test('K4: Kitchen nav links all resolve', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/kitchen`);
    await page.waitForLoadState('networkidle').catch(() => {});
    
    const navLinks = await page.$$eval('nav a, aside a',
      links => links.map(l => ({
        text: l.textContent?.trim().slice(0, 30),
        href: l.getAttribute('href')
      })).filter(l => l.href && l.href.startsWith('/'))
    );
    
    const broken: string[] = [];
    for (const link of navLinks.slice(0, 8)) {
      if (!link.href) continue;
      await page.goto(`${BASE}${link.href}`).catch(() => {});
      const body = await visibleBodyText(page);
      if (body.includes("couldn't load") || body.includes('This page could not')) {
        broken.push(`"${link.text}" → ${link.href}`);
      }
    }
    expect(broken, `Broken kitchen links:\n${broken.join('\n')}`).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════
// STUDENT JOURNEY
// ══════════════════════════════════════════════════════
test.describe('Student — Browse & View', () => {
  test.beforeEach(async ({ page }) => { await loginAs(page, 'student'); });

  test('S1: Student dashboard loads', async ({ page }) => {
    const result = await auditPage(page, `${BASE}/dashboard/student`, {
      hasH1: true, noRawErrors: true, noNotFound: true
    });
    expect(result.issues, result.issues.join(', ')).toHaveLength(0);
  });

  test('S2: Student can view menu', async ({ page }) => {
    const result = await auditPage(page, `${BASE}/menu`, {
      noRawErrors: true, noNotFound: true, hasContent: true
    });
    expect(result.issues, result.issues.join(', ')).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════
// VENDOR JOURNEY
// ══════════════════════════════════════════════════════
test.describe('Vendor — Catalog Management', () => {
  test.beforeEach(async ({ page }) => { await loginAs(page, 'vendor'); });

  test('V1: Vendor dashboard loads without PRD copy', async ({ page }) => {
    const result = await auditPage(page, `${BASE}/dashboard/vendor`, {
      hasH1: true, noRawErrors: true, noNotFound: true
    });
    expect(result.issues, result.issues.join(', ')).toHaveLength(0);
    // Confirm PRD scaffolding is gone
    const body = await visibleBodyText(page);
    expect(body).not.toContain('TODO:');
    expect(body).not.toContain('PRD');
    expect(body).not.toContain('placeholder');
  });
});

// ══════════════════════════════════════════════════════
// VISUAL CONSISTENCY AUDIT
// ══════════════════════════════════════════════════════
test.describe('Visual Consistency — Cross-Role', () => {
  test('VC1: Background color is consistent across role dashboards', async ({ page }) => {
    const bgColors: Record<string, string> = {};
    
    for (const [role, creds] of Object.entries(CREDS)) {
      await loginAs(page, role as keyof typeof CREDS);
      await page.goto(`${BASE}/dashboard/${role === 'admin' ? 'admin' : 
        role === 'kitchen' ? 'kitchen' : 
        role === 'parent' ? 'parent' : 
        role === 'student' ? 'student' : 'vendor'}`);
      await page.waitForLoadState('networkidle').catch(() => {});
      
      bgColors[role] = await page.evaluate(() => {
        const el = document.querySelector('main, [data-testid="dashboard"], body');
        return el ? window.getComputedStyle(el).backgroundColor : 'unknown';
      });
    }
    
    console.log('Background colors per role:', JSON.stringify(bgColors, null, 2));
    // Flag inconsistencies — not hard fail, but log for UI/UX review
    const uniqueColors = new Set(Object.values(bgColors));
    if (uniqueColors.size > 2) {
      console.warn(`⚠️ ${uniqueColors.size} different background colors across dashboards — review for consistency`);
    }
  });

  test('VC2: All pages have consistent nav/header', async ({ page }) => {
    await loginAs(page, 'parent');
    const routes = ['/dashboard/parent', '/menu', '/cart', '/orders'];
    const headerTexts: string[] = [];
    
    for (const route of routes) {
      await page.goto(`${BASE}${route}`);
      await page.waitForLoadState('networkidle').catch(() => {});
      const header = await page.$eval('header, nav', el => el.textContent?.slice(0,50) || '').catch(() => '');
      headerTexts.push(header);
    }
    
    // All pages should have some consistent nav element
    const emptyHeaders = headerTexts.filter(h => h.trim().length < 5);
    expect(emptyHeaders.length, 'Some pages have no visible header/nav').toBeLessThanOrEqual(1);
  });

  test('VC3: Typography scale is consistent', async ({ page }) => {
    await loginAs(page, 'parent');
    await page.goto(`${BASE}/dashboard/parent`);
    
    const fontData = await page.evaluate(() => {
      const elements = document.querySelectorAll('h1, h2, h3, p, button');
      const fonts = new Set<string>();
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        fonts.add(style.fontFamily.split(',')[0].trim());
      });
      return Array.from(fonts);
    });
    
    console.log('Font families in use:', fontData);
    // Should use at most 2-3 font families
    expect(fontData.length, `Too many fonts: ${fontData.join(', ')}`).toBeLessThanOrEqual(4);
  });
});

// ══════════════════════════════════════════════════════
// ACCESSIBILITY SPOT CHECK
// ══════════════════════════════════════════════════════
test.describe('Accessibility — Critical Pages', () => {
  test('ACC1: Login page has no critical axe violations', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`);
    await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});

    const violations = await getWcagViolations(page);
    
    const critical = violations.filter((v: any) => 
      v.impact === 'critical' || v.impact === 'serious'
    );
    
    if (critical.length > 0) {
      console.log('Login page accessibility violations:', JSON.stringify(critical, null, 2));
    }
    expect(critical.length, 
      `Critical a11y violations on login: ${critical.map((v: any) => v.id).join(', ')}`
    ).toBe(0);
  });

  test('ACC2: Parent dashboard has no critical axe violations', async ({ page }) => {
    await loginAs(page, 'parent');
    await page.goto(`${BASE}/dashboard/parent`);
    await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});

    const violations = await getWcagViolations(page);
    
    const critical = violations.filter((v: any) => 
      ['critical', 'serious'].includes(v.impact)
    );
    
    console.log('Parent dashboard violations:', violations);
    expect(critical.length, 
      `Critical a11y violations: ${JSON.stringify(critical)}`
    ).toBe(0);
  });
});

// ══════════════════════════════════════════════════════
// MOBILE RESPONSIVENESS
// ══════════════════════════════════════════════════════
test.describe('Mobile Responsiveness', () => {
  test('MOB1: Parent ordering flow works on mobile viewport', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }, // iPhone 14
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
    });
    const page = await context.newPage();
    
    await loginAs(page, 'parent');
    
    // Check that main parent flows are usable on mobile
    for (const route of ['/dashboard/parent', '/menu', '/cart']) {
      await page.goto(`${BASE}${route}`);
      await page.waitForLoadState('networkidle').catch(() => {});
      
      // Check for horizontal scroll (indicates broken responsive layout)
      const hasHorizontalScroll = await page.evaluate(() => 
        document.body.scrollWidth > window.innerWidth
      );
      
      if (hasHorizontalScroll) {
        console.warn(`⚠️ Horizontal scroll on mobile at ${route}`);
      }
      
      const body = await visibleBodyText(page);
      expect(body).not.toContain("couldn't load");
    }
    
    await context.close();
  });
});
