import "server-only";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitOptions = { limit: number; windowMs: number };
export type RateLimitResult = { ok: boolean; remaining: number; resetAt: number };

export function rateLimit(key: string, { limit, windowMs }: RateLimitOptions): RateLimitResult {
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
        const fresh: Bucket = { count: 1, resetAt: now + windowMs };
        buckets.set(key, fresh);
        reapIfLarge(now);
        return { ok: true, remaining: limit - 1, resetAt: fresh.resetAt };
    }

    existing.count += 1;
    return {
        ok: existing.count <= limit,
        remaining: Math.max(0, limit - existing.count),
        resetAt: existing.resetAt,
    };
}

function reapIfLarge(now: number) {
    if (buckets.size < 5000) return;
    for (const [k, b] of buckets) {
        if (b.resetAt <= now) buckets.delete(k);
    }
}

export function getClientIp(req: Request): string {
    const fwd = req.headers.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0].trim();
    const real = req.headers.get("x-real-ip");
    if (real) return real.trim();
    return "unknown";
}

export function retryAfterSeconds(resetAt: number): number {
    return Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
}
