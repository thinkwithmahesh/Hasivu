# HASIVU Platform - Immediate Infrastructure Actions

## Critical Path to 100/100 Production Readiness

**Agent 4: Infrastructure Engineer**
**Date:** October 12, 2025
**Urgency:** HIGH - Begin within 24 hours

---

## Overview

This document outlines the **critical path actions** required to achieve 100/100 production readiness for the HASIVU Platform. These actions are prioritized by urgency and impact.

**Current State:** 75/100
**Target State:** 100/100
**Timeline:** 4 weeks
**Phase 1 Target:** Week 1 (Critical Infrastructure)

---

## Immediate Actions (Next 24 Hours)

### 1. Deploy Comprehensive Health Check (2 hours)

**Priority:** CRITICAL
**Impact:** Enables automated health monitoring and rollback decisions

#### Files Created:

- `/Users/mahesha/Downloads/hasivu-platform/src/functions/health/comprehensive-health.ts`

#### Steps:

```bash
cd /Users/mahesha/Downloads/hasivu-platform

# 1. Update serverless.yml to add new health endpoints
cat >> serverless.yml << 'EOF'

# Add comprehensive health check functions
functions:
  health-comprehensive:
    handler: src/functions/health/comprehensive-health.comprehensiveHealthCheck
    memorySize: 512
    timeout: 10
    events:
      - http:
          path: /health
          method: get
          cors: true
    environment:
      FUNCTION_NAME: health-comprehensive

  health-liveness:
    handler: src/functions/health/comprehensive-health.livenessProbe
    memorySize: 256
    timeout: 3
    events:
      - http:
          path: /health/live
          method: get
          cors: true
    environment:
      FUNCTION_NAME: health-liveness

  health-readiness:
    handler: src/functions/health/comprehensive-health.readinessProbe
    memorySize: 512
    timeout: 5
    events:
      - http:
          path: /health/ready
          method: get
          cors: true
    environment:
      FUNCTION_NAME: health-readiness

  health-startup:
    handler: src/functions/health/comprehensive-health.startupProbe
    memorySize: 256
    timeout: 5
    events:
      - http:
          path: /health/startup
          method: get
          cors: true
    environment:
      FUNCTION_NAME: health-startup
EOF

# 2. Install missing dependencies if needed
npm install @aws-sdk/client-s3 ioredis

# 3. Build and test locally
npm run build
npm run test:unit -- src/functions/health/comprehensive-health

# 4. Deploy to dev environment first
npm run deploy:dev

# 5. Test health endpoints
curl https://your-dev-api.com/health
curl https://your-dev-api.com/health/live
curl https://your-dev-api.com/health/ready

# 6. If successful, deploy to staging
npm run deploy:staging

# 7. Monitor for 1 hour, then deploy to production
npm run deploy:production
```

**Success Criteria:**

- ✅ Health endpoints respond in <100ms
- ✅ All checks return 'pass' status
- ✅ Database, Redis, S3 connectivity verified
- ✅ Memory usage tracked and within limits

---

### 2. Enable Lambda Versioning & Aliases (1 hour)

**Priority:** CRITICAL
**Impact:** Enables automated rollback capability

#### Steps:

```bash
# 1. Add versioning to serverless.yml
cat >> serverless.yml << 'EOF'

custom:
  # Add Lambda versioning
  versionFunctions: true

  # Add aliases configuration
  aliases:
    production:
      version: $LATEST
      provisioned: 5  # Provisioned concurrency for critical functions
    canary:
      version: $LATEST
      provisioned: 1

  # Add deployment settings
  deploymentSettings:
    type: Linear10PercentEvery3Minutes
    alias: production
    preTrafficHook: health-readiness
    postTrafficHook: health-comprehensive
    alarms:
      - ErrorRateAlarm
      - DurationAlarm

plugins:
  - serverless-plugin-typescript
  - serverless-offline
  - serverless-plugin-warmup
  - serverless-plugin-split-stacks
  - serverless-associate-waf
  - serverless-plugin-canary-deployments  # Add this
  - serverless-plugin-aws-alerts  # Add this
EOF

# 2. Install required plugins
npm install --save-dev serverless-plugin-canary-deployments serverless-plugin-aws-alerts

# 3. Deploy to dev to test versioning
npm run deploy:dev

# 4. Verify versions and aliases
aws lambda list-versions-by-function --function-name hasivu-dev-health-comprehensive
aws lambda list-aliases --function-name hasivu-dev-health-comprehensive
```

**Success Criteria:**

- ✅ Lambda functions have version numbers
- ✅ Production and canary aliases created
- ✅ Provisioned concurrency active for critical functions

---

### 3. Add CloudWatch Alarms for Automated Rollback (1 hour)

**Priority:** CRITICAL
**Impact:** Automatic rollback triggers on errors or high latency

#### Steps:

```bash
# Add CloudWatch alarms to serverless.yml resources section
cat >> serverless.yml << 'EOF'

resources:
  Resources:
    # Error rate alarm
    ErrorRateAlarm:
      Type: AWS::CloudWatch::Alarm
      Properties:
        AlarmName: ${self:service}-${self:provider.stage}-error-rate
        AlarmDescription: Trigger rollback on high error rate
        MetricName: Errors
        Namespace: AWS/Lambda
        Statistic: Sum
        Period: 60
        EvaluationPeriods: 2
        Threshold: 10
        ComparisonOperator: GreaterThanThreshold
        TreatMissingData: notBreaching
        AlarmActions:
          - !Ref AlertTopic

    # Duration alarm
    DurationAlarm:
      Type: AWS::CloudWatch::Alarm
      Properties:
        AlarmName: ${self:service}-${self:provider.stage}-duration
        AlarmDescription: Trigger rollback on high latency
        MetricName: Duration
        Namespace: AWS/Lambda
        Statistic: Average
        Period: 60
        EvaluationPeriods: 2
        Threshold: 10000  # 10 seconds
        ComparisonOperator: GreaterThanThreshold
        TreatMissingData: notBreaching
        AlarmActions:
          - !Ref AlertTopic

    # SNS topic for alerts
    AlertTopic:
      Type: AWS::SNS::Topic
      Properties:
        TopicName: ${self:service}-${self:provider.stage}-alerts
        Subscription:
          - Endpoint: ${env:ALERT_EMAIL, 'devops@hasivu.com'}
            Protocol: email
EOF

# Deploy alarms
npm run deploy:dev
```

**Success Criteria:**

- ✅ CloudWatch alarms created and active
- ✅ SNS topic configured with email subscription
- ✅ Alarms trigger on simulated errors

---

### 4. Test Canary Deployment (2 hours)

**Priority:** HIGH
**Impact:** Validates safe deployment strategy

#### Files Created:

- `/Users/mahesha/Downloads/hasivu-platform/scripts/canary-deployment.sh`

#### Steps:

```bash
cd /Users/mahesha/Downloads/hasivu-platform

# 1. Make script executable (already done)
# chmod +x scripts/canary-deployment.sh

# 2. Set Slack webhook (optional)
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# 3. Test in dev environment
./scripts/canary-deployment.sh dev 10 300

# Expected output:
# - Deploy to canary alias
# - Route 10% traffic to canary
# - Monitor for 5 minutes (300 seconds)
# - If healthy, promote to 100%
# - If unhealthy, rollback automatically

# 4. Monitor deployment
watch -n 5 'aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=hasivu-dev-health-comprehensive \
  --start-time $(date -u -d "5 minutes ago" +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Sum'

# 5. If successful in dev, test in staging
./scripts/canary-deployment.sh staging 10 600
```

**Success Criteria:**

- ✅ Canary deploys successfully
- ✅ Traffic routing works (10% → canary)
- ✅ Health monitoring detects issues
- ✅ Automatic promotion or rollback executes

---

## Quick Wins (Within 48 Hours)

### 5. Consolidate CI/CD Pipelines

**Priority:** HIGH
**Impact:** Simplified deployment process, reduced maintenance

#### Action:

```bash
cd /Users/mahesha/Downloads/hasivu-platform/.github/workflows

# 1. Rename ci-cd-optimized.yml to ci-cd.yml (make it primary)
mv ci-cd-optimized.yml ci-cd-primary.yml

# 2. Archive old pipelines
mkdir -p archive
mv production-cicd.yml archive/
mv comprehensive-testing.yml archive/

# 3. Update ci-cd-primary.yml to use new health checks
# Add to deploy-production job:
cat >> ci-cd-primary.yml << 'EOF'

      - name: Comprehensive health check
        run: |
          npm run health:check:production

          # Check all health endpoints
          curl -f https://api.hasivu.com/health || exit 1
          curl -f https://api.hasivu.com/health/ready || exit 1
          curl -f https://api.hasivu.com/health/live || exit 1
EOF

# 4. Commit changes
git add .github/workflows/
git commit -m "Consolidate CI/CD pipelines with comprehensive health checks"
```

---

### 6. Add Deployment Metrics Dashboard

**Priority:** MEDIUM
**Impact:** Visibility into deployment performance

#### Action:

```bash
# Create CloudWatch dashboard for deployment metrics
aws cloudwatch put-dashboard \
  --dashboard-name hasivu-deployment-metrics \
  --dashboard-body file://infrastructure/monitoring/deployment-dashboard.json

# Create deployment-dashboard.json
cat > infrastructure/monitoring/deployment-dashboard.json << 'EOF'
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["HASIVU/Deployment", "DeploymentFrequency", {"stat": "Sum"}],
          [".", "DeploymentDuration", {"stat": "Average"}],
          [".", "DeploymentSuccessRate", {"stat": "Average"}]
        ],
        "period": 86400,
        "stat": "Average",
        "region": "ap-south-1",
        "title": "Deployment Metrics (Last 7 Days)"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Lambda", "Errors", {"stat": "Sum"}],
          [".", "Throttles", {"stat": "Sum"}],
          [".", "Duration", {"stat": "Average"}]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "ap-south-1",
        "title": "Lambda Health Metrics"
      }
    }
  ]
}
EOF
```

---

## Validation Checklist

### Before Moving to Phase 2

- [ ] Comprehensive health checks deployed to all environments
- [ ] Lambda versioning and aliases configured
- [ ] CloudWatch alarms active and tested
- [ ] Canary deployment tested successfully in dev and staging
- [ ] CI/CD pipeline consolidated and optimized
- [ ] Deployment metrics dashboard created
- [ ] Team trained on new deployment procedures
- [ ] Rollback procedure tested and documented

### Success Metrics (Week 1 Target)

| Metric                     | Target | Current | Status |
| -------------------------- | ------ | ------- | ------ |
| Health Check Response Time | <100ms | -       | ⏳     |
| Deployment Success Rate    | >95%   | ~90%    | ⏳     |
| Rollback Time (MTTR)       | <2 min | Manual  | ⏳     |
| Lambda Cold Start          | <500ms | ~2s     | ⏳     |
| System Availability        | >99.5% | 99.0%   | ⏳     |

---

## Risk Mitigation

### If Something Goes Wrong

#### Rollback Procedure

```bash
# Manual rollback if automated rollback fails
cd /Users/mahesha/Downloads/hasivu-platform

# 1. Get previous version
PREVIOUS_VERSION=$(aws lambda list-versions-by-function \
  --function-name hasivu-production-health-comprehensive \
  --query 'Versions[-2].Version' \
  --output text)

# 2. Update production alias to previous version
aws lambda update-alias \
  --function-name hasivu-production-health-comprehensive \
  --name production \
  --function-version $PREVIOUS_VERSION

# 3. Verify rollback
curl https://api.hasivu.com/health
```

#### Emergency Contacts

- **DevOps Lead:** [Add contact]
- **Platform Engineer:** [Add contact]
- **On-Call Engineer:** [Add PagerDuty/phone]

---

## Cost Considerations

### Expected Cost Changes (Week 1)

| Item                              | Monthly Cost   | Justification                |
| --------------------------------- | -------------- | ---------------------------- |
| Provisioned Concurrency (5 units) | +$45           | Eliminates cold starts       |
| Enhanced CloudWatch Monitoring    | +$10           | Detailed metrics and alarms  |
| Lambda Versioning Storage         | +$5            | Rollback capability          |
| **Total Increase**                | **+$60/month** | **Worth it for reliability** |

**ROI:** Reduced downtime costs ($5,000+/hour) far exceeds additional monitoring costs.

---

## Next Steps After Week 1

### Phase 2 Preview (Week 2)

1. **Advanced Canary Deployments**
   - Gradual rollout: 10% → 25% → 50% → 100%
   - Multiple health check stages
   - Automated A/B testing

2. **Blue-Green Deployment Optimization**
   - Zero-downtime database migrations
   - Instant traffic switching
   - Automated cleanup

3. **Infrastructure Testing**
   - Chaos engineering tests
   - Disaster recovery drills
   - Cost regression tests

---

## Support & Documentation

### Key Resources

1. **Main Report:** `/Users/mahesha/Downloads/hasivu-platform/INFRASTRUCTURE_PRODUCTION_READINESS_REPORT.md`
2. **Canary Script:** `/Users/mahesha/Downloads/hasivu-platform/scripts/canary-deployment.sh`
3. **Health Check:** `/Users/mahesha/Downloads/hasivu-platform/src/functions/health/comprehensive-health.ts`
4. **Serverless Config:** `/Users/mahesha/Downloads/hasivu-platform/serverless.yml`

### Questions?

Contact Agent 4 (Infrastructure Engineer) for clarification on any of these steps.

---

**Status:** Ready for Implementation
**Last Updated:** October 12, 2025
**Review Date:** After Week 1 completion
