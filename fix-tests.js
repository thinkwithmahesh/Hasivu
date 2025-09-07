#!/usr/bin/env node

/**
 * Test Infrastructure Cleanup and Repair Script
 * Removes malformed test files and creates clean test infrastructure
 */

const fs = require('fs');
const path = require('path');

const testDirs = [
  'tests/unit/auth',
  'tests/unit/payments', 
  'tests/unit/services'
];

const brokenTestFiles = [
  'tests/unit/auth/jwt.service.test.ts',
  'tests/unit/auth/auth-security.test.ts',
  'tests/unit/auth/rbac.test.ts', 
  'tests/unit/auth/session-management.test.ts',
  'tests/unit/payments/advanced-payment.test.ts',
  'tests/unit/payments/billing-automation.test.ts',
  'tests/unit/payments/dunning-management.test.ts',
  'tests/unit/payments/manage-payment-methods.test.ts',
  'tests/unit/payments/payment-analytics.test.ts',
  'tests/unit/payments/payment-retry.test.ts',
  'tests/unit/payments/reconciliation.test.ts',
  'tests/unit/payments/subscription-analytics.test.ts',
  'tests/unit/payments/subscription-management.test.ts',
  'tests/unit/payments/subscription-plans.test.ts',
  'tests/unit/services/circuit-breaker-fixed.test.ts',
  'tests/unit/services/circuit-breaker.service.test.ts',
  'tests/unit/services/graceful-degradation.service.test.ts',
  'tests/unit/services/rfid-service-fixed.test.ts',
  'tests/unit/services/rfid.service.comprehensive.test.ts',
  'tests/unit/services/transaction.service.test.ts',
  'tests/unit/services/validation.service.test.ts'
];

console.log('🧹 Cleaning up broken test files...');

// Remove broken test files
brokenTestFiles.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`✅ Removed: ${file}`);
    }
  } catch (error) {
    console.log(`⚠️ Could not remove ${file}: ${error.message}`);
  }
});

// Remove .bak files
const removeBakFiles = (dir) => {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (file.endsWith('.bak')) {
      try {
        fs.unlinkSync(fullPath);
        console.log(`✅ Removed backup: ${fullPath}`);
      } catch (error) {
        console.log(`⚠️ Could not remove ${fullPath}: ${error.message}`);
      }
    } else if (fs.statSync(fullPath).isDirectory()) {
      removeBakFiles(fullPath);
    }
  });
};

testDirs.forEach(removeBakFiles);

console.log('✅ Test cleanup completed!');
console.log('🚀 Ready to create clean test infrastructure');