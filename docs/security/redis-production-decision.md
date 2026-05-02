# Production Redis Decision

**Finding:** No AWS ElastiCache configured in serverless.yml  
**BMAD Agent:** John (Performance), Paige (DevOps)  
**Severity:** High

## Decision

**OPTION A (implement):** Add ElastiCache resource to serverless.yml  
**OPTION B (accept risk):** Use Redis Cloud / Upstash free tier via REDIS_URL SSM parameter — lower ops overhead for MVP scale

## Chosen Option: B (Upstash Serverless Redis)

### Rationale

- MVP scale (5 pilot schools, ~500 users) does not justify ElastiCache complexity
- Upstash provides serverless Redis with per-request pricing ($0 at low volume)
- No VPC configuration needed (connects over TLS, not VPC peering)
- Can migrate to ElastiCache when scaling past 25 schools (Phase 2)

### Implementation

1. Create Upstash Redis instance at https://console.upstash.com
2. Store connection URL in AWS SSM: `/hasivu/production/redis-url`
3. Update `serverless.yml` environment block:
   ```yaml
   REDIS_URL: ${ssm:/hasivu/${self:provider.stage}/redis-url}
   ```

### Risk if Option B

- Session data loss on Redis provider outage
- Latency slightly higher than VPC-local ElastiCache (~5-10ms vs ~1ms)
- Rate limiting degrades to in-memory (per-Lambda-instance) if Redis unavailable

### Migration Trigger to Option A

- Monthly Redis commands > 100K/month
- Need sub-2ms cache latency for real-time order tracking
- PCI compliance audit requires VPC-isolated data stores

## Accepted by: [Mahesha] [2026-05-02]
