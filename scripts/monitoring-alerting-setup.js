#!/usr/bin/env node

/**
 * HASIVU Platform - Comprehensive Monitoring & Alerting Setup Script
 *
 * Production-ready monitoring infrastructure for HASIVU Platform
 * Sets up CloudWatch metrics, alarms, dashboards, and SNS notifications
 *
 * Usage:
 *   node scripts/monitoring-alerting-setup.js [environment] [options]
 *
 * Environments:
 *   dev         Development environment
 *   staging     Staging environment
 *   production  Production environment
 *
 * Options:
 *   --dry-run           Show what would be done without making changes
 *   --skip-metrics      Skip custom metrics setup
 *   --skip-alarms       Skip CloudWatch alarms setup
 *   --skip-dashboards   Skip CloudWatch dashboards setup
 *   --verbose, -v       Enable detailed logging
 *   --help, -h          Show this help message
 *
 * @author HASIVU Platform Team
 * @version 2.0.0
 */

const {
  CloudWatchClient,
  PutMetricAlarmCommand,
  PutDashboardCommand,
  DescribeAlarmsCommand,
} = require('@aws-sdk/client-cloudwatch');
const {
  SNSClient,
  CreateTopicCommand,
  SubscribeCommand,
  ListTopicsCommand,
} = require('@aws-sdk/client-sns');
const { LambdaClient, ListFunctionsCommand } = require('@aws-sdk/client-lambda');
const {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  PutRetentionPolicyCommand,
} = require('@aws-sdk/client-cloudwatch-logs');
const { RDSClient, DescribeDBInstancesCommand } = require('@aws-sdk/client-rds');
const { ElastiCacheClient, DescribeCacheClustersCommand } = require('@aws-sdk/client-elasticache');
const fs = require('fs').promises;
const path = require('path');

class MonitoringSetup {
  constructor(environment = 'dev', options = {}) {
    this.environment = environment;
    this.options = {
      dryRun: options.dryRun || false,
      skipMetrics: options.skipMetrics || false,
      skipAlarms: options.skipAlarms || false,
      skipDashboards: options.skipDashboards || false,
      verbose: options.verbose || false,
    };

    // AWS Region configuration
    this.region = process.env.AWS_REGION || 'ap-south-1';

    // Initialize AWS clients
    this.cloudwatch = new CloudWatchClient({ region: this.region });
    this.sns = new SNSClient({ region: this.region });
    this.lambda = new LambdaClient({ region: this.region });
    this.logs = new CloudWatchLogsClient({ region: this.region });
    this.rds = new RDSClient({ region: this.region });
    this.elasticache = new ElastiCacheClient({ region: this.region });

    // Configuration
    this.stackName = `${environment}-hasivu-platform`;
    this.accountId = process.env.AWS_ACCOUNT_ID;

    // Results tracking
    this.results = {
      configuredComponents: 0,
      totalComponents: 0,
      recommendations: [],
      errors: [],
      warnings: [],
    };
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      console.log(`📊 Initializing Monitoring & Alerting for ${this.environment} environment`);
      console.log(`🌍 AWS Region: ${this.region}`);

      if (this.options.dryRun) {
        console.log('🔍 Running in DRY RUN mode - no changes will be made');
      }

      // Step 1: Analyze current infrastructure
      await this.analyzeInfrastructure();

      // Step 2: Setup SNS topics for notifications
      if (!this.options.skipAlarms) {
        await this.setupSNSTopics();
      }

      // Step 3: Setup CloudWatch alarms
      if (!this.options.skipAlarms) {
        await this.setupCloudWatchAlarms();
      }

      // Step 4: Setup CloudWatch dashboards
      if (!this.options.skipDashboards) {
        await this.setupCloudWatchDashboards();
      }

      // Step 5: Setup log monitoring
      await this.setupLogMonitoring();

      // Step 6: Setup custom metrics (if not skipped)
      if (!this.options.skipMetrics) {
        await this.setupCustomMetrics();
      }

      // Step 7: Generate report
      await this.generateReport();

      console.log(`\n✨ Monitoring setup completed for ${this.environment} environment`);
    } catch (error) {
      console.error(`💥 Monitoring setup failed: ${error.message}`);
      this.results.errors.push(error.message);
      throw error;
    }
  }

  /**
   * Analyze current AWS infrastructure
   */
  async analyzeInfrastructure() {
    console.log('\n🔍 Analyzing AWS infrastructure...');

    try {
      // Check Lambda functions
      const lambdaResponse = await this.lambda.send(new ListFunctionsCommand({}));
      const hasivuFunctions = lambdaResponse.Functions.filter(
        func => func.FunctionName.includes('hasivu') && func.FunctionName.includes(this.environment)
      );

      console.log(`✅ Found ${hasivuFunctions.length} HASIVU Lambda functions`);

      // Check RDS instances
      const rdsResponse = await this.rds.send(new DescribeDBInstancesCommand({}));
      const hasivuDBs = rdsResponse.DBInstances.filter(
        db =>
          db.DBInstanceIdentifier.includes('hasivu') &&
          db.DBInstanceIdentifier.includes(this.environment)
      );

      console.log(`✅ Found ${hasivuDBs.length} HASIVU RDS instances`);

      // Check ElastiCache clusters
      const cacheResponse = await this.elasticache.send(new DescribeCacheClustersCommand({}));
      const hasivuCaches = cacheResponse.CacheClusters.filter(
        cluster =>
          cluster.CacheClusterId.includes('hasivu') &&
          cluster.CacheClusterId.includes(this.environment)
      );

      console.log(`✅ Found ${hasivuCaches.length} HASIVU ElastiCache clusters`);

      // Store for later use
      this.infrastructure = {
        lambdaFunctions: hasivuFunctions,
        rdsInstances: hasivuDBs,
        cacheClusters: hasivuCaches,
      };
    } catch (error) {
      console.warn(`⚠️  Infrastructure analysis failed: ${error.message}`);
      this.results.warnings.push(`Infrastructure analysis failed: ${error.message}`);
    }
  }

  /**
   * Setup SNS topics for notifications
   */
  async setupSNSTopics() {
    console.log('\n📢 Setting up SNS notification topics...');

    const topics = [
      {
        name: `${this.environment}-hasivu-critical-alerts`,
        displayName: 'HASIVU Critical Alerts',
        description: 'Critical system alerts requiring immediate attention',
      },
      {
        name: `${this.environment}-hasivu-warning-alerts`,
        displayName: 'HASIVU Warning Alerts',
        description: 'Warning alerts for system issues',
      },
      {
        name: `${this.environment}-hasivu-security-alerts`,
        displayName: 'HASIVU Security Alerts',
        description: 'Security-related alerts and violations',
      },
      {
        name: `${this.environment}-hasivu-backup-notifications`,
        displayName: 'HASIVU Backup Notifications',
        description: 'Backup and disaster recovery notifications',
      },
    ];

    let createdTopics = 0;

    for (const topic of topics) {
      try {
        if (this.options.dryRun) {
          console.log(`📝 [DRY RUN] Would create SNS topic: ${topic.name}`);
          continue;
        }

        // Check if topic already exists
        const existingTopics = await this.sns.send(new ListTopicsCommand({}));
        const topicExists = existingTopics.Topics.some(t => t.TopicArn.includes(topic.name));

        if (topicExists) {
          console.log(`✅ SNS topic already exists: ${topic.name}`);
          continue;
        }

        // Create topic
        const createResponse = await this.sns.send(
          new CreateTopicCommand({
            Name: topic.name,
            Attributes: {
              DisplayName: topic.displayName,
              DeliveryPolicy: JSON.stringify({
                healthyRetryPolicy: {
                  numRetries: 3,
                  numNoDelayRetries: 0,
                  minDelayTarget: 20,
                  maxDelayTarget: 600,
                  numMinDelayRetries: 0,
                  numMaxDelayRetries: 0,
                  backoffFunction: 'exponential',
                },
              }),
            },
          })
        );

        console.log(`✅ Created SNS topic: ${topic.name}`);
        createdTopics++;

        // Add recommendation for email subscription
        this.results.recommendations.push(
          `Configure email subscriptions for SNS topic: ${topic.name}`
        );
      } catch (error) {
        console.warn(`⚠️  Failed to create SNS topic ${topic.name}: ${error.message}`);
        this.results.errors.push(`SNS topic creation failed: ${topic.name} - ${error.message}`);
      }
    }

    this.results.configuredComponents += createdTopics;
    this.results.totalComponents += topics.length;

    console.log(
      `📊 SNS topics: ${createdTopics} created, ${topics.length - createdTopics} already existed`
    );
  }

  /**
   * Setup CloudWatch alarms
   */
  async setupCloudWatchAlarms() {
    console.log('\n🚨 Setting up CloudWatch alarms...');

    const alarms = this.getAlarmConfigurations();
    let createdAlarms = 0;
    let existingAlarms = 0;

    for (const alarm of alarms) {
      try {
        if (this.options.dryRun) {
          console.log(`📝 [DRY RUN] Would create alarm: ${alarm.name}`);
          continue;
        }

        // Check if alarm already exists
        const existing = await this.cloudwatch.send(
          new DescribeAlarmsCommand({
            AlarmNames: [alarm.name],
          })
        );

        if (existing.MetricAlarms && existing.MetricAlarms.length > 0) {
          console.log(`✅ Alarm already exists: ${alarm.name}`);
          existingAlarms++;
          continue;
        }

        // Create alarm
        await this.cloudwatch.send(new PutMetricAlarmCommand(alarm));
        console.log(`✅ Created alarm: ${alarm.name}`);
        createdAlarms++;
      } catch (error) {
        console.warn(`⚠️  Failed to create alarm ${alarm.name}: ${error.message}`);
        this.results.errors.push(`Alarm creation failed: ${alarm.name} - ${error.message}`);
      }
    }

    this.results.configuredComponents += createdAlarms;
    this.results.totalComponents += alarms.length;

    console.log(
      `📊 CloudWatch alarms: ${createdAlarms} created, ${existingAlarms} already existed`
    );
  }

  /**
   * Get alarm configurations
   */
  getAlarmConfigurations() {
    const alarms = [];

    // Lambda function errors
    if (this.infrastructure?.lambdaFunctions?.length > 0) {
      this.infrastructure.lambdaFunctions.slice(0, 3).forEach(func => {
        const functionName = func.FunctionName;

        alarms.push({
          AlarmName: `${this.environment}-hasivu-lambda-errors-${functionName.split('-').pop()}`,
          AlarmDescription: `Lambda function errors for ${functionName}`,
          MetricName: 'Errors',
          Namespace: 'AWS/Lambda',
          Statistic: 'Sum',
          Dimensions: [{ Name: 'FunctionName', Value: functionName }],
          Period: 300,
          EvaluationPeriods: 2,
          Threshold: 5,
          ComparisonOperator: 'GreaterThanThreshold',
          AlarmActions: [
            `arn:aws:sns:${this.region}:${this.accountId}:${this.environment}-hasivu-warning-alerts`,
          ],
        });
      });
    }

    // Database CPU utilization
    if (this.infrastructure?.rdsInstances?.length > 0) {
      this.infrastructure.rdsInstances.forEach(db => {
        alarms.push({
          AlarmName: `${this.environment}-hasivu-db-cpu-high-${db.DBInstanceIdentifier}`,
          AlarmDescription: `High CPU utilization for database ${db.DBInstanceIdentifier}`,
          MetricName: 'CPUUtilization',
          Namespace: 'AWS/RDS',
          Statistic: 'Average',
          Dimensions: [{ Name: 'DBInstanceIdentifier', Value: db.DBInstanceIdentifier }],
          Period: 300,
          EvaluationPeriods: 2,
          Threshold: 80,
          ComparisonOperator: 'GreaterThanThreshold',
          AlarmActions: [
            `arn:aws:sns:${this.region}:${this.accountId}:${this.environment}-hasivu-warning-alerts`,
          ],
        });
      });
    }

    // API Gateway 5xx errors
    alarms.push({
      AlarmName: `${this.environment}-hasivu-api-5xx-errors`,
      AlarmDescription: 'High rate of 5xx errors from API Gateway',
      MetricName: '5XXError',
      Namespace: 'AWS/ApiGateway',
      Statistic: 'Sum',
      Dimensions: [{ Name: 'ApiName', Value: `${this.environment}-hasivu-platform` }],
      Period: 300,
      EvaluationPeriods: 2,
      Threshold: 10,
      ComparisonOperator: 'GreaterThanThreshold',
      AlarmActions: [
        `arn:aws:sns:${this.region}:${this.accountId}:${this.environment}-hasivu-critical-alerts`,
      ],
    });

    // Lambda duration warnings
    if (this.infrastructure?.lambdaFunctions?.length > 0) {
      this.infrastructure.lambdaFunctions.slice(0, 2).forEach(func => {
        alarms.push({
          AlarmName: `${this.environment}-hasivu-lambda-duration-${func.FunctionName.split('-').pop()}`,
          AlarmDescription: `High execution duration for ${func.FunctionName}`,
          MetricName: 'Duration',
          Namespace: 'AWS/Lambda',
          Statistic: 'Average',
          Dimensions: [{ Name: 'FunctionName', Value: func.FunctionName }],
          Period: 300,
          EvaluationPeriods: 3,
          Threshold: 30000, // 30 seconds
          ComparisonOperator: 'GreaterThanThreshold',
          AlarmActions: [
            `arn:aws:sns:${this.region}:${this.accountId}:${this.environment}-hasivu-warning-alerts`,
          ],
        });
      });
    }

    return alarms;
  }

  /**
   * Setup CloudWatch dashboards
   */
  async setupCloudWatchDashboards() {
    console.log('\n📊 Setting up CloudWatch dashboards...');

    const dashboards = [
      {
        name: `${this.environment}-hasivu-overview`,
        body: this.getOverviewDashboard(),
      },
      {
        name: `${this.environment}-hasivu-performance`,
        body: this.getPerformanceDashboard(),
      },
      {
        name: `${this.environment}-hasivu-security`,
        body: this.getSecurityDashboard(),
      },
    ];

    let createdDashboards = 0;

    for (const dashboard of dashboards) {
      try {
        if (this.options.dryRun) {
          console.log(`📝 [DRY RUN] Would create dashboard: ${dashboard.name}`);
          continue;
        }

        await this.cloudwatch.send(
          new PutDashboardCommand({
            DashboardName: dashboard.name,
            DashboardBody: JSON.stringify(dashboard.body),
          })
        );

        console.log(`✅ Created dashboard: ${dashboard.name}`);
        createdDashboards++;
      } catch (error) {
        console.warn(`⚠️  Failed to create dashboard ${dashboard.name}: ${error.message}`);
        this.results.errors.push(`Dashboard creation failed: ${dashboard.name} - ${error.message}`);
      }
    }

    this.results.configuredComponents += createdDashboards;
    this.results.totalComponents += dashboards.length;

    console.log(`📊 CloudWatch dashboards: ${createdDashboards} created`);
  }

  /**
   * Get overview dashboard configuration
   */
  getOverviewDashboard() {
    return {
      widgets: [
        {
          type: 'metric',
          x: 0,
          y: 0,
          width: 12,
          height: 6,
          properties: {
            metrics: [
              [
                'AWS/Lambda',
                'Invocations',
                'FunctionName',
                `${this.environment}-hasivu-platform-api-login`,
              ],
              [
                'AWS/Lambda',
                'Errors',
                'FunctionName',
                `${this.environment}-hasivu-platform-api-login`,
              ],
            ],
            view: 'timeSeries',
            stacked: false,
            region: this.region,
            title: 'API Invocations & Errors',
            period: 300,
          },
        },
        {
          type: 'metric',
          x: 12,
          y: 0,
          width: 12,
          height: 6,
          properties: {
            metrics: [
              [
                'AWS/RDS',
                'CPUUtilization',
                'DBInstanceIdentifier',
                `${this.environment}-hasivu-postgres`,
              ],
              [
                'AWS/RDS',
                'DatabaseConnections',
                'DBInstanceIdentifier',
                `${this.environment}-hasivu-postgres`,
              ],
            ],
            view: 'timeSeries',
            stacked: false,
            region: this.region,
            title: 'Database Performance',
            period: 300,
          },
        },
      ],
    };
  }

  /**
   * Get performance dashboard configuration
   */
  getPerformanceDashboard() {
    return {
      widgets: [
        {
          type: 'metric',
          x: 0,
          y: 0,
          width: 24,
          height: 8,
          properties: {
            metrics: [
              [
                'AWS/Lambda',
                'Duration',
                'FunctionName',
                `${this.environment}-hasivu-platform-api-login`,
              ],
              [
                'AWS/Lambda',
                'Duration',
                'FunctionName',
                `${this.environment}-hasivu-platform-api-orders`,
              ],
            ],
            view: 'timeSeries',
            stacked: false,
            region: this.region,
            title: 'Lambda Function Duration',
            period: 300,
          },
        },
      ],
    };
  }

  /**
   * Get security dashboard configuration
   */
  getSecurityDashboard() {
    return {
      widgets: [
        {
          type: 'log',
          x: 0,
          y: 0,
          width: 24,
          height: 8,
          properties: {
            query: `fields @timestamp, @message | filter @message like /ERROR/ or @message like /WARN/ | sort @timestamp desc | limit 100`,
            region: this.region,
            title: 'Security Events & Errors',
            view: 'table',
          },
        },
      ],
    };
  }

  /**
   * Setup log monitoring
   */
  async setupLogMonitoring() {
    console.log('\n📝 Setting up log monitoring...');

    try {
      const logGroups = await this.logs.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: `/aws/lambda/${this.environment}-hasivu`,
        })
      );

      let configuredLogs = 0;

      for (const logGroup of logGroups.logGroups || []) {
        try {
          if (this.options.dryRun) {
            console.log(`📝 [DRY RUN] Would set retention for: ${logGroup.logGroupName}`);
            continue;
          }

          // Set retention policy to 30 days
          await this.logs.send(
            new PutRetentionPolicyCommand({
              logGroupName: logGroup.logGroupName,
              retentionInDays: 30,
            })
          );

          console.log(`✅ Set retention policy for ${logGroup.logGroupName}`);
          configuredLogs++;
        } catch (error) {
          console.warn(
            `⚠️  Failed to configure log group ${logGroup.logGroupName}: ${error.message}`
          );
        }
      }

      this.results.configuredComponents += configuredLogs;
      this.results.totalComponents += logGroups.logGroups?.length || 0;

      console.log(`📊 Log monitoring: ${configuredLogs} log groups configured`);
    } catch (error) {
      console.warn(`⚠️  Log monitoring setup failed: ${error.message}`);
      this.results.errors.push(`Log monitoring setup failed: ${error.message}`);
    }
  }

  /**
   * Setup custom metrics
   */
  async setupCustomMetrics() {
    console.log('\n📈 Setting up custom metrics...');

    // Custom metrics would be implemented here
    // For now, just log that this feature is planned
    console.log('ℹ️  Custom metrics setup - planned for future implementation');

    this.results.recommendations.push(
      'Implement custom application metrics (business KPIs, user engagement, etc.)'
    );
  }

  /**
   * Generate monitoring setup report
   */
  async generateReport() {
    const report = {
      environment: this.environment,
      timestamp: new Date().toISOString(),
      summary: {
        configuredComponents: this.results.configuredComponents,
        totalComponents: this.results.totalComponents,
        overallHealth: this.results.errors.length === 0 ? 'Healthy' : 'Needs Attention',
        totalRecommendations: this.results.recommendations.length,
      },
      results: this.results,
      dashboardUrls: [
        `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.environment}-hasivu-overview`,
        `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.environment}-hasivu-performance`,
        `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.environment}-hasivu-security`,
      ],
    };

    // Save report
    const reportPath = path.join(
      process.cwd(),
      `monitoring-report-${this.environment}-${Date.now()}.json`
    );
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📄 Monitoring report saved to: ${reportPath}`);
    console.log(
      `Components Configured: ${report.summary.configuredComponents}/${report.summary.totalComponents}`
    );
    console.log(`Overall Health: ${report.summary.overallHealth}`);

    if (report.summary.totalRecommendations > 0) {
      console.log(`⚠️  ${report.summary.totalRecommendations} recommendations require attention`);
    }

    console.log('\n📊 CloudWatch Dashboard URLs:');
    report.dashboardUrls.forEach(url => console.log(`   📊 ${url}`));
  }
}

// CLI Interface
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    environment: 'dev',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--skip-metrics':
        options.skipMetrics = true;
        break;
      case '--skip-alarms':
        options.skipAlarms = true;
        break;
      case '--skip-dashboards':
        options.skipDashboards = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        console.log(`
HASIVU Platform - Monitoring & Alerting Setup Script

Usage: node scripts/monitoring-alerting-setup.js [environment] [options]

Environments:
  dev         Development environment (default)
  staging     Staging environment
  production  Production environment

Options:
  --dry-run           Show what would be done without making changes
  --skip-metrics      Skip custom metrics setup
  --skip-alarms       Skip CloudWatch alarms setup
  --skip-dashboards   Skip CloudWatch dashboards setup
  --verbose, -v       Enable detailed logging
  --help, -h          Show this help message

Examples:
  node scripts/monitoring-alerting-setup.js dev
  node scripts/monitoring-alerting-setup.js production --dry-run
  node scripts/monitoring-alerting-setup.js staging --skip-metrics --verbose
        `);
        process.exit(0);
      default:
        if (!arg.startsWith('--') && !options.environmentSet) {
          options.environment = arg;
          options.environmentSet = true;
        }
        break;
    }
  }

  return options;
}

// Execute if called directly
if (require.main === module) {
  const options = parseArguments();
  const setup = new MonitoringSetup(options.environment, options);
  setup.run().catch(error => {
    console.error('💥 Monitoring setup failed:', error.message);
    process.exit(1);
  });
}

module.exports = { MonitoringSetup };
