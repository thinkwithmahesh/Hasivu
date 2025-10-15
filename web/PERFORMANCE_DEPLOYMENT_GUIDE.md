# HASIVU Platform - Performance Deployment Guide

## 🚀 Database Performance Optimizations Implementation Guide

This guide provides step-by-step instructions for deploying the comprehensive database performance optimizations for the HASIVU school meal delivery platform.

## 📋 Pre-Deployment Checklist

### 1. Environment Preparation

- [ ] **PostgreSQL Version**: Ensure PostgreSQL 14+ is installed
- [ ] **Redis Setup**: Redis 6.0+ running and accessible
- [ ] **Node.js Version**: Node.js 18+ for optimal performance
- [ ] **Memory Requirements**:
  - Production: 8GB+ RAM
  - Development: 4GB+ RAM
- [ ] **Disk Space**: 50GB+ SSD storage for optimal I/O performance

### 2. Database Configuration

- [ ] **PostgreSQL Extensions Installed**:

  ```sql
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "pg_trgm";
  CREATE EXTENSION IF NOT EXISTS "btree_gin";
  ```

- [ ] **PostgreSQL Configuration** (postgresql.conf):

  ```ini
  # Memory Settings (adjust based on server specs)
  shared_buffers = 512MB                    # 25% of total RAM
  effective_cache_size = 2GB                # 75% of total RAM
  work_mem = 16MB                           # For sorting/hashing
  maintenance_work_mem = 256MB              # For VACUUM, CREATE INDEX

  # Connection Settings
  max_connections = 200                      # Handle lunch rush

  # Query Planning
  default_statistics_target = 100           # Better query plans
  random_page_cost = 1.1                    # SSD optimization
  seq_page_cost = 1.0                       # SSD optimization
  effective_io_concurrency = 200            # SSD concurrent I/O

  # WAL Settings
  wal_buffers = 16MB
  checkpoint_completion_target = 0.9
  max_wal_size = 2GB
  min_wal_size = 512MB

  # Logging for Performance Monitoring
  log_duration = on
  log_min_duration_statement = 1000         # Log slow queries (>1s)
  log_checkpoints = on
  log_connections = on
  log_lock_waits = on

  # Auto Vacuum Settings
  autovacuum = on
  autovacuum_max_workers = 6
  autovacuum_naptime = 15s
  autovacuum_vacuum_threshold = 25
  autovacuum_analyze_threshold = 10
  ```

### 3. Environment Variables Setup

- [ ] **Database Connection**:

  ```env
  DATABASE_URL=postgresql://user:password@host:5432/hasivu_prod
  ```

- [ ] **Redis Configuration**:

  ```env
  REDIS_URL=redis://user:password@redis-host:6379
  REDIS_HOST=your-redis-host
  REDIS_PORT=6379
  REDIS_PASSWORD=your-redis-password
  REDIS_DB=0
  ```

- [ ] **Performance Settings**:
  ```env
  NODE_ENV=production
  ENABLE_PERFORMANCE_MONITORING=true
  ENABLE_QUERY_LOGGING=true
  CACHE_ENABLED=true
  ```

## 🛠️ Deployment Steps

### Step 1: Database Schema and Optimizations

1. **Apply Database Schema**:

   ```bash
   psql $DATABASE_URL -f database/schema.sql
   ```

2. **Apply Performance Optimizations**:

   ```bash
   psql $DATABASE_URL -f database/performance-optimizations.sql
   ```

3. **Verify Indexes Created**:
   ```sql
   SELECT schemaname, tablename, indexname
   FROM pg_indexes
   WHERE schemaname = 'public'
   AND indexname LIKE 'idx_%'
   ORDER BY tablename, indexname;
   ```

### Step 2: Application Code Deployment

1. **Install Dependencies**:

   ```bash
   npm install ioredis pg
   ```

2. **Deploy Optimized Code**:
   - Copy `lib/cache/redis-menu-cache.ts`
   - Copy `lib/database/optimized-menu-queries.ts`
   - Copy `lib/performance/menu-performance-monitor.ts`
   - Copy `src/app/api/menu/optimized/route.ts`

3. **Build Application**:
   ```bash
   npm run build
   ```

### Step 3: Performance Monitoring Setup

1. **Enable Monitoring**:

   ```bash
   # Add to your startup script
   export ENABLE_PERFORMANCE_MONITORING=true
   ```

2. **Setup Log Rotation**:
   ```bash
   # Configure log rotation for performance logs
   sudo logrotate -d /etc/logrotate.d/hasivu-performance
   ```

### Step 4: Load Testing

1. **Run Load Tests**:

   ```bash
   # Lunch rush simulation
   node scripts/performance-load-test.js --scenario=lunch-rush

   # Search-heavy load test
   node scripts/performance-load-test.js --scenario=search-heavy

   # Mixed workload
   node scripts/performance-load-test.js --scenario=mixed-load

   # Stress test
   node scripts/performance-load-test.js --scenario=stress-test
   ```

2. **Verify Performance Targets**:
   - [ ] Average response time < 200ms during normal load
   - [ ] Average response time < 500ms during lunch rush
   - [ ] Error rate < 1%
   - [ ] Cache hit ratio > 80%
   - [ ] Support 1000+ concurrent users

## 📊 Performance Monitoring Dashboard

### Monitoring Endpoints

1. **Real-time Performance Stats**:

   ```
   PUT /api/menu/optimized?action=performance-stats
   ```

2. **Cache Statistics**:

   ```
   PUT /api/menu/optimized?action=cache-stats
   ```

3. **Health Check**:
   ```
   PUT /api/menu/optimized?action=health-check
   ```

### Key Performance Indicators (KPIs)

#### Response Time Targets

- **Excellent**: < 200ms average
- **Good**: 200-500ms average
- **Fair**: 500ms-1s average
- **Poor**: > 1s average

#### Cache Performance Targets

- **Excellent**: > 80% hit ratio
- **Good**: 60-80% hit ratio
- **Fair**: 40-60% hit ratio
- **Poor**: < 40% hit ratio

#### Error Rate Targets

- **Excellent**: < 0.5%
- **Good**: 0.5-1%
- **Fair**: 1-2%
- **Poor**: > 2%

#### Throughput Targets

- **Normal Load**: 50-100 RPS
- **Lunch Rush**: 200-500 RPS
- **Peak Capacity**: 1000+ RPS

## 🔧 Production Optimization Settings

### Database Connection Pool

```typescript
// Optimized for lunch rush
max: 20,                    // Maximum connections
min: 5,                     // Minimum connections
idleTimeoutMillis: 30000,   // Close idle connections after 30s
connectionTimeoutMillis: 5000, // Wait 5s for connection
statement_timeout: 10000,   // 10s query timeout
```

### Redis Cache Configuration

```typescript
// Cache TTL settings optimized for school meal patterns
MENU_LIST: 3600,          // 1 hour - menu changes infrequently
POPULAR_ITEMS: 900,       // 15 minutes - popularity changes during lunch
SEARCH_RESULTS: 1800,     // 30 minutes - search results
LUNCH_MENU: 1800,         // 30 minutes - lunch period specific
```

### Auto-scaling Triggers

- **Scale up**: CPU > 70% for 5 minutes OR Response time > 500ms for 2 minutes
- **Scale down**: CPU < 30% for 15 minutes AND Response time < 200ms for 10 minutes

## 🚨 Alert Configuration

### Critical Alerts (Immediate Action)

- Response time > 1000ms
- Error rate > 2%
- Database connection pool exhausted
- Redis unavailable
- Memory usage > 80%

### Warning Alerts (Monitor Closely)

- Response time > 500ms for > 5 minutes
- Error rate > 1%
- Cache hit ratio < 60%
- Concurrent users > 1200

### Informational Alerts

- Lunch rush started/ended
- Performance degradation during peak hours
- Slow query detected (> 1s)

## 📈 Performance Baseline Expectations

### Normal Operations (Outside Lunch Rush)

- **Response Time**: 100-200ms average
- **Throughput**: 50-100 RPS
- **Cache Hit Ratio**: 85-95%
- **Error Rate**: < 0.5%
- **Concurrent Users**: 50-200

### Lunch Rush Performance (11:30 AM - 1:30 PM)

- **Response Time**: 200-400ms average
- **Throughput**: 200-500 RPS
- **Cache Hit Ratio**: 80-90%
- **Error Rate**: < 1%
- **Concurrent Users**: 500-1000+

## 🔍 Troubleshooting Guide

### High Response Times

1. Check database connection pool utilization
2. Verify cache hit ratios
3. Check for slow queries in logs
4. Monitor server resource utilization
5. Review index usage statistics

### Low Cache Hit Ratios

1. Verify Redis connectivity
2. Check cache key patterns
3. Review TTL settings
4. Monitor cache eviction rates
5. Analyze request patterns

### High Error Rates

1. Check database connection availability
2. Monitor application logs for exceptions
3. Verify API endpoint responses
4. Check network connectivity
5. Review rate limiting configurations

### Database Performance Issues

1. Run `ANALYZE` on tables
2. Check index usage with `pg_stat_user_indexes`
3. Monitor lock waits and deadlocks
4. Review auto-vacuum statistics
5. Check for table bloat

## 🔄 Maintenance Schedule

### Daily (Automated)

- [ ] Refresh materialized views
- [ ] Clean up old performance logs
- [ ] Update table statistics with `ANALYZE`
- [ ] Monitor cache memory usage

### Weekly (Semi-Automated)

- [ ] Review performance trends
- [ ] Check index usage efficiency
- [ ] Clean up unused cache keys
- [ ] Performance baseline comparison

### Monthly (Manual)

- [ ] Comprehensive performance review
- [ ] Database optimization recommendations
- [ ] Capacity planning assessment
- [ ] Update performance benchmarks

## 🎯 Success Criteria

Deployment is considered successful when:

- [ ] All load tests pass with "GOOD" or "EXCELLENT" ratings
- [ ] Lunch rush simulation supports 1000+ concurrent users
- [ ] Average response time < 500ms during peak load
- [ ] Error rate < 1% under all test scenarios
- [ ] Cache hit ratio > 80% for common queries
- [ ] Database query performance < 50ms average
- [ ] Materialized views refresh successfully
- [ ] Performance monitoring dashboard operational
- [ ] Alert system functioning correctly

## 📚 Additional Resources

- [PostgreSQL Performance Tuning Guide](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Redis Performance Best Practices](https://redis.io/docs/management/optimization/)
- [Node.js Performance Monitoring](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Next.js Performance Optimization](https://nextjs.org/docs/advanced-features/measuring-performance)

---

**Note**: This deployment guide is specifically tailored for the HASIVU school meal delivery platform's lunch rush performance requirements. Adjust configurations based on your specific infrastructure and load patterns.
