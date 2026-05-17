# CloudWatch Monitoring & Alerting System

**Infrastructure Reliability Expert - Comprehensive Monitoring Solution**

## Overview

The HASIVU Platform CloudWatch monitoring system provides comprehensive observability across all infrastructure components, business metrics, and security events. This system enables proactive issue detection, performance optimization, and cost management.

## Architecture

### Components

1. **CloudWatch Metrics** - Custom business and performance metrics
2. **CloudWatch Alarms** - Automated alerting for critical events
3. **CloudWatch Dashboards** - Real-time visualization
4. **CloudWatch Logs** - Centralized logging
5. **SNS Topics** - Alert notification delivery
6. **Metric Service** - Application-level metrics tracking

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- CloudFormation templates in `monitoring/` directory
- Environment variables configured

### Quick Start

```bash
# Deploy monitoring infrastructure
bash scripts/deploy-cloudwatch-monitoring.sh production

# Verify deployment
aws cloudwatch describe-alarms --region ap-south-1 | grep HASIVU
```

### Environment Variables

Add these to your `.env` file after deployment:

```env
# CloudWatch Configuration
CLOUDWATCH_METRICS_ENABLED=true
CLOUDWATCH_LOGS_ENABLED=true
AWS_REGION=ap-south-1

# SNS Topics (from CloudFormation outputs)
SNS_TOPIC_CRITICAL_ALERTS=arn:aws:sns:ap-south-1:ACCOUNT:production-hasivu-critical-alerts
SNS_TOPIC_WARNING_ALERTS=arn:aws:sns:ap-south-1:ACCOUNT:production-hasivu-warning-alerts
SNS_TOPIC_BUSINESS_ALERTS=arn:aws:sns:ap-south-1:ACCOUNT:production-hasivu-business-alerts
```

## Monitored Metrics

### Business Metrics (HASIVU/Business)

| Metric Name         | Description                   | Unit       | Dimensions                     |
| ------------------- | ----------------------------- | ---------- | ------------------------------ |
| TotalRevenue        | Revenue generated             | None (INR) | Environment, Period, Currency  |
| PaymentTransactions | Payment transaction count     | Count      | Environment, Status            |
| OrdersCreated       | New orders created            | Count      | Environment, SchoolId          |
| OrdersCompleted     | Orders successfully completed | Count      | Environment                    |
| OrdersCancelled     | Orders cancelled              | Count      | Environment, Reason            |
| ActiveUsers         | Currently active users        | Count      | Environment                    |
| RFIDOperations      | RFID operations performed     | Count      | Environment, Operation, Status |
| FailedVerifications | Failed RFID verifications     | Count      | Environment                    |
| SystemHealthScore   | Overall system health         | Percent    | Environment                    |
| PaymentSuccessRate  | Payment success rate          | Percent    | Environment, Gateway           |

### Performance Metrics (HASIVU/Application)

| Metric Name      | Description                | Unit         | Dimensions           |
| ---------------- | -------------------------- | ------------ | -------------------- |
| ApiResponseTime  | API endpoint response time | Milliseconds | Endpoint, Method     |
| ApiErrorRate     | API error rate             | Percent      | Endpoint, StatusCode |
| LambdaDuration   | Lambda execution duration  | Milliseconds | FunctionName         |
| LambdaColdStarts | Lambda cold starts         | Count        | FunctionName         |
| SlowApiRequests  | API requests > 1s          | Count        | Endpoint             |

### Database Metrics (HASIVU/Database)

| Metric Name               | Description                | Unit         | Dimensions  |
| ------------------------- | -------------------------- | ------------ | ----------- |
| DatabaseQueryDuration     | Query execution time       | Milliseconds | QueryType   |
| SlowQueries               | Queries > 1s               | Count        | QueryType   |
| DeadlockCount             | Database deadlocks         | Count        | Environment |
| FailedConnections         | Failed connection attempts | Count        | Environment |
| TransactionRollbacks      | Transaction rollbacks      | Count        | Environment |
| ConnectionPoolUtilization | Connection pool usage      | Percent      | Environment |

### Security Metrics (HASIVU/Security)

| Metric Name                | Description                  | Unit  | Dimensions             |
| -------------------------- | ---------------------------- | ----- | ---------------------- |
| FailedLoginAttempts        | Failed authentication        | Count | Environment            |
| SuspiciousActivity         | Suspicious activity detected | Count | Environment, EventType |
| PaymentFraudAttempts       | Fraud attempts               | Count | Environment            |
| UnauthorizedAccessAttempts | Unauthorized access          | Count | Environment            |
| SecurityEvents             | All security events          | Count | Environment, EventType |

### Cost Metrics (HASIVU/Cost)

| Metric Name             | Description                | Unit       | Dimensions          |
| ----------------------- | -------------------------- | ---------- | ------------------- |
| EstimatedLambdaCost     | Estimated Lambda cost      | None (USD) | Environment, Period |
| EstimatedRDSCost        | Estimated RDS cost         | None (USD) | Environment, Period |
| EstimatedAPIGatewayCost | Estimated API Gateway cost | None (USD) | Environment, Period |
| EstimatedS3Cost         | Estimated S3 cost          | None (USD) | Environment, Period |
| CostPerTransaction      | Cost per transaction       | None (USD) | Environment         |
| RevenuePerTransaction   | Revenue per transaction    | None (INR) | Environment         |

## CloudWatch Alarms

### Critical Alarms (Immediate Action)

1. **Payment System Errors** - Threshold: 10 errors in 5 minutes
2. **API High Error Rate** - Threshold: 5% error rate
3. **Database Low Storage** - Threshold: < 2GB free space
4. **Health Check Failure** - Threshold: Any failure
5. **System Health Low** - Threshold: Score < 75%
6. **Payment Fraud Attempt** - Threshold: Any occurrence
7. **Database High CPU** - Threshold: > 85% for 10 minutes

### Warning Alarms (Review Within Hours)

1. **API High Latency** - Threshold: > 5s average latency
2. **Lambda High Duration** - Threshold: > 10s execution time
3. **Database High Connections** - Threshold: > 80% capacity
4. **High Lambda Costs** - Threshold: > $100/day

### Business Alarms (Business Impact)

1. **High Payment Failure Rate** - Threshold: > 5% failure rate
2. **High RFID Failure Rate** - Threshold: > 10 failures in 5 minutes

### Composite Alarms

1. **Payment System Health** - Combines payment-related alarms
2. **System-Wide Health** - Overall system health status

## CloudWatch Dashboards

### 1. Executive Overview Dashboard

**Purpose**: High-level business and system health

**Widgets**:

- Revenue, transactions, orders, active users (24h)
- Payment system health trends
- Success vs failure rates
- Health scores (system, user satisfaction, payment)

**URL Pattern**:

```
https://console.aws.amazon.com/cloudwatch/home?region=ap-south-1#dashboards:name=production-HASIVU-Executive-Overview
```

### 2. Lambda Performance Dashboard

**Purpose**: Lambda function monitoring

**Widgets**:

- Function duration across all Lambdas
- Error rates by function
- Concurrent executions
- Throttles
- Cold start analysis

### 3. API Gateway Dashboard

**Purpose**: API performance monitoring

**Widgets**:

- Traffic & error trends
- Latency metrics (overall and integration)
- Cache performance (hits/misses)
- Top endpoint traffic
- Endpoint error analysis

### 4. Database Performance Dashboard

**Purpose**: Database health and performance

**Widgets**:

- RDS performance (CPU, connections, latency)
- I/O performance (IOPS, throughput)
- Resource utilization (memory, storage, connections)
- Application database metrics (query duration, pool utilization)
- Error metrics (slow queries, deadlocks, failed connections)

### 5. Business Metrics Dashboard

**Purpose**: Business intelligence and KPIs

**Widgets**:

- Revenue trends (daily, weekly, monthly)
- Payment transaction status
- Order lifecycle
- RFID operations
- User engagement patterns
- Financial metrics
- Security events

### 6. Cost Optimization Dashboard

**Purpose**: Cost monitoring and optimization

**Widgets**:

- Lambda invocations (cost impact)
- Duration (cost per execution)
- RDS utilization (cost efficiency)
- Estimated daily costs by service
- Cost vs revenue per transaction

## Using the Metrics Service

### Basic Usage

```typescript
import { metricsService } from './services/metrics.service';

// Track payment
await metricsService.trackPayment({
  transactionId: 'txn_123',
  amount: 500,
  currency: 'INR',
  status: 'success',
  gateway: 'razorpay',
  processingTime: 1234,
});

// Track order creation
await metricsService.trackOrderCreation({
  orderId: 'ord_123',
  userId: 'user_123',
  schoolId: 'school_123',
  totalAmount: 500,
  itemCount: 3,
  processingTime: 890,
});

// Track RFID operation
await metricsService.trackRFID({
  rfidTag: 'RF123456',
  operation: 'verification',
  status: 'success',
  processingTime: 234,
  location: 'cafeteria_1',
});

// Track security event
await metricsService.trackSecurityEvent('failed_login', 'user_123', {
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
});

// Track system health
await metricsService.trackSystemHealth({
  timestamp: Date.now(),
  components: {
    api: { healthy: true, responseTime: 50 },
    database: { healthy: true, connectionPool: 75 },
    cache: { healthy: true, hitRate: 85 },
    payment: { healthy: true, successRate: 98 },
  },
  overallScore: 95,
});
```

### Automatic Tracking with Middleware

```typescript
import {
  metricsMiddleware,
  userActivityMiddleware,
  securityMetricsMiddleware,
} from './middleware/metrics.middleware';

// Add to Express app
app.use(metricsMiddleware);
app.use(userActivityMiddleware);
app.use(securityMetricsMiddleware);
```

### Database Query Tracking

```typescript
import { createDatabaseMetricsWrapper } from './middleware/metrics.middleware';

// Wrap database queries
const wrappedQuery = createDatabaseMetricsWrapper('SELECT', async () => {
  return await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
});

const result = await wrappedQuery();
```

### Cache Operation Tracking

```typescript
import { createCacheMetricsWrapper } from './middleware/metrics.middleware';

// Wrap cache operations
const wrappedCacheGet = createCacheMetricsWrapper(
  'hit', // or 'miss'
  async () => {
    return await redis.get(key);
  }
);

const value = await wrappedCacheGet();
```

## Alert Response Procedures

### Critical Alert Response (< 15 minutes)

1. **Verify Alert** - Check dashboard for confirmation
2. **Assess Impact** - Determine affected users/functionality
3. **Immediate Mitigation** - Apply emergency fixes
4. **Notify Stakeholders** - Alert management and affected teams
5. **Root Cause Analysis** - Investigate after stabilization
6. **Post-Mortem** - Document and prevent recurrence

### Warning Alert Response (< 1 hour)

1. **Review Metrics** - Analyze trends in dashboard
2. **Determine Urgency** - Assess if escalation needed
3. **Schedule Investigation** - Plan detailed analysis
4. **Apply Optimization** - Implement improvements
5. **Monitor Results** - Verify resolution

### Business Alert Response (< 4 hours)

1. **Business Impact Analysis** - Calculate revenue/user impact
2. **Stakeholder Communication** - Inform business teams
3. **Corrective Action Plan** - Develop improvement strategy
4. **Implementation** - Execute changes
5. **Verification** - Confirm metrics improvement

## Best Practices

### Metric Collection

1. **Batch Metrics** - Use automatic batching for efficiency
2. **High-Cardinality Caution** - Avoid metrics with unbounded dimensions
3. **Consistent Naming** - Follow established naming conventions
4. **Appropriate Units** - Use correct StandardUnit values
5. **Meaningful Dimensions** - Include context for filtering

### Alarm Configuration

1. **Avoid False Positives** - Set realistic thresholds
2. **Multiple Evaluation Periods** - Use 2-3 periods for stability
3. **Composite Alarms** - Group related alarms logically
4. **OK Actions** - Set recovery notifications
5. **Regular Review** - Adjust thresholds based on patterns

### Dashboard Design

1. **User-Focused** - Design for specific audiences (exec, ops, dev)
2. **Logical Grouping** - Group related metrics
3. **Time Windows** - Use appropriate time ranges
4. **Annotations** - Add context to graphs
5. **Regular Updates** - Refine based on feedback

### Cost Optimization

1. **Metric Filtering** - Only collect valuable metrics
2. **Log Retention** - Set appropriate retention periods
3. **Dashboard Efficiency** - Optimize query performance
4. **Alarm Consolidation** - Use composite alarms
5. **Regular Cleanup** - Remove unused resources

## Troubleshooting

### No Metrics Appearing

1. Check `CLOUDWATCH_METRICS_ENABLED=true` in .env
2. Verify AWS credentials have CloudWatch permissions
3. Check application logs for metric errors
4. Verify namespace and dimension names

### Alarms Not Triggering

1. Verify alarm state in CloudWatch console
2. Check metric data is being published
3. Verify threshold values are appropriate
4. Check evaluation periods and statistics

### High CloudWatch Costs

1. Review metric cardinality
2. Check log retention policies
3. Optimize dashboard queries
4. Consolidate duplicate metrics
5. Use metric filters instead of log insights

### Missing Dashboard Data

1. Verify correct environment and region
2. Check metric namespaces match
3. Verify time range selection
4. Check for data gaps in metrics

## Maintenance

### Daily Tasks

- Review critical alarms
- Check system health dashboard
- Monitor business metrics trends

### Weekly Tasks

- Analyze performance trends
- Review cost metrics
- Update alarm thresholds if needed
- Check for anomalies

### Monthly Tasks

- Full dashboard review
- Cost optimization analysis
- Alarm effectiveness review
- Update documentation

## Support

For issues or questions:

- DevOps Team: devops@hasivu.com
- Documentation: /docs/CLOUDWATCH_MONITORING.md
- AWS Support: Premium support available

## References

- [AWS CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)
- [CloudWatch Metrics Best Practices](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Best_Practice_Recommended_Alarms_AWS_Services.html)
- [CloudWatch Pricing](https://aws.amazon.com/cloudwatch/pricing/)
- HASIVU Platform Architecture Documentation
