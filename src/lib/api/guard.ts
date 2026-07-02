import "server-only";

/**
 * Shared hardening for the AI route handlers. Two cheap layers:
 *
 * - Same-origin check: browsers always attach `Origin` to cross-site POSTs,
 *   so rejecting mismatched origins stops third-party pages from burning our
 *   Anthropic tokens through a visitor's browser. Requests without an Origin
 *   header (curl, server-to-server, same-origin GET) pass through — the rate
 *   limiter still applies to them.
 * - In-memory per-IP rate limiting (per instance; resets on restart). Fine for
 *   this deployment size; swap for Redis/Upstash if it ever scales out.
 */

/** True when the request's Origin (if any) matches the host serving the app. */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    return host !== null && new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Standard 403 for cross-site callers. */
export function crossOriginResponse(): Response {
  return Response.json({ error: "Origen no permitido." }, { status: 403 });
}

/** Client IP as reported by the platform proxy (best effort). */
export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "local").split(",")[0]!.trim();
}

/** Sliding-window limiter factory: `limiter(ip)` → true when over the limit. */
export function createRateLimiter(max: number, windowMs: number): (key: string) => boolean {
  const hits = new Map<string, number[]>();
  return (key: string): boolean => {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      hits.set(key, recent);
      return true;
    }
    recent.push(now);
    hits.set(key, recent);
    return false;
  };
}
