#!/usr/bin/env node

/**
 * HASIVU Platform - Performance Setup Verification Script
 * Verifies that all database performance optimizations are properly implemented
 *
 * Usage: node scripts/verify-performance-setup.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PerformanceSetupVerifier {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
    this.basePath = process.cwd();
  }

  log(message, type = 'info') {
    const icons = {
      info: '📝',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      check: '🔍',
    };
    console.log(`${icons[type]} ${message}`);
  }

  // Check if required files exist
  checkRequiredFiles() {
    this.log('Checking required performance optimization files...', 'check');

    const requiredFiles = [
      'database/schema.sql',
      'database/performance-optimizations.sql',
      'lib/cache/redis-menu-cache.ts',
      'lib/database/optimized-menu-queries.ts',
      'lib/performance/menu-performance-monitor.ts',
      'src/app/api/menu/optimized/route.ts',
      'scripts/performance-load-test.js',
      'PERFORMANCE_DEPLOYMENT_GUIDE.md',
    ];

    let allFilesExist = true;

    requiredFiles.forEach(file => {
      const filePath = path.join(this.basePath, file);
      if (fs.existsSync(filePath)) {
        this.passed.push(`Required file exists: ${file}`);
      } else {
        this.errors.push(`Missing required file: ${file}`);
        allFilesExist = false;
      }
    });

    if (allFilesExist) {
      this.log('All required files present', 'success');
    }

    return allFilesExist;
  }

  // Check package.json dependencies
  checkDependencies() {
    this.log('Checking package.json dependencies...', 'check');

    try {
      const packagePath = path.join(this.basePath, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      const requiredDeps = {
        ioredis: 'Redis client for caching',
        pg: 'PostgreSQL client',
      };

      let allDepsPresent = true;

      Object.entries(requiredDeps).forEach(([dep, description]) => {
        if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
          this.passed.push(`Dependency found: ${dep} (${description})`);
        } else {
          this.errors.push(`Missing dependency: ${dep} - ${description}`);
          allDepsPresent = false;
        }
      });

      if (allDepsPresent) {
        this.log('All required dependencies present', 'success');
      }

      return allDepsPresent;
    } catch (error) {
      this.errors.push(`Could not read package.json: ${error.message}`);
      return false;
    }
  }

  // Check environment variables setup
  checkEnvironmentVariables() {
    this.log('Checking environment variables configuration...', 'check');

    try {
      const envFiles = ['.env.production', '.env.local', '.env'];
      let envFileFound = false;
      let envContent = '';

      for (const envFile of envFiles) {
        const envPath = path.join(this.basePath, envFile);
        if (fs.existsSync(envPath)) {
          envContent += `${fs.readFileSync(envPath, 'utf8')}\n`;
          envFileFound = true;
        }
      }

      if (!envFileFound) {
        this.warnings.push('No environment files found (.env, .env.local, .env.production)');
        return false;
      }

      const requiredEnvVars = ['DATABASE_URL', 'REDIS_URL', 'REDIS_HOST', 'NEXTAUTH_SECRET'];

      const missingVars = [];
      const presentVars = [];

      requiredEnvVars.forEach(envVar => {
        if (envContent.includes(`${envVar}=`) || process.env[envVar]) {
          presentVars.push(envVar);
        } else {
          missingVars.push(envVar);
        }
      });

      presentVars.forEach(v => this.passed.push(`Environment variable configured: ${v}`));
      missingVars.forEach(v => this.warnings.push(`Environment variable not found: ${v}`));

      if (missingVars.length === 0) {
        this.log('All environment variables configured', 'success');
        return true;
      } else {
        this.log(`Missing ${missingVars.length} environment variables`, 'warning');
        return false;
      }
    } catch (error) {
      this.errors.push(`Error checking environment variables: ${error.message}`);
      return false;
    }
  }

  // Check database schema content
  checkDatabaseSchema() {
    this.log('Verifying database schema content...', 'check');

    try {
      const schemaPath = path.join(this.basePath, 'database/schema.sql');
      if (!fs.existsSync(schemaPath)) {
        this.errors.push('Database schema file not found');
        return false;
      }

      const schemaContent = fs.readFileSync(schemaPath, 'utf8');

      const requiredTables = [
        'schools',
        'menu_categories',
        'menu_items',
        'dietary_types',
        'menu_item_dietary',
        'ingredients',
        'menu_item_ingredients',
        'age_groups',
        'menu_item_age_groups',
        'menu_availability',
      ];

      const requiredExtensions = ['uuid-ossp', 'pg_trgm', 'btree_gin'];

      let schemaValid = true;

      requiredTables.forEach(table => {
        if (
          schemaContent.includes(`CREATE TABLE ${table}`) ||
          schemaContent.includes(`CREATE TABLE IF NOT EXISTS ${table}`)
        ) {
          this.passed.push(`Table definition found: ${table}`);
        } else {
          this.errors.push(`Missing table definition: ${table}`);
          schemaValid = false;
        }
      });

      requiredExtensions.forEach(ext => {
        if (schemaContent.includes(`CREATE EXTENSION IF NOT EXISTS "${ext}"`)) {
          this.passed.push(`Extension definition found: ${ext}`);
        } else {
          this.warnings.push(`Missing extension definition: ${ext}`);
        }
      });

      // Check for full-text search setup
      if (schemaContent.includes('search_vector tsvector GENERATED ALWAYS AS')) {
        this.passed.push('Full-text search vector configured');
      } else {
        this.warnings.push('Full-text search vector not found in schema');
      }

      if (schemaValid) {
        this.log('Database schema validation passed', 'success');
      }

      return schemaValid;
    } catch (error) {
      this.errors.push(`Error validating database schema: ${error.message}`);
      return false;
    }
  }

  // Check performance optimizations content
  checkPerformanceOptimizations() {
    this.log('Verifying performance optimizations...', 'check');

    try {
      const perfPath = path.join(this.basePath, 'database/performance-optimizations.sql');
      if (!fs.existsSync(perfPath)) {
        this.errors.push('Performance optimizations file not found');
        return false;
      }

      const perfContent = fs.readFileSync(perfPath, 'utf8');

      const requiredIndexes = [
        'idx_menu_items_lunch_rush',
        'idx_menu_items_school_category_active',
        'idx_menu_items_price_range',
        'idx_menu_search_composite',
        'idx_search_vector_ranked',
        'idx_menu_name_fuzzy',
        'idx_allergen_safety_lookup',
        'idx_dietary_preference_lookup',
      ];

      const requiredMaterializedViews = ['mv_menu_stats', 'mv_lunch_menu'];

      const optimizationsValid = true;

      requiredIndexes.forEach(index => {
        if (perfContent.includes(index)) {
          this.passed.push(`Performance index found: ${index}`);
        } else {
          this.warnings.push(`Performance index not found: ${index}`);
        }
      });

      requiredMaterializedViews.forEach(view => {
        if (perfContent.includes(view)) {
          this.passed.push(`Materialized view found: ${view}`);
        } else {
          this.warnings.push(`Materialized view not found: ${view}`);
        }
      });

      // Check for performance monitoring table
      if (perfContent.includes('CREATE TABLE IF NOT EXISTS performance_logs')) {
        this.passed.push('Performance logging table configured');
      } else {
        this.warnings.push('Performance logging table not found');
      }

      this.log('Performance optimizations verified', 'success');
      return true;
    } catch (error) {
      this.errors.push(`Error validating performance optimizations: ${error.message}`);
      return false;
    }
  }

  // Check TypeScript/JavaScript code structure
  checkCodeImplementation() {
    this.log('Verifying code implementation...', 'check');

    const codeChecks = [
      {
        file: 'lib/cache/redis-menu-cache.ts',
        requiredContent: ['MenuCacheService', 'CACHE_KEYS', 'CACHE_TTL', 'menuCache'],
        description: 'Redis caching implementation',
      },
      {
        file: 'lib/database/optimized-menu-queries.ts',
        requiredContent: [
          'OptimizedMenuQueries',
          'executeQuery',
          'getSchoolMenu',
          'searchMenuItems',
        ],
        description: 'Optimized database queries',
      },
      {
        file: 'lib/performance/menu-performance-monitor.ts',
        requiredContent: [
          'MenuPerformanceMonitor',
          'PerformanceMetrics',
          'recordMetric',
          'performanceMonitor',
        ],
        description: 'Performance monitoring',
      },
      {
        file: 'src/app/api/menu/optimized/route.ts',
        requiredContent: [
          'export async function GET',
          'export async function POST',
          'optimizedMenuQueries',
          'menuCache',
        ],
        description: 'Optimized API routes',
      },
    ];

    let allCodeValid = true;

    codeChecks.forEach(check => {
      const filePath = path.join(this.basePath, check.file);

      if (!fs.existsSync(filePath)) {
        this.errors.push(`Code file missing: ${check.file}`);
        allCodeValid = false;
        return;
      }

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        let fileValid = true;

        check.requiredContent.forEach(requiredText => {
          if (content.includes(requiredText)) {
            this.passed.push(`Code check passed: ${check.file} contains ${requiredText}`);
          } else {
            this.warnings.push(`Code check failed: ${check.file} missing ${requiredText}`);
            fileValid = false;
          }
        });

        if (fileValid) {
          this.passed.push(`Code implementation valid: ${check.description}`);
        } else {
          allCodeValid = false;
        }
      } catch (error) {
        this.errors.push(`Error reading ${check.file}: ${error.message}`);
        allCodeValid = false;
      }
    });

    if (allCodeValid) {
      this.log('All code implementations verified', 'success');
    }

    return allCodeValid;
  }

  // Check if load testing script is ready
  checkLoadTestingSetup() {
    this.log('Verifying load testing setup...', 'check');

    try {
      const testPath = path.join(this.basePath, 'scripts/performance-load-test.js');
      if (!fs.existsSync(testPath)) {
        this.errors.push('Load testing script not found');
        return false;
      }

      const testContent = fs.readFileSync(testPath, 'utf8');

      const requiredFeatures = [
        'LoadTestRunner',
        'PerformanceTracker',
        'lunch-rush',
        'search-heavy',
        'mixed-load',
        'stress-test',
      ];

      let loadTestValid = true;

      requiredFeatures.forEach(feature => {
        if (testContent.includes(feature)) {
          this.passed.push(`Load test feature found: ${feature}`);
        } else {
          this.warnings.push(`Load test feature missing: ${feature}`);
          loadTestValid = false;
        }
      });

      // Check if script is executable
      try {
        fs.accessSync(testPath, fs.constants.X_OK);
        this.passed.push('Load test script is executable');
      } catch (error) {
        this.warnings.push(
          'Load test script may not be executable - run: chmod +x scripts/performance-load-test.js'
        );
      }

      if (loadTestValid) {
        this.log('Load testing setup verified', 'success');
      }

      return loadTestValid;
    } catch (error) {
      this.errors.push(`Error verifying load testing setup: ${error.message}`);
      return false;
    }
  }

  // Generate verification report
  generateReport() {
    console.log(`\n${'='.repeat(80)}`);
    console.log('📋 HASIVU PERFORMANCE SETUP VERIFICATION REPORT');
    console.log('='.repeat(80));

    console.log(`\n✅ PASSED CHECKS (${this.passed.length}):`);
    this.passed.forEach(item => console.log(`   • ${item}`));

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${this.warnings.length}):`);
      this.warnings.forEach(item => console.log(`   • ${item}`));
    }

    if (this.errors.length > 0) {
      console.log(`\n❌ ERRORS (${this.errors.length}):`);
      this.errors.forEach(item => console.log(`   • ${item}`));
    }

    console.log(`\n${'='.repeat(80)}`);

    const totalChecks = this.passed.length + this.warnings.length + this.errors.length;
    const successRate = totalChecks > 0 ? (this.passed.length / totalChecks) * 100 : 0;

    console.log(
      `📊 OVERALL SCORE: ${Math.round(successRate)}% (${this.passed.length}/${totalChecks} checks passed)`
    );

    if (this.errors.length === 0 && this.warnings.length <= 3) {
      console.log('✅ SETUP STATUS: READY FOR DEPLOYMENT');
      console.log('\n🚀 Next steps:');
      console.log(
        '   1. Deploy database optimizations: psql $DATABASE_URL -f database/performance-optimizations.sql'
      );
      console.log(
        '   2. Run load tests: node scripts/performance-load-test.js --scenario=lunch-rush'
      );
      console.log('   3. Deploy optimized API routes');
      console.log('   4. Monitor performance metrics');
    } else if (this.errors.length === 0) {
      console.log('⚠️  SETUP STATUS: READY WITH WARNINGS');
      console.log('\nRecommendation: Address warnings before production deployment');
    } else {
      console.log('❌ SETUP STATUS: NOT READY');
      console.log('\nCritical errors must be fixed before deployment');
    }

    console.log('\n📄 For detailed deployment instructions, see: PERFORMANCE_DEPLOYMENT_GUIDE.md');
    console.log('='.repeat(80));

    return {
      passed: this.passed.length,
      warnings: this.warnings.length,
      errors: this.errors.length,
      successRate,
      ready: this.errors.length === 0,
    };
  }

  // Run all verification checks
  async runAllChecks() {
    console.log('🔍 Starting HASIVU Performance Setup Verification...\n');

    const checks = [
      () => this.checkRequiredFiles(),
      () => this.checkDependencies(),
      () => this.checkEnvironmentVariables(),
      () => this.checkDatabaseSchema(),
      () => this.checkPerformanceOptimizations(),
      () => this.checkCodeImplementation(),
      () => this.checkLoadTestingSetup(),
    ];

    for (const check of checks) {
      try {
        await check();
      } catch (error) {
        this.errors.push(`Verification check failed: ${error.message}`);
      }
      console.log(''); // Add spacing between checks
    }

    return this.generateReport();
  }
}

// Main execution
async function main() {
  const verifier = new PerformanceSetupVerifier();
  const report = await verifier.runAllChecks();

  // Exit with appropriate code
  process.exit(report.ready ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
}

module.exports = { PerformanceSetupVerifier };
