import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { AppError } from "./errors";
import { log } from "./logger";

type Policy = "fail-open" | "fail-closed";

const limiters = new Map<string, Ratelimit>();

function disabled(): boolean {
  return process.env.RATE_LIMIT_DISABLED === "true" && process.env.NODE_ENV !== "production";
}

function getLimiter(prefix: string): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  let limiter = limiters.get(prefix);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      prefix: `rl:${prefix}`,
    });
    limiters.set(prefix, limiter);
  }
  return limiter;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

// ADR-0010: 5 intentos/min por IP. Login admin falla cerrado; cancelación falla abierta.
export async function enforceRateLimit(
  req: Request,
  prefix: string,
  policy: Policy,
  requestId: string | null,
): Promise<void> {
  if (disabled()) return;
  try {
    const limiter = getLimiter(prefix);
    if (!limiter) throw new Error("rate limiting no configurado");
    const { success, reset } = await limiter.limit(clientIp(req));
    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      log("warn", "rate_limited", { requestId, route: prefix, status: 429 });
      throw new AppError(429, "demasiados intentos, intentar nuevamente más tarde", {
        "Retry-After": String(retryAfter),
      });
    }
  } catch (e) {
    if (e instanceof AppError) throw e;
    log("error", "rate_limit_unavailable", { requestId, route: prefix, policy });
    if (policy === "fail-closed") {
      throw new AppError(503, "servicio no disponible, intentar nuevamente");
    }
  }
}
