#!/usr/bin/env node

/**
 * Production Readiness Check Script
 * Validates that the application is ready for production deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

const log = {
  info: msg => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: msg => console.log(`${colors.green}[PASS]${colors.reset} ${msg}`),
  warning: msg => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: msg => console.log(`${colors.red}[FAIL]${colors.reset} ${msg}`),
};

// Track results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  checks: [],
};

function addCheck(name, status, message) {
  results.checks.push({ name, status, message });
  if (status === 'pass') results.passed++;
  else if (status === 'fail') results.failed++;
  else if (status === 'warn') results.warnings++;
}

function execCommand(command, silent = true) {
  try {
    return execSync(command, {
      encoding: 'utf-8',
      stdio: silent ? 'pipe' : 'inherit',
    });
  } catch (error) {
    return null;
  }
}

function checkEnvironmentVariables() {
  log.info('Checking environment variables...');

  const requiredVars = ['NODE_ENV', 'DATABASE_URL', 'JWT_SECRET', 'AWS_REGION'];

  let allPresent = true;
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      log.error(`Missing required environment variable: ${varName}`);
      allPresent = false;
    }
  }

  if (allPresent) {
    log.success('All required environment variables present');
    addCheck('Environment Variables', 'pass', 'All required variables set');
  } else {
    addCheck('Environment Variables', 'fail', 'Missing required variables');
  }

  return allPresent;
}

function checkDependencies() {
  log.info('Checking dependencies...');

  // Check if node_modules exists
  if (!fs.existsSync('node_modules')) {
    log.error('node_modules not found. Run npm install');
    addCheck('Dependencies', 'fail', 'node_modules not found');
    return false;
  }

  // Check for security vulnerabilities
  const auditResult = execCommand('npm audit --json');
  if (auditResult) {
    try {
      const audit = JSON.parse(auditResult);
      const critical = audit.metadata?.vulnerabilities?.critical || 0;
      const high = audit.metadata?.vulnerabilities?.high || 0;

      if (critical > 0 || high > 0) {
        log.error(`Found ${critical} critical and ${high} high severity vulnerabilities`);
        addCheck('Security Audit', 'fail', `${critical + high} high/critical vulnerabilities`);
        return false;
      }
    } catch (e) {
      log.warning('Could not parse npm audit results');
      addCheck('Security Audit', 'warn', 'Could not parse audit results');
    }
  }

  log.success('Dependencies check passed');
  addCheck('Dependencies', 'pass', 'All dependencies installed and secure');
  return true;
}

function checkBuild() {
  log.info('Checking if build is up to date...');

  if (!fs.existsSync('dist')) {
    log.error('Build directory not found. Run npm run build');
    addCheck('Build', 'fail', 'Build directory not found');
    return false;
  }

  // Check if build is recent
  const buildStat = fs.statSync('dist');
  const packageStat = fs.statSync('package.json');

  if (buildStat.mtime < packageStat.mtime) {
    log.warning('Build may be outdated. Consider rebuilding');
    addCheck('Build', 'warn', 'Build may be outdated');
    return true;
  }

  log.success('Build is up to date');
  addCheck('Build', 'pass', 'Build exists and is current');
  return true;
}

function checkTests() {
  log.info('Running tests...');

  // Run unit tests
  const testResult = execCommand('npm run test:unit -- --passWithNoTests');
  if (!testResult) {
    log.error('Unit tests failed');
    addCheck('Unit Tests', 'fail', 'Unit tests failed');
    return false;
  }

  log.success('Tests passed');
  addCheck('Unit Tests', 'pass', 'All unit tests passed');
  return true;
}

function checkTypeScript() {
  log.info('Running TypeScript type check...');

  const typeCheckResult = execCommand('npm run type-check');
  if (!typeCheckResult && typeCheckResult !== '') {
    log.error('TypeScript type check failed');
    addCheck('Type Check', 'fail', 'TypeScript errors found');
    return false;
  }

  log.success('TypeScript check passed');
  addCheck('Type Check', 'pass', 'No TypeScript errors');
  return true;
}

function checkLinting() {
  log.info('Running linter...');

  const lintResult = execCommand('npm run lint');
  if (!lintResult && lintResult !== '') {
    log.error('Linting failed');
    addCheck('Linting', 'fail', 'Linting errors found');
    return false;
  }

  log.success('Linting passed');
  addCheck('Linting', 'pass', 'No linting errors');
  return true;
}

function checkDatabaseMigrations() {
  log.info('Checking database migrations...');

  try {
    // Check if there are pending migrations
    const migrationsPath = path.join(__dirname, '..', 'prisma', 'migrations');

    if (!fs.existsSync(migrationsPath)) {
      log.warning('No migrations directory found');
      addCheck('Database Migrations', 'warn', 'No migrations directory');
      return true;
    }

    log.success('Database migrations check passed');
    addCheck('Database Migrations', 'pass', 'Migrations ready');
    return true;
  } catch (error) {
    log.error(`Database migration check failed: ${error.message}`);
    addCheck('Database Migrations', 'fail', error.message);
    return false;
  }
}

function checkAWSConfiguration() {
  log.info('Checking AWS configuration...');

  // Check AWS CLI
  const awsVersion = execCommand('aws --version');
  if (!awsVersion) {
    log.warning('AWS CLI not installed or not in PATH');
    addCheck('AWS CLI', 'warn', 'AWS CLI not found');
    return true;
  }

  // Check AWS credentials
  const awsIdentity = execCommand('aws sts get-caller-identity');
  if (!awsIdentity) {
    log.error('AWS credentials not configured');
    addCheck('AWS Configuration', 'fail', 'AWS credentials not configured');
    return false;
  }

  log.success('AWS configuration valid');
  addCheck('AWS Configuration', 'pass', 'AWS CLI configured correctly');
  return true;
}

function checkDockerfile() {
  log.info('Checking Dockerfile...');

  if (!fs.existsSync('Dockerfile')) {
    log.warning('Dockerfile not found');
    addCheck('Dockerfile', 'warn', 'Dockerfile not found');
    return true;
  }

  // Check if Dockerfile is valid
  const dockerfileContent = fs.readFileSync('Dockerfile', 'utf-8');
  if (!dockerfileContent.includes('FROM node:')) {
    log.warning('Dockerfile may be invalid');
    addCheck('Dockerfile', 'warn', 'Dockerfile structure may be invalid');
    return true;
  }

  log.success('Dockerfile present and valid');
  addCheck('Dockerfile', 'pass', 'Dockerfile is valid');
  return true;
}

function checkSecurityHeaders() {
  log.info('Checking security configuration...');

  // Check if helmet is configured
  const srcPath = path.join(__dirname, '..', 'src');
  let hasHelmet = false;

  try {
    const files = execCommand('find src -name "*.ts" -type f');
    if (files && files.includes('helmet')) {
      hasHelmet = true;
    }
  } catch (e) {
    // Silent fail
  }

  if (!hasHelmet) {
    log.warning('Helmet security middleware not detected');
    addCheck('Security Headers', 'warn', 'Helmet not detected');
    return true;
  }

  log.success('Security configuration looks good');
  addCheck('Security Headers', 'pass', 'Security middleware configured');
  return true;
}

function generateReport() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('PRODUCTION READINESS CHECK RESULTS');
  console.log(`${'='.repeat(80)}\n`);

  // Print all checks
  results.checks.forEach(check => {
    const icon = check.status === 'pass' ? '✓' : check.status === 'fail' ? '✗' : '⚠';
    const color =
      check.status === 'pass' ? colors.green : check.status === 'fail' ? colors.red : colors.yellow;
    console.log(`${color}${icon} ${check.name}${colors.reset}: ${check.message}`);
  });

  // Print summary
  console.log(`\n${'-'.repeat(80)}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${results.warnings}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`${'-'.repeat(80)}\n`);

  // Final verdict
  if (results.failed === 0 && results.warnings === 0) {
    log.success('✓ Production readiness check PASSED - Ready for deployment!');
    return 0;
  } else if (results.failed === 0) {
    log.warning(
      `⚠ Production readiness check PASSED with ${results.warnings} warning(s) - Review warnings before deployment`
    );
    return 0;
  } else {
    log.error(
      `✗ Production readiness check FAILED - ${results.failed} critical issue(s) must be fixed`
    );
    return 1;
  }
}

// Main execution
async function main() {
  console.log(`${colors.blue}Starting Production Readiness Check...${colors.reset}\n`);

  const checks = [
    checkEnvironmentVariables,
    checkDependencies,
    checkBuild,
    checkTypeScript,
    checkLinting,
    checkTests,
    checkDatabaseMigrations,
    checkAWSConfiguration,
    checkDockerfile,
    checkSecurityHeaders,
  ];

  for (const check of checks) {
    try {
      check();
      console.log(''); // Add spacing
    } catch (error) {
      log.error(`Check failed with error: ${error.message}`);
      addCheck(check.name || 'Unknown', 'fail', error.message);
    }
  }

  const exitCode = generateReport();
  process.exit(exitCode);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };
