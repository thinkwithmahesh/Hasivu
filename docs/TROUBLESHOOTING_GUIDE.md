# HASIVU Platform - Troubleshooting Guide

**Comprehensive troubleshooting guide for common issues and their resolutions**

## Table of Contents

1. [Application Issues](#application-issues)
2. [Database Issues](#database-issues)
3. [API Gateway Issues](#api-gateway-issues)
4. [Lambda Function Issues](#lambda-function-issues)
5. [Authentication Issues](#authentication-issues)
6. [Payment Issues](#payment-issues)
7. [RFID System Issues](#rfid-system-issues)
8. [Performance Issues](#performance-issues)
9. [Monitoring & Alerting Issues](#monitoring--alerting-issues)
10. [Infrastructure Issues](#infrastructure-issues)

---

## Application Issues

### Application Unresponsive

**Symptoms:**

- 502 Bad Gateway errors
- 503 Service Unavailable errors
- Slow response times (>5 seconds)

**Diagnosis:**

```bash
# Check application health
curl -f https://app.hasivu.edu.in/health

# Check pod status
kubectl get pods -n production

# Check application logs
kubectl logs -f deployment/hasivu-web -n production --tail=50

# Check resource usage
kubectl top pods -n production
```

**Solutions:**

```bash
# Scale up application
kubectl scale deployment hasivu-web --replicas=5 -n production

# Restart deployment
kubectl rollout restart deployment/hasivu-web -n production

# Check node capacity
kubectl describe nodes | grep -A 10 "Allocated resources"
```

### JavaScript Errors in Browser

**Symptoms:**

- Console errors in browser
- Features not working
- Page not loading properly

**Diagnosis:**

```bash
# Check browser console for errors
# Look for CORS errors, network failures, or JavaScript exceptions

# Check API connectivity
curl -H "Origin: https://app.hasivu.edu.in" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS https://api.hasivu.edu.in/health

# Verify CDN assets
curl -I https://cdn.hasivu.edu.in/static/js/main.js
```

**Solutions:**

```bash
# Clear browser cache
# Hard refresh: Ctrl+Shift+R (Windows/Linux), Cmd+Shift+R (Mac)

# Check CDN configuration
aws cloudfront list-distributions --query 'DistributionList.Items[?Comment==`HASIVU Production`].DomainName'

# Update CORS configuration
kubectl patch configmap hasivu-config -n production -p '{"data":{"cors-origins":"https://app.hasivu.edu.in,https://admin.hasivu.edu.in"}}'
```

---

## Database Issues

### Connection Pool Exhausted

**Symptoms:**

- "Too many connections" errors
- Database queries timing out
- Application becoming unresponsive

**Diagnosis:**

```bash
# Check current connections
psql -h $DB_HOST -U hasivu_admin -d hasivu_production -c "
SELECT count(*) as total_connections,
       count(*) filter (where state = 'active') as active_connections,
       count(*) filter (where state = 'idle') as idle_connections
FROM pg_stat_activity;"

# Check connection limits
psql -h $DB_HOST -U hasivu_admin -d hasivu_production -c "SHOW max_connections;"

# Check long-running queries
psql -h $DB_HOST -U hasivu_admin -d hasivu_production -c "
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '30 seconds'
ORDER BY duration DESC;"
```

**Solutions:**

```bash
# Kill long-running queries
psql -h $DB_HOST -U hasivu_admin -d hasivu_production -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '5 minutes';"

# Increase connection pool size
kubectl patch configmap hasivu-config -n production -p '{"data":{"database-pool-size":"20","database-pool-max":"50"}}'

# Restart application pods
kubectl rollout restart deployment/hasivu-web -n production
```

### Slow Query Performance

**Symptoms:**

- API responses slow (>2 seconds)
- Database CPU usage high
- User complaints about slowness

**Diagnosis:**

```bash
# Identify slow queries
psql -h $DB_HOST -U hasivu_admin -d hasivu_production -c "
SELECT query, calls, mean_time, rows
FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY mean_time DESC
LIMIT 10;"

# Check index usage
psql -h $DB_HOST -U hasivu_admin -d hasivu_production -c "
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY idx_tup_read DESC;"

# Check table bloat
psql -h $DB_HOST -U hasivu_admin -d hasivu_production -c "
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
       pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as data_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;"
```

**Solutions:**

```bash
# Add missing indexes
psql -h $DB_HOST -U hasivu_admin -d hasivu_production -c "
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_status
ON orders(user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_items_school_available
ON menu_items(school_id, available) WHERE available = true;"

# Update statistics
psql -h $DB_HOST -U hasivu_admin -d hasivu_production -c "ANALYZE;"

# Vacuum tables
psql -h $DB_HOST -U hasivu_admin -d hasivu_production -c "VACUUM ANALYZE;"
```

### Database Lock Conflicts

**Symptoms:**

- Transactions failing with lock timeouts
- Deadlock detected errors
- Application hanging

**Diagnosis:**

```bash
# Check for locks
psql -h $DB_HOST -U hasivu_admin -d hasivu_production -c "
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.usename AS blocked_user,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.usename AS blocking_user,
       blocked_activity.query AS blocked_query,
       blocking_activity.query AS blocking_query
FROM pg_locks blocked_locks
JOIN pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_locks blocking_locks
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;"

# Check deadlock history
psql -h $DB_HOST -U hasivu_admin -d hasivu_production -c "
SELECT * FROM pg_stat_database_conflicts
WHERE datname = 'hasivu_production';"
```

**Solutions:**

```bash
# Kill blocking queries
psql -h $DB_HOST -U hasivu_admin -d hasivu_production -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid IN (
    SELECT DISTINCT blocking_pid
    FROM blocking_queries_view
);"

# Reduce transaction isolation level if appropriate
# Add retry logic in application code

# Optimize query order to reduce lock conflicts
```

---

## API Gateway Issues

### 429 Too Many Requests

**Symptoms:**

- Rate limit exceeded errors
- Users unable to access application

**Diagnosis:**

```bash
# Check rate limit metrics
aws cloudwatch get-metric-statistics \
  --namespace "AWS/ApiGateway" \
  --metric-name "Count" \
  --dimensions Name=ApiName,Value=hasivu-production \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum

# Check throttle metrics
aws cloudwatch get-metric-statistics \
  --namespace "AWS/ApiGateway" \
  --metric-name "ThrottleCount" \
  --dimensions Name=ApiName,Value=hasivu-production \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

**Solutions:**

```bash
# Increase rate limits
aws apigateway update-usage-plan \
  --usage-plan-id $USAGE_PLAN_ID \
  --throttle-settings burstLimit=2000,rateLimit=1000

# Implement request queuing
# Add exponential backoff in client applications

# Check for abusive traffic patterns
aws waf list-logging-configurations
```

### CORS Errors

**Symptoms:**

- Browser blocking API requests
- "Access-Control-Allow-Origin" errors

**Diagnosis:**

```bash
# Test CORS headers
curl -H "Origin: https://app.hasivu.edu.in" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS https://api.hasivu.edu.in/health \
     -v

# Check API Gateway CORS configuration
aws apigateway get-rest-api --rest-api-id $API_ID
```

**Solutions:**

```bash
# Update CORS configuration in API Gateway
aws apigateway update-integration-response \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters '{
    "method.response.header.Access-Control-Allow-Origin": "'*'",
    "method.response.header.Access-Control-Allow-Methods": "'GET,POST,PUT,DELETE,OPTIONS'",
    "method.response.header.Access-Control-Allow-Headers": "'Content-Type,Authorization,X-Amz-Date,X-Api-Key'"
  }'

# Update Lambda function CORS headers
# Ensure consistent CORS configuration across all endpoints
```

---

## Lambda Function Issues

### Function Timeouts

**Symptoms:**

- 504 Gateway Timeout errors
- Functions taking longer than expected

**Diagnosis:**

```bash
# Check function timeout settings
aws lambda get-function-configuration \
  --function-name hasivu-platform-api-orders

# Check CloudWatch logs for timeout errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/hasivu-platform-api-orders \
  --filter-pattern "Task timed out" \
  --start-time $(date -u -d '1 hour ago' +%s000)

# Check function duration metrics
aws cloudwatch get-metric-statistics \
  --namespace "AWS/Lambda" \
  --metric-name "Duration" \
  --dimensions Name=FunctionName,Value=hasivu-platform-api-orders \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Maximum
```

**Solutions:**

```bash
# Increase timeout
aws lambda update-function-configuration \
  --function-name hasivu-platform-api-orders \
  --timeout 60

# Increase memory allocation
aws lambda update-function-configuration \
  --function-name hasivu-platform-api-orders \
  --memory-size 2048

# Optimize function code
# Add early returns for invalid requests
# Implement caching for expensive operations
```

### Cold Start Issues

**Symptoms:**

- First request after inactivity is slow
- Inconsistent response times

**Diagnosis:**

```bash
# Check cold start frequency
aws logs filter-log-events \
  --log-group-name /aws/lambda/hasivu-platform-api-orders \
  --filter-pattern "INIT_START" \
  --start-time $(date -u -d '1 hour ago' +%s000) | wc -l

# Check provisioned concurrency settings
aws lambda get-provisioned-concurrency-config \
  --function-name hasivu-platform-api-orders
```

**Solutions:**

```bash
# Enable provisioned concurrency
aws lambda put-provisioned-concurrency-config \
  --function-name hasivu-platform-api-orders \
  --qualifier $LATEST \
  --provisioned-concurrent-executions 5

# Optimize package size
# Remove unnecessary dependencies
npm prune --production

# Use warmer function for critical paths
```

### Memory Issues

**Symptoms:**

- Functions running out of memory
- "Process exited before completing request" errors

**Diagnosis:**

```bash
# Check memory usage metrics
aws cloudwatch get-metric-statistics \
  --namespace "AWS/Lambda" \
  --metric-name "MemoryUsage" \
  --dimensions Name=FunctionName,Value=hasivu-platform-api-orders \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Maximum

# Check function logs for memory errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/hasivu-platform-api-orders \
  --filter-pattern "MemoryError|OutOfMemory" \
  --start-time $(date -u -d '1 hour ago' +%s000)
```

**Solutions:**

```bash
# Increase memory allocation
aws lambda update-function-configuration \
  --function-name hasivu-platform-api-orders \
  --memory-size 2048

# Optimize memory usage in code
# Process data in streams instead of loading everything into memory
# Use efficient data structures

# Implement pagination for large datasets
```

---

## Authentication Issues

### JWT Token Expired

**Symptoms:**

- 401 Unauthorized errors
- Users being logged out unexpectedly

**Diagnosis:**

```bash
# Check token expiration settings
aws secretsmanager get-secret-value \
  --secret-id hasivu/jwt-secret \
  --query 'SecretString' --output text | jq .expiration

# Check token refresh logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/hasivu-platform-api-auth \
  --filter-pattern "TOKEN_EXPIRED" \
  --start-time $(date -u -d '1 hour ago' +%s000)
```

**Solutions:**

```bash
# Update JWT expiration settings
kubectl patch configmap hasivu-config -n production -p '{"data":{"jwt-expiration":"2h","jwt-refresh-expiration":"7d"}}'

# Implement automatic token refresh in frontend
# Add token refresh endpoint monitoring

# Clear expired tokens from cache
redis-cli -h $REDIS_HOST KEYS "token:*" | xargs redis-cli DEL
```

### Invalid Token Errors

**Symptoms:**

- Authentication failures
- Users unable to access protected resources

**Diagnosis:**

```bash
# Check JWT secret consistency
# Verify token format in logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/hasivu-platform-api-auth \
  --filter-pattern "INVALID_TOKEN" \
  --start-time $(date -u -d '1 hour ago' +%s000)

# Check for token tampering
# Verify signature validation
```

**Solutions:**

```bash
# Rotate JWT secret if compromised
aws secretsmanager update-secret \
  --secret-id hasivu/jwt-secret \
  --secret-string '{"secret":"NEW_SECRET_KEY","expiration":"2h"}'

# Force logout all users (temporary measure)
redis-cli -h $REDIS_HOST FLUSHDB

# Update frontend with new token validation logic
```

---

## Payment Issues

### Payment Gateway Down

**Symptoms:**

- Payment processing failures
- Razorpay API errors

**Diagnosis:**

```bash
# Check Razorpay service status
curl -f https://api.razorpay.com/v1/health

# Check webhook delivery
aws logs filter-log-events \
  --log-group-name /aws/lambda/hasivu-payment-webhook \
  --filter-pattern "WEBHOOK_FAILED" \
  --start-time $(date -u -d '1 hour ago' +%s000)

# Check payment failure rates
aws cloudwatch get-metric-statistics \
  --namespace "HASIVU/Payments" \
  --metric-name "PaymentFailures" \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

**Solutions:**

```bash
# Switch to secondary payment gateway if available
kubectl patch configmap hasivu-config -n production -p '{"data":{"payment-gateway":"stripe"}}'

# Implement payment retry logic
# Notify users of payment processing delays

# Contact Razorpay support
```

### Webhook Signature Verification Failed

**Symptoms:**

- Webhook processing failures
- Payments not being confirmed

**Diagnosis:**

```bash
# Check webhook secret configuration
aws secretsmanager get-secret-value \
  --secret-id hasivu/razorpay-webhook-secret

# Verify webhook signature validation code
# Check webhook payload format
aws logs filter-log-events \
  --log-group-name /aws/lambda/hasivu-payment-webhook \
  --filter-pattern "SIGNATURE_VERIFICATION_FAILED" \
  --start-time $(date -u -d '1 hour ago' +%s000)
```

**Solutions:**

```bash
# Update webhook secret
aws secretsmanager update-secret \
  --secret-id hasivu/razorpay-webhook-secret \
  --secret-string "NEW_WEBHOOK_SECRET"

# Verify webhook endpoint URL in Razorpay dashboard
# Implement webhook retry mechanism

# Manually process failed payments
```

---

## RFID System Issues

### RFID Reader Offline

**Symptoms:**

- Card verification failures
- Readers not responding

**Diagnosis:**

```bash
# Check reader status
aws iot list-things --thing-group-name hasivu-rfid-readers

# Check reader connectivity
aws iot get-thing-shadow \
  --thing-name reader_001 \
  --query 'payload.state.reported.status'

# Check RFID service logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/hasivu-rfid-verify \
  --filter-pattern "READER_OFFLINE" \
  --start-time $(date -u -d '1 hour ago' +%s000)
```

**Solutions:**

```bash
# Restart RFID readers
aws iot update-thing-shadow \
  --thing-name reader_001 \
  --payload '{"state":{"desired":{"restart":true}}}'

# Check network connectivity
# Replace faulty readers

# Implement reader redundancy
```

### Card Verification Errors

**Symptoms:**

- Valid cards being rejected
- Invalid cards being accepted

**Diagnosis:**

```bash
# Check card database
psql -h $DB_HOST -U hasivu_admin -d hasivu_production -c "
SELECT id, card_number, is_active, expiry_date
FROM rfid_cards
WHERE last_used > NOW() - INTERVAL '1 hour';"

# Check verification algorithm
# Verify card format validation
aws logs filter-log-events \
  --log-group-name /aws/lambda/hasivu-rfid-verify \
  --filter-pattern "VERIFICATION_FAILED" \
  --start-time $(date -u -d '1 hour ago' +%s000)
```

**Solutions:**

```bash
# Update card database
# Recalibrate readers
# Update verification algorithm

# Implement manual card verification override
```

---

## Performance Issues

### High Latency

**Symptoms:**

- Slow API responses
- User complaints about performance

**Diagnosis:**

```bash
# Check API latency metrics
aws cloudwatch get-metric-statistics \
  --namespace "HASIVU/API" \
  --metric-name "Latency" \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average

# Check database query performance
psql -h $DB_HOST -U hasivu_admin -d hasivu_production -c "
SELECT query, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 5;"

# Check Redis performance
redis-cli -h $REDIS_HOST INFO stats
```

**Solutions:**

```bash
# Scale up resources
kubectl scale deployment hasivu-web --replicas=8 -n production

# Add database indexes
psql -h $DB_HOST -U hasivu_admin -d hasivu_production -f scripts/add-performance-indexes.sql

# Clear caches
redis-cli -h $REDIS_HOST FLUSHALL

# Enable query result caching
```

### Memory Leaks

**Symptoms:**

- Gradual performance degradation
- Increasing memory usage over time

**Diagnosis:**

```bash
# Check memory usage trends
aws cloudwatch get-metric-statistics \
  --namespace "HASIVU/Application" \
  --metric-name "MemoryUsage" \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average

# Check for memory leaks in application code
# Review heap dump if available

# Monitor garbage collection
kubectl logs deployment/hasivu-web -n production | grep "GC"
```

**Solutions:**

```bash
# Restart application pods
kubectl rollout restart deployment/hasivu-web -n production

# Update to latest stable version
kubectl set image deployment/hasivu-web hasivu-web=hasivu/platform:v2.1.0

# Implement memory monitoring
# Add memory limits and requests
```

---

## Monitoring & Alerting Issues

### Missing Alerts

**Symptoms:**

- Issues not being detected
- No notifications for problems

**Diagnosis:**

```bash
# Check CloudWatch alarm status
aws cloudwatch describe-alarms --alarm-name-prefix "HASIVU"

# Verify alarm configurations
aws cloudwatch describe-alarms \
  --alarm-names "HASIVU-HighErrorRate" \
  --query 'MetricAlarms[0].{State:StateValue,Reason:StateReason}'

# Check SNS topic subscriptions
aws sns list-subscriptions-by-topic \
  --topic-arn $SNS_TOPIC_ARN
```

**Solutions:**

```bash
# Recreate missing alarms
aws cloudwatch put-metric-alarm \
  --alarm-name "HASIVU-HighErrorRate" \
  --alarm-description "High error rate detected" \
  --metric-name "ErrorRate" \
  --namespace "HASIVU/API" \
  --statistic "Average" \
  --period 300 \
  --threshold 5 \
  --comparison-operator "GreaterThanThreshold"

# Update SNS subscriptions
aws sns subscribe \
  --topic-arn $SNS_TOPIC_ARN \
  --protocol email \
  --notification-endpoint alerts@hasivu.edu.in
```

### False Positive Alerts

**Symptoms:**

- Too many unnecessary alerts
- Alert fatigue

**Diagnosis:**

```bash
# Review alert thresholds
aws cloudwatch describe-alarms \
  --query 'MetricAlarms[?StateValue==`ALARM`].[AlarmName,MetricName,Threshold]'

# Check alert patterns
# Analyze historical alert data
```

**Solutions:**

```bash
# Adjust alert thresholds
aws cloudwatch put-metric-alarm \
  --alarm-name "HASIVU-HighLatency" \
  --threshold 3000  # Increase from 2000ms

# Implement alert suppression
# Add alert cooldown periods

# Create alert escalation policies
```

---

## Infrastructure Issues

### Network Connectivity Problems

**Symptoms:**

- Intermittent connection failures
- Service discovery issues

**Diagnosis:**

```bash
# Check network connectivity
kubectl run test-network --rm -i --restart=Never --image=busybox -- wget -O- app.hasivu.svc.cluster.local/health

# Check DNS resolution
nslookup api.hasivu.edu.in

# Verify load balancer health
aws elbv2 describe-target-health \
  --target-group-arn $TARGET_GROUP_ARN
```

**Solutions:**

```bash
# Restart network components
kubectl delete pod -l app=hasivu-web

# Update DNS records
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://dns-update.json

# Check load balancer configuration
aws elbv2 modify-target-group \
  --target-group-arn $TARGET_GROUP_ARN \
  --health-check-path /health
```

### Disk Space Issues

**Symptoms:**

- Application crashes due to no space
- Log rotation failures

**Diagnosis:**

```bash
# Check disk usage
df -h

# Check log file sizes
find /var/log -name "*.log" -size +100M

# Check database disk usage
psql -h $DB_HOST -U hasivu_admin -d hasivu_production -c "
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;"
```

**Solutions:**

```bash
# Clean up old log files
find /var/log -name "*.log" -mtime +30 -delete

# Archive old data
pg_dump -h $DB_HOST -U hasivu_admin -d hasivu_production \
  --table orders --where "created_at < NOW() - INTERVAL '1 year'" \
  > orders_archive.sql

# Add disk space monitoring
# Implement log rotation
```

---

## Quick Reference Commands

### Health Checks

```bash
# System health
curl -f https://api.hasivu.edu.in/health

# Database health
psql -h $DB_HOST -U hasivu_admin -d hasivu_production -c "SELECT 1;"

# Redis health
redis-cli -h $REDIS_HOST ping

# Application pods
kubectl get pods -n production
```

### Log Analysis

```bash
# Recent errors
kubectl logs deployment/hasivu-web -n production --since=1h | grep -i error

# API latency
aws logs filter-log-events --log-group-name /aws/lambda/hasivu-platform-api-orders --filter-pattern "duration"

# Database slow queries
psql -h $DB_HOST -U hasivu_admin -d hasivu_production -c "
SELECT query, calls, mean_time
FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY mean_time DESC
LIMIT 5;"
```

### Emergency Commands

```bash
# Scale application
kubectl scale deployment hasivu-web --replicas=10 -n production

# Restart all pods
kubectl rollout restart deployment/hasivu-web -n production

# Clear Redis cache
redis-cli -h $REDIS_HOST FLUSHALL

# Force database reconnection
kubectl rollout restart deployment/hasivu-web -n production
```

---

**Document Version**: 1.0
**Last Updated**: 2025-01-07
**Review Frequency**: Monthly
**Document Owner**: DevOps Team
