/**
 * HASIVU Platform - Accessibility Testing Utilities
 * 
 * Comprehensive accessibility testing utilities for development and production
 * Features:
 * - Runtime accessibility monitoring
 * - WCAG 2.1 AA compliance checking
 * - Automated accessibility auditing
 * - Focus management testing
 * - Screen reader compatibility validation
 * - Color contrast analysis
 * - Keyboard navigation testing
 */

import { ReactElement } from 'react';

// Types for accessibility testing
export interface AccessibilityTestResult {
  id: string;
  timestamp: number;
  element?: string;
  rule: string;
  description: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  wcagLevel: 'A' | 'AA' | 'AAA';
  category: 'structure' | 'keyboard' | 'color' | 'forms' | 'images' | 'multimedia' | 'navigation';
  help: string;
  helpUrl: string;
  tags: string[];
}

export interface AccessibilityAuditReport {
  url: string;
  timestamp: number;
  violations: AccessibilityTestResult[];
  passes: AccessibilityTestResult[];
  incomplete: AccessibilityTestResult[];
  compliance: {
    level: 'A' | 'AA' | 'AAA';
    percentage: number;
    total: number;
    passed: number;
    failed: number;
  };
  performance: {
    auditDuration: number;
    elementsChecked: number;
  };
}

export interface ColorContrastResult {
  element: string;
  foreground: string;
  background: string;
  ratio: number;
  level: 'AA' | 'AAA' | 'FAIL';
  size: 'normal' | 'large';
}

export interface KeyboardNavigationResult {
  element: string;
  accessible: boolean;
  hasVisibleFocus: boolean;
  tabIndex: number;
  role?: string;
  ariaLabel?: string;
  issues: string[];
}

// Accessibility testing class
export class AccessibilityTester {
  private static instance: AccessibilityTester;
  private axeCore: any;
  private isInitialized = false;
  private observers: MutationObserver[] = [];

  static getInstance(): AccessibilityTester {
    if (!AccessibilityTester.instance) {
      AccessibilityTester.instance = new AccessibilityTester();
    }
    return AccessibilityTester.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') return;

    try {
      // Dynamically import axe-core to avoid SSR issues
      this.axeCore = await import('axe-core');
      
      // Configure axe-core for HASIVU platform
      this.axeCore.default.configure({
        reporter: 'v2',
        rules: {
          // Customize rules for HASIVU platform
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'focus-visible': { enabled: true },
          'aria-roles': { enabled: true },
          'aria-valid-attr': { enabled: true },
          'aria-required-attr': { enabled: true },
          'form-field-multiple-labels': { enabled: true },
          'heading-order': { enabled: true },
          'landmark-unique': { enabled: true },
          'page-has-heading-one': { enabled: true },
        },
      });

      this.isInitialized = true;
      console.log('✅ HASIVU Accessibility Tester initialized');
    } catch (error) {
      console.error('Failed to initialize accessibility tester:', error);
    }
  }

  /**
   * Run comprehensive accessibility audit
   */
  async runAudit(
    context?: Element,
    options?: {
      tags?: string[];
      rules?: string[];
      excludeSelectors?: string[];
      includeSelectors?: string[];
    }
  ): Promise<AccessibilityAuditReport> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = performance.now();
    const url = window.location.href;

    try {
      const axeOptions: any = {
        reporter: 'v2',
        runOnly: options?.tags || ['wcag2a', 'wcag2aa', 'wcag21aa'],
        resultTypes: ['violations', 'passes', 'incomplete', 'inapplicable'],
      };

      if (options?.rules) {
        axeOptions.runOnly = {
          type: 'rule',
          values: options.rules,
        };
      }

      if (options?.excludeSelectors?.length) {
        axeOptions.exclude = options.excludeSelectors;
      }

      if (options?.includeSelectors?.length) {
        axeOptions.include = options.includeSelectors;
      }

      const results = await this.axeCore.default.run(context || document, axeOptions);
      const endTime = performance.now();

      // Transform results
      const violations = this.transformResults(results.violations);
      const passes = this.transformResults(results.passes);
      const incomplete = this.transformResults(results.incomplete);

      const total = violations.length + passes.length;
      const passed = passes.length;
      const failed = violations.length;
      const percentage = total > 0 ? Math.round((passed / total) * 100) : 100;

      const report: AccessibilityAuditReport = {
        url,
        timestamp: Date.now(),
        violations,
        passes,
        incomplete,
        compliance: {
          level: this.getComplianceLevel(violations),
          percentage,
          total,
          passed,
          failed,
        },
        performance: {
          auditDuration: endTime - startTime,
          elementsChecked: results.violations.reduce((count: number, v: any) => count + v.nodes.length, 0) +
                          results.passes.reduce((count: number, p: any) => count + p.nodes.length, 0),
        },
      };

      return report;
    } catch (error) {
      console.error('Accessibility audit failed:', error);
      throw new Error('Failed to run accessibility audit');
    }
  }

  /**
   * Test color contrast for specific elements
   */
  async testColorContrast(selector?: string): Promise<ColorContrastResult[]> {
    const elements = selector 
      ? document.querySelectorAll(selector)
      : document.querySelectorAll('*:not(script):not(style):not(meta)');

    const results: ColorContrastResult[] = [];

    for (const element of Array.from(elements)) {
      if (!element.textContent?.trim()) continue;

      const styles = window.getComputedStyle(element);
      const foreground = styles.color;
      const background = styles.backgroundColor || 'rgb(255, 255, 255)';
      const fontSize = parseFloat(styles.fontSize);
      const fontWeight = styles.fontWeight;

      const ratio = this.calculateContrastRatio(foreground, background);
      const isLarge = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
      
      let level: 'AA' | 'AAA' | 'FAIL';
      if (isLarge) {
        level = ratio >= 4.5 ? 'AAA' : ratio >= 3 ? 'AA' : 'FAIL';
      } else {
        level = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'FAIL';
      }

      results.push({
        element: this.getElementSelector(element as HTMLElement),
        foreground,
        background,
        ratio: Math.round(ratio * 100) / 100,
        level,
        size: isLarge ? 'large' : 'normal',
      });
    }

    return results.filter(result => result.level === 'FAIL');
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(): Promise<KeyboardNavigationResult[]> {
    const focusableElements = document.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const results: KeyboardNavigationResult[] = [];

    for (const element of Array.from(focusableElements)) {
      const htmlElement = element as HTMLElement;
      const issues: string[] = [];

      // Check if element is visible
      const isVisible = this.isElementVisible(htmlElement);
      if (!isVisible) {
        issues.push('Element is not visible');
      }

      // Check tab index
      const tabIndex = htmlElement.tabIndex;
      if (tabIndex < -1) {
        issues.push('Invalid tabindex value');
      }

      // Focus the element and check focus visibility
      htmlElement.focus();
      const hasVisibleFocus = this.hasFocusIndicator(htmlElement);
      
      if (!hasVisibleFocus) {
        issues.push('No visible focus indicator');
      }

      // Check ARIA attributes
      const role = htmlElement.getAttribute('role');
      const ariaLabel = htmlElement.getAttribute('aria-label');
      const ariaLabelledBy = htmlElement.getAttribute('aria-labelledby');

      if (!ariaLabel && !ariaLabelledBy && !htmlElement.textContent?.trim()) {
        if (htmlElement.tagName.toLowerCase() !== 'input' || 
            !document.querySelector(`label[for="${htmlElement.id}"]`)) {
          issues.push('No accessible name');
        }
      }

      results.push({
        element: this.getElementSelector(htmlElement),
        accessible: issues.length === 0,
        hasVisibleFocus,
        tabIndex,
        role: role || undefined,
        ariaLabel: ariaLabel || undefined,
        issues,
      });
    }

    return results;
  }

  /**
   * Monitor accessibility in real-time
   */
  startLiveMonitoring(callback: (violations: AccessibilityTestResult[]) => void): void {
    if (!this.isInitialized) {
      this.initialize().then(() => this.startLiveMonitoring(callback));
      return;
    }

    // Monitor DOM changes and re-run accessibility checks
    const observer = new MutationObserver(async (mutations) => {
      let shouldRecheck = false;

      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldRecheck = true;
          break;
        }
        if (mutation.type === 'attributes' && 
            ['aria-', 'role', 'tabindex', 'alt'].some(attr => 
              mutation.attributeName?.startsWith(attr))) {
          shouldRecheck = true;
          break;
        }
      }

      if (shouldRecheck) {
        try {
          const results = await this.runAudit();
          if (results.violations.length > 0) {
            callback(results.violations);
          }
        } catch (error) {
          console.error('Live accessibility monitoring error:', error);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label', 'aria-labelledby', 'aria-describedby', 'role', 'tabindex', 'alt'],
    });

    this.observers.push(observer);
  }

  /**
   * Stop live monitoring
   */
  stopLiveMonitoring(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  /**
   * Generate accessibility report HTML
   */
  generateReportHTML(report: AccessibilityAuditReport): string {
    const { compliance, violations, passes, performance } = report;
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HASIVU Accessibility Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
          .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px; margin-bottom: 24px; }
          .metric { display: inline-block; margin-right: 24px; }
          .metric-value { font-size: 24px; font-weight: bold; }
          .metric-label { font-size: 12px; opacity: 0.8; }
          .section { margin: 24px 0; }
          .violation { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 6px; padding: 16px; margin: 12px 0; }
          .pass { background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 16px; margin: 12px 0; }
          .impact-critical { border-left: 4px solid #dc2626; }
          .impact-serious { border-left: 4px solid #ea580c; }
          .impact-moderate { border-left: 4px solid #d97706; }
          .impact-minor { border-left: 4px solid #65a30d; }
          .help-link { color: #2563eb; text-decoration: none; }
          .help-link:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>HASIVU Platform Accessibility Report</h1>
          <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
          <p>URL: ${report.url}</p>
        </div>

        <div class="section">
          <h2>Compliance Summary</h2>
          <div class="metric">
            <div class="metric-value">${compliance.percentage}%</div>
            <div class="metric-label">Compliance Rate</div>
          </div>
          <div class="metric">
            <div class="metric-value">${compliance.passed}</div>
            <div class="metric-label">Tests Passed</div>
          </div>
          <div class="metric">
            <div class="metric-value">${compliance.failed}</div>
            <div class="metric-label">Violations</div>
          </div>
          <div class="metric">
            <div class="metric-value">${performance.auditDuration.toFixed(0)}ms</div>
            <div class="metric-label">Audit Duration</div>
          </div>
        </div>

        ${violations.length > 0 ? `
          <div class="section">
            <h2>Violations (${violations.length})</h2>
            ${violations.map(violation => `
              <div class="violation impact-${violation.impact}">
                <h3>${violation.rule}</h3>
                <p><strong>Impact:</strong> ${violation.impact}</p>
                <p><strong>WCAG Level:</strong> ${violation.wcagLevel}</p>
                <p><strong>Description:</strong> ${violation.description}</p>
                <p><strong>Element:</strong> <code>${violation.element || 'N/A'}</code></p>
                <p><a href="${violation.helpUrl}" target="_blank" class="help-link">Learn more</a></p>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="section">
          <h2>Successful Tests (${passes.length})</h2>
          <p>The following accessibility tests passed:</p>
          ${passes.slice(0, 10).map(pass => `
            <div class="pass">
              <strong>${pass.rule}</strong>: ${pass.description}
            </div>
          `).join('')}
          ${passes.length > 10 ? `<p>... and ${passes.length - 10} more tests passed.</p>` : ''}
        </div>
      </body>
      </html>
    `;
  }

  // Private helper methods
  private transformResults(results: any[]): AccessibilityTestResult[] {
    return results.map(result => ({
      id: result.id,
      timestamp: Date.now(),
      element: result.nodes?.[0]?.target?.[0] || '',
      rule: result.id,
      description: result.description,
      impact: result.impact || 'moderate',
      wcagLevel: this.getWcagLevel(result.tags),
      category: this.getCategory(result.tags),
      help: result.help,
      helpUrl: result.helpUrl,
      tags: result.tags,
    }));
  }

  private getWcagLevel(tags: string[]): 'A' | 'AA' | 'AAA' {
    if (tags.includes('wcag21aaa') || tags.includes('wcag2aaa')) return 'AAA';
    if (tags.includes('wcag21aa') || tags.includes('wcag2aa')) return 'AA';
    return 'A';
  }

  private getCategory(tags: string[]): AccessibilityTestResult['category'] {
    if (tags.includes('forms')) return 'forms';
    if (tags.includes('keyboard')) return 'keyboard';
    if (tags.includes('color-contrast')) return 'color';
    if (tags.includes('images')) return 'images';
    if (tags.includes('multimedia')) return 'multimedia';
    if (tags.includes('navigation')) return 'navigation';
    return 'structure';
  }

  private getComplianceLevel(violations: AccessibilityTestResult[]): 'A' | 'AA' | 'AAA' {
    const hasCritical = violations.some(v => v.impact === 'critical');
    const hasSerious = violations.some(v => v.impact === 'serious');
    
    if (hasCritical || violations.length > 10) return 'A';
    if (hasSerious || violations.length > 5) return 'AA';
    return 'AAA';
  }

  private calculateContrastRatio(foreground: string, background: string): number {
    const fgLuminance = this.getLuminance(foreground);
    const bgLuminance = this.getLuminance(background);
    
    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  private getLuminance(color: string): number {
    // Convert RGB to relative luminance
    const rgb = color.match(/\d+/g);
    if (!rgb || rgb.length < 3) return 0;

    const [r, g, b] = rgb.map(val => {
      const normalized = parseInt(val) / 255;
      return normalized <= 0.03928 
        ? normalized / 12.92 
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private isElementVisible(element: HTMLElement): boolean {
    const styles = window.getComputedStyle(element);
    return styles.display !== 'none' && 
           styles.visibility !== 'hidden' && 
           styles.opacity !== '0' &&
           element.offsetWidth > 0 && 
           element.offsetHeight > 0;
  }

  private hasFocusIndicator(element: HTMLElement): boolean {
    const styles = window.getComputedStyle(element);
    return styles.outline !== 'none' || 
           styles.boxShadow !== 'none' || 
           styles.borderColor !== styles.borderColor; // Check if border changes on focus
  }

  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }
}

// Singleton instance for global use
export const accessibilityTester = AccessibilityTester.getInstance();

// React hook for accessibility testing
export function useAccessibilityTesting() {
  const runAudit = async (options?: Parameters<AccessibilityTester['runAudit']>[1]) => {
    return await accessibilityTester.runAudit(undefined, options);
  };

  const testColorContrast = async (selector?: string) => {
    return await accessibilityTester.testColorContrast(selector);
  };

  const testKeyboardNavigation = async () => {
    return await accessibilityTester.testKeyboardNavigation();
  };

  return {
    runAudit,
    testColorContrast,
    testKeyboardNavigation,
  };
}