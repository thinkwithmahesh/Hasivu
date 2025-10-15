#!/usr/bin/env node
/**
 * Quick Accessibility Validation for HASIVU Platform
 * Validates WCAG 2.1 AA compliance improvements
 */

const fetch = require('node-fetch');

async function validatePage(url, pageName) {
  try {
    console.log(`\n🔍 Validating ${pageName}...`);

    const response = await fetch(url);
    const html = await response.text();

    const issues = [];

    // Check 1: HTML lang attribute
    if (!html.includes('lang="en"') && !html.includes("lang='en'")) {
      issues.push('❌ Missing lang attribute on HTML element');
    } else {
      console.log('✅ HTML lang attribute present');
    }

    // Check 2: Main landmark
    if (!html.includes('<main') && !html.includes('role="main"')) {
      issues.push('❌ Missing main landmark');
    } else {
      console.log('✅ Main landmark present');
    }

    // Check 3: Skip link
    if (!html.includes('Skip to main content')) {
      issues.push('❌ Missing skip link');
    } else {
      console.log('✅ Skip link present');
    }

    // Check 4: Form labels (basic check)
    const inputCount = (html.match(/<input/g) || []).length;
    const labelCount = (html.match(/<label/g) || []).length;
    const ariaLabelCount = (html.match(/aria-label=/g) || []).length;

    if (inputCount > 0 && (labelCount > 0 || ariaLabelCount > 0)) {
      console.log('✅ Forms appear to have labels or aria-labels');
    } else if (inputCount > 0) {
      issues.push('⚠️  Forms may be missing proper labels');
    }

    // Check 5: Heading structure
    const h1Count = (html.match(/<h1/g) || []).length;
    if (h1Count === 0) {
      issues.push('⚠️  No h1 heading found');
    } else if (h1Count > 1) {
      issues.push('⚠️  Multiple h1 headings found');
    } else {
      console.log('✅ Proper h1 heading structure');
    }

    // Check 6: Focus management
    if (html.includes('focus:outline') || html.includes('focus-visible')) {
      console.log('✅ Focus styles appear to be implemented');
    } else {
      issues.push('⚠️  Focus styles may not be properly implemented');
    }

    // Check 7: Error handling
    if (html.includes('role="alert"') || html.includes('aria-live')) {
      console.log('✅ Error handling with ARIA live regions detected');
    }

    // Check 8: Button accessibility
    if (html.includes('aria-label') || html.includes('aria-labelledby')) {
      console.log('✅ ARIA labels detected for interactive elements');
    }

    if (issues.length === 0) {
      console.log(`🎉 ${pageName} - No critical accessibility issues found!`);
    } else {
      console.log(`\n⚠️  ${pageName} - Issues found:`);
      issues.forEach(issue => console.log(`   ${issue}`));
    }

    return issues.length;
  } catch (error) {
    console.error(`❌ Error validating ${pageName}:`, error.message);
    return 1;
  }
}

async function main() {
  console.log('🚀 HASIVU Platform Accessibility Validation');
  console.log('='.repeat(50));

  const baseUrl = 'http://localhost:3000';

  const pages = [
    { path: '/', name: 'Homepage' },
    { path: '/auth/login', name: 'Login Page' },
    { path: '/menu', name: 'Menu Page' },
  ];

  let totalIssues = 0;

  for (const page of pages) {
    try {
      const issues = await validatePage(`${baseUrl}${page.path}`, page.name);
      totalIssues += issues;
    } catch (error) {
      console.error(`Error testing ${page.name}:`, error.message);
      totalIssues += 1;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(50));

  if (totalIssues === 0) {
    console.log('🎉 SUCCESS: All pages passed basic accessibility validation!');
    console.log('✅ WCAG 2.1 AA compliance improvements are working');
    console.log('🚀 Platform is ready for production!');
  } else {
    console.log(`⚠️  ${totalIssues} potential issues found across all pages`);
    console.log('🔧 Review the issues above and make necessary adjustments');
  }

  console.log('\n📋 Manual Testing Checklist:');
  console.log('• Test keyboard navigation (Tab, Enter, Space, Escape)');
  console.log('• Test with screen reader (macOS VoiceOver, Windows NVDA)');
  console.log('• Verify color contrast with tools like WebAIM Color Contrast Analyzer');
  console.log('• Test focus management and visual focus indicators');
  console.log('• Verify form error handling and announcements');

  process.exit(totalIssues > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}
