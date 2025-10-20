#!/usr/bin/env node

/**
 * HASIVU Platform - Security Validation Script
 * Comprehensive security validation for production deployment
 * Run before deploying to production
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Security validation results
 */
const results = {
  passed: [],
  warnings: [],
  errors: [],
  critical: [],
};

/**
 * Add validation result
 */
function addResult(level, category, message, fix = null) {
  const result = { category, message, fix, timestamp: new Date().toISOString() };
  results[level].push(result);
}

/**
 * Validate JWT configuration
 */
function validateJWTConfig() {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    addResult(
      'critical',
      'JWT',
      'JWT_SECRET environment variable not set',
      'Set JWT_SECRET to a random 64+ character string'
    );
    return;
  }

  if (jwtSecret.length < 64) {
    addResult(
      'critical',
      'JWT',
      'JWT secret is too short for production security',
      'Generate a new 64+ character secret'
    );
    return;
  }

  // Check for weak patterns
  const weakPatterns = ['secret', 'password', 'default', '123456', 'qwerty'];
  const lowerSecret = jwtSecret.toLowerCase();

  for (const pattern of weakPatterns) {
    if (lowerSecret.includes(pattern)) {
      addResult(
        'critical',
        'JWT',
        `JWT secret contains weak pattern: ${pattern}`,
        'Generate a new cryptographically secure random secret'
      );
      return;
    }
  }

  addResult('passed', 'JWT', 'JWT configuration is secure');
}

/**
 * Validate database security
 */
function validateDatabaseConfig() {
  const dbUrl = process.env.DATABASE_URL;
  const dbPassword = process.env.DATABASE_PASSWORD;

  if (!dbUrl) {
    addResult('critical', 'Database', 'DATABASE_URL not configured');
    return;
  }

  if (!dbPassword || dbPassword.length < 12) {
    addResult(
      'critical',
      'Database',
      'Database password is too weak',
      'Use a strong password with at least 12 characters'
    );
    return;
  }

  // Check for SSL requirement in production
  if (process.env.NODE_ENV === 'production' && !dbUrl.includes('sslmode=require')) {
    addResult(
      'warnings',
      'Database',
      'Database SSL not enforced in production',
      'Add sslmode=require to DATABASE_URL'
    );
  } else {
    addResult('passed', 'Database', 'Database configuration is secure');
  }
}

/**
 * Validate webhook security
 */
function validateWebhookConfig() {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    addResult('critical', 'Webhook', 'RAZORPAY_WEBHOOK_SECRET not configured');
    return;
  }

  if (webhookSecret.length < 32) {
    addResult(
      'critical',
      'Webhook',
      'Webhook secret is too short',
      'Use a secret with at least 32 characters'
    );
    return;
  }

  addResult('passed', 'Webhook', 'Webhook security configuration is valid');
}

/**
 * Validate session security
 */
function validateSessionConfig() {
  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret) {
    addResult('critical', 'Session', 'SESSION_SECRET not configured');
    return;
  }

  if (sessionSecret.length < 32) {
    addResult(
      'critical',
      'Session',
      'Session secret is too short',
      'Use a secret with at least 32 characters'
    );
    return;
  }

  addResult('passed', 'Session', 'Session security configuration is valid');
}

/**
 * Validate CORS configuration
 */
function validateCORSConfig() {
  const corsOrigins = process.env.CORS_ORIGINS || '*';

  if (process.env.NODE_ENV === 'production' && corsOrigins.includes('*')) {
    addResult(
      'critical',
      'CORS',
      'Wildcard CORS origins not allowed in production',
      'Specify exact origins in CORS_ORIGINS'
    );
    return;
  }

  addResult('passed', 'CORS', 'CORS configuration is secure');
}

/**
 * Validate encryption configuration
 */
function validateEncryptionConfig() {
  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (!encryptionKey) {
    addResult('critical', 'Encryption', 'ENCRYPTION_KEY not configured');
    return;
  }

  if (encryptionKey.length < 32) {
    addResult(
      'critical',
      'Encryption',
      'Encryption key is too short',
      'Use a key with at least 32 characters'
    );
    return;
  }

  addResult('passed', 'Encryption', 'Encryption configuration is secure');
}

/**
 * Validate rate limiting configuration
 */
function validateRateLimitConfig() {
  const rateLimitEnabled = process.env.RATE_LIMIT_ENABLED !== 'false';

  if (process.env.NODE_ENV === 'production' && !rateLimitEnabled) {
    addResult(
      'warnings',
      'Rate Limiting',
      'Rate limiting should be enabled in production',
      'Set RATE_LIMIT_ENABLED=true'
    );
  } else {
    addResult('passed', 'Rate Limiting', 'Rate limiting is properly configured');
  }
}

/**
 * Validate file permissions
 */
function validateFilePermissions() {
  const criticalFiles = [
    'src/shared/services/jwt.service.ts',
    'src/services/auth.service.ts',
    'src/middleware/auth.middleware.ts',
    'src/config/environment.ts',
    'src/functions/payments/webhook.ts',
  ];

  for (const file of criticalFiles) {
    const filePath = path.join(__dirname, '..', file);

    try {
      const stats = fs.statSync(filePath);
      const mode = (stats.mode & parseInt('777', 8)).toString(8);

      // Check for world-writable files
      if (mode.endsWith('6') || mode.endsWith('7')) {
        addResult(
          'warnings',
          'File Permissions',
          `${file} is world-writable (${mode})`,
          `chmod 644 ${file}`
        );
      } else {
        addResult('passed', 'File Permissions', `${file} has secure permissions`);
      }
    } catch (error) {
      addResult(
        'errors',
        'File Permissions',
        `Cannot check permissions for ${file}: ${error.message}`
      );
    }
  }
}

/**
 * Validate external service credentials
 */
function validateExternalServices() {
  // Razorpay validation
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!razorpayKeyId || razorpayKeyId.length < 14) {
    addResult('errors', 'Razorpay', 'Invalid or missing RAZORPAY_KEY_ID');
  }

  if (!razorpayKeySecret || razorpayKeySecret.length < 24) {
    addResult('errors', 'Razorpay', 'Invalid or missing RAZORPAY_KEY_SECRET');
  }

  if (
    razorpayKeyId &&
    razorpayKeySecret &&
    razorpayKeyId.length >= 14 &&
    razorpayKeySecret.length >= 24
  ) {
    addResult('passed', 'Razorpay', 'Razorpay credentials format is valid');
  }
}

/**
 * Generate security report
 */
function generateReport() {
  console.log('\n🔐 HASIVU Platform Security Validation Report');
  console.log('='.repeat(50));
  console.log(`Generated: ${new Date().toISOString()}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('\n');

  // Critical issues
  if (results.critical.length > 0) {
    console.log('🚨 CRITICAL ISSUES (Must fix before production):');
    results.critical.forEach(item => {
      console.log(`  ❌ [${item.category}] ${item.message}`);
      if (item.fix) {
        console.log(`     Fix: ${item.fix}`);
      }
    });
    console.log('\n');
  }

  // Errors
  if (results.errors.length > 0) {
    console.log('❌ ERRORS:');
    results.errors.forEach(item => {
      console.log(`  ⚠️  [${item.category}] ${item.message}`);
      if (item.fix) {
        console.log(`     Fix: ${item.fix}`);
      }
    });
    console.log('\n');
  }

  // Warnings
  if (results.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    results.warnings.forEach(item => {
      console.log(`  ⚠️  [${item.category}] ${item.message}`);
      if (item.fix) {
        console.log(`     Fix: ${item.fix}`);
      }
    });
    console.log('\n');
  }

  // Passed checks
  if (results.passed.length > 0) {
    console.log('✅ PASSED CHECKS:');
    results.passed.forEach(item => {
      console.log(`  ✅ [${item.category}] ${item.message}`);
    });
    console.log('\n');
  }

  // Summary
  console.log('📊 SUMMARY:');
  console.log(`  ✅ Passed: ${results.passed.length}`);
  console.log(`  ⚠️  Warnings: ${results.warnings.length}`);
  console.log(`  ❌ Errors: ${results.errors.length}`);
  console.log(`  🚨 Critical: ${results.critical.length}`);

  const isProductionReady = results.critical.length === 0 && results.errors.length === 0;

  console.log('\n');
  if (isProductionReady) {
    console.log('🎉 PRODUCTION READY: All critical security checks passed!');
    if (results.warnings.length > 0) {
      console.log('⚠️  Consider addressing warnings for enhanced security.');
    }
    process.exit(0);
  } else {
    console.log('🚫 NOT PRODUCTION READY: Critical issues must be resolved.');
    process.exit(1);
  }
}

/**
 * Main validation function
 */
function runSecurityValidation() {
  console.log('🔐 Running HASIVU Platform Security Validation...\n');

  validateJWTConfig();
  validateDatabaseConfig();
  validateWebhookConfig();
  validateSessionConfig();
  validateCORSConfig();
  validateEncryptionConfig();
  validateRateLimitConfig();
  validateFilePermissions();
  validateExternalServices();

  generateReport();
}

// Run validation if called directly
if (require.main === module) {
  runSecurityValidation();
}

module.exports = { runSecurityValidation, results };
