import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import {
  HARMONIC_LOCK_THRESHOLD,
  JITTER_HISTORY_LEN,
  PHASE_TOLERANCE_RAD,
  RIEMANN_CARRIER_HZ,
  RIGID_LOOP_CV_THRESHOLD,
  WARMUP_REQUESTS,
  ZERO_PHASE_TARGET_RAD,
} from "./constants.ts";
import { zeroPhaseResidualRad } from "./compensated-phase.ts";
import { zeroPhaseFir } from "./fir-filter.ts";
import { perfCounterNs } from "./token.ts";

export type JitterVerdict = {
  pass: boolean;
  dropReason: string | null;
  requestCount: number;
  deltaMs: number | null;
  phaseRad: number;
  zeroPhaseResidual: number;
  harmonicLock: number;
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
  if (deltasMs.length < 3) return 0;
  const periodMs = 1000 / RIEMANN_CARRIER_HZ;
  let hits = 0;
  for (const d of deltasMs) {
    const ratio = d / periodMs;
    const nearest = Math.round(ratio);
    if (nearest > 0 && Math.abs(ratio - nearest) < 0.025) hits++;
  }
  return hits / deltasMs.length;
}

function analyzeDeltas(deltasMs: number[]): {
  zeroPhaseResidual: number;
  phaseRad: number;
  harmonicLock: number;
  rigidLoop: boolean;
  phaseViolation: boolean;
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
  const phaseViolation = zeroPhaseResidual > PHASE_TOLERANCE_RAD;

  return { zeroPhaseResidual, phaseRad, harmonicLock, rigidLoop, phaseViolation };
}

function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export function clientKeyFromRequest(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || req.headers.get("cf-connecting-ip") || "unknown";
  const ua = req.headers.get("user-agent") || "na";
  let hash = 0;
  for (let i = 0; i < ua.length; i++) hash = (hash * 31 + ua.charCodeAt(i)) | 0;
  return `${ip}:${hash.toString(16)}`;
}

export async function verifyRequestJitter(
  req: Request,
  endpoint: string,
): Promise<JitterVerdict> {
  const supabase = adminClient();
  const clientKey = clientKeyFromRequest(req);
  const requestNs = perfCounterNs();

  const { data: state } = await supabase
    .from("phase_shield_state")
    .select("request_count, delta_history_ms, last_request_ns")
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

  const analysis = analyzeDeltas(history);
  const requestCount = prevCount + 1;

  let pass = true;
  let dropReason: string | null = null;

  if (requestCount > WARMUP_REQUESTS && history.length >= 4) {
    if (analysis.phaseViolation) {
      pass = false;
      dropReason = "nonlinear_phase_shift";
    } else if (analysis.harmonicLock >= HARMONIC_LOCK_THRESHOLD) {
      pass = false;
      dropReason = "harmonic_bot_signature";
    } else if (analysis.rigidLoop) {
      pass = false;
      dropReason = "rigid_timing_loop";
    }
  }

  await supabase.from("phase_shield_state").upsert({
    client_key: clientKey,
    request_count: requestCount,
    delta_history_ms: history,
    last_request_ns: Number(requestNs),
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
  });

  return {
    pass,
    dropReason,
    requestCount,
    deltaMs,
    phaseRad: analysis.phaseRad,
    zeroPhaseResidual: analysis.zeroPhaseResidual,
    harmonicLock: analysis.harmonicLock,
  };
}
