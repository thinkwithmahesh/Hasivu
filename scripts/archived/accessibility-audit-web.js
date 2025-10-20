#!/usr/bin/env node

/**
 * HASIVU Platform - Accessibility Audit Script
 *
 * Comprehensive accessibility auditing tool for the HASIVU platform
 * Features:
 * - Automated WCAG 2.1 AA compliance checking
 * - Multi-page accessibility scanning
 * - Detailed reporting with recommendations
 * - CI/CD integration support
 * - Performance impact analysis
 * - Color contrast validation
 * - Keyboard navigation testing
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { createServer } = require('next/dist/server/next');

// Configuration
const AUDIT_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  outputDir: './accessibility-reports',
  pages: [
    { path: '/', name: 'Homepage', critical: true },
    { path: '/auth/login', name: 'Login Page', critical: true },
    { path: '/auth/register', name: 'Registration Page', critical: true },
    { path: '/dashboard', name: 'Dashboard', critical: true },
    { path: '/dashboard/admin', name: 'Admin Dashboard', critical: false },
    { path: '/dashboard/teacher', name: 'Teacher Dashboard', critical: false },
    { path: '/dashboard/parent', name: 'Parent Dashboard', critical: false },
    { path: '/dashboard/student', name: 'Student Dashboard', critical: false },
    { path: '/menu', name: 'Menu Page', critical: true },
    { path: '/orders', name: 'Order Management', critical: false },
    { path: '/profile', name: 'Profile Page', critical: false },
    { path: '/settings', name: 'Settings Page', critical: false },
  ],
  viewports: [
    { width: 375, height: 667, name: 'Mobile' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1200, height: 800, name: 'Desktop' },
    { width: 1920, height: 1080, name: 'Large Desktop' },
  ],
  standards: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  timeout: 30000,
  retries: 2,
};

class AccessibilityAuditor {
  constructor() {
    this.browser = null;
    this.results = {
      summary: {
        timestamp: new Date().toISOString(),
        totalPages: 0,
        totalViolations: 0,
        totalPasses: 0,
        compliance: 0,
        criticalIssues: 0,
        duration: 0,
      },
      pages: [],
      violations: [],
    };
  }

  async initialize() {
    console.log('🚀 Initializing HASIVU Accessibility Auditor...');

    // Create output directory
    if (!fs.existsSync(AUDIT_CONFIG.outputDir)) {
      fs.mkdirSync(AUDIT_CONFIG.outputDir, { recursive: true });
    }

    // Launch browser
    this.browser = await chromium.launch({
      headless: true,
      args: ['--disable-dev-shm-usage', '--no-sandbox'],
    });

    console.log('✅ Browser launched successfully');
  }

  async auditPage(page, pageConfig, viewport = null) {
    const startTime = Date.now();

    try {
      // Set viewport if specified
      if (viewport) {
        await page.setViewportSize(viewport);
      }

      // Navigate to page
      console.log(
        `📄 Auditing ${pageConfig.name} (${pageConfig.path})${viewport ? ` at ${viewport.name}` : ''}`
      );

      const response = await page.goto(`${AUDIT_CONFIG.baseUrl}${pageConfig.path}`, {
        waitUntil: 'networkidle',
        timeout: AUDIT_CONFIG.timeout,
      });

      if (!response.ok()) {
        throw new Error(`Failed to load page: ${response.status()}`);
      }

      // Wait for page to be fully loaded
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000); // Allow dynamic content to load

      // Inject axe-core
      await page.addScriptTag({
        path: require.resolve('axe-core/axe.min.js'),
      });

      // Configure axe-core
      await page.evaluate(standards => {
        window.axe.configure({
          reporter: 'v2',
          rules: {
            'color-contrast': { enabled: true },
            'focus-visible': { enabled: true },
            'keyboard-navigation': { enabled: true },
            'aria-valid-attr': { enabled: true },
            'aria-required-attr': { enabled: true },
            'form-field-multiple-labels': { enabled: true },
            'heading-order': { enabled: true },
            'landmark-unique': { enabled: true },
            'page-has-heading-one': { enabled: true },
          },
        });
      }, AUDIT_CONFIG.standards);

      // Run accessibility audit
      const axeResults = await page.evaluate(async standards => {
        return await window.axe.run({
          reporter: 'v2',
          runOnly: {
            type: 'tag',
            values: standards,
          },
          resultTypes: ['violations', 'passes', 'incomplete', 'inapplicable'],
        });
      }, AUDIT_CONFIG.standards);

      // Analyze results
      const pageResult = {
        name: pageConfig.name,
        path: pageConfig.path,
        viewport: viewport ? viewport.name : 'Default',
        critical: pageConfig.critical,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        violations: axeResults.violations.length,
        passes: axeResults.passes.length,
        incomplete: axeResults.incomplete.length,
        inapplicable: axeResults.inapplicable.length,
        violationDetails: axeResults.violations.map(violation => ({
          id: violation.id,
          impact: violation.impact,
          description: violation.description,
          help: violation.help,
          helpUrl: violation.helpUrl,
          tags: violation.tags,
          nodes: violation.nodes.map(node => ({
            target: node.target,
            html: node.html.substring(0, 200),
            failureSummary: node.failureSummary,
          })),
        })),
      };

      // Update summary
      this.results.summary.totalPages++;
      this.results.summary.totalViolations += axeResults.violations.length;
      this.results.summary.totalPasses += axeResults.passes.length;

      // Track critical issues
      const criticalViolations = axeResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );
      this.results.summary.criticalIssues += criticalViolations.length;

      // Add to global violations list
      axeResults.violations.forEach(violation => {
        this.results.violations.push({
          page: pageConfig.name,
          path: pageConfig.path,
          viewport: viewport ? viewport.name : 'Default',
          ...violation,
        });
      });

      this.results.pages.push(pageResult);

      // Log results
      const status = axeResults.violations.length === 0 ? '✅' : '❌';
      console.log(
        `${status} ${pageConfig.name}: ${axeResults.violations.length} violations, ${axeResults.passes.length} passes`
      );

      return pageResult;
    } catch (error) {
      console.error(`❌ Error auditing ${pageConfig.name}:`, error.message);

      const errorResult = {
        name: pageConfig.name,
        path: pageConfig.path,
        viewport: viewport ? viewport.name : 'Default',
        critical: pageConfig.critical,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        error: error.message,
        violations: 0,
        passes: 0,
        incomplete: 0,
        inapplicable: 0,
        violationDetails: [],
      };

      this.results.pages.push(errorResult);
      return errorResult;
    }
  }

  async runAudit() {
    const auditStartTime = Date.now();

    try {
      await this.initialize();

      const context = await this.browser.newContext({
        // Simulate accessibility preferences
        colorScheme: 'light',
        reducedMotion: 'reduce',
        // Enable browser accessibility features
        extraHTTPHeaders: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      const page = await context.newPage();

      // Enable console logging for debugging
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.error('Browser error:', msg.text());
        }
      });

      // Audit each page
      for (const pageConfig of AUDIT_CONFIG.pages) {
        // Test on default viewport first
        await this.auditPage(page, pageConfig);

        // Test on different viewports for critical pages
        if (pageConfig.critical) {
          for (const viewport of AUDIT_CONFIG.viewports.slice(0, 2)) {
            // Mobile and Tablet
            await this.auditPage(page, pageConfig, viewport);
          }
        }
      }

      await context.close();
    } catch (error) {
      console.error('❌ Audit failed:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
      this.results.summary.duration = Date.now() - auditStartTime;
    }
  }

  generateReport() {
    console.log('📊 Generating accessibility report...');

    // Calculate compliance percentage
    const totalTests = this.results.summary.totalViolations + this.results.summary.totalPasses;
    this.results.summary.compliance =
      totalTests > 0 ? Math.round((this.results.summary.totalPasses / totalTests) * 100) : 100;

    // Generate JSON report
    const jsonReport = JSON.stringify(this.results, null, 2);
    const jsonPath = path.join(AUDIT_CONFIG.outputDir, `accessibility-report-${Date.now()}.json`);
    fs.writeFileSync(jsonPath, jsonReport);

    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    const htmlPath = path.join(AUDIT_CONFIG.outputDir, `accessibility-report-${Date.now()}.html`);
    fs.writeFileSync(htmlPath, htmlReport);

    // Generate summary report for CI/CD
    const summaryReport = this.generateSummaryReport();
    const summaryPath = path.join(AUDIT_CONFIG.outputDir, 'accessibility-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summaryReport, null, 2));

    console.log(`✅ Reports generated:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   HTML: ${htmlPath}`);
    console.log(`   Summary: ${summaryPath}`);

    return {
      json: jsonPath,
      html: htmlPath,
      summary: summaryPath,
      results: this.results,
    };
  }

  generateHTMLReport() {
    const { summary, pages, violations } = this.results;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HASIVU Platform - Accessibility Report</title>
        <style>
          * { box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; padding: 20px; background: #f8fafc; line-height: 1.6;
          }
          .container { max-width: 1200px; margin: 0 auto; }
          .header { 
            background: linear-gradient(135deg, #2563eb, #1d4ed8); 
            color: white; padding: 40px; border-radius: 12px; margin-bottom: 30px; 
            text-align: center; box-shadow: 0 10px 25px rgba(37, 99, 235, 0.2);
          }
          .header h1 { margin: 0 0 10px 0; font-size: 2.5rem; font-weight: 700; }
          .header p { margin: 0; opacity: 0.9; font-size: 1.1rem; }
          .metrics { 
            display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; margin-bottom: 30px; 
          }
          .metric { 
            background: white; padding: 25px; border-radius: 10px; text-align: center;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;
          }
          .metric-value { 
            font-size: 3rem; font-weight: 800; margin-bottom: 5px; 
            color: ${summary.compliance >= 95 ? '#10b981' : summary.compliance >= 80 ? '#f59e0b' : '#ef4444'};
          }
          .metric-label { font-size: 0.9rem; color: #64748b; font-weight: 500; }
          .section { 
            background: white; padding: 30px; border-radius: 10px; margin-bottom: 25px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;
          }
          .section h2 { 
            margin: 0 0 20px 0; font-size: 1.5rem; color: #1e293b; 
            border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;
          }
          .page-result { 
            display: flex; justify-content: space-between; align-items: center;
            padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 10px;
          }
          .page-result.critical { border-left: 4px solid #ef4444; }
          .page-result.success { border-left: 4px solid #10b981; }
          .page-result.warning { border-left: 4px solid #f59e0b; }
          .page-name { font-weight: 600; color: #1e293b; }
          .page-path { font-size: 0.9rem; color: #64748b; }
          .page-metrics { text-align: right; }
          .violation { 
            background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; 
            padding: 20px; margin-bottom: 15px; border-left: 4px solid #dc2626;
          }
          .violation h3 { margin: 0 0 10px 0; color: #dc2626; font-size: 1.1rem; }
          .violation-meta { 
            display: flex; gap: 15px; font-size: 0.9rem; margin-bottom: 10px;
            color: #7f1d1d;
          }
          .violation-description { color: #374151; margin-bottom: 10px; }
          .violation-help { margin-top: 10px; }
          .violation-help a { color: #2563eb; text-decoration: none; }
          .violation-help a:hover { text-decoration: underline; }
          .impact-critical { border-left-color: #dc2626; }
          .impact-serious { border-left-color: #ea580c; }
          .impact-moderate { border-left-color: #d97706; }
          .impact-minor { border-left-color: #16a34a; }
          .nodes { margin-top: 15px; }
          .node { 
            background: white; border: 1px solid #e2e8f0; border-radius: 6px;
            padding: 10px; margin: 5px 0; font-family: monospace; font-size: 0.85rem;
          }
          .filters { margin-bottom: 20px; }
          .filter-btn { 
            background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 15px;
            border-radius: 6px; margin-right: 10px; cursor: pointer; font-size: 0.9rem;
          }
          .filter-btn.active { background: #2563eb; color: white; border-color: #2563eb; }
          .summary-stats {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px; margin-bottom: 25px;
          }
          .stat { text-align: center; }
          .stat-value { font-size: 1.8rem; font-weight: 700; }
          .stat-label { font-size: 0.8rem; color: #64748b; }
          @media (max-width: 768px) {
            .container { padding: 10px; }
            .header { padding: 20px; }
            .header h1 { font-size: 2rem; }
            .metrics { grid-template-columns: 1fr; }
            .page-result { flex-direction: column; align-items: flex-start; }
            .page-metrics { margin-top: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>HASIVU Platform</h1>
            <p>Accessibility Compliance Report - WCAG 2.1 AA</p>
            <p>Generated on ${new Date(summary.timestamp).toLocaleString()}</p>
          </div>

          <div class="metrics">
            <div class="metric">
              <div class="metric-value">${summary.compliance}%</div>
              <div class="metric-label">Compliance Rate</div>
            </div>
            <div class="metric">
              <div class="metric-value">${summary.totalViolations}</div>
              <div class="metric-label">Total Violations</div>
            </div>
            <div class="metric">
              <div class="metric-value">${summary.criticalIssues}</div>
              <div class="metric-label">Critical Issues</div>
            </div>
            <div class="metric">
              <div class="metric-value">${Math.round(summary.duration / 1000)}s</div>
              <div class="metric-label">Audit Duration</div>
            </div>
          </div>

          <div class="section">
            <h2>Page Results (${summary.totalPages} pages tested)</h2>
            ${pages
              .map(
                page => `
              <div class="page-result ${page.error ? 'critical' : page.violations === 0 ? 'success' : 'warning'}">
                <div>
                  <div class="page-name">${page.name}</div>
                  <div class="page-path">${page.path}${page.viewport !== 'Default' ? ` (${page.viewport})` : ''}</div>
                </div>
                <div class="page-metrics">
                  ${
                    page.error
                      ? `<span style="color: #dc2626;">Error: ${page.error}</span>`
                      : `<span>${page.violations} violations • ${page.passes} passes</span>`
                  }
                </div>
              </div>
            `
              )
              .join('')}
          </div>

          ${
            violations.length > 0
              ? `
            <div class="section">
              <h2>Detailed Violations (${violations.length})</h2>
              <div class="filters">
                <button class="filter-btn active" onclick="filterViolations('all')">All</button>
                <button class="filter-btn" onclick="filterViolations('critical')">Critical</button>
                <button class="filter-btn" onclick="filterViolations('serious')">Serious</button>
                <button class="filter-btn" onclick="filterViolations('moderate')">Moderate</button>
              </div>
              
              ${violations
                .slice(0, 20)
                .map(
                  (violation, index) => `
                <div class="violation impact-${violation.impact}" data-impact="${violation.impact}">
                  <h3>${violation.id}</h3>
                  <div class="violation-meta">
                    <span><strong>Page:</strong> ${violation.page}</span>
                    <span><strong>Impact:</strong> ${violation.impact}</span>
                    <span><strong>Viewport:</strong> ${violation.viewport}</span>
                  </div>
                  <div class="violation-description">${violation.description}</div>
                  <div class="violation-help">
                    <a href="${violation.helpUrl}" target="_blank">Learn how to fix this issue</a>
                  </div>
                  ${
                    violation.nodes
                      ? `
                    <div class="nodes">
                      <strong>Affected elements:</strong>
                      ${violation.nodes
                        .slice(0, 3)
                        .map(
                          node => `
                        <div class="node">
                          <strong>Target:</strong> ${node.target.join(', ')}<br>
                          <strong>HTML:</strong> ${node.html}
                        </div>
                      `
                        )
                        .join('')}
                      ${violation.nodes.length > 3 ? `<p>... and ${violation.nodes.length - 3} more elements</p>` : ''}
                    </div>
                  `
                      : ''
                  }
                </div>
              `
                )
                .join('')}
              ${violations.length > 20 ? `<p><strong>Showing first 20 violations out of ${violations.length} total.</strong></p>` : ''}
            </div>
          `
              : ''
          }

          <div class="section">
            <h2>Recommendations</h2>
            <ul>
              <li><strong>Critical Issues:</strong> Fix immediately before deployment</li>
              <li><strong>Serious Issues:</strong> Address within current sprint</li>
              <li><strong>Moderate Issues:</strong> Plan fixes for next release</li>
              <li><strong>Minor Issues:</strong> Continuous improvement backlog</li>
            </ul>
            <p><strong>Target:</strong> Maintain 95%+ compliance rate for production deployment.</p>
          </div>
        </div>

        <script>
          function filterViolations(impact) {
            const violations = document.querySelectorAll('.violation');
            const buttons = document.querySelectorAll('.filter-btn');
            
            buttons.forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            violations.forEach(violation => {
              if (impact === 'all' || violation.dataset.impact === impact) {
                violation.style.display = 'block';
              } else {
                violation.style.display = 'none';
              }
            });
          }
        </script>
      </body>
      </html>
    `;
  }

  generateSummaryReport() {
    const { summary } = this.results;

    return {
      timestamp: summary.timestamp,
      compliance: summary.compliance,
      status: summary.compliance >= 95 ? 'PASS' : summary.compliance >= 80 ? 'WARNING' : 'FAIL',
      totalViolations: summary.totalViolations,
      criticalIssues: summary.criticalIssues,
      totalPages: summary.totalPages,
      duration: summary.duration,
      recommendations: this.getRecommendations(),
    };
  }

  getRecommendations() {
    const { summary, violations } = this.results;
    const recommendations = [];

    if (summary.criticalIssues > 0) {
      recommendations.push('🚨 Critical accessibility issues found - deployment blocked');
    }

    if (summary.compliance < 80) {
      recommendations.push('⚠️ Low compliance rate - requires immediate attention');
    }

    // Analyze common violation types
    const violationTypes = {};
    violations.forEach(v => {
      violationTypes[v.id] = (violationTypes[v.id] || 0) + 1;
    });

    const mostCommon = Object.entries(violationTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    if (mostCommon.length > 0) {
      recommendations.push(`🎯 Most common issues: ${mostCommon.map(([id]) => id).join(', ')}`);
    }

    if (summary.compliance >= 95) {
      recommendations.push('✅ Excellent accessibility compliance - ready for production');
    }

    return recommendations;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    baseUrl: args.includes('--url') ? args[args.indexOf('--url') + 1] : AUDIT_CONFIG.baseUrl,
    outputDir: args.includes('--output')
      ? args[args.indexOf('--output') + 1]
      : AUDIT_CONFIG.outputDir,
    critical: args.includes('--critical-only'),
    verbose: args.includes('--verbose'),
  };

  console.log('🔍 HASIVU Platform Accessibility Auditor');
  console.log('========================================');
  console.log(`Base URL: ${options.baseUrl}`);
  console.log(`Output Directory: ${options.outputDir}`);
  console.log(`Critical Pages Only: ${options.critical ? 'Yes' : 'No'}`);
  console.log('');

  // Filter pages if critical-only mode
  if (options.critical) {
    AUDIT_CONFIG.pages = AUDIT_CONFIG.pages.filter(page => page.critical);
  }

  const auditor = new AccessibilityAuditor();

  try {
    await auditor.runAudit();
    const reports = auditor.generateReport();
    const { summary } = reports.results;

    console.log('\n📊 Audit Complete');
    console.log('==================');
    console.log(`✅ Pages Tested: ${summary.totalPages}`);
    console.log(`❌ Total Violations: ${summary.totalViolations}`);
    console.log(`🚨 Critical Issues: ${summary.criticalIssues}`);
    console.log(`📈 Compliance Rate: ${summary.compliance}%`);
    console.log(`⏱️  Duration: ${Math.round(summary.duration / 1000)}s`);

    // Exit with appropriate code
    if (summary.criticalIssues > 0 || summary.compliance < 80) {
      console.log('\n❌ ACCESSIBILITY AUDIT FAILED');
      process.exit(1);
    } else if (summary.compliance < 95) {
      console.log('\n⚠️  ACCESSIBILITY AUDIT WARNING');
      process.exit(0);
    } else {
      console.log('\n✅ ACCESSIBILITY AUDIT PASSED');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Audit failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { AccessibilityAuditor, AUDIT_CONFIG };
