# HASIVU Platform - Operations Manual

**Complete Operations Guide for Production Environment**
_Daily operations, maintenance procedures, and incident response_

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [System Monitoring](#system-monitoring)
3. [Maintenance Procedures](#maintenance-procedures)
4. [Incident Response](#incident-response)
5. [Backup & Recovery](#backup--recovery)
6. [Performance Optimization](#performance-optimization)
7. [Security Operations](#security-operations)
8. [Compliance & Auditing](#compliance--auditing)
9. [Contact Information](#contact-information)

---

## Daily Operations

### Morning Health Check (9:00 AM IST)

#### 1. System Status Verification

```bash
# Check all Lambda functions status
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `hasivu`)].{Name:FunctionName,Status:State}' --output table

# Verify API Gateway health
curl -f https://api.hasivu.edu.in/health

# Check database connectivity
psql -h hasivu-production.cluster.ap-south-1.rds.amazonaws.com -U hasivu_admin -d hasivu_production -c "SELECT 1;"

# Verify Redis connectivity
redis-cli -h hasivu-production.cache.ap-south-1.amazonaws.com ping
```

#### 2. Application Metrics Review

```bash
# Check Grafana dashboards
open https://grafana.hasivu.edu.in

# Review key metrics:
- API Response Times (< 200ms average)
- Error Rates (< 1%)
- Active Users
- Order Volume
- Payment Success Rate (> 99%)
```

#### 3. Alert Review

```bash
# Check CloudWatch alarms
aws cloudwatch describe-alarms --alarm-name-prefix "HASIVU" --state-value ALARM

# Review PagerDuty incidents
# Check email alerts from monitoring system
```

### Peak Hours Monitoring (11:00 AM - 2:00 PM IST)

#### Lunch Order Rush Monitoring

```bash
# Monitor order creation rate
aws cloudwatch get-metric-statistics \
  --namespace "HASIVU/Orders" \
  --metric-name "OrdersCreated" \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum

# Check queue depths
aws sqs get-queue-attributes \
  --queue-url https://sqs.ap-south-1.amazonaws.com/123456789012/hasivu-order-queue \
  --attribute-names ApproximateNumberOfMessages
```

### Evening Operations (6:00 PM IST)

#### 1. End-of-Day Reporting

```bash
# Generate daily summary report
curl -X POST https://api.hasivu.edu.in/reports/daily-summary \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date": "'$(date +%Y-%m-%d)'"}'

# Backup verification
aws s3 ls s3://hasivu-prod-backups/database/ --recursive | tail -5
```

#### 2. System Cleanup

```bash
# Clean up old log files
find /var/log/hasivu -name "*.log" -mtime +30 -delete

# Archive old order data (if applicable)
# Note: Most data retention handled by database policies
```

---

## System Monitoring

### Key Performance Indicators (KPIs)

#### Application Metrics

- **API Response Time**: Target < 200ms (95th percentile)
- **Error Rate**: Target < 1%
- **Availability**: Target 99.9% uptime
- **Throughput**: Handle 1000+ concurrent users

#### Business Metrics

- **Order Success Rate**: Target > 98%
- **Payment Success Rate**: Target > 99%
- **RFID Verification Rate**: Target > 95%
- **User Satisfaction**: Target > 4.5/5

### Monitoring Dashboards

#### Grafana Dashboards

1. **HASIVU Production Overview**
   - Real-time metrics
   - Error rates and response times
   - Resource utilization

2. **HASIVU Business Metrics**
   - Order volume trends
   - Revenue analytics
   - User engagement metrics

3. **HASIVU Infrastructure**
   - Database performance
   - Redis metrics
   - Lambda function metrics

#### CloudWatch Dashboards

- **HASIVU-API-Metrics**: API Gateway performance
- **HASIVU-Database-Metrics**: RDS performance
- **HASIVU-Lambda-Metrics**: Function performance

### Alert Configuration

#### Critical Alerts (Immediate Response)

- API Error Rate > 5%
- Database Connection Failures
- Payment Gateway Down
- RFID System Offline

#### Warning Alerts (Within 30 minutes)

- API Response Time > 500ms
- High Memory Usage > 85%
- Queue Depth > 1000 messages

#### Info Alerts (Daily Review)

- Unusual traffic patterns
- Performance degradation trends
- Security scan results

---

## Maintenance Procedures

### Weekly Maintenance (Every Sunday 2:00 AM IST)

#### 1. Database Maintenance

```bash
# Run database vacuum and analyze
psql -h $DB_HOST -U hasivu_admin -d hasivu_production -c "VACUUM ANALYZE;"

# Update table statistics
psql -h $DB_HOST -U hasivu_admin -d hasivu_production -c "ANALYZE;"

# Check for long-running queries
psql -h $DB_HOST -U hasivu_admin -d hasivu_production -c "
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '5 minutes';
"
```

#### 2. Redis Maintenance

```bash
# Check Redis memory usage
redis-cli -h $REDIS_HOST INFO memory

# Clean up expired keys
redis-cli -h $REDIS_HOST KEYS "*" | xargs redis-cli DEL

# Check Redis persistence
redis-cli -h $REDIS_HOST INFO persistence
```

#### 3. Lambda Function Updates

```bash
# Update Lambda function configurations if needed
aws lambda update-function-configuration \
  --function-name hasivu-platform-api-orders \
  --memory-size 1024 \
  --timeout 30

# Check for deprecated runtime versions
aws lambda list-functions --query 'Functions[?Runtime==`nodejs14.x`].FunctionName'
```

### Monthly Maintenance (First Sunday of Month)

#### 1. Security Updates

```bash
# Update Lambda runtime versions
# Rotate database credentials
aws secretsmanager update-secret \
  --secret-id hasivu/database-credentials \
  --secret-string '{"username":"hasivu_admin","password":"NEW_PASSWORD"}'

# Update SSL certificates
certbot renew --nginx

# Run security scans
npm audit fix
docker scan hasivu/platform:latest
```

#### 2. Performance Optimization

```bash
# Review and optimize slow queries
psql -h $DB_HOST -U hasivu_admin -d hasivu_production -c "
SELECT query, calls, mean_time, rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
"

# Add missing indexes
psql -h $DB_HOST -U hasivu_admin -d hasivu_production -f scripts/performance-indexes.sql

# Update materialized views
psql -h $DB_HOST -U hasivu_admin -d hasivu_production -c "REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_menu_stats;"
```

#### 3. Log Rotation and Cleanup

```bash
# Rotate CloudWatch logs
aws logs create-log-group --log-group-name hasivu/archive/$(date +%Y%m)

# Clean up old S3 backups (keep last 90 days)
aws s3 ls s3://hasivu-prod-backups/database/ | while read -r line; do
    file_date=$(echo $line | awk '{print $1}')
    file_age=$(( ($(date +%s) - $(date -d "$file_date" +%s)) / 86400 ))
    if [ $file_age -gt 90 ]; then
        aws s3 rm s3://hasivu-prod-backups/database/$line
    fi
done
```

### Quarterly Maintenance

#### 1. Major Version Updates

- Update Lambda runtime versions
- Database major version upgrades
- Infrastructure as Code updates

#### 2. Compliance Audits

- Security assessment
- Performance benchmarking
- Compliance reporting

---

## Incident Response

### Incident Severity Levels

#### P0 - Critical (Immediate Response < 15 minutes)

- Complete system outage
- Payment system down
- Data breach
- Security incident

#### P1 - High (Response < 1 hour)

- Major functionality broken
- Significant performance degradation
- Database issues affecting users

#### P2 - Medium (Response < 4 hours)

- Minor functionality issues
- Performance warnings
- Monitoring alerts

#### P3 - Low (Response < 24 hours)

- Cosmetic issues
- Non-critical errors
- Informational alerts

### Incident Response Process

#### 1. Detection and Assessment

```bash
# Check system status
curl -f https://api.hasivu.edu.in/health

# Check error rates
aws cloudwatch get-metric-statistics \
  --namespace "HASIVU/API" \
  --metric-name "ErrorRate" \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

#### 2. Containment

```bash
# Enable circuit breakers if needed
aws lambda update-function-configuration \
  --function-name hasivu-platform-api-orders \
  --environment "Variables={CIRCUIT_BREAKER_ENABLED=true}"

# Scale up resources
kubectl scale deployment hasivu-web --replicas=10 -n production

# Redirect traffic if needed
aws cloudfront create-distribution-with-tags \
  --distribution-config file://maintenance-distribution.json
```

#### 3. Recovery

```bash
# Rollback to previous version
kubectl rollout undo deployment/hasivu-web -n production

# Restore from backup if needed
./scripts/disaster-recovery.sh YYYYMMDD_HHMMSS

# Clear caches
redis-cli -h $REDIS_HOST FLUSHALL
```

#### 4. Post-Incident Review

- Document incident timeline
- Identify root cause
- Implement preventive measures
- Update incident response procedures

### Common Incident Scenarios

#### Database Connection Issues

```bash
# Check database status
aws rds describe-db-instances --db-instance-identifier hasivu-production

# Restart database if needed
aws rds reboot-db-instance --db-instance-identifier hasivu-production

# Check connection pool
kubectl exec -it deployment/hasivu-web -n production -- curl localhost:3000/metrics | grep pool
```

#### Lambda Function Timeouts

```bash
# Check function logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/hasivu-platform-api-orders \
  --start-time $(date -u -d '1 hour ago' +%s000) \
  --filter-pattern "Task timed out"

# Increase timeout
aws lambda update-function-configuration \
  --function-name hasivu-platform-api-orders \
  --timeout 60
```

#### High Error Rates

```bash
# Check recent errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/hasivu-platform-api-orders \
  --start-time $(date -u -d '30 minutes ago' +%s000) \
  --filter-pattern "ERROR"

# Enable detailed logging
kubectl patch deployment hasivu-web -n production -p '{"spec":{"template":{"spec":{"containers":[{"name":"hasivu-web","env":[{"name":"LOG_LEVEL","value":"debug"}]}]}}}}'
```

---

## Backup & Recovery

### Automated Backup Schedule

#### Daily Backups

- **Database**: Every 6 hours (00:00, 06:00, 12:00, 18:00 IST)
- **Application Config**: Daily at 02:00 IST
- **User Files**: Continuous via S3 versioning

#### Weekly Backups

- **Full System Backup**: Every Sunday 03:00 IST
- **Cross-region Replication**: Weekly validation

#### Monthly Backups

- **Long-term Archive**: First day of month
- **Compliance Backups**: As required by regulations

### Recovery Procedures

#### Database Recovery

```bash
# 1. Stop application traffic
kubectl scale deployment hasivu-web --replicas=0 -n production

# 2. Restore from backup
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier hasivu-recovery \
  --db-snapshot-identifier hasivu-production-snapshot

# 3. Update application configuration
kubectl patch configmap hasivu-config -n production -p '{"data":{"database-url":"NEW_CONNECTION_STRING"}}'

# 4. Restart application
kubectl scale deployment hasivu-web --replicas=3 -n production
```

#### Application Recovery

```bash
# 1. Deploy from backup artifact
aws s3 cp s3://hasivu-prod-backups/app/hasivu-platform-backup.tar.gz .

# 2. Restore configuration
kubectl apply -f k8s/production/configmap.yaml

# 3. Deploy application
kubectl apply -f k8s/production/deployment.yaml

# 4. Verify health
curl -f https://api.hasivu.edu.in/health
```

### Recovery Time Objectives (RTO)

- **Critical Systems**: 1 hour
- **Core Application**: 4 hours
- **Full System**: 24 hours

### Recovery Point Objectives (RPO)

- **Transactional Data**: 1 hour
- **Configuration Data**: 24 hours
- **Analytics Data**: 24 hours

---

## Performance Optimization

### Database Optimization

#### Query Performance Monitoring

```sql
-- Identify slow queries
SELECT query, calls, mean_time, rows
FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY mean_time DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Add performance indexes
CREATE INDEX CONCURRENTLY idx_orders_status_created
ON orders(status, created_at DESC)
WHERE status IN ('pending', 'preparing');
```

#### Lambda Function Optimization

```bash
# Increase memory allocation
aws lambda update-function-configuration \
  --function-name hasivu-platform-api-orders \
  --memory-size 2048

# Enable provisioned concurrency
aws lambda put-provisioned-concurrency-config \
  --function-name hasivu-platform-api-orders \
  --qualifier $LATEST \
  --provisioned-concurrent-executions 10

# Optimize package size
# Remove unnecessary dependencies
npm prune --production
```

### Caching Strategy

#### Redis Cache Configuration

```redis
# Set appropriate TTL values
SET order:123 EX 3600 {"status":"ready","items":[...]}

# Use cache for frequently accessed data
GET school:123:menu

# Implement cache warming for peak hours
# Pre-load popular menu items
```

#### CDN Optimization

```bash
# Configure CloudFront behaviors
aws cloudfront update-distribution \
  --id $DISTRIBUTION_ID \
  --default-cache-behavior file://cache-behavior.json

# Set appropriate cache headers
Cache-Control: max-age=3600, s-maxage=86400
```

---

## Security Operations

### Daily Security Checks

#### 1. Access Log Review

```bash
# Check for suspicious login attempts
aws logs filter-log-events \
  --log-group-name /aws/lambda/hasivu-platform-api-auth \
  --filter-pattern "FAILED_LOGIN" \
  --start-time $(date -u -d '24 hours ago' +%s000)

# Review admin access
aws logs filter-log-events \
  --log-group-name /aws/lambda/hasivu-platform-api-users \
  --filter-pattern "ADMIN_ACCESS" \
  --start-time $(date -u -d '24 hours ago' +%s000)
```

#### 2. Vulnerability Scanning

```bash
# Run container vulnerability scan
trivy image hasivu/platform:latest

# Check for exposed secrets
gitleaks detect --verbose --redact

# Review security group changes
aws ec2 describe-security-groups --group-ids $HASIVU_SG
```

### Security Incident Response

#### Suspicious Activity Detection

1. **Multiple Failed Logins**

   ```bash
   # Check failed login attempts by IP
   aws logs filter-log-events \
     --log-group-name /aws/lambda/hasivu-platform-api-auth \
     --filter-pattern "FAILED_LOGIN" | \
     jq -r '.events[].message' | \
     grep -oE '\b([0-9]{1,3}\.){3}[0-9]{1,3}\b' | \
     sort | uniq -c | sort -nr | head -10
   ```

2. **Unusual API Usage**
   ```bash
   # Check for rate limit violations
   aws cloudwatch get-metric-statistics \
     --namespace "HASIVU/API" \
     --metric-name "RateLimitExceeded" \
     --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 300 \
     --statistics Sum
   ```

#### Security Breach Response

1. **Isolate Affected Systems**
2. **Preserve Evidence**
3. **Notify Security Team**
4. **Contain the Breach**
5. **Eradicate Threats**
6. **Recover Systems**
7. **Post-Incident Analysis**

---

## Compliance & Auditing

### Regulatory Compliance

#### GDPR Compliance

- **Data Subject Rights**: Right to access, rectify, erase data
- **Data Portability**: Export user data in machine-readable format
- **Consent Management**: Track user consent for data processing
- **Breach Notification**: Report breaches within 72 hours

#### PCI-DSS Compliance (Payment Data)

- **Data Encryption**: All payment data encrypted in transit and at rest
- **Access Controls**: Restricted access to payment systems
- **Audit Trails**: Comprehensive logging of payment operations
- **Regular Testing**: Quarterly vulnerability scans and penetration testing

### Audit Procedures

#### Monthly Security Audit

```bash
#!/bin/bash
# monthly-security-audit.sh

echo "=== HASIVU Monthly Security Audit ==="

# 1. User Access Review
echo "👥 Reviewing user access..."
aws iam list-users --query 'Users[?CreateDate<`2024-01-01`].UserName'

# 2. Permission Changes
echo "🔐 Checking permission changes..."
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=AttachUserPolicy \
  --start-time $(date -d '30 days ago' +%s)

# 3. Security Group Changes
echo "🛡️ Reviewing security group modifications..."
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=AuthorizeSecurityGroupIngress \
  --start-time $(date -d '30 days ago' +%s)

# 4. Database Access Audit
echo "🗄️ Checking database access patterns..."
psql -h $DB_HOST -U hasivu_admin -d hasivu_production -c "
SELECT usename, client_addr, COUNT(*) as connections
FROM pg_stat_activity
GROUP BY usename, client_addr
ORDER BY connections DESC;"

echo "=== Audit Complete ==="
```

#### Compliance Reporting

- **Monthly**: Security metrics and compliance status
- **Quarterly**: Full compliance audit report
- **Annually**: SOC 2 Type II audit

---

## Contact Information

### Emergency Contacts

- **Primary On-Call**: +91-9876543210 (DevOps Lead)
- **Secondary On-Call**: +91-9876543211 (Senior Developer)
- **Security Incident**: security@hasivu.edu.in
- **Customer Support**: support@hasivu.edu.in

### Vendor Contacts

- **AWS Support**: 1-888-280-4331 (Enterprise Support)
- **Razorpay Support**: support@razorpay.com
- **Cloudflare Support**: support@cloudflare.com

### Internal Teams

- **Development Team**: dev@hasivu.edu.in
- **Operations Team**: ops@hasivu.edu.in
- **Security Team**: security@hasivu.edu.in
- **Business Team**: business@hasivu.edu.in

### Escalation Matrix

1. **L1 Support**: Customer-facing issues, basic troubleshooting
2. **L2 Support**: Technical issues, system monitoring
3. **L3 Support**: Complex issues, code-level debugging
4. **Management**: Business impact assessment, stakeholder communication

---

**Document Version**: 1.0
**Last Updated**: 2025-01-07
**Review Frequency**: Monthly
**Document Owner**: Operations Team
