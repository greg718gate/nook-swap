import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import {
  HARMONIC_LOCK_THRESHOLD,
  JITTER_HISTORY_LEN,
  NETWORK_GRACE_DAILY_CAP,
  NETWORK_JITTER_AVG_MS,
  NETWORK_JITTER_GRACE_MS,
  PHASE_TOLERANCE_RAD,
  PHI,
  RIGID_LOOP_CV_THRESHOLD,
  WARMUP_REQUESTS,
  ZERO_PHASE_TARGET_RAD,
} from "./constants.ts";
import { zeroPhaseResidualRad } from "./compensated-phase.ts";
import { zeroPhaseFir } from "./fir-filter.ts";
import {
  harmonicLockScoreSentinel,
  isArtificialGatcaLock,
} from "./gatca-resonance.ts";
import { ensurePhaseShieldTables } from "./provision.ts";
import { perfCounterNs } from "./token.ts";
import {
  clientIpFromRequest,
  jwtSubFromRequest,
  maskIp,
} from "../request-context.ts";

export type JitterVerdict = {
  pass: boolean;
  dropReason: string | null;
  requestCount: number;
  deltaMs: number | null;
  phaseRad: number;
  zeroPhaseResidual: number;
  harmonicLock: number;
  networkVolatile: boolean;
  graceApplied: boolean;
};

function coefficientOfVariation(values: number[]): number {
  if (values.length < 2) return 1;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean <= 0) return 1;
  const variance =
    values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / mean;
}

function harmonicLockScore(deltasMs: number[]): number {
  return harmonicLockScoreSentinel(deltasMs);
}

function isNetworkVolatile(deltasMs: number[]): boolean {
  if (deltasMs.length < 3) return false;
  const recent = deltasMs.slice(-6);
  const max = Math.max(...recent);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  return max >= NETWORK_JITTER_GRACE_MS || avg >= NETWORK_JITTER_AVG_MS;
}

function analyzeDeltas(deltasMs: number[], networkVolatile: boolean): {
  zeroPhaseResidual: number;
  phaseRad: number;
  harmonicLock: number;
  rigidLoop: boolean;
  phaseViolation: boolean;
  gatcaLock: boolean;
} {
  const harmonicLock = harmonicLockScore(deltasMs);
  const cv = coefficientOfVariation(deltasMs);
  const rigidLoop = deltasMs.length >= 4 && cv < RIGID_LOOP_CV_THRESHOLD;

  const filtered = zeroPhaseFir(deltasMs);
  const tail: [number, number] = filtered.length >= 2
    ? [filtered[filtered.length - 2], filtered[filtered.length - 1]]
    : [0, 0];
  const zeroPhaseResidual = zeroPhaseResidualRad(tail);
  const phaseRad = Math.atan2(
    tail[1],
    tail[0] === 0 ? Number.EPSILON : tail[0],
  );
  const tolerance = networkVolatile
    ? PHASE_TOLERANCE_RAD * PHI
    : PHASE_TOLERANCE_RAD;
  const phaseViolation = zeroPhaseResidual > tolerance;

  const gatcaLock = isArtificialGatcaLock(deltasMs);

  return { zeroPhaseResidual, phaseRad, harmonicLock, rigidLoop, phaseViolation, gatcaLock };
}

function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export function clientKeyFromRequest(req: Request): string {
  const ip = clientIpFromRequest(req);
  const ua = req.headers.get("user-agent") || "na";
  let hash = 0;
  for (let i = 0; i < ua.length; i++) hash = (hash * 31 + ua.charCodeAt(i)) | 0;
  return `${ip}:${hash.toString(16)}`;
}

function graceWindowExpired(resetAt: string | null): boolean {
  if (!resetAt) return true;
  return Date.now() - new Date(resetAt).getTime() > 24 * 60 * 60 * 1000;
}

export async function verifyRequestJitter(
  req: Request,
  endpoint: string,
): Promise<JitterVerdict> {
  const tablesReady = await ensurePhaseShieldTables();
  if (!tablesReady) {
    console.warn("[phase-shield] jitter logging unavailable — tables not provisioned");
    return {
      pass: true,
      dropReason: null,
      requestCount: 0,
      deltaMs: null,
      phaseRad: ZERO_PHASE_TARGET_RAD,
      zeroPhaseResidual: 0,
      harmonicLock: 0,
      networkVolatile: false,
      graceApplied: false,
    };
  }

  const supabase = adminClient();
  const clientKey = clientKeyFromRequest(req);
  const userId = jwtSubFromRequest(req);
  const ipMasked = maskIp(clientIpFromRequest(req));
  const userAgent = (req.headers.get("user-agent") || "").slice(0, 512);
  const requestNs = perfCounterNs();

  const { data: state } = await supabase
    .from("phase_shield_state")
    .select(
      "request_count, delta_history_ms, last_request_ns, network_grace_count, network_grace_reset_at",
    )
    .eq("client_key", clientKey)
    .maybeSingle();

  const prevCount = state?.request_count ?? 0;
  const history: number[] = Array.isArray(state?.delta_history_ms)
    ? state.delta_history_ms
    : [];

  let deltaMs: number | null = null;
  if (state?.last_request_ns != null) {
    deltaMs = Number(requestNs - BigInt(state.last_request_ns)) / 1e6;
    history.push(deltaMs);
    while (history.length > JITTER_HISTORY_LEN) history.shift();
  }

  const networkVolatile = isNetworkVolatile(history);
  const analysis = analyzeDeltas(history, networkVolatile);
  const requestCount = prevCount + 1;

  let pass = true;
  let dropReason: string | null = null;
  let graceApplied = false;

  let graceCount = state?.network_grace_count ?? 0;
  let graceResetAt = state?.network_grace_reset_at ?? null;
  if (graceWindowExpired(graceResetAt)) {
    graceCount = 0;
    graceResetAt = new Date().toISOString();
  }

  if (requestCount > WARMUP_REQUESTS && history.length >= 6) {
    if (analysis.phaseViolation) {
      pass = false;
      dropReason = "nonlinear_phase_shift";
    } else if (analysis.harmonicLock >= HARMONIC_LOCK_THRESHOLD) {
      pass = false;
      dropReason = "harmonic_bot_signature";
    } else if (analysis.gatcaLock) {
      pass = false;
      dropReason = "gatca_resonance_lock";
    } else if (analysis.rigidLoop) {
      pass = false;
      dropReason = "rigid_timing_loop";
    }

    // Network grace: trains / mobile BTS handoffs — not bot signatures on stable RTT
    if (!pass && networkVolatile && dropReason !== "rigid_timing_loop" &&
      dropReason !== "gatca_resonance_lock") {
      if (graceCount < NETWORK_GRACE_DAILY_CAP || userId) {
        pass = true;
        graceApplied = true;
        graceCount += 1;
        dropReason = "network_grace_applied";
      }
    }
  }

  await supabase.from("phase_shield_state").upsert({
    client_key: clientKey,
    request_count: requestCount,
    delta_history_ms: history,
    last_request_ns: Number(requestNs),
    network_grace_count: graceCount,
    network_grace_reset_at: graceResetAt,
    updated_at: new Date().toISOString(),
  });

  await supabase.from("phase_shield_jitter_log").insert({
    client_key: clientKey,
    endpoint,
    request_ns: Number(requestNs),
    delta_ms: deltaMs,
    phase_rad: analysis.phaseRad,
    zero_phase_residual: analysis.zeroPhaseResidual,
    harmonic_lock: analysis.harmonicLock,
    dropped: !pass,
    drop_reason: dropReason,
    user_id: userId,
    ip_masked: ipMasked,
    user_agent: userAgent || null,
    network_volatile: networkVolatile,
  });

  return {
    pass,
    dropReason,
    requestCount,
    deltaMs,
    phaseRad: analysis.phaseRad,
    zeroPhaseResidual: analysis.zeroPhaseResidual,
    harmonicLock: analysis.harmonicLock,
    networkVolatile,
    graceApplied,
  };
}
