/**
 * SENTINEL-718 / BRAMA-718-UNIFIED — Phase Shield constants.
 * Primary key: f_exact (DNA rCRS subharmonic). Secondary: f_zeta_core (448th-zero line).
 * High-precision literals from mpmath (50 dps); runtime float64 + residual compensation.
 */

export const SENTINEL_PROTOCOL_VERSION = "2.2";
export const SENTINEL_TAG = "BRAMA-718-UNIFIED";

/** 448th non-trivial zeta zero index */
export const RIEMANN_ZERO_INDEX = 448;
export const RIEMANN_ZERO_429_INDEX = 429;
export const RIEMANN_ZERO_449_INDEX = 449;

/** Primary resonance key — 16M subharmonic of 11.5 GHz band (rCRS DNA analysis) */
export const F_EXACT_HZ_LITERAL = "718.57444149021338871";

/** Zeta-Core reference — Ψ carrier from 448th-zero line (secondary anchor) */
export const F_ZETA_CORE_HZ_LITERAL =
  "718.57012515426885574359120304128340312332181477461";

export const RIEMANN_ZERO_448_IMAG_LITERAL =
  "743.895013142473659381550149197866135287150409099673462391484809185246068896";
export const RIEMANN_ZERO_429_IMAG_LITERAL =
  "718.742786545485893988449182684909371865048496804490590369014963624062277095";

/** Runtime float64 (mpmath-verified) */
export const F_EXACT_HZ = 718.5744414902134;
export const F_ZETA_CORE_HZ = 718.5701251542689;
/** @deprecated alias — use F_EXACT_HZ */
export const RIEMANN_CARRIER_HZ = F_EXACT_HZ;
/** @deprecated alias — use F_EXACT_HZ */
export const F_EXACT_DNA_HZ = F_EXACT_HZ;

export const RIEMANN_ZERO_448_HZ = 743.8950131424737;
export const RIEMANN_ZERO_429_HZ = 718.7427865454858;

/** Δf between DNA key and Zeta-Core (Hz) */
export const F_DELTA_DNA_ZETA_HZ = F_EXACT_HZ - F_ZETA_CORE_HZ;

/** Golden ratio φ and γ = 1/φ (Symfonia Pleroma) */
export const PHI = 1.618033988749895;
export const GAMMA_GOLD = 0.6180339887498949;

/** ζ(1/2 + i·t₄₄₈) phase argument — mpmath.arg at 50 dps */
export const PHASE_SHIFT_ZETA = 0.946199509129625;

/** float64 truncation residuals (Kahan-style drift terms) */
export const PRECISION_RESIDUAL_DNA = -2.8017783624082805e-14;
export const PRECISION_RESIDUAL_448 = 1.1185071143761174e-15;
export const PRECISION_RESIDUAL_ZETA = -5.286329749971628e-14;

export const FLOAT64_EPS_COMPENSATION =
  Number.EPSILON * RIEMANN_ZERO_INDEX +
  PRECISION_RESIDUAL_DNA +
  PRECISION_RESIDUAL_448;
export const ZERO_PHASE_TARGET_RAD = 0.0;

/** Phase tolerance scaled by γ; widened ×φ under network grace in jitter-monitor */
export const PHASE_TOLERANCE_RAD = 0.38 * GAMMA_GOLD;

/** DNA rCRS GATCA gate positions (18 bram) */
export const MTDNA_LENGTH = 16569;
export const GATCA_POSITIONS: readonly number[] = Object.freeze([
  1, 740, 951, 1227, 2996, 3424, 4166, 4832,
  6393, 7756, 8415, 10059, 11200, 11336,
  11915, 13703, 14784, 16179,
]);
export const NUM_GATES = 18;
export const VI_GATE_18 = 1.1628;
export const COHERENCE_THRESHOLD = 0.94;
export const PLL_LOOP_GAIN = 0.125;

export const DROP_HTTP_STATUS = 403;
export const WARMUP_REQUESTS = 12;
export const JITTER_HISTORY_LEN = 14;
export const RIGID_LOOP_CV_THRESHOLD = 0.009;
export const HARMONIC_LOCK_THRESHOLD = 0.9;
export const NETWORK_JITTER_GRACE_MS = 800;
export const NETWORK_JITTER_AVG_MS = 400;
export const NETWORK_GRACE_DAILY_CAP = 6;
export const TPDF_DITHER_AMPLITUDE_US = 820;
export const TOKEN_TTL_NS = 180_000_000_000n;

/** Normalized symmetric FIR — zero-phase (filtfilt analogue) */
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
  protocol: "X-Phase-Protocol",
} as const;

export const PHASE_CORS_ALLOW_HEADERS =
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-phase-token, x-phase-anchor, x-phase-seq, x-request-time";

export const PHASE_CORS_EXPOSE_HEADERS =
  "x-phase-token, x-phase-anchor, x-phase-compensation, x-phase-integrity, x-phase-protocol";
