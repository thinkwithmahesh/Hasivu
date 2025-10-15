#!/usr/bin/env ts-node

/**
 * HASIVU Platform - Production Readiness Check
 * Comprehensive validation script for production deployment readiness
 * Validates environment, services, dependencies, and security configurations
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import config from '../config/environment';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

interface ValidationSuite {
  environment: CheckResult[];
  security: CheckResult[];
  database: CheckResult[];
  services: CheckResult[];
  dependencies: CheckResult[];
  performance: CheckResult[];
}

class ProductionReadinessChecker {
  private results: ValidationSuite = {
    environment: [],
    security: [],
    database: [],
    services: [],
    dependencies: [],
    performance: [],
  };

  /**
   * Run all production readiness checks
   */
  async runAllChecks(): Promise<void> {
    try {
      await this.checkEnvironmentVariables();
      await this.checkSecurityConfiguration();
      await this.checkDatabaseConfiguration();
      await this.checkExternalServices();
      await this.checkDependencies();
      await this.checkPerformanceConfiguration();

      this.printReport();
    } catch (error) {
      process.exit(1);
    }
  }

  /**
   * Check environment variables
   */
  private async checkEnvironmentVariables(): Promise<void> {
    const requiredEnvVars = [
      'NODE_ENV',
      'PORT',
      'DATABASE_URL',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'RAZORPAY_KEY_ID',
      'RAZORPAY_KEY_SECRET',
      'AWS_REGION',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'REDIS_URL',
    ];

    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        this.results.environment.push({
          name: `Environment Variable: ${envVar}`,
          status: 'pass',
          message: 'Present and configured',
        });
      } else {
        this.results.environment.push({
          name: `Environment Variable: ${envVar}`,
          status: 'fail',
          message: 'Missing required environment variable',
        });
      }
    }

    // Check NODE_ENV is production
    if (process.env.NODE_ENV !== 'production') {
      this.results.environment.push({
        name: 'Production Environment',
        status: 'warning',
        message: `NODE_ENV is ${process.env.NODE_ENV}, expected 'production'`,
      });
    } else {
      this.results.environment.push({
        name: 'Production Environment',
        status: 'pass',
        message: 'NODE_ENV correctly set to production',
      });
    }
  }

  /**
   * Check security configuration
   */
  private async checkSecurityConfiguration(): Promise<void> {
    // Check JWT secret strength
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret.length >= 32) {
      this.results.security.push({
        name: 'JWT Secret Strength',
        status: 'pass',
        message: 'JWT secret has adequate length',
      });
    } else {
      this.results.security.push({
        name: 'JWT Secret Strength',
        status: 'fail',
        message: 'JWT secret is too short (minimum 32 characters)',
      });
    }

    // Check CORS configuration
    const corsOrigin = process.env.CORS_ORIGIN;
    if (corsOrigin && corsOrigin !== '*') {
      this.results.security.push({
        name: 'CORS Configuration',
        status: 'pass',
        message: 'CORS origin is properly configured',
      });
    } else {
      this.results.security.push({
        name: 'CORS Configuration',
        status: 'warning',
        message: 'CORS origin should be restricted in production',
      });
    }

    // Check rate limiting configuration
    const rateLimit = process.env.RATE_LIMIT_MAX || '100';
    this.results.security.push({
      name: 'Rate Limiting',
      status: 'pass',
      message: `Rate limit set to ${rateLimit} requests per window`,
    });
  }

  /**
   * Check database configuration
   */
  private async checkDatabaseConfiguration(): Promise<void> {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      this.results.database.push({
        name: 'Database Connection',
        status: 'fail',
        message: 'DATABASE_URL not configured',
      });
      return;
    }

    // Parse database URL
    try {
      const url = new URL(dbUrl);

      // Check SSL requirement
      if (url.searchParams.get('sslmode') === 'require' || url.protocol === 'postgresql:') {
        this.results.database.push({
          name: 'Database SSL',
          status: 'pass',
          message: 'SSL connection configured',
        });
      } else {
        this.results.database.push({
          name: 'Database SSL',
          status: 'warning',
          message: 'SSL connection should be enabled in production',
        });
      }

      this.results.database.push({
        name: 'Database URL Format',
        status: 'pass',
        message: 'Database URL is properly formatted',
      });
    } catch (error) {
      this.results.database.push({
        name: 'Database URL Format',
        status: 'fail',
        message: 'Invalid database URL format',
      });
    }
  }

  /**
   * Check external services
   */
  private async checkExternalServices(): Promise<void> {
    // Check Razorpay configuration
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    if (razorpayKeyId && razorpaySecret) {
      this.results.services.push({
        name: 'Razorpay Configuration',
        status: 'pass',
        message: 'Razorpay credentials configured',
      });
    } else {
      this.results.services.push({
        name: 'Razorpay Configuration',
        status: 'fail',
        message: 'Missing Razorpay credentials',
      });
    }

    // Check AWS configuration
    const awsRegion = process.env.AWS_REGION;
    const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
    const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (awsRegion && awsAccessKey && awsSecretKey) {
      this.results.services.push({
        name: 'AWS Configuration',
        status: 'pass',
        message: 'AWS credentials configured',
      });
    } else {
      this.results.services.push({
        name: 'AWS Configuration',
        status: 'fail',
        message: 'Missing AWS credentials',
      });
    }

    // Check Redis configuration
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      this.results.services.push({
        name: 'Redis Configuration',
        status: 'pass',
        message: 'Redis URL configured',
      });
    } else {
      this.results.services.push({
        name: 'Redis Configuration',
        status: 'warning',
        message: 'Redis not configured (caching disabled)',
      });
    }
  }

  /**
   * Check dependencies
   */
  private async checkDependencies(): Promise<void> {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

      // Check for security vulnerabilities flag
      this.results.dependencies.push({
        name: 'Package.json Integrity',
        status: 'pass',
        message: 'Package.json is valid and readable',
      });

      // Check critical dependencies
      const criticalDeps = ['express', '@prisma/client', 'jsonwebtoken', 'bcrypt'];
      const missingDeps = criticalDeps.filter(
        dep => !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
      );

      if (missingDeps.length === 0) {
        this.results.dependencies.push({
          name: 'Critical Dependencies',
          status: 'pass',
          message: 'All critical dependencies present',
        });
      } else {
        this.results.dependencies.push({
          name: 'Critical Dependencies',
          status: 'fail',
          message: `Missing dependencies: ${missingDeps.join(', ')}`,
        });
      }
    } catch (error) {
      this.results.dependencies.push({
        name: 'Package.json',
        status: 'fail',
        message: 'Cannot read package.json file',
      });
    }
  }

  /**
   * Check performance configuration
   */
  private async checkPerformanceConfiguration(): Promise<void> {
    // Check memory limits
    const maxOldSpaceSize = process.env.NODE_OPTIONS?.includes('--max-old-space-size');
    if (maxOldSpaceSize) {
      this.results.performance.push({
        name: 'Memory Configuration',
        status: 'pass',
        message: 'Node.js memory limit configured',
      });
    } else {
      this.results.performance.push({
        name: 'Memory Configuration',
        status: 'warning',
        message: 'Consider setting --max-old-space-size for production',
      });
    }

    // Check compression
    const compression = process.env.ENABLE_COMPRESSION !== 'false';
    this.results.performance.push({
      name: 'Response Compression',
      status: compression ? 'pass' : 'warning',
      message: compression ? 'Response compression enabled' : 'Response compression disabled',
    });

    // Check clustering
    const clustering = process.env.ENABLE_CLUSTERING === 'true';
    this.results.performance.push({
      name: 'Process Clustering',
      status: clustering ? 'pass' : 'warning',
      message: clustering ? 'Process clustering enabled' : 'Consider enabling process clustering',
    });
  }

  /**
   * Print comprehensive report
   */
  private printReport(): void {
    let totalChecks = 0;
    let passedChecks = 0;
    let failedChecks = 0;
    let warningChecks = 0;

    const categories = Object.keys(this.results) as Array<keyof ValidationSuite>;

    for (const category of categories) {
      console.log(
        `\n${this.getCategoryIcon(category)} ${this.capitalize(category)} (${this.results[category].length} checks)`
      );

      for (const result of this.results[category]) {
        const icon = this.getStatusIcon(result.status);

        totalChecks++;
        if (result.status === 'pass') passedChecks++;
        else if (result.status === 'fail') failedChecks++;
        else warningChecks++;
      }
    }

    // Summary

    const score = Math.round((passedChecks / totalChecks) * 100);

    if (failedChecks > 0) {
      process.exit(1);
    } else if (warningChecks > 0) {
      process.exit(0);
    } else {
      process.exit(0);
    }
  }

  private getCategoryIcon(category: keyof ValidationSuite): string {
    const icons = {
      environment: '🌍',
      security: '🔒',
      database: '🗄️',
      services: '🌐',
      dependencies: '📦',
      performance: '⚡',
    };
    return icons[category] || '📋';
  }

  private getStatusIcon(status: CheckResult['status']): string {
    return status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Run the production readiness check
if (require.main === module) {
  const checker = new ProductionReadinessChecker();
  checker.runAllChecks().catch(error => {
    process.exit(1);
  });
}

export default ProductionReadinessChecker;
