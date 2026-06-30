import { enforceRateLimit } from "../rate-limit.ts";
import { isAllowedOrigin, originForbiddenResponse } from "../origin-guard.ts";
import {
  DROP_HTTP_STATUS,
  PHASE_CORS_ALLOW_HEADERS,
  PHASE_CORS_EXPOSE_HEADERS,
  PHASE_HEADERS,
  WARMUP_REQUESTS,
  ZERO_PHASE_TARGET_RAD,
} from "./constants.ts";
import { delayMicroseconds, tpdfDitherMicroseconds } from "./dither.ts";
import { verifyRequestJitter } from "./jitter-monitor.ts";
import {
  mintPhaseToken,
  perfCounterNs,
  phaseResponseHeaders,
  verifyPhaseToken,
} from "./token.ts";

export type PhaseShieldOptions = {
  endpoint: string;
  corsHeaders?: Record<string, string>;
  /** Skip token validation (handshake/bootstrap only) */
  bootstrap?: boolean;
  /** Skip Origin/Referer check (webhooks, cron) */
  skipOriginCheck?: boolean;
};

function mergeCors(extra?: Record<string, string>): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": PHASE_CORS_ALLOW_HEADERS,
    "Access-Control-Expose-Headers": PHASE_CORS_EXPOSE_HEADERS,
    ...extra,
  };
}


async function attachPhaseHeaders(
  response: Response,
  cors: Record<string, string>,
  integrity: string,
): Promise<Response> {
  const anchorNs = perfCounterNs();
  const { token, compensation } = await mintPhaseToken(anchorNs);
  const ditherUs = tpdfDitherMicroseconds();
  await delayMicroseconds(ditherUs + tpdfDitherMicroseconds(120));

  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(cors)) headers.set(k, v);
  for (const [k, v] of Object.entries(
    phaseResponseHeaders(anchorNs, token, compensation, integrity),
  )) {
    headers.set(k, v);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Anti-Bot Phase Shield — wraps critical edge function handlers.
 * Drop Package Protocol on phase/token/jitter failure.
 */
export function withPhaseShield(
  options: PhaseShieldOptions,
  handler: (req: Request) => Promise<Response>,
): (req: Request) => Promise<Response> {
  const cors = mergeCors(options.corsHeaders);

  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      const anchorNs = perfCounterNs();
      const { token, compensation } = await mintPhaseToken(anchorNs);
      return new Response(null, {
        headers: {
          ...cors,
          ...phaseResponseHeaders(anchorNs, token, compensation, "preflight"),
        },
      });
    }

    const rateLimited = await enforceRateLimit(req, options.endpoint);
    if (rateLimited) {
      for (const [k, v] of Object.entries(cors)) rateLimited.headers.set(k, v);
      return rateLimited;
    }

    if (!options.skipOriginCheck && req.method !== "OPTIONS" && !isAllowedOrigin(req)) {
      return originForbiddenResponse(cors);
    }

    try {
      if (!options.bootstrap) {
        const token = req.headers.get(PHASE_HEADERS.token);
        const anchor = req.headers.get(PHASE_HEADERS.anchor);
        const jitter = await verifyRequestJitter(req, options.endpoint);

        if (!jitter.pass) {
          console.warn(
            `[phase-shield] DROP ${options.endpoint} reason=${jitter.dropReason} harmonic=${jitter.harmonicLock.toFixed(3)} residual=${jitter.zeroPhaseResidual.toFixed(4)} volatile=${jitter.networkVolatile}`,
          );
          const dropped = new Response(
            JSON.stringify({
              error: "Request rejected — integrity check failed",
              code: "PHASE_DROP",
              hint: jitter.networkVolatile
                ? "Unstable connection detected. Wait a moment and try again."
                : "Please refresh the page and try again.",
            }),
            {
              status: DROP_HTTP_STATUS,
              headers: { ...cors, "Content-Type": "application/json" },
            },
          );
          return attachPhaseHeaders(
            dropped,
            cors,
            `drop:${jitter.dropReason ?? "unknown"}`,
          );
        }

        if (jitter.requestCount > WARMUP_REQUESTS) {
          const tokenOk = await verifyPhaseToken(token, anchor);
          if (!tokenOk) {
            // Authenticated users on volatile networks get one token grace per session window
            const hasAuth = !!req.headers.get("Authorization");
            if (hasAuth && jitter.networkVolatile && jitter.graceApplied) {
              console.warn(
                `[phase-shield] token grace ${options.endpoint} (volatile network, authenticated)`,
              );
            } else {
              console.warn(`[phase-shield] DROP ${options.endpoint} invalid_phase_token`);
              const dropped = new Response(
                JSON.stringify({
                  error: "Request rejected — integrity check failed",
                  code: "PHASE_TOKEN_INVALID",
                  hint: "Refresh the page to renew your session shield.",
                }),
                {
                  status: DROP_HTTP_STATUS,
                  headers: { ...cors, "Content-Type": "application/json" },
                },
              );
              return attachPhaseHeaders(dropped, cors, "drop:invalid_token");
            }
          }
        }
      }

      const result = await handler(req);
      const integrity =
        `zpf:${ZERO_PHASE_TARGET_RAD.toFixed(1)};seq:${req.headers.get(PHASE_HEADERS.seq) ?? "0"}`;
      return attachPhaseHeaders(result, cors, integrity);
    } catch (error) {
      console.error(`[phase-shield] ${options.endpoint} handler error:`, error);
      const errResponse = new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
      );
      return attachPhaseHeaders(errResponse, cors, "error");
    }
  };
}

export { mergeCors as phaseShieldCors };
