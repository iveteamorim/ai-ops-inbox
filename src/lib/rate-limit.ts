type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type CheckRateLimitParams = {
  key: string;
  windowMs: number;
  limit: number;
};

type CheckRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const globalBuckets = globalThis as typeof globalThis & {
  __novuaRateLimitBuckets__?: Map<string, RateLimitBucket>;
};

const buckets = globalBuckets.__novuaRateLimitBuckets__ ?? new Map<string, RateLimitBucket>();
globalBuckets.__novuaRateLimitBuckets__ = buckets;

export function checkRateLimit(params: CheckRateLimitParams): CheckRateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(params.key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(params.key, {
      count: 1,
      resetAt: now + params.windowMs,
    });

    return {
      allowed: true,
      retryAfterSeconds: Math.ceil(params.windowMs / 1000),
    };
  }

  if (bucket.count >= params.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  buckets.set(params.key, bucket);

  return {
    allowed: true,
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}
