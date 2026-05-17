#!/usr/bin/env node

/**
 * HASIVU Platform - Lambda URL Configuration Script
 *
 * This script automatically configures Lambda function URLs in environment variables
 * after serverless deployment. It reads the CloudFormation stack outputs and
 * generates proper .env files for both development and production environments.
 *
 * Usage:
 *   node scripts/configure-lambda-urls.js [stage] [--dry-run] [--verify-endpoints]
 *
 * Examples:
 *   node scripts/configure-lambda-urls.js dev
 *   node scripts/configure-lambda-urls.js production --verify-endpoints
 *   node scripts/configure-lambda-urls.js staging --dry-run
 *
 * @author HASIVU Platform Team
 * @version 1.0.0
 */

const {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStackResourcesCommand,
} = require('@aws-sdk/client-cloudformation');
const {
  LambdaClient,
  ListFunctionsCommand,
  GetFunctionCommand,
} = require('@aws-sdk/client-lambda');
const {
  APIGatewayClient,
  GetRestApisCommand,
  GetResourcesCommand,
  GetMethodCommand,
} = require('@aws-sdk/client-api-gateway');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// Configuration
const CONFIG = {
  AWS_REGION: process.env.AWS_REGION || 'ap-south-1',
  PROJECT_NAME: 'hasivu-platform',
  ENVIRONMENTS: {
    dev: {
      stackName: 'hasivu-platform-dev',
      envFile: '.env.local',
      domain: 'dev-api.hasivu.com',
    },
    staging: {
      stackName: 'hasivu-platform-staging',
      envFile: '.env.staging',
      domain: 'staging-api.hasivu.com',
    },
    production: {
      stackName: 'hasivu-platform-production',
      envFile: '.env.production.local',
      domain: 'api.hasivu.com',
    },
  },
  LAMBDA_FUNCTIONS: {
    // Authentication Functions
    'auth-login': 'LAMBDA_AUTH_LOGIN_URL',
    'auth-register': 'LAMBDA_AUTH_REGISTER_URL',
    'auth-verify-email': 'LAMBDA_AUTH_VERIFY_EMAIL_URL',
    'auth-refresh-token': 'LAMBDA_AUTH_REFRESH_URL',
    'auth-logout': 'LAMBDA_AUTH_LOGOUT_URL',

    // User Management Functions
    'users-list': 'LAMBDA_USERS_LIST_URL',
    'users-get': 'LAMBDA_USERS_GET_URL',
    'users-update': 'LAMBDA_USERS_UPDATE_URL',
    'users-bulk-import': 'LAMBDA_USERS_BULK_IMPORT_URL',
    'users-manage-children': 'LAMBDA_USERS_MANAGE_CHILDREN_URL',

    // Order Functions
    'orders-create': 'LAMBDA_ORDERS_CREATE_URL',
    'orders-get': 'LAMBDA_ORDERS_GET_URL',
    'orders-update': 'LAMBDA_ORDERS_UPDATE_URL',
    'orders-list': 'LAMBDA_ORDERS_LIST_URL',
    'orders-history': 'LAMBDA_ORDERS_HISTORY_URL',

    // Menu Functions
    'menus-create-plan': 'LAMBDA_MENUS_CREATE_PLAN_URL',
    'menus-get-plan': 'LAMBDA_MENUS_GET_PLAN_URL',
    'menus-update-plan': 'LAMBDA_MENUS_UPDATE_PLAN_URL',
    'menus-list-plans': 'LAMBDA_MENUS_LIST_PLANS_URL',
    'menus-approve': 'LAMBDA_MENUS_APPROVE_URL',
    'menus-daily': 'LAMBDA_MENUS_DAILY_URL',

    // Payment Functions
    'payments-create-order': 'LAMBDA_PAYMENTS_CREATE_ORDER_URL',
    'payments-verify': 'LAMBDA_PAYMENTS_VERIFY_URL',
    'payments-webhook': 'LAMBDA_PAYMENTS_WEBHOOK_URL',
    'payments-refund': 'LAMBDA_PAYMENTS_REFUND_URL',
    'payments-status': 'LAMBDA_PAYMENTS_STATUS_URL',
    'payments-manage-methods': 'LAMBDA_PAYMENTS_MANAGE_METHODS_URL',
    'payments-advanced': 'LAMBDA_PAYMENTS_ADVANCED_URL',
    'payments-retry': 'LAMBDA_PAYMENTS_RETRY_URL',
    'payments-reconciliation': 'LAMBDA_PAYMENTS_RECONCILIATION_URL',
    'payments-analytics': 'LAMBDA_PAYMENTS_ANALYTICS_URL',
    'payments-webhook-handler': 'LAMBDA_PAYMENTS_WEBHOOK_HANDLER_URL',

    // Subscription Functions
    'subscription-management': 'LAMBDA_SUBSCRIPTION_MANAGEMENT_URL',
    'billing-automation': 'LAMBDA_BILLING_AUTOMATION_URL',
    'subscription-plans': 'LAMBDA_SUBSCRIPTION_PLANS_URL',
    'dunning-management': 'LAMBDA_DUNNING_MANAGEMENT_URL',
    'subscription-analytics': 'LAMBDA_SUBSCRIPTION_ANALYTICS_URL',

    // Invoice Functions
    'invoice-generator': 'LAMBDA_INVOICE_GENERATOR_URL',
    'pdf-generator': 'LAMBDA_PDF_GENERATOR_URL',
    'invoice-templates': 'LAMBDA_INVOICE_TEMPLATES_URL',
    'invoice-mailer': 'LAMBDA_INVOICE_MAILER_URL',
    'invoice-analytics': 'LAMBDA_INVOICE_ANALYTICS_URL',

    // ML and Intelligence Functions
    'ml-payment-insights': 'LAMBDA_ML_PAYMENT_INSIGHTS_URL',
    'advanced-payment-intelligence': 'LAMBDA_ADVANCED_PAYMENT_INTELLIGENCE_URL',

    // RFID Functions
    'rfid-manage-readers': 'LAMBDA_RFID_MANAGE_READERS_URL',
    'rfid-verify-card': 'LAMBDA_RFID_VERIFY_CARD_URL',
    'rfid-bulk-import-cards': 'LAMBDA_RFID_BULK_IMPORT_CARDS_URL',
    'rfid-test-connection': 'LAMBDA_RFID_TEST_CONNECTION_URL',
    'rfid-card-registration': 'LAMBDA_RFID_CARD_REGISTRATION_URL',
    'rfid-delivery-verification': 'LAMBDA_RFID_DELIVERY_VERIFICATION_URL',
    'rfid-bulk-verification': 'LAMBDA_RFID_BULK_VERIFICATION_URL',
    'rfid-mobile-tracking': 'LAMBDA_RFID_MOBILE_TRACKING_URL',
    'rfid-parent-dashboard': 'LAMBDA_RFID_PARENT_DASHBOARD_URL',
    'rfid-delivery-history': 'LAMBDA_RFID_DELIVERY_HISTORY_URL',

    // Mobile Functions
    'mobile-parent-notifications': 'LAMBDA_MOBILE_PARENT_NOTIFICATIONS_URL',
    'mobile-delivery-tracking': 'LAMBDA_MOBILE_DELIVERY_TRACKING_URL',
    'mobile-device-registration': 'LAMBDA_MOBILE_DEVICE_REGISTRATION_URL',

    // Health and Monitoring Functions
    health: 'LAMBDA_HEALTH_URL',
    'monitoring-status': 'LAMBDA_MONITORING_STATUS_URL',
    'monitoring-dashboard': 'LAMBDA_MONITORING_DASHBOARD_URL',
    'monitoring-health': 'LAMBDA_MONITORING_HEALTH_URL',
    'monitoring-metrics': 'LAMBDA_MONITORING_METRICS_URL',
    'monitoring-performance': 'LAMBDA_MONITORING_PERFORMANCE_URL',
    'monitoring-business': 'LAMBDA_MONITORING_BUSINESS_URL',
    'monitoring-alerts': 'LAMBDA_MONITORING_ALERTS_URL',
    'monitoring-recommendations': 'LAMBDA_MONITORING_RECOMMENDATIONS_URL',
  },
};

class LambdaURLConfigurator {
  constructor(stage = 'dev', options = {}) {
    this.stage = stage;
    this.options = {
      dryRun: options.dryRun || false,
      verifyEndpoints: options.verifyEndpoints || false,
      verbose: options.verbose || false,
    };

    this.config = CONFIG.ENVIRONMENTS[stage];
    if (!this.config) {
      throw new Error(
        `Invalid stage: ${stage}. Valid stages: ${Object.keys(CONFIG.ENVIRONMENTS).join(', ')}`
      );
    }

    // Initialize AWS clients
    this.cloudFormationClient = new CloudFormationClient({ region: CONFIG.AWS_REGION });
    this.lambdaClient = new LambdaClient({ region: CONFIG.AWS_REGION });
    this.apiGatewayClient = new APIGatewayClient({ region: CONFIG.AWS_REGION });

    this.lambdaUrls = new Map();
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      console.log(`🚀 Configuring Lambda URLs for stage: ${this.stage}`);
      console.log(`📁 Target environment file: ${this.config.envFile}`);

      if (this.options.dryRun) {
        console.log('🔍 Running in DRY RUN mode - no files will be modified');
      }

      // Step 1: Verify CloudFormation stack exists
      await this.verifyStack();

      // Step 2: Get API Gateway information
      const apiGatewayInfo = await this.getApiGatewayInfo();

      // Step 3: Discover Lambda functions
      await this.discoverLambdaFunctions(apiGatewayInfo);

      // Step 4: Generate environment variables
      const envVars = this.generateEnvironmentVariables();

      // Step 5: Verify endpoints (if requested)
      if (this.options.verifyEndpoints) {
        await this.verifyEndpoints();
      }

      // Step 6: Update environment files
      await this.updateEnvironmentFiles(envVars);

      // Step 7: Generate summary report
      this.generateReport();

      console.log(`✅ Lambda URL configuration completed successfully!`);

      return {
        success: true,
        stage: this.stage,
        functionsConfigured: this.lambdaUrls.size,
        envFile: this.config.envFile,
        errors: this.errors,
        warnings: this.warnings,
      };
    } catch (error) {
      console.error(`❌ Configuration failed:`, error.message);
      this.errors.push(error.message);

      return {
        success: false,
        stage: this.stage,
        error: error.message,
        errors: this.errors,
        warnings: this.warnings,
      };
    }
  }

  /**
   * Verify that the CloudFormation stack exists
   */
  async verifyStack() {
    try {
      const command = new DescribeStacksCommand({
        StackName: this.config.stackName,
      });

      const response = await this.cloudFormationClient.send(command);
      const stack = response.Stacks[0];

      if (stack.StackStatus !== 'CREATE_COMPLETE' && stack.StackStatus !== 'UPDATE_COMPLETE') {
        throw new Error(
          `Stack ${this.config.stackName} is not in a stable state: ${stack.StackStatus}`
        );
      }

      console.log(`✅ CloudFormation stack verified: ${this.config.stackName}`);
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new Error(
          `CloudFormation stack not found: ${this.config.stackName}. Please deploy the stack first.`
        );
      }
      throw error;
    }
  }

  /**
   * Get API Gateway information from CloudFormation stack
   */
  async getApiGatewayInfo() {
    try {
      const command = new DescribeStacksCommand({
        StackName: this.config.stackName,
      });

      const response = await this.cloudFormationClient.send(command);
      const stack = response.Stacks[0];

      // Find API Gateway ID from outputs
      const apiGatewayIdOutput = stack.Outputs?.find(
        output => output.OutputKey === 'ApiGatewayRestApiId'
      );

      if (!apiGatewayIdOutput) {
        throw new Error('API Gateway ID not found in CloudFormation outputs');
      }

      const apiGatewayId = apiGatewayIdOutput.OutputValue;
      const baseUrl = `https://${apiGatewayId}.execute-api.${CONFIG.AWS_REGION}.amazonaws.com/${this.stage}`;

      console.log(`✅ API Gateway discovered: ${apiGatewayId}`);
      console.log(`🌐 Base URL: ${baseUrl}`);

      return {
        apiGatewayId,
        baseUrl,
        customDomain: this.config.domain ? `https://${this.config.domain}` : null,
      };
    } catch (error) {
      throw new Error(`Failed to get API Gateway info: ${error.message}`);
    }
  }

  /**
   * Discover Lambda functions from the serverless deployment
   */
  async discoverLambdaFunctions(apiGatewayInfo) {
    try {
      // Get all Lambda functions with the project prefix
      const command = new ListFunctionsCommand({});
      const response = await this.lambdaClient.send(command);

      const projectFunctions = response.Functions.filter(func =>
        func.FunctionName.startsWith(`${CONFIG.PROJECT_NAME}-${this.stage}-`)
      );

      console.log(`🔍 Found ${projectFunctions.length} Lambda functions for stage: ${this.stage}`);

      for (const func of projectFunctions) {
        const functionName = func.FunctionName;
        const shortName = functionName.replace(`${CONFIG.PROJECT_NAME}-${this.stage}-`, '');

        if (CONFIG.LAMBDA_FUNCTIONS[shortName]) {
          // For HTTP API functions, construct the URL
          const endpoint = this.constructLambdaEndpoint(shortName, apiGatewayInfo);
          this.lambdaUrls.set(CONFIG.LAMBDA_FUNCTIONS[shortName], endpoint);

          if (this.options.verbose) {
            console.log(`  📍 ${shortName} → ${endpoint}`);
          }
        } else {
          this.warnings.push(`Unknown function: ${shortName}`);
        }
      }

      console.log(`✅ Mapped ${this.lambdaUrls.size} Lambda function URLs`);
    } catch (error) {
      throw new Error(`Failed to discover Lambda functions: ${error.message}`);
    }
  }

  /**
   * Construct Lambda endpoint URL based on serverless configuration
   */
  constructLambdaEndpoint(functionName, apiGatewayInfo) {
    // Use custom domain if available, otherwise use API Gateway URL
    const baseUrl = apiGatewayInfo.customDomain || apiGatewayInfo.baseUrl;

    // Map function names to their HTTP paths based on serverless.yml
    const pathMapping = {
      // Authentication
      'auth-login': '/auth/login',
      'auth-register': '/auth/register',
      'auth-verify-email': '/auth/verify-email',
      'auth-refresh-token': '/auth/refresh',
      'auth-logout': '/auth/logout',

      // Users
      'users-list': '/api/v1/users',
      'users-get': '/api/v1/users/{id}',
      'users-update': '/api/v1/users/{id}',
      'users-bulk-import': '/api/v1/users/bulk-import',
      'users-manage-children': '/api/v1/users/{id}/children',

      // Orders
      'orders-create': '/orders',
      'orders-get': '/orders/{orderId}',
      'orders-update': '/orders/{orderId}',
      'orders-list': '/orders',
      'orders-history': '/orders/history/{userId}',

      // Menus
      'menus-create-plan': '/menus/plans',
      'menus-get-plan': '/menus/plans/{planId}',
      'menus-update-plan': '/menus/plans/{planId}',
      'menus-list-plans': '/menus/plans',
      'menus-approve': '/menus/approve/{planId}',
      'menus-daily': '/menus/daily',

      // Payments
      'payments-create-order': '/payments/orders',
      'payments-verify': '/payments/verify',
      'payments-webhook': '/payments/webhook',
      'payments-refund': '/payments/refund',
      'payments-status': '/payments/status/{orderId}',

      // Health
      health: '/health',
      'monitoring-status': '/status',
    };

    const path = pathMapping[functionName] || `/${functionName}`;
    return `${baseUrl}${path}`;
  }

  /**
   * Generate environment variables map
   */
  generateEnvironmentVariables() {
    const envVars = new Map();

    // Add Lambda URLs
    for (const [envVar, url] of this.lambdaUrls) {
      envVars.set(envVar, url);
    }

    // Add additional environment-specific variables
    if (this.stage === 'production') {
      envVars.set('LAMBDA_BASE_URL', `https://${this.config.domain}`);
      envVars.set('LAMBDA_STAGE', 'production');
    } else {
      envVars.set(
        'LAMBDA_BASE_URL',
        this.lambdaUrls.values().next().value?.split('/').slice(0, 3).join('/') || ''
      );
      envVars.set('LAMBDA_STAGE', this.stage);
    }

    // Add timestamp
    envVars.set('LAMBDA_CONFIG_UPDATED', new Date().toISOString());

    return envVars;
  }

  /**
   * Verify that endpoints are accessible
   */
  async verifyEndpoints() {
    console.log('🔍 Verifying endpoint accessibility...');

    const healthUrls = [
      this.lambdaUrls.get('LAMBDA_HEALTH_URL'),
      this.lambdaUrls.get('LAMBDA_MONITORING_STATUS_URL'),
    ].filter(Boolean);

    for (const url of healthUrls) {
      try {
        const isAccessible = await this.checkEndpoint(url);
        if (isAccessible) {
          console.log(`  ✅ ${url}`);
        } else {
          console.log(`  ⚠️  ${url} - Not accessible`);
          this.warnings.push(`Endpoint not accessible: ${url}`);
        }
      } catch (error) {
        console.log(`  ❌ ${url} - Error: ${error.message}`);
        this.warnings.push(`Endpoint verification failed: ${url} - ${error.message}`);
      }
    }
  }

  /**
   * Check if an endpoint is accessible
   */
  async checkEndpoint(url, timeout = 5000) {
    return new Promise(resolve => {
      const request = https.get(url, { timeout }, response => {
        resolve(response.statusCode < 500);
      });

      request.on('error', () => resolve(false));
      request.on('timeout', () => {
        request.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Update environment files with new Lambda URLs
   */
  async updateEnvironmentFiles(envVars) {
    const targets = [
      { file: this.config.envFile, isWeb: false },
      { file: `web/${this.config.envFile}`, isWeb: true },
    ];

    for (const target of targets) {
      await this.updateSingleEnvironmentFile(target.file, envVars, target.isWeb);
    }
  }

  /**
   * Update a single environment file
   */
  async updateSingleEnvironmentFile(filePath, envVars, isWebFile = false) {
    try {
      if (this.options.dryRun) {
        console.log(`📝 [DRY RUN] Would update: ${filePath}`);
        return;
      }

      const fullPath = path.resolve(filePath);

      // Read existing file or create new content
      let content = '';
      try {
        content = await fs.readFile(fullPath, 'utf8');
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
        console.log(`📄 Creating new file: ${filePath}`);
      }

      // Parse existing environment variables
      const existingVars = new Map();
      const lines = content.split('\n');

      for (const line of lines) {
        if (line.includes('=') && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          existingVars.set(key.trim(), valueParts.join('='));
        }
      }

      // Update Lambda URLs section
      const updatedLines = [];
      let inLambdaSection = false;
      let lambdaSectionFound = false;

      for (const line of lines) {
        if (
          line.includes('# Lambda Function URLs') ||
          (line.includes('LAMBDA_') && !inLambdaSection)
        ) {
          if (!lambdaSectionFound) {
            lambdaSectionFound = true;
            inLambdaSection = true;
            updatedLines.push('# Lambda Function URLs - Auto-generated');
            updatedLines.push(`# Updated: ${new Date().toISOString()}`);

            // Add all Lambda URLs
            for (const [key, value] of envVars) {
              if (key.startsWith('LAMBDA_')) {
                updatedLines.push(`${key}=${value}`);
              }
            }
            updatedLines.push('');
          }
          // Skip existing Lambda lines
          if (
            line.startsWith('LAMBDA_') ||
            line.includes('Lambda Function URLs') ||
            line.includes('Updated:')
          ) {
            continue;
          }
          inLambdaSection = false;
        } else if (inLambdaSection && line.startsWith('LAMBDA_')) {
          // Skip existing Lambda lines
          continue;
        } else if (inLambdaSection && line.trim() === '') {
          inLambdaSection = false;
          continue;
        } else if (!inLambdaSection) {
          updatedLines.push(line);
        }
      }

      // If no Lambda section found, add it at the end
      if (!lambdaSectionFound) {
        updatedLines.push('');
        updatedLines.push('# Lambda Function URLs - Auto-generated');
        updatedLines.push(`# Updated: ${new Date().toISOString()}`);

        for (const [key, value] of envVars) {
          if (key.startsWith('LAMBDA_')) {
            updatedLines.push(`${key}=${value}`);
          }
        }
      }

      // Write updated content
      const updatedContent = updatedLines.join('\n');
      await fs.writeFile(fullPath, updatedContent, 'utf8');

      console.log(`✅ Updated ${filePath} with ${envVars.size} Lambda URLs`);
    } catch (error) {
      this.errors.push(`Failed to update ${filePath}: ${error.message}`);
      console.error(`❌ Failed to update ${filePath}:`, error.message);
    }
  }

  /**
   * Generate summary report
   */
  generateReport() {
    console.log('\n📊 Configuration Summary:');
    console.log(`   Stage: ${this.stage}`);
    console.log(`   Functions configured: ${this.lambdaUrls.size}`);
    console.log(`   Environment file: ${this.config.envFile}`);

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${this.warnings.length}):`);
      this.warnings.forEach(warning => console.log(`   • ${warning}`));
    }

    if (this.errors.length > 0) {
      console.log(`\n❌ Errors (${this.errors.length}):`);
      this.errors.forEach(error => console.log(`   • ${error}`));
    }

    if (this.options.verbose) {
      console.log('\n🔗 Configured URLs:');
      for (const [envVar, url] of this.lambdaUrls) {
        console.log(`   ${envVar}: ${url}`);
      }
    }
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const stage = args[0] || 'dev';

  const options = {
    dryRun: args.includes('--dry-run'),
    verifyEndpoints: args.includes('--verify-endpoints'),
    verbose: args.includes('--verbose') || args.includes('-v'),
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
HASIVU Platform - Lambda URL Configuration Script

Usage: node scripts/configure-lambda-urls.js [stage] [options]

Stages:
  dev         Development environment (default)
  staging     Staging environment
  production  Production environment

Options:
  --dry-run           Show what would be done without making changes
  --verify-endpoints  Test endpoint accessibility after configuration
  --verbose, -v       Show detailed output
  --help, -h          Show this help message

Examples:
  node scripts/configure-lambda-urls.js dev
  node scripts/configure-lambda-urls.js production --verify-endpoints
  node scripts/configure-lambda-urls.js staging --dry-run --verbose
`);
    process.exit(0);
  }

  try {
    const configurator = new LambdaURLConfigurator(stage, options);
    const result = await configurator.run();

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('❌ Script execution failed:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { LambdaURLConfigurator, CONFIG };
