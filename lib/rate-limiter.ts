// Rate limiter for API routes
// In-memory store (use Redis in production for multi-instance)

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const stores = new Map<string, Map<string, RateLimitInfo>>();

function getStore(config: RateLimitConfig): Map<string, RateLimitInfo> {
  const key = `${config.keyPrefix || "default"}:${config.windowMs}:${config.maxRequests}`;
  if (!stores.has(key)) {
    stores.set(key, new Map());
  }
  return stores.get(key)!;
}

function cleanupStore(store: Map<string, RateLimitInfo>, windowMs: number) {
  const now = Date.now();
  for (const [key, info] of store.entries()) {
    if (info.resetTime < now) {
      store.delete(key);
    }
  }
}

export function rateLimit(config: RateLimitConfig) {
  const store = getStore(config);

  return async function (identifier: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
  }> {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    cleanupStore(store, config.windowMs);

    let info = store.get(identifier);
    
    if (!info || info.resetTime < now) {
      info = { count: 0, resetTime: now + config.windowMs };
      store.set(identifier, info);
    }

    info.count += 1;
    
    const success = info.count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - info.count);

    return {
      success,
      limit: config.maxRequests,
      remaining,
      resetTime: info.resetTime,
    };
  };
}

// Pre-configured rate limiters
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per minute
  keyPrefix: "api",
});

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 AI requests per minute per user
  keyPrefix: "ai",
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 auth attempts per 15 min
  keyPrefix: "auth",
});

export function getRateLimitHeaders(result: Awaited<ReturnType<typeof apiRateLimiter>>): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetTime / 1000)),
    "Retry-After": result.success ? "0" : String(Math.ceil((result.resetTime - Date.now()) / 1000)),
  };
}