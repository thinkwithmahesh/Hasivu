#!/usr/bin/env node
/**
 * Simple Accessibility Audit for HASIVU Platform
 * Identifies specific WCAG 2.1 AA violations for final production readiness
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const PAGES_TO_AUDIT = [
  { path: '/', name: 'Homepage' },
  { path: '/auth/login', name: 'Login' },
  { path: '/menu', name: 'Menu' },
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/profile', name: 'Profile' },
  { path: '/settings', name: 'Settings' },
];

class AccessibilityAuditor {
  constructor() {
    this.violations = [];
    this.browser = null;
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  async auditColorContrast(page, pageName) {
    const contrastIssues = await page.evaluate(() => {
      const issues = [];

      // Check for problematic color classes that often fail contrast
      const problematicSelectors = [
        '.text-primary-100',
        '.text-green-600',
        '.text-gray-400',
        '.text-gray-300',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'span',
        'div[class*="text-"]',
      ];

      problematicSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((_element, _index) => {
          const styles = getComputedStyle(element);
          const text = element.textContent?.trim();

          if (text && text.length > 2) {
            // Simple contrast check - in real world, use proper contrast calculation
            const { color } = styles;
            const { backgroundColor } = styles;

            if (
              (color &&
                backgroundColor &&
                (color.includes('rgba(') || backgroundColor.includes('rgba('))) ||
              selector.includes('text-primary-100') ||
              selector.includes('text-green-600')
            ) {
              issues.push({
                selector,
                element: element.tagName.toLowerCase(),
                text: text.substring(0, 50),
                color,
                backgroundColor,
                issue: 'Potential contrast violation',
              });
            }
          }
        });
      });

      return issues;
    });

    return contrastIssues.map(issue => ({
      page: pageName,
      type: 'Color Contrast',
      severity: 'CRITICAL',
      ...issue,
    }));
  }

  async auditFormLabels(page, pageName) {
    const labelIssues = await page.evaluate(() => {
      const issues = [];
      const inputs = document.querySelectorAll('input, textarea, select');

      inputs.forEach(input => {
        const id = input.getAttribute('id');
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledBy = input.getAttribute('aria-labelledby');
        const associatedLabel = id ? document.querySelector(`label[for="${id}"]`) : null;
        const parentLabel = input.closest('label');

        if (!associatedLabel && !ariaLabel && !ariaLabelledBy && !parentLabel) {
          issues.push({
            tagName: input.tagName.toLowerCase(),
            type: input.type || 'unknown',
            id: id || 'no-id',
            className: input.className || 'no-class',
            placeholder: input.placeholder || '',
            issue: 'Missing accessible label',
          });
        }
      });

      return issues;
    });

    return labelIssues.map(issue => ({
      page: pageName,
      type: 'Form Labels',
      severity: 'CRITICAL',
      ...issue,
    }));
  }

  async auditButtonAccessibility(page, pageName) {
    const buttonIssues = await page.evaluate(() => {
      const issues = [];
      const buttons = document.querySelectorAll(
        'button, [role="button"], a[onclick], div[onclick]'
      );

      buttons.forEach(button => {
        const text = button.textContent?.trim();
        const ariaLabel = button.getAttribute('aria-label');
        const ariaLabelledBy = button.getAttribute('aria-labelledby');
        const title = button.getAttribute('title');

        if (!text && !ariaLabel && !ariaLabelledBy && !title) {
          issues.push({
            tagName: button.tagName.toLowerCase(),
            className: button.className || 'no-class',
            role: button.getAttribute('role') || 'none',
            issue: 'Button without accessible name',
          });
        }
      });

      return issues;
    });

    return buttonIssues.map(issue => ({
      page: pageName,
      type: 'Button Accessibility',
      severity: 'CRITICAL',
      ...issue,
    }));
  }

  async auditHTMLStructure(page, pageName) {
    const structureIssues = await page.evaluate(() => {
      const issues = [];

      // Check for missing lang attribute
      const htmlLang = document.documentElement.getAttribute('lang');
      if (!htmlLang) {
        issues.push({
          issue: 'Missing lang attribute on HTML element',
          element: 'html',
          expected: 'lang="en" or appropriate language code',
        });
      }

      // Check for missing main landmark
      const main = document.querySelector('main, [role="main"]');
      if (!main) {
        issues.push({
          issue: 'Missing main landmark',
          element: 'main',
          expected: '<main> element or role="main"',
        });
      }

      // Check for heading structure
      const _headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const h1s = document.querySelectorAll('h1');

      if (h1s.length === 0) {
        issues.push({
          issue: 'Missing h1 heading',
          element: 'h1',
          expected: 'One h1 per page',
        });
      } else if (h1s.length > 1) {
        issues.push({
          issue: 'Multiple h1 headings',
          element: 'h1',
          expected: 'Only one h1 per page',
          found: h1s.length,
        });
      }

      return issues;
    });

    return structureIssues.map(issue => ({
      page: pageName,
      type: 'HTML Structure',
      severity: 'HIGH',
      ...issue,
    }));
  }

  async auditPage(pageInfo) {
    const page = await this.browser.newPage();

    try {
      console.log(`Auditing ${pageInfo.name} (${pageInfo.path})...`);

      await page.goto(`http://localhost:3000${pageInfo.path}`, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      await page.waitForTimeout(2000); // Wait for dynamic content

      const violations = [
        ...(await this.auditColorContrast(page, pageInfo.name)),
        ...(await this.auditFormLabels(page, pageInfo.name)),
        ...(await this.auditButtonAccessibility(page, pageInfo.name)),
        ...(await this.auditHTMLStructure(page, pageInfo.name)),
      ];

      this.violations.push(...violations);
      console.log(`Found ${violations.length} issues on ${pageInfo.name}`);
    } catch (error) {
      console.error(`Error auditing ${pageInfo.name}:`, error.message);
      this.violations.push({
        page: pageInfo.name,
        type: 'Audit Error',
        severity: 'ERROR',
        issue: `Failed to audit page: ${error.message}`,
      });
    } finally {
      await page.close();
    }
  }

  async generateReport() {
    const report = {
      auditDate: new Date().toISOString(),
      totalViolations: this.violations.length,
      criticalViolations: this.violations.filter(v => v.severity === 'CRITICAL').length,
      violations: this.violations,
      summary: this.generateSummary(),
    };

    // Write JSON report
    fs.writeFileSync(
      '/Users/mahesha/Downloads/hasivu-platform/web/accessibility-audit-report.json',
      JSON.stringify(report, null, 2)
    );

    // Write human-readable report
    const readableReport = this.generateReadableReport(report);
    fs.writeFileSync(
      '/Users/mahesha/Downloads/hasivu-platform/web/accessibility-audit-report.md',
      readableReport
    );

    return report;
  }

  generateSummary() {
    const byType = {};
    const byPage = {};
    const bySeverity = {};

    this.violations.forEach(violation => {
      byType[violation.type] = (byType[violation.type] || 0) + 1;
      byPage[violation.page] = (byPage[violation.page] || 0) + 1;
      bySeverity[violation.severity] = (bySeverity[violation.severity] || 0) + 1;
    });

    return { byType, byPage, bySeverity };
  }

  generateReadableReport(report) {
    return `# HASIVU Platform Accessibility Audit Report

**Audit Date:** ${report.auditDate}
**Total Violations:** ${report.totalViolations}
**Critical Violations:** ${report.criticalViolations}

## Executive Summary

This audit identifies WCAG 2.1 AA compliance violations that need immediate attention for production readiness.

## Violations by Type

${Object.entries(report.summary.byType)
  .map(([type, count]) => `- **${type}**: ${count} issues`)
  .join('\n')}

## Violations by Page

${Object.entries(report.summary.byPage)
  .map(([page, count]) => `- **${page}**: ${count} issues`)
  .join('\n')}

## Violations by Severity

${Object.entries(report.summary.bySeverity)
  .map(([severity, count]) => `- **${severity}**: ${count} issues`)
  .join('\n')}

## Detailed Violations

${report.violations
  .map(
    (violation, index) => `
### ${index + 1}. ${violation.type} - ${violation.severity}
**Page:** ${violation.page}
**Issue:** ${violation.issue}
${violation.element ? `**Element:** ${violation.element}` : ''}
${violation.selector ? `**Selector:** ${violation.selector}` : ''}
${violation.expected ? `**Expected:** ${violation.expected}` : ''}
${violation.text ? `**Text Content:** ${violation.text}` : ''}
`
  )
  .join('\n')}

## Recommendations

### 1. Color Contrast (CRITICAL)
- Review all text colors against backgrounds
- Ensure 4.5:1 contrast ratio for normal text
- Pay special attention to .text-primary-100 and .text-green-600 classes

### 2. Form Labels (CRITICAL) 
- Add proper labels to all form controls
- Use aria-label, aria-labelledby, or associated label elements
- Ensure screen reader compatibility

### 3. Button Accessibility (CRITICAL)
- Add accessible names to all buttons
- Use aria-label for icon-only buttons
- Ensure all interactive elements are properly described

### 4. HTML Structure (HIGH)
- Verify lang attribute on HTML element
- Ensure proper heading hierarchy
- Add main landmark if missing

## Next Steps

1. **Priority 1 (CRITICAL)**: Fix color contrast and form label issues
2. **Priority 2 (HIGH)**: Address button accessibility and HTML structure
3. **Validation**: Re-run audit after fixes
4. **Testing**: Verify with screen readers and keyboard navigation
`;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

async function main() {
  const auditor = new AccessibilityAuditor();

  try {
    await auditor.init();

    console.log('Starting HASIVU Accessibility Audit...');
    console.log('='.repeat(50));

    for (const pageInfo of PAGES_TO_AUDIT) {
      await auditor.auditPage(pageInfo);
    }

    console.log('\nGenerating report...');
    const report = await auditor.generateReport();

    console.log(`\n${'='.repeat(50)}`);
    console.log('AUDIT COMPLETE');
    console.log('='.repeat(50));
    console.log(`Total Violations: ${report.totalViolations}`);
    console.log(`Critical Violations: ${report.criticalViolations}`);
    console.log('\nReports saved:');
    console.log('- accessibility-audit-report.json');
    console.log('- accessibility-audit-report.md');

    if (report.criticalViolations > 0) {
      console.log('\n⚠️  CRITICAL VIOLATIONS FOUND - Production readiness at risk!');
      process.exit(1);
    } else {
      console.log('\n✅ No critical violations found');
      process.exit(0);
    }
  } catch (error) {
    console.error('Audit failed:', error);
    process.exit(1);
  } finally {
    await auditor.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = AccessibilityAuditor;
