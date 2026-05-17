#!/usr/bin/env node

/**
 * HASIVU Platform - Authentication API Test Validation Script
 *
 * Validates that all authentication API test files are properly configured
 * and dependencies are available before running the full test suite.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TestValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.success = [];
  }

  async validateAll() {
    console.log('🔍 Validating HASIVU Authentication API Test Suite');
    console.log('='.repeat(60));

    // Check test files
    this.validateTestFiles();

    // Check dependencies
    this.validateDependencies();

    // Check configuration
    this.validateConfiguration();

    // Check API connectivity
    await this.validateAPIConnectivity();

    // Generate report
    this.generateReport();

    return this.errors.length === 0;
  }

  validateTestFiles() {
    console.log('\n📁 Validating Test Files...');

    const testFiles = [
      'tests/api/auth-endpoints.comprehensive.test.ts',
      'tests/api/auth-contract-validation.test.ts',
      'tests/api/auth-load-testing.spec.ts',
      'tests/api/auth-security-testing.spec.ts',
    ];

    testFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        this.success.push(`✅ ${file} - Found`);

        // Check file content
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('test.describe') && content.includes('expect')) {
          this.success.push(`✅ ${file} - Valid test structure`);
        } else {
          this.warnings.push(`⚠️ ${file} - Incomplete test structure`);
        }
      } else {
        this.errors.push(`❌ ${file} - Missing`);
      }
    });

    // Check scripts
    const scripts = ['scripts/run-auth-api-tests.js', 'scripts/validate-auth-api-tests.js'];

    scripts.forEach(script => {
      const scriptPath = path.join(process.cwd(), script);
      if (fs.existsSync(scriptPath)) {
        this.success.push(`✅ ${script} - Found`);
      } else {
        this.errors.push(`❌ ${script} - Missing`);
      }
    });
  }

  validateDependencies() {
    console.log('\n📦 Validating Dependencies...');

    const requiredDependencies = ['@playwright/test', 'ajv', 'ajv-formats'];

    requiredDependencies.forEach(dep => {
      try {
        require.resolve(dep);
        this.success.push(`✅ ${dep} - Installed`);
      } catch (error) {
        this.errors.push(`❌ ${dep} - Not found`);
      }
    });

    // Check Playwright browsers
    try {
      execSync('npx playwright --version', { stdio: 'pipe' });
      this.success.push('✅ Playwright CLI - Available');

      // Check if browsers are installed
      try {
        execSync('npx playwright list', { stdio: 'pipe' });
        this.success.push('✅ Playwright browsers - Installed');
      } catch (error) {
        this.warnings.push(
          '⚠️ Playwright browsers - May need installation (run: npx playwright install)'
        );
      }
    } catch (error) {
      this.errors.push('❌ Playwright CLI - Not available');
    }
  }

  validateConfiguration() {
    console.log('\n⚙️ Validating Configuration...');

    // Check package.json scripts
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      const requiredScripts = [
        'test:api:auth',
        'test:api:auth:comprehensive',
        'test:api:auth:contract',
        'test:api:auth:load',
        'test:api:auth:security',
      ];

      requiredScripts.forEach(script => {
        if (packageJson.scripts && packageJson.scripts[script]) {
          this.success.push(`✅ npm script: ${script} - Configured`);
        } else {
          this.errors.push(`❌ npm script: ${script} - Missing`);
        }
      });
    } else {
      this.errors.push('❌ package.json - Not found');
    }

    // Check Playwright config
    const playwrightConfigs = ['playwright.config.ts', 'playwright.config.js'];

    let configFound = false;
    playwrightConfigs.forEach(config => {
      const configPath = path.join(process.cwd(), config);
      if (fs.existsSync(configPath)) {
        this.success.push(`✅ ${config} - Found`);
        configFound = true;
      }
    });

    if (!configFound) {
      this.warnings.push('⚠️ Playwright config - Not found (will use defaults)');
    }

    // Check environment variables
    const requiredEnvVars = ['NEXT_PUBLIC_API_URL'];

    requiredEnvVars.forEach(envVar => {
      if (process.env[envVar]) {
        this.success.push(`✅ Environment variable: ${envVar} - Set`);
      } else {
        this.warnings.push(`⚠️ Environment variable: ${envVar} - Not set (will use default)`);
      }
    });
  }

  async validateAPIConnectivity() {
    console.log('\n🌐 Validating API Connectivity...');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.hasivu.com';

    try {
      // Check if we can import fetch (Node 18+ or polyfill)
      const fetch = global.fetch || require('node-fetch');

      console.log(`   Testing connection to: ${apiUrl}`);

      // Test health endpoint
      try {
        const healthResponse = await fetch(`${apiUrl}/health`, {
          method: 'GET',
          timeout: 5000,
        });

        if (healthResponse.ok) {
          this.success.push(`✅ API Health endpoint - Responding (${healthResponse.status})`);
        } else {
          this.warnings.push(`⚠️ API Health endpoint - Responding with ${healthResponse.status}`);
        }
      } catch (error) {
        this.warnings.push(`⚠️ API Health endpoint - Not accessible (${error.message})`);
      }

      // Test auth endpoint (should return 400/405 for GET request)
      try {
        const authResponse = await fetch(`${apiUrl}/auth/login`, {
          method: 'GET',
          timeout: 5000,
        });

        // Any response means the endpoint exists
        this.success.push(`✅ Auth endpoint - Accessible (${authResponse.status})`);
      } catch (error) {
        this.warnings.push(`⚠️ Auth endpoint - Not accessible (${error.message})`);
      }
    } catch (error) {
      this.warnings.push(`⚠️ API connectivity test failed - ${error.message}`);
      this.warnings.push('   Tests will run in demo mode');
    }
  }

  generateReport() {
    console.log('\n📊 Validation Results');
    console.log('='.repeat(60));

    if (this.success.length > 0) {
      console.log('\n✅ Successful Validations:');
      this.success.forEach(item => console.log(`   ${item}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      this.warnings.forEach(item => console.log(`   ${item}`));
    }

    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(item => console.log(`   ${item}`));
    }

    console.log(`\n${'='.repeat(60)}`);

    if (this.errors.length === 0) {
      console.log('🎉 Validation Passed! Authentication API tests are ready to run.');
      console.log('\nNext steps:');
      console.log('   npm run test:api:auth              # Run all tests');
      console.log('   npm run test:api:auth:smoke        # Quick smoke test');
      console.log('   npm run test:api:auth:report       # Generate full report');
    } else {
      console.log('❌ Validation Failed! Please fix the errors above before running tests.');
      console.log('\nCommon fixes:');
      console.log('   npm install                        # Install dependencies');
      console.log('   npx playwright install             # Install browsers');
      console.log('   npm run test:setup                 # Run setup script');
    }

    console.log(
      `\nValidation Summary: ${this.success.length} passed, ${this.warnings.length} warnings, ${this.errors.length} errors`
    );
  }
}

// Main execution
async function main() {
  const validator = new TestValidator();
  const isValid = await validator.validateAll();
  process.exit(isValid ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Validation script failed:', error);
    process.exit(1);
  });
}

module.exports = TestValidator;
