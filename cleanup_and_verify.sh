#!/bin/bash

echo "🧹 Cleaning up duplicate disconnect method..."

# Remove duplicate disconnect methods and keep only one
awk '
/public static async disconnect\(\): Promise<void> \{/ {
    if (!seen) {
        print
        getline; print
        getline; print
        seen = 1
    } else {
        getline; getline  # skip the duplicate
    }
    next
}
{print}
' src/services/redis.service.ts > /tmp/cleaned_redis.ts && mv /tmp/cleaned_redis.ts src/services/redis.service.ts

echo "✅ Cleanup complete!"

echo "🔍 Verifying final RedisService disconnect method..."
grep -A 3 -B 1 "public static async disconnect" src/services/redis.service.ts

echo ""
echo "🔍 Verifying rate limiter handler changes..."
grep -n "handler.*Request.*Response" src/middleware/rateLimiter.middleware.ts | head -3
