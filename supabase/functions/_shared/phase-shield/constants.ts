/** Riemann zeta 448th-zero reference carrier (Hz) — float64 compensated */
export const RIEMANN_ZERO_INDEX = 448;
export const RIEMANN_CARRIER_HZ = 718.5701251542;
export const FLOAT64_EPS_COMPENSATION = Number.EPSILON * RIEMANN_ZERO_INDEX;
export const ZERO_PHASE_TARGET_RAD = 0.0;
export const PHASE_TOLERANCE_RAD = 0.38;

export const DROP_HTTP_STATUS = 403;
export const WARMUP_REQUESTS = 2;
export const JITTER_HISTORY_LEN = 14;
export const RIGID_LOOP_CV_THRESHOLD = 0.009;
export const HARMONIC_LOCK_THRESHOLD = 0.9;
export const TPDF_DITHER_AMPLITUDE_US = 820;
export const TOKEN_TTL_NS = 180_000_000_000n;

/** Normalized symmetric FIR — zero-phase via forward/backward pass */
export const FIR_KERNEL: readonly number[] = Object.freeze([
  0.06, 0.1, 0.14, 0.2, 0.2, 0.14, 0.1, 0.06,
]);

export const PHASE_HEADERS = {
  token: "X-Phase-Token",
  anchor: "X-Phase-Anchor",
  compensation: "X-Phase-Compensation",
  seq: "X-Phase-Seq",
  requestTime: "X-Request-Time",
  integrity: "X-Phase-Integrity",
} as const;

export const PHASE_CORS_ALLOW_HEADERS =
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-phase-token, x-phase-anchor, x-phase-seq, x-request-time";

export const PHASE_CORS_EXPOSE_HEADERS =
  "x-phase-token, x-phase-anchor, x-phase-compensation, x-phase-integrity";
