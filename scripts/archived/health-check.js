#!/usr/bin/env node

/**
 * Health Check Script for Hasivu Platform
 * Performs comprehensive health checks on deployed services
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const config = {
  timeout: 10000,
  retries: 3,
  retryDelay: 2000,
};

// Environment URLs
const environments = {
  development: {
    backend: process.env.DEV_API_BASE_URL || 'http://localhost:3000',
    frontend: process.env.DEV_WEB_BASE_URL || 'http://localhost:3001',
  },
  staging: {
    backend: process.env.STAGING_API_BASE_URL || 'https://staging-api.hasivu.com',
    frontend: process.env.STAGING_WEB_BASE_URL || 'https://staging.hasivu.com',
  },
  production: {
    backend: process.env.PRODUCTION_API_BASE_URL || 'https://api.hasivu.com',
    frontend: process.env.PRODUCTION_WEB_BASE_URL || 'https://hasivu.com',
  },
};

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

// Results tracking
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  checks: [],
};

function addCheck(service, endpoint, status, responseTime, message) {
  results.checks.push({ service, endpoint, status, responseTime, message });
  if (status === 'pass') results.passed++;
  else if (status === 'fail') results.failed++;
  else if (status === 'warn') results.warnings++;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(url, attempt = 1) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const startTime = Date.now();

    const req = client.get(
      url,
      {
        timeout: config.timeout,
        headers: {
          'User-Agent': 'Hasivu-HealthCheck/1.0',
        },
      },
      res => {
        const responseTime = Date.now() - startTime;
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({
              statusCode: res.statusCode,
              data: jsonData,
              responseTime,
              headers: res.headers,
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              data,
              responseTime,
              headers: res.headers,
            });
          }
        });
      }
    );

    req.on('error', error => {
      if (attempt < config.retries) {
        log.warning(`Request failed (attempt ${attempt}/${config.retries}), retrying...`);
        sleep(config.retryDelay).then(() => {
          makeRequest(url, attempt + 1)
            .then(resolve)
            .catch(reject);
        });
      } else {
        reject(error);
      }
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${config.timeout}ms`));
    });
  });
}

async function checkBackendHealth(env, baseUrl) {
  const endpoint = `${baseUrl}/health`;
  log.info(`Checking backend health: ${endpoint}`);

  try {
    const response = await makeRequest(endpoint);

    if (response.statusCode === 200) {
      const health = response.data;

      // Check response time
      if (response.responseTime > 3000) {
        log.warning(`Backend response time is high: ${response.responseTime}ms`);
        addCheck('Backend', '/health', 'warn', response.responseTime, 'High response time');
      } else {
        log.success(`Backend healthy - Response time: ${response.responseTime}ms`);
        addCheck('Backend', '/health', 'pass', response.responseTime, 'Service healthy');
      }

      // Check dependent services
      if (health.services) {
        // Database check
        if (health.services.database) {
          if (health.services.database.status === 'up') {
            log.success('Database connection healthy');
          } else {
            log.error(
              `Database connection failed: ${health.services.database.error || 'Unknown error'}`
            );
            addCheck('Database', 'connection', 'fail', null, health.services.database.error);
          }
        }

        // Redis check
        if (health.services.redis) {
          if (health.services.redis.status === 'up') {
            log.success('Redis connection healthy');
          } else {
            log.warning(
              `Redis connection failed: ${health.services.redis.error || 'Unknown error'}`
            );
            addCheck('Redis', 'connection', 'warn', null, health.services.redis.error);
          }
        }
      }

      return true;
    } else {
      log.error(`Backend health check failed with status ${response.statusCode}`);
      addCheck('Backend', '/health', 'fail', response.responseTime, `HTTP ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    log.error(`Backend health check failed: ${error.message}`);
    addCheck('Backend', '/health', 'fail', null, error.message);
    return false;
  }
}

async function checkFrontendHealth(env, baseUrl) {
  const endpoint = `${baseUrl}/api/health`;
  log.info(`Checking frontend health: ${endpoint}`);

  try {
    const response = await makeRequest(endpoint);

    if (response.statusCode === 200) {
      if (response.responseTime > 3000) {
        log.warning(`Frontend response time is high: ${response.responseTime}ms`);
        addCheck('Frontend', '/api/health', 'warn', response.responseTime, 'High response time');
      } else {
        log.success(`Frontend healthy - Response time: ${response.responseTime}ms`);
        addCheck('Frontend', '/api/health', 'pass', response.responseTime, 'Service healthy');
      }
      return true;
    } else {
      log.error(`Frontend health check failed with status ${response.statusCode}`);
      addCheck(
        'Frontend',
        '/api/health',
        'fail',
        response.responseTime,
        `HTTP ${response.statusCode}`
      );
      return false;
    }
  } catch (error) {
    log.error(`Frontend health check failed: ${error.message}`);
    addCheck('Frontend', '/api/health', 'fail', null, error.message);
    return false;
  }
}

async function checkAPIEndpoints(env, baseUrl) {
  log.info('Checking critical API endpoints...');

  const endpoints = [
    { path: '/api/v1/auth/health', name: 'Auth Service' },
    { path: '/api/v1/payments/health', name: 'Payment Service' },
    { path: '/api/v1/notifications/health', name: 'Notification Service' },
  ];

  let allHealthy = true;

  for (const endpoint of endpoints) {
    const url = `${baseUrl}${endpoint.path}`;
    try {
      const response = await makeRequest(url);
      if (response.statusCode === 200) {
        log.success(`${endpoint.name} is healthy`);
      } else {
        log.warning(`${endpoint.name} returned status ${response.statusCode}`);
        allHealthy = false;
      }
    } catch (error) {
      log.warning(`${endpoint.name} is not responding: ${error.message}`);
      allHealthy = false;
    }
  }

  return allHealthy;
}

function generateReport() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('HEALTH CHECK RESULTS');
  console.log(`${'='.repeat(80)}\n`);

  // Group checks by service
  const services = {};
  results.checks.forEach(check => {
    if (!services[check.service]) {
      services[check.service] = [];
    }
    services[check.service].push(check);
  });

  // Print checks by service
  Object.keys(services).forEach(service => {
    console.log(`\n${colors.blue}${service}${colors.reset}`);
    services[service].forEach(check => {
      const icon = check.status === 'pass' ? '✓' : check.status === 'fail' ? '✗' : '⚠';
      const color =
        check.status === 'pass'
          ? colors.green
          : check.status === 'fail'
            ? colors.red
            : colors.yellow;
      const timeStr = check.responseTime ? ` (${check.responseTime}ms)` : '';
      console.log(`  ${color}${icon} ${check.endpoint}${colors.reset}${timeStr}: ${check.message}`);
    });
  });

  // Print summary
  console.log(`\n${'-'.repeat(80)}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${results.warnings}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`${'-'.repeat(80)}\n`);

  // Final verdict
  if (results.failed === 0 && results.warnings === 0) {
    log.success('✓ All health checks PASSED');
    return 0;
  } else if (results.failed === 0) {
    log.warning(`⚠ Health checks PASSED with ${results.warnings} warning(s)`);
    return 0;
  } else {
    log.error(`✗ Health checks FAILED - ${results.failed} critical issue(s)`);
    return 1;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const envArg = args.find(arg => arg.startsWith('--env='));
  const env = envArg ? envArg.split('=')[1] : 'production';

  if (!environments[env]) {
    log.error(`Invalid environment: ${env}`);
    log.error('Valid environments: development, staging, production');
    process.exit(1);
  }

  console.log(
    `${colors.blue}Starting Health Check for ${env.toUpperCase()} environment...${colors.reset}\n`
  );

  const urls = environments[env];

  // Run health checks
  await checkBackendHealth(env, urls.backend);
  console.log(''); // Add spacing

  await checkFrontendHealth(env, urls.frontend);
  console.log(''); // Add spacing

  if (env === 'production' || env === 'staging') {
    await checkAPIEndpoints(env, urls.backend);
    console.log(''); // Add spacing
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

module.exports = { main, makeRequest };
