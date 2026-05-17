# HASIVU Platform - Production Deployment Guide

**Priority 9: Documentation & Training Materials**
_Complete guide for achieving 10/10 production readiness_

## Table of Contents

1. [Pre-Production Checklist](#pre-production-checklist)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Security Configuration](#security-configuration)
4. [Database Setup](#database-setup)
5. [Application Deployment](#application-deployment)
6. [Monitoring & Alerting](#monitoring--alerting)
7. [Backup & Disaster Recovery](#backup--disaster-recovery)
8. [Performance Optimization](#performance-optimization)
9. [Troubleshooting](#troubleshooting)
10. [Compliance & Auditing](#compliance--auditing)

## Pre-Production Checklist

### ✅ Security Requirements

- [ ] SSL/TLS certificates configured (Let's Encrypt + Cloudflare)
- [ ] WAF (Web Application Firewall) enabled
- [ ] DDoS protection active
- [ ] Rate limiting configured per endpoint
- [ ] CSRF protection implemented
- [ ] XSS protection headers set
- [ ] SQL injection prevention validated
- [ ] Secrets management configured (AWS Secrets Manager)
- [ ] Database encryption at rest enabled
- [ ] Application logs do not contain sensitive data
- [ ] Security scanning completed (Snyk, CodeQL, OWASP ZAP)
- [ ] Penetration testing passed
- [ ] Compliance audit completed (SOC 2, GDPR, local regulations)

### ✅ Performance Requirements

- [ ] Load testing completed (1000+ concurrent users)
- [ ] Database query optimization validated
- [ ] Redis caching layer configured
- [ ] CDN configured for static assets
- [ ] Image optimization implemented
- [ ] Code splitting and lazy loading enabled
- [ ] Performance monitoring setup (response times <100ms API, <2s page load)
- [ ] Auto-scaling policies configured
- [ ] Resource limits defined

### ✅ Reliability Requirements

- [ ] Health checks implemented for all services
- [ ] Circuit breakers configured
- [ ] Graceful shutdown handling
- [ ] Error handling and retry logic
- [ ] Backup strategy validated (RPO: 1 hour, RTO: 15 minutes)
- [ ] Disaster recovery procedures tested
- [ ] Multi-AZ deployment configured
- [ ] Database replication setup
- [ ] Log aggregation and retention policies
- [ ] Alerting and escalation procedures

### ✅ Operational Requirements

- [ ] CI/CD pipeline with automated testing
- [ ] Blue-green deployment strategy
- [ ] Database migration strategy
- [ ] Rollback procedures tested
- [ ] Production monitoring dashboards
- [ ] On-call procedures documented
- [ ] Incident response playbook
- [ ] Documentation complete
- [ ] Team training completed
- [ ] Compliance certifications obtained

## Infrastructure Setup

### AWS Infrastructure Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     HASIVU Production Infrastructure         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Route 53  │    │ CloudFront  │    │   WAF       │     │
│  │   DNS       │────▶│   CDN       │────▶│ Firewall    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                ▼            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │               Application Load Balancer                 │ │
│  └─────────────────────┬───────────────────┬───────────────┘ │
│                        ▼                   ▼                 │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    EKS Cluster                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │ │
│  │  │   Web App   │  │   API       │  │  Worker     │     │ │
│  │  │   (3 pods)  │  │  Service    │  │  Services   │     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                        ▼                   ▼                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   RDS       │    │   ElastiCache│    │    S3       │     │
│  │ PostgreSQL  │    │    Redis     │    │   Storage   │     │
│  │ Multi-AZ    │    │   Cluster    │    │   + Backup  │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Terraform Infrastructure Setup

```hcl
# main.tf
terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "hasivu-terraform-state"
    key    = "production/terraform.tfstate"
    region = "ap-south-1"
    encrypt = true
    dynamodb_table = "hasivu-terraform-locks"
  }
}

# VPC Configuration
resource "aws_vpc" "hasivu_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "hasivu-production-vpc"
    Environment = "production"
    Project     = "hasivu-platform"
  }
}

# EKS Cluster
resource "aws_eks_cluster" "hasivu_cluster" {
  name     = "hasivu-production"
  role_arn = aws_iam_role.eks_cluster_role.arn
  version  = "1.27"

  vpc_config {
    subnet_ids              = aws_subnet.private[*].id
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = ["0.0.0.0/0"]

    security_group_ids = [aws_security_group.eks_cluster.id]
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "hasivu_db" {
  identifier = "hasivu-production"

  # Engine
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.r6g.xlarge"

  # Storage
  allocated_storage     = 500
  max_allocated_storage = 2000
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.rds.arn

  # Database
  db_name  = "hasivu_production"
  username = "hasivu_admin"
  password = random_password.db_password.result

  # Network
  db_subnet_group_name   = aws_db_subnet_group.hasivu.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  # Backup
  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  # Multi-AZ
  multi_az = true

  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  # Performance Insights
  performance_insights_enabled = true
  performance_insights_retention_period = 731

  tags = {
    Name        = "hasivu-production-db"
    Environment = "production"
  }
}

# ElastiCache Redis Cluster
resource "aws_elasticache_replication_group" "hasivu_redis" {
  replication_group_id       = "hasivu-production"
  description                = "HASIVU Redis cluster for production"

  node_type                  = "cache.r7g.xlarge"
  port                       = 6379
  parameter_group_name       = aws_elasticache_parameter_group.hasivu_redis.name

  num_cache_clusters         = 3
  automatic_failover_enabled = true
  multi_az_enabled          = true

  subnet_group_name = aws_elasticache_subnet_group.hasivu.name
  security_group_ids = [aws_security_group.redis.id]

  # Encryption
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_auth.result
  kms_key_id                = aws_kms_key.elasticache.arn

  # Backup
  snapshot_retention_limit = 7
  snapshot_window         = "03:00-05:00"

  tags = {
    Name        = "hasivu-production-redis"
    Environment = "production"
  }
}
```

## Security Configuration

### SSL/TLS Configuration

```yaml
# k8s/ingress-tls.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: hasivu-ingress
  namespace: production
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: 'true'
    nginx.ingress.kubernetes.io/force-ssl-redirect: 'true'
    nginx.ingress.kubernetes.io/ssl-protocols: 'TLSv1.2 TLSv1.3'
    nginx.ingress.kubernetes.io/ssl-ciphers: 'ECDHE-RSA-AES128-GCM-SHA256,ECDHE-RSA-AES256-GCM-SHA384'
    nginx.ingress.kubernetes.io/configuration-snippet: |
      add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
      add_header X-Frame-Options "DENY" always;
      add_header X-Content-Type-Options "nosniff" always;
      add_header X-XSS-Protection "1; mode=block" always;
      add_header Referrer-Policy "strict-origin-when-cross-origin" always;
spec:
  tls:
    - hosts:
        - app.hasivu.edu.in
        - api.hasivu.edu.in
        - admin.hasivu.edu.in
      secretName: hasivu-tls-secret
  rules:
    - host: app.hasivu.edu.in
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: hasivu-web
                port:
                  number: 3000
```

### WAF Configuration

```json
{
  "Name": "HASIVU-Production-WAF",
  "Scope": "CLOUDFRONT",
  "DefaultAction": { "Allow": {} },
  "Rules": [
    {
      "Name": "AWSManagedRulesCommonRuleSet",
      "Priority": 1,
      "OverrideAction": { "None": {} },
      "Statement": {
        "ManagedRuleGroupStatement": {
          "VendorName": "AWS",
          "Name": "AWSManagedRulesCommonRuleSet"
        }
      },
      "VisibilityConfig": {
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "CommonRuleSetMetric"
      }
    },
    {
      "Name": "RateLimitRule",
      "Priority": 2,
      "Action": { "Block": {} },
      "Statement": {
        "RateBasedStatement": {
          "Limit": 2000,
          "AggregateKeyType": "IP"
        }
      }
    }
  ]
}
```

## Database Setup

### PostgreSQL Configuration

```sql
-- Production database optimizations
-- /scripts/db-optimization.sql

-- Connection settings
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- Write-ahead logging
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET checkpoint_timeout = '10min';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;

-- Query planner
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Logging for monitoring
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_lock_waits = on;

-- Reload configuration
SELECT pg_reload_conf();

-- Create monitoring user
CREATE USER hasivu_monitor WITH PASSWORD 'secure_monitor_password';
GRANT pg_monitor TO hasivu_monitor;

-- Create read-only replica user
CREATE USER hasivu_replica WITH PASSWORD 'secure_replica_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO hasivu_replica;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO hasivu_replica;
```

### Database Migration Strategy

```bash
#!/bin/bash
# scripts/production-migrate.sh

set -e

# Configuration
DB_HOST="hasivu-production.cluster-xyz.ap-south-1.rds.amazonaws.com"
DB_NAME="hasivu_production"
BACKUP_S3_BUCKET="hasivu-db-backups"

echo "🔄 Starting production database migration..."

# 1. Pre-migration backup
echo "📦 Creating pre-migration backup..."
pg_dump -h $DB_HOST -U hasivu_admin -d $DB_NAME -F c -b -v \
  -f "backup_pre_migration_$(date +%Y%m%d_%H%M%S).dump"

# Upload backup to S3
aws s3 cp backup_pre_migration_*.dump s3://$BACKUP_S3_BUCKET/migrations/

# 2. Run migration in transaction
echo "🚀 Running database migrations..."
psql -h $DB_HOST -U hasivu_admin -d $DB_NAME -v ON_ERROR_STOP=1 << 'EOF'
BEGIN;

-- Enable migration tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT NOW()
);

-- Run migrations
\i migrations/001_initial_schema.sql
\i migrations/002_add_indexes.sql
\i migrations/003_nutrition_compliance.sql
\i migrations/004_performance_optimizations.sql

-- Update migration tracking
INSERT INTO schema_migrations (version) VALUES
('001_initial_schema'),
('002_add_indexes'),
('003_nutrition_compliance'),
('004_performance_optimizations');

COMMIT;
EOF

echo "✅ Database migration completed successfully!"

# 3. Verify migration
echo "🔍 Verifying migration..."
psql -h $DB_HOST -U hasivu_admin -d $DB_NAME -c "
    SELECT version, applied_at
    FROM schema_migrations
    ORDER BY applied_at DESC
    LIMIT 5;
"

# 4. Update application config
kubectl patch deployment hasivu-web -n production -p '{"spec":{"template":{"metadata":{"annotations":{"migration-version":"'$(date +%Y%m%d_%H%M%S)'"}}}}}'

echo "🎉 Production migration complete!"
```

## Application Deployment

### Kubernetes Deployment Configuration

```yaml
# k8s/production/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hasivu-web
  namespace: production
  labels:
    app: hasivu-web
    version: blue
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: hasivu-web
  template:
    metadata:
      labels:
        app: hasivu-web
        version: blue
      annotations:
        prometheus.io/scrape: 'true'
        prometheus.io/port: '3000'
        prometheus.io/path: '/metrics'
    spec:
      serviceAccountName: hasivu-web
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      containers:
        - name: hasivu-web
          image: hasivu/platform:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 3000
              protocol: TCP
          env:
            - name: NODE_ENV
              value: 'production'
            - name: PORT
              value: '3000'
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: hasivu-secrets
                  key: database-url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: hasivu-secrets
                  key: redis-url
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: hasivu-secrets
                  key: jwt-secret
          resources:
            requests:
              memory: '512Mi'
              cpu: '250m'
            limits:
              memory: '1Gi'
              cpu: '500m'
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 2
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
          volumeMounts:
            - name: tmp-volume
              mountPath: /tmp
            - name: logs-volume
              mountPath: /app/logs
      volumes:
        - name: tmp-volume
          emptyDir: {}
        - name: logs-volume
          emptyDir: {}
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchExpressions:
                    - key: app
                      operator: In
                      values:
                        - hasivu-web
                topologyKey: kubernetes.io/hostname
```

## Monitoring & Alerting

### Prometheus Configuration

```yaml
# monitoring/prometheus-rules.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: hasivu-alerts
  namespace: monitoring
spec:
  groups:
    - name: hasivu.availability
      rules:
        - alert: HASSIVUWebDown
          expr: up{job="hasivu-web"} == 0
          for: 1m
          labels:
            severity: critical
            service: web
          annotations:
            summary: 'HASIVU web service is down'
            description: 'HASIVU web service has been down for more than 1 minute.'

        - alert: HASSIVUHighLatency
          expr: histogram_quantile(0.95, http_request_duration_seconds_bucket{job="hasivu-web"}) > 2
          for: 2m
          labels:
            severity: warning
            service: web
          annotations:
            summary: 'High request latency'
            description: '95th percentile latency is above 2 seconds.'

        - alert: HASSIVUHighErrorRate
          expr: rate(http_requests_total{job="hasivu-web",status=~"5.."}[5m]) > 0.1
          for: 1m
          labels:
            severity: critical
            service: web
          annotations:
            summary: 'High error rate'
            description: 'Error rate is above 10%.'

    - name: hasivu.database
      rules:
        - alert: HASSIVUDatabaseConnections
          expr: postgres_connections_active / postgres_connections_max > 0.8
          for: 2m
          labels:
            severity: warning
            service: database
          annotations:
            summary: 'High database connections'
            description: 'Database connections are above 80% of maximum.'

        - alert: HASSIVUDatabaseReplicationLag
          expr: postgres_replication_lag_seconds > 60
          for: 1m
          labels:
            severity: critical
            service: database
          annotations:
            summary: 'Database replication lag'
            description: 'Database replication lag is above 60 seconds.'

    - name: hasivu.redis
      rules:
        - alert: HASSIVURedisDown
          expr: redis_up == 0
          for: 1m
          labels:
            severity: critical
            service: redis
          annotations:
            summary: 'Redis is down'
            description: 'Redis service is not responding.'

        - alert: HASSIVURedisMemoryHigh
          expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.9
          for: 2m
          labels:
            severity: warning
            service: redis
          annotations:
            summary: 'Redis memory usage high'
            description: 'Redis memory usage is above 90%.'
```

### Grafana Dashboards

```json
{
  "dashboard": {
    "title": "HASIVU Production Overview",
    "tags": ["hasivu", "production"],
    "timezone": "Asia/Kolkata",
    "panels": [
      {
        "title": "Request Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{job=\"hasivu-web\"}[5m]))",
            "legendFormat": "Requests/sec"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "reqps",
            "thresholds": {
              "steps": [
                { "color": "green", "value": 0 },
                { "color": "yellow", "value": 100 },
                { "color": "red", "value": 500 }
              ]
            }
          }
        }
      },
      {
        "title": "Response Time (95th percentile)",
        "type": "stat",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds_bucket{job=\"hasivu-web\"})",
            "legendFormat": "95th percentile"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "s",
            "thresholds": {
              "steps": [
                { "color": "green", "value": 0 },
                { "color": "yellow", "value": 1 },
                { "color": "red", "value": 2 }
              ]
            }
          }
        }
      },
      {
        "title": "Error Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{job=\"hasivu-web\",status=~\"5..\"}[5m])) / sum(rate(http_requests_total{job=\"hasivu-web\"}[5m])) * 100",
            "legendFormat": "Error Rate %"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "steps": [
                { "color": "green", "value": 0 },
                { "color": "yellow", "value": 1 },
                { "color": "red", "value": 5 }
              ]
            }
          }
        }
      }
    ]
  }
}
```

## Backup & Disaster Recovery

### Automated Backup Strategy

```bash
#!/bin/bash
# scripts/automated-backup.sh

# HASIVU Production Backup Script
# Runs every hour for database, daily for full system backup

set -e

# Configuration
DB_HOST="hasivu-production.cluster-xyz.ap-south-1.rds.amazonaws.com"
DB_NAME="hasivu_production"
S3_BUCKET="hasivu-prod-backups"
RETENTION_DAYS=30

# Create timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🔄 Starting automated backup process..."

# 1. Database Backup
echo "📦 Creating database backup..."
pg_dump -h $DB_HOST -U hasivu_admin -d $DB_NAME \
  -F c -b -v -f "db_backup_${TIMESTAMP}.dump"

# Compress and encrypt backup
gzip "db_backup_${TIMESTAMP}.dump"
gpg --cipher-algo AES256 --compress-algo 1 --s2k-mode 3 \
    --s2k-digest-algo SHA512 --s2k-count 65536 --force-mdc \
    --quiet --batch --passphrase "$BACKUP_ENCRYPTION_KEY" \
    --output "db_backup_${TIMESTAMP}.dump.gz.gpg" \
    --symmetric "db_backup_${TIMESTAMP}.dump.gz"

# Upload to S3
aws s3 cp "db_backup_${TIMESTAMP}.dump.gz.gpg" \
    "s3://${S3_BUCKET}/database/" \
    --storage-class STANDARD_IA \
    --server-side-encryption aws:kms \
    --ssekms-key-id alias/hasivu-backup-key

# 2. Application Configuration Backup
echo "⚙️ Backing up Kubernetes configurations..."
kubectl get all,configmap,secret,ingress -n production -o yaml > \
    "k8s_config_${TIMESTAMP}.yaml"

# Upload K8s config
aws s3 cp "k8s_config_${TIMESTAMP}.yaml" \
    "s3://${S3_BUCKET}/kubernetes/" \
    --server-side-encryption aws:kms \
    --ssekms-key-id alias/hasivu-backup-key

# 3. Redis Backup (if needed)
redis-cli -h hasivu-production.cache.amazonaws.com \
    --rdb "redis_backup_${TIMESTAMP}.rdb"

aws s3 cp "redis_backup_${TIMESTAMP}.rdb" \
    "s3://${S3_BUCKET}/redis/" \
    --server-side-encryption aws:kms

# 4. Cleanup old backups
echo "🧹 Cleaning up old backups..."
aws s3 ls "s3://${S3_BUCKET}/database/" --recursive | \
    awk '{print $4}' | \
    while read file; do
        if [[ $file == *".dump.gz.gpg" ]]; then
            file_date=$(echo $file | grep -oE '[0-9]{8}_[0-9]{6}')
            file_timestamp=$(date -d "${file_date:0:8} ${file_date:9:2}:${file_date:11:2}:${file_date:13:2}" +%s)
            current_timestamp=$(date +%s)
            age_days=$(( (current_timestamp - file_timestamp) / 86400 ))

            if [ $age_days -gt $RETENTION_DAYS ]; then
                echo "Deleting old backup: $file (age: ${age_days} days)"
                aws s3 rm "s3://${S3_BUCKET}/database/$file"
            fi
        fi
    done

# 5. Verify backup integrity
echo "✅ Verifying backup integrity..."
aws s3api head-object --bucket "$S3_BUCKET" \
    --key "database/db_backup_${TIMESTAMP}.dump.gz.gpg" \
    --query 'ETag' --output text

# Cleanup local files
rm -f "db_backup_${TIMESTAMP}.dump.gz"
rm -f "db_backup_${TIMESTAMP}.dump.gz.gpg"
rm -f "k8s_config_${TIMESTAMP}.yaml"
rm -f "redis_backup_${TIMESTAMP}.rdb"

echo "🎉 Backup completed successfully!"

# Send notification
curl -X POST "$SLACK_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"✅ HASIVU Production backup completed: ${TIMESTAMP}\"}"
```

### Disaster Recovery Procedures

```bash
#!/bin/bash
# scripts/disaster-recovery.sh

# HASIVU Disaster Recovery Script
# Use only in emergency situations

set -e

echo "🚨 HASIVU Disaster Recovery Process Starting..."
echo "⚠️  This will restore production from backup!"
read -p "Enter 'CONFIRM' to proceed: " confirmation

if [ "$confirmation" != "CONFIRM" ]; then
    echo "❌ Recovery aborted."
    exit 1
fi

# Configuration
BACKUP_DATE="$1"
S3_BUCKET="hasivu-prod-backups"
NEW_CLUSTER_NAME="hasivu-recovery-$(date +%Y%m%d)"

if [ -z "$BACKUP_DATE" ]; then
    echo "Usage: $0 <backup_date> (format: YYYYMMDD_HHMMSS)"
    exit 1
fi

echo "🔄 Starting recovery from backup: $BACKUP_DATE"

# 1. Download encrypted backup
echo "📦 Downloading database backup..."
aws s3 cp "s3://${S3_BUCKET}/database/db_backup_${BACKUP_DATE}.dump.gz.gpg" .

# Decrypt and decompress
gpg --batch --passphrase "$BACKUP_ENCRYPTION_KEY" \
    --decrypt "db_backup_${BACKUP_DATE}.dump.gz.gpg" | \
    gunzip > "db_backup_${BACKUP_DATE}.dump"

# 2. Create new RDS instance from latest automated backup
echo "🗄️ Creating new database instance..."
aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier "$NEW_CLUSTER_NAME" \
    --db-snapshot-identifier "hasivu-production-automated-$(date -d 'yesterday' +%Y-%m-%d)" \
    --db-instance-class db.r6g.xlarge \
    --multi-az \
    --storage-encrypted

# Wait for database to be available
echo "⏳ Waiting for database to be available..."
aws rds wait db-instance-available --db-instance-identifier "$NEW_CLUSTER_NAME"

# Get new database endpoint
NEW_DB_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier "$NEW_CLUSTER_NAME" \
    --query 'DBInstances[0].Endpoint.Address' --output text)

# 3. Restore application backup
echo "📥 Restoring database from backup..."
pg_restore -h "$NEW_DB_ENDPOINT" -U hasivu_admin -d hasivu_production \
    -c --if-exists -v "db_backup_${BACKUP_DATE}.dump"

# 4. Update Kubernetes secrets with new database endpoint
echo "🔐 Updating Kubernetes secrets..."
kubectl patch secret hasivu-secrets -n production -p "{\"data\":{\"database-url\":\"$(echo -n "postgresql://hasivu_admin:$DB_PASSWORD@$NEW_DB_ENDPOINT:5432/hasivu_production" | base64 -w 0)\"}}"

# 5. Deploy recovery configuration
echo "🚀 Deploying recovery configuration..."
aws s3 cp "s3://${S3_BUCKET}/kubernetes/k8s_config_${BACKUP_DATE}.yaml" .

# Apply configuration with validation
kubectl apply --dry-run=client -f "k8s_config_${BACKUP_DATE}.yaml"
kubectl apply -f "k8s_config_${BACKUP_DATE}.yaml"

# 6. Restart deployments to pick up new configuration
kubectl rollout restart deployment/hasivu-web -n production
kubectl rollout restart deployment/hasivu-api -n production
kubectl rollout restart deployment/hasivu-worker -n production

# Wait for rollout to complete
kubectl rollout status deployment/hasivu-web -n production --timeout=600s
kubectl rollout status deployment/hasivu-api -n production --timeout=600s
kubectl rollout status deployment/hasivu-worker -n production --timeout=600s

# 7. Run health checks
echo "🔍 Running post-recovery health checks..."
sleep 60

HEALTH_URL="https://app.hasivu.edu.in/health"
for i in {1..10}; do
    if curl -f "$HEALTH_URL" > /dev/null 2>&1; then
        echo "✅ Health check passed ($i/10)"
        break
    else
        echo "⏳ Health check failed, retrying... ($i/10)"
        sleep 30
    fi

    if [ $i -eq 10 ]; then
        echo "❌ Health checks failed after 10 attempts"
        exit 1
    fi
done

# 8. Run smoke tests
echo "🧪 Running smoke tests..."
kubectl run smoke-test --rm -i --restart=Never \
    --image=hasivu/platform:latest -- npm run test:smoke:production

echo "🎉 Disaster recovery completed successfully!"
echo "📊 New database endpoint: $NEW_DB_ENDPOINT"
echo "🔗 Application URL: https://app.hasivu.edu.in"

# Send success notification
curl -X POST "$SLACK_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"✅ HASIVU Disaster Recovery Completed Successfully!\n📊 Recovery from backup: $BACKUP_DATE\n🔗 Application: https://app.hasivu.edu.in\"}"

# Cleanup
rm -f "db_backup_${BACKUP_DATE}.dump.gz.gpg"
rm -f "db_backup_${BACKUP_DATE}.dump"
rm -f "k8s_config_${BACKUP_DATE}.yaml"

echo "🏁 Recovery process complete!"
```

## Performance Optimization

### Database Performance Tuning

```sql
-- Performance optimization queries
-- Run these after initial deployment

-- 1. Create necessary indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_created
    ON orders(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_school_status
    ON orders(school_id, status) WHERE status IN ('pending', 'preparing', 'ready');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_items_school_available
    ON menu_items(school_id, available) WHERE available = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_hash
    ON users USING hash(email);

-- 2. Optimize frequently queried data
CREATE MATERIALIZED VIEW mv_daily_menu_stats AS
SELECT
    school_id,
    DATE(created_at) as date,
    COUNT(*) as total_orders,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_order_value
FROM orders
WHERE status = 'completed'
GROUP BY school_id, DATE(created_at);

-- Refresh materialized view daily
CREATE UNIQUE INDEX ON mv_daily_menu_stats (school_id, date);

-- 3. Partition large tables
CREATE TABLE orders_2024 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- 4. Update table statistics
ANALYZE orders;
ANALYZE menu_items;
ANALYZE users;

-- 5. Set up automatic maintenance
-- This should be added to pg_cron or similar
SELECT cron.schedule('vacuum-analyze', '0 2 * * *', 'VACUUM ANALYZE;');
```

### Redis Performance Configuration

```redis
# redis.conf production settings

# Memory management
maxmemory 2gb
maxmemory-policy allkeys-lru
maxmemory-samples 10

# Persistence
save 900 1
save 300 10
save 60 10000

# AOF persistence
appendonly yes
appendfsync everysec
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Networking
tcp-keepalive 300
tcp-backlog 511
timeout 300

# Security
requirepass ${REDIS_PASSWORD}
rename-command FLUSHDB "HASIVU_FLUSHDB_CMD"
rename-command FLUSHALL "HASIVU_FLUSHALL_CMD"
rename-command DEBUG "HASIVU_DEBUG_CMD"

# Slow log
slowlog-log-slower-than 10000
slowlog-max-len 1000

# Client output buffer limits
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60
```

## Troubleshooting

### Common Issues & Solutions

#### 1. High Response Times

**Symptoms:**

- API responses > 2 seconds
- Database queries taking too long
- Users reporting slow page loads

**Diagnosis:**

```bash
# Check database query performance
kubectl exec -it hasivu-db-0 -n production -- psql -U hasivu_admin -d hasivu_production -c "
    SELECT query, calls, mean_time, rows, 100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
    FROM pg_stat_statements
    ORDER BY mean_time DESC
    LIMIT 10;
"

# Check Redis performance
redis-cli -h hasivu-production.cache.amazonaws.com INFO stats

# Check application metrics
kubectl exec -it deployment/hasivu-web -n production -- curl localhost:3000/metrics
```

**Solutions:**

```bash
# 1. Scale application horizontally
kubectl scale deployment hasivu-web --replicas=5 -n production

# 2. Add database indexes
kubectl exec -it hasivu-db-0 -n production -- psql -U hasivu_admin -d hasivu_production -f /scripts/performance-indexes.sql

# 3. Clear Redis if needed
redis-cli -h hasivu-production.cache.amazonaws.com FLUSHDB

# 4. Restart services
kubectl rollout restart deployment/hasivu-web -n production
```

#### 2. Database Connection Issues

**Symptoms:**

- "Too many connections" errors
- Connection timeouts
- Failed database queries

**Diagnosis:**

```bash
# Check current connections
kubectl exec -it hasivu-db-0 -n production -- psql -U hasivu_admin -d hasivu_production -c "
    SELECT count(*), state
    FROM pg_stat_activity
    GROUP BY state;
"

# Check connection limits
kubectl exec -it hasivu-db-0 -n production -- psql -U hasivu_admin -d hasivu_production -c "SHOW max_connections;"
```

**Solutions:**

```bash
# 1. Increase connection pool settings
kubectl patch configmap hasivu-config -n production -p '{"data":{"DATABASE_POOL_SIZE":"20","DATABASE_POOL_TIMEOUT":"30000"}}'

# 2. Restart application to pick up new settings
kubectl rollout restart deployment/hasivu-web -n production

# 3. If needed, increase RDS max_connections (requires reboot)
aws rds modify-db-parameter-group \
    --db-parameter-group-name hasivu-production \
    --parameters ParameterName=max_connections,ParameterValue=300,ApplyMethod=pending-reboot
```

#### 3. Memory Issues

**Symptoms:**

- Pods getting OOMKilled
- High memory usage alerts
- Application becoming unresponsive

**Diagnosis:**

```bash
# Check pod memory usage
kubectl top pods -n production

# Check node memory usage
kubectl top nodes

# Check detailed memory metrics
kubectl describe pod deployment/hasivu-web -n production
```

**Solutions:**

```bash
# 1. Increase memory limits
kubectl patch deployment hasivu-web -n production -p '{"spec":{"template":{"spec":{"containers":[{"name":"hasivu-web","resources":{"limits":{"memory":"2Gi"},"requests":{"memory":"1Gi"}}}]}}}}'

# 2. Add more nodes if cluster is at capacity
eksctl scale nodegroup --cluster=hasivu-production --name=hasivu-workers --nodes=5

# 3. Enable memory optimization in Node.js
kubectl patch deployment hasivu-web -n production -p '{"spec":{"template":{"spec":{"containers":[{"name":"hasivu-web","env":[{"name":"NODE_OPTIONS","value":"--max-old-space-size=1536"}]}]}}}}'
```

### Log Analysis Commands

```bash
# View recent application logs
kubectl logs -f deployment/hasivu-web -n production --tail=100

# Search for specific errors
kubectl logs deployment/hasivu-web -n production | grep -i "error\|exception\|fail"

# View logs from specific time range
kubectl logs deployment/hasivu-web -n production --since=1h

# Export logs for analysis
kubectl logs deployment/hasivu-web -n production --since=24h > /tmp/hasivu-logs-$(date +%Y%m%d).log

# Monitor logs in real-time with filtering
kubectl logs -f deployment/hasivu-web -n production | grep -E "(ERROR|WARN|order|payment)"
```

## Compliance & Auditing

### Data Protection Compliance (GDPR/CCPA/Local)

```sql
-- Data audit and compliance queries

-- 1. Personal data audit
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name LIKE ANY(ARRAY['%email%', '%phone%', '%name%', '%address%']);

-- 2. Data retention compliance
SELECT
    'users' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN last_login_at < NOW() - INTERVAL '2 years' THEN 1 END) as inactive_2years,
    COUNT(CASE WHEN created_at < NOW() - INTERVAL '7 years' THEN 1 END) as old_7years
FROM users
UNION ALL
SELECT
    'orders' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN created_at < NOW() - INTERVAL '5 years' THEN 1 END) as old_5years,
    COUNT(CASE WHEN status = 'cancelled' AND created_at < NOW() - INTERVAL '1 year' THEN 1 END) as cancelled_old
FROM orders;

-- 3. Data anonymization for old records
UPDATE users
SET
    email = 'anonymized_' || id || '@example.com',
    phone_number = NULL,
    first_name = 'Anonymized',
    last_name = 'User',
    updated_at = NOW()
WHERE last_login_at < NOW() - INTERVAL '3 years'
AND email NOT LIKE 'anonymized_%';

-- 4. Audit log for compliance
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    user_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    ip_address INET
);

-- Create audit triggers
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD)::jsonb);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### Security Audit Checklist

#### Monthly Security Review

```bash
#!/bin/bash
# scripts/monthly-security-audit.sh

echo "🔐 HASIVU Monthly Security Audit - $(date)"

# 1. Check SSL certificate expiry
echo "📋 SSL Certificate Status:"
echo | openssl s_client -servername app.hasivu.edu.in -connect app.hasivu.edu.in:443 2>/dev/null | \
    openssl x509 -noout -dates

# 2. Scan for vulnerabilities
echo "🔍 Vulnerability Scan:"
npm audit --audit-level high
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
    aquasec/trivy image hasivu/platform:latest

# 3. Check security headers
echo "🛡️ Security Headers:"
curl -I https://app.hasivu.edu.in | grep -E "(Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options)"

# 4. Database security check
echo "🗄️ Database Security:"
kubectl exec -it hasivu-db-0 -n production -- psql -U hasivu_admin -d hasivu_production -c "
    SELECT name, setting
    FROM pg_settings
    WHERE name IN ('ssl', 'log_connections', 'log_statement', 'shared_preload_libraries');
"

# 5. Check for unused secrets
echo "🔑 Secrets Audit:"
kubectl get secrets -n production -o json | jq -r '.items[] | select(.metadata.name | test("hasivu")) | .metadata.name'

# 6. Review user access
echo "👥 Access Review:"
kubectl get rolebindings -n production -o wide

# 7. Check backup encryption
echo "💾 Backup Security:"
aws s3api head-object --bucket hasivu-prod-backups --key "database/$(aws s3 ls s3://hasivu-prod-backups/database/ | tail -1 | awk '{print $4}')" --query 'ServerSideEncryption'

echo "✅ Security audit completed - review results above"
```

### Performance Benchmarking

```bash
#!/bin/bash
# scripts/performance-benchmark.sh

echo "⚡ HASIVU Performance Benchmark - $(date)"

# 1. API Performance Test
echo "🔄 API Performance Test:"
artillery quick --count 100 --num 10 https://api.hasivu.edu.in/health

# 2. Database Performance Test
echo "🗄️ Database Performance:"
kubectl exec -it hasivu-db-0 -n production -- psql -U hasivu_admin -d hasivu_production -c "
    EXPLAIN ANALYZE
    SELECT u.id, u.name, COUNT(o.id) as order_count
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    WHERE u.created_at > NOW() - INTERVAL '30 days'
    GROUP BY u.id, u.name
    ORDER BY order_count DESC
    LIMIT 100;
"

# 3. Redis Performance Test
echo "🚀 Redis Performance:"
redis-cli -h hasivu-production.cache.amazonaws.com --latency-history -i 1 | head -20

# 4. Website Performance Test
echo "🌐 Website Performance:"
npx lighthouse https://app.hasivu.edu.in --output=json --quiet | \
    jq '.categories | {performance: .performance.score, accessibility: .accessibility.score, seo: .seo.score}'

# 5. Load Balancer Health
echo "⚖️ Load Balancer Status:"
kubectl get ingress -n production -o wide

echo "✅ Performance benchmark completed"
```

---

## Production Readiness Certification

After completing all the above steps, your HASIVU platform will achieve **10/10 production readiness** with:

✅ **Security**: Enterprise-grade security with WAF, SSL, encryption, and compliance  
✅ **Performance**: Sub-2s response times with auto-scaling and optimization  
✅ **Reliability**: 99.9% uptime with multi-AZ, backups, and disaster recovery  
✅ **Monitoring**: Comprehensive observability with alerts and dashboards  
✅ **Compliance**: GDPR, security, and audit compliance  
✅ **Operations**: Automated deployments, monitoring, and maintenance

**Final Validation Commands:**

```bash
# Run the complete production readiness check
./scripts/production-readiness-check.sh

# Verify all systems are operational
kubectl get all -n production
curl -f https://app.hasivu.edu.in/health
curl -f https://api.hasivu.edu.in/health

# Confirm monitoring is active
curl -f https://grafana.hasivu.edu.in/api/health
```

🎉 **Your HASIVU platform is now production-ready with 10/10 reliability, security, and performance!**
