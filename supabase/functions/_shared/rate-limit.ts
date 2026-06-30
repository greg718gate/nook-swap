import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { clientIpFromRequest, jwtSubFromRequest } from "./request-context.ts";

export type RateLimitRule = {
  windowSec: number;
  maxRequests: number;
};

/** Per-endpoint limits (IP or authenticated user bucket). */
export const RATE_LIMITS: Record<string, RateLimitRule> = {
  "auth-signup": { windowSec: 3600, maxRequests: 8 },
  "create-checkout-session": { windowSec: 60, maxRequests: 20 },
  "messaging-api": { windowSec: 60, maxRequests: 80 },
  "create-stripe-connect-account": { windowSec: 3600, maxRequests: 10 },
  "refund-order": { windowSec: 3600, maxRequests: 15 },
  "velvet-coin-api": { windowSec: 60, maxRequests: 40 },
  "phase-shield-handshake": { windowSec: 60, maxRequests: 40 },
  default: { windowSec: 60, maxRequests: 120 },
};

function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function bucketKey(endpoint: string, req: Request): string {
  const userId = jwtSubFromRequest(req);
  if (userId) return `rl:${endpoint}:u:${userId}`;
  const ip = clientIpFromRequest(req);
  return `rl:${endpoint}:ip:${ip}`;
}

/**
 * Returns a 429 Response when limit exceeded, or null when allowed.
 * Fails open if RPC unavailable (logged).
 */
export async function enforceRateLimit(
  req: Request,
  endpoint: string,
): Promise<Response | null> {
  const rule = RATE_LIMITS[endpoint] ?? RATE_LIMITS.default;
  const supabase = adminClient();

  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_bucket_key: bucketKey(endpoint, req),
    p_window_seconds: rule.windowSec,
    p_max_hits: rule.maxRequests,
  });

  if (error) {
    console.warn(`[rate-limit] ${endpoint} RPC failed — fail open:`, error.message);
    return null;
  }

  const allowed = data?.allowed === true;
  if (allowed) return null;

  const retryAfter = typeof data?.retry_after_sec === "number"
    ? data.retry_after_sec
    : rule.windowSec;

  console.warn(`[rate-limit] DROP ${endpoint} bucket=${bucketKey(endpoint, req)}`);

  return new Response(
    JSON.stringify({
      error: "Too many requests — please wait and try again",
      code: "RATE_LIMIT",
      retry_after_sec: retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    },
  );
}
