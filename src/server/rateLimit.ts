/**
 * Best-effort in-memory token bucket per key. On serverless this is per-instance; for
 * stronger guarantees put AWS WAF rate-based rules in front (see docs/AWS_DEPLOYMENT.md).
 */
const buckets = new Map<string, { tokens: number; at: number }>();

export function rateLimit(key: string, capacity: number, refillPerSec: number): boolean {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: capacity, at: now };
  b.tokens = Math.min(capacity, b.tokens + ((now - b.at) / 1000) * refillPerSec);
  b.at = now;
  if (b.tokens < 1) {
    buckets.set(key, b);
    return false;
  }
  b.tokens -= 1;
  buckets.set(key, b);
  if (buckets.size > 10000) buckets.clear();
  return true;
}

export function clientKey(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || headers.get("x-real-ip") || "local";
}
