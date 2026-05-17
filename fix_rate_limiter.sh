#!/bin/bash

echo "🔧 Fixing rate limiter deprecation warnings..."

# Fix the RateLimiterOptions interface
sed -i '' 's/onLimitReached?: (req: Request, res: Response) => void;/handler?: (req: Request, res: Response, next?: NextFunction) => void;/' src/middleware/rateLimiter.middleware.ts

# Fix the createRateLimiter function where onLimitReached is used
sed -i '' 's/if (options.onLimitReached) {/if (options.handler) {/' src/middleware/rateLimiter.middleware.ts
sed -i '' 's/options.onLimitReached(req, res);/options.handler(req, res);/' src/middleware/rateLimiter.middleware.ts

# Fix the authRateLimit export where onLimitReached is used
sed -i '' 's/onLimitReached: (req: Request, res: Response) => {/handler: (req: Request, res: Response) => {/' src/middleware/rateLimiter.middleware.ts

echo "✅ Rate limiter deprecation warnings fixed!"
