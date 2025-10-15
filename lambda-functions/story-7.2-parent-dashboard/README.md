# Epic 7.2: Advanced Parent Dashboard & Insights Portal - Lambda Functions

This directory contains the 5 production-ready Lambda functions that complete Epic 7.2 implementation for the HASIVU platform's Advanced Parent Dashboard & Insights Portal.

## 🏗️ Architecture Overview

### Lambda Functions

1. **parent-dashboard-orchestrator** - Main coordination function for parent dashboard data aggregation
2. **personalized-insights-engine** - AI-powered insights generation for individual families
3. **child-progress-analytics** - Student nutrition and engagement analytics
4. **engagement-intelligence** - Parent app usage and engagement tracking
5. **dashboard-customization** - Personalized dashboard configuration management

## 🚀 Features

### Parent Dashboard Orchestrator

- **Data Aggregation**: Orchestrates data collection from multiple services
- **Parallel Processing**: Efficient data retrieval with performance optimization
- **Caching Strategy**: Redis-based caching with intelligent invalidation
- **Real-time Updates**: Live dashboard updates with WebSocket support
- **Error Handling**: Graceful degradation and comprehensive error recovery

### Personalized Insights Engine

- **AI-Powered Analysis**: Uses SageMaker and Bedrock for intelligent insights
- **Spending Patterns**: ML-based spending behavior analysis
- **Nutrition Analysis**: Comprehensive dietary pattern assessment
- **Engagement Prediction**: Parent engagement forecasting and optimization
- **Multi-language Support**: Localized insights and recommendations

### Child Progress Analytics

- **Nutrition Tracking**: Comprehensive nutrition analytics with target adherence
- **Engagement Metrics**: Meal engagement and behavioral analysis
- **Progress Indicators**: Academic correlation and development tracking
- **Comparison Analytics**: Peer comparison and family benchmarking
- **Trend Analysis**: Seasonal patterns and predictive modeling

### Engagement Intelligence

- **Behavioral Analytics**: Deep user behavior pattern analysis
- **Feature Adoption**: Feature usage tracking and optimization
- **Churn Prediction**: ML-based churn risk assessment
- **Real-time Tracking**: Live engagement event processing
- **Personalized Recommendations**: Engagement improvement suggestions

### Dashboard Customization

- **Layout Management**: Grid, list, and compact layout options
- **Widget Configuration**: Flexible widget positioning and settings
- **Theme Customization**: Light, dark, and auto themes with custom colors
- **User Preferences**: Comprehensive personalization options
- **Multi-device Sync**: Configuration synchronization across devices

## 🛠️ Technical Stack

- **Language**: TypeScript
- **Runtime**: Node.js 18+
- **AWS Services**: Lambda, DynamoDB, SageMaker, Bedrock, S3, CloudWatch, EventBridge
- **Validation**: Zod schemas for type-safe input validation
- **Security**: IAM roles, VPC configuration, encryption at rest and in transit
- **Monitoring**: CloudWatch metrics, custom performance tracking

## 📦 Installation & Deployment

### Prerequisites

```bash
# AWS CLI configured
aws configure

# Node.js 18+ installed
node --version

# TypeScript installed globally
npm install -g typescript
```

### Build All Functions

```bash
# Install dependencies for all functions
cd parent-dashboard-orchestrator && npm install && cd ..
cd personalized-insights-engine && npm install && cd ..
cd child-progress-analytics && npm install && cd ..
cd engagement-intelligence && npm install && cd ..
cd dashboard-customization && npm install && cd ..

# Build TypeScript
npm run build
```

### Deploy Individual Functions

```bash
# Deploy orchestrator
cd parent-dashboard-orchestrator
npm run build && npm run package && npm run deploy

# Deploy insights engine
cd ../personalized-insights-engine
npm run build && npm run package && npm run deploy

# Deploy progress analytics
cd ../child-progress-analytics
npm run build && npm run package && npm run deploy

# Deploy engagement intelligence
cd ../engagement-intelligence
npm run build && npm run package && npm run deploy

# Deploy dashboard customization
cd ../dashboard-customization
npm run build && npm run package && npm run deploy
```

## 🔧 Configuration

### Environment Variables

Each Lambda function requires specific environment variables:

#### Common Variables

```
USERS_TABLE=hasivu-users
PARENT_CHILDREN_TABLE=hasivu-parent-children
ORDERS_TABLE=hasivu-orders
PAYMENTS_TABLE=hasivu-payments
```

#### Function-Specific Variables

**parent-dashboard-orchestrator**:

```
DASHBOARD_CACHE_TABLE=hasivu-dashboard-cache
DASHBOARD_PREFERENCES_TABLE=hasivu-dashboard-preferences
```

**personalized-insights-engine**:

```
SPENDING_PATTERNS_MODEL=hasivu-spending-patterns-endpoint
NUTRITION_ANALYSIS_MODEL=hasivu-nutrition-analysis-endpoint
ENGAGEMENT_PREDICTION_MODEL=hasivu-engagement-prediction-endpoint
RECOMMENDATION_ENGINE_MODEL=hasivu-recommendation-engine-endpoint
```

**child-progress-analytics**:

```
MEALS_TABLE=hasivu-meals
NUTRITION_TRACKING_TABLE=hasivu-nutrition-tracking
ENGAGEMENT_TRACKING_TABLE=hasivu-engagement-tracking
STUDENT_PREFERENCES_TABLE=hasivu-student-preferences
```

**engagement-intelligence**:

```
ENGAGEMENT_EVENTS_TABLE=hasivu-engagement-events
USER_SESSIONS_TABLE=hasivu-user-sessions
FEATURE_USAGE_TABLE=hasivu-feature-usage
ENGAGEMENT_STREAM=hasivu-engagement-stream
REAL_TIME_METRICS_TABLE=hasivu-real-time-metrics
```

**dashboard-customization**:

```
DASHBOARD_CUSTOMIZATION_TABLE=hasivu-dashboard-customization
CUSTOMIZATION_BACKUP_BUCKET=hasivu-customization-backups
```

### IAM Permissions

Each function requires specific IAM permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/hasivu-*"
    },
    {
      "Effect": "Allow",
      "Action": ["lambda:InvokeFunction"],
      "Resource": "arn:aws:lambda:*:*:function:*"
    },
    {
      "Effect": "Allow",
      "Action": ["sagemaker:InvokeEndpoint"],
      "Resource": "arn:aws:sagemaker:*:*:endpoint/*"
    },
    {
      "Effect": "Allow",
      "Action": ["bedrock:InvokeModel"],
      "Resource": "arn:aws:bedrock:*:*:model/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::hasivu-*/*"
    },
    {
      "Effect": "Allow",
      "Action": ["events:PutEvents"],
      "Resource": "arn:aws:events:*:*:event-bus/*"
    },
    {
      "Effect": "Allow",
      "Action": ["kinesis:PutRecord", "kinesis:PutRecords"],
      "Resource": "arn:aws:kinesis:*:*:stream/hasivu-*"
    },
    {
      "Effect": "Allow",
      "Action": ["cloudwatch:PutMetricData"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["timestream:Query"],
      "Resource": "arn:aws:timestream:*:*:database/hasivu-*"
    }
  ]
}
```

## 🔄 API Integration

### Parent Dashboard Orchestrator API

```typescript
// Get comprehensive dashboard data
POST /api/dashboard/orchestrator
{
  "action": "get_dashboard",
  "userId": "user-uuid",
  "dateRange": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  },
  "metrics": {
    "includeNutrition": true,
    "includeEngagement": true
  }
}
```

### Personalized Insights Engine API

```typescript
// Generate family insights
POST /api/insights/generate
{
  "action": "generate_insights",
  "userId": "user-uuid",
  "studentIds": ["student-uuid-1", "student-uuid-2"],
  "insightTypes": ["spending", "nutrition", "engagement"],
  "options": {
    "includeMLAnalysis": true,
    "includeAIRecommendations": true
  }
}
```

### Child Progress Analytics API

```typescript
// Get progress analytics
POST /api/analytics/progress
{
  "action": "get_progress_data",
  "userId": "user-uuid",
  "studentIds": ["student-uuid"],
  "timeframe": "monthly",
  "metrics": {
    "includeNutrition": true,
    "includeEngagement": true,
    "includeComparisons": true
  }
}
```

### Engagement Intelligence API

```typescript
// Track engagement event
POST /api/engagement/track
{
  "action": "track_event",
  "userId": "user-uuid",
  "eventData": {
    "eventType": "dashboard_view",
    "eventCategory": "navigation",
    "sessionId": "session-uuid",
    "deviceInfo": {
      "platform": "web",
      "version": "1.0.0",
      "deviceType": "desktop"
    }
  }
}
```

### Dashboard Customization API

```typescript
// Update dashboard layout
POST /api/dashboard/customize
{
  "action": "update_layout",
  "userId": "user-uuid",
  "customization": {
    "layout": {
      "type": "grid",
      "columns": 3,
      "responsive": true
    }
  }
}
```

## 📊 Performance Metrics

### Key Performance Indicators

- **Response Time**: < 2s for dashboard data aggregation
- **Throughput**: 1000+ concurrent users
- **Availability**: 99.9% uptime
- **Error Rate**: < 0.1% for critical operations
- **Cache Hit Rate**: > 80% for frequently accessed data

### Monitoring & Alerting

- CloudWatch metrics for all functions
- Custom performance tracking
- Error rate monitoring with alerts
- Resource utilization tracking
- Business metrics dashboard

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

### Load Testing

```bash
npm run test:load
```

## 🔒 Security Features

- **Input Validation**: Zod schema validation for all inputs
- **Authentication**: JWT token validation
- **Authorization**: Role-based access control
- **Encryption**: Data encryption at rest and in transit
- **Rate Limiting**: API rate limiting and throttling
- **Audit Logging**: Comprehensive audit trail
- **Data Privacy**: GDPR and COPPA compliance

## 📈 Scaling & Performance

### Auto Scaling

- Automatic scaling based on demand
- Provisioned concurrency for critical functions
- Reserved capacity for predictable workloads

### Optimization

- Connection pooling for database operations
- Intelligent caching strategies
- Batch processing for bulk operations
- Parallel execution for independent tasks

## 🐛 Troubleshooting

### Common Issues

1. **Cold Start Latency**
   - Use provisioned concurrency
   - Optimize package size
   - Use connection pooling

2. **Memory Issues**
   - Increase memory allocation
   - Optimize data structures
   - Use streaming for large datasets

3. **Timeout Issues**
   - Increase timeout settings
   - Implement pagination
   - Use async processing

### Debugging

- Enable CloudWatch detailed monitoring
- Use X-Ray tracing for distributed debugging
- Implement structured logging
- Monitor error rates and patterns

## 🤝 Contributing

1. Follow TypeScript best practices
2. Add comprehensive tests
3. Update documentation
4. Follow security guidelines
5. Optimize for performance

## 📚 Additional Resources

- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/)
- [DynamoDB Developer Guide](https://docs.aws.amazon.com/dynamodb/)
- [SageMaker Developer Guide](https://docs.aws.amazon.com/sagemaker/)
- [HASIVU Platform Architecture](../../../docs/architecture.md)
- [API Documentation](../../../docs/api.md)
