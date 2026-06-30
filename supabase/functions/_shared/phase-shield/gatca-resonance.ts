import {
  COHERENCE_THRESHOLD,
  F_EXACT_DNA_HZ,
  GAMMA_GOLD,
  GATCA_POSITIONS,
  MTDNA_LENGTH,
  PHI,
  RIEMANN_CARRIER_HZ,
  RIEMANN_ZERO_448_HZ,
} from "./constants.ts";

/** Gate base frequency — Symfonia Pleroma v2.1 (gate 18 = 448th zero). */
export function gateBaseFrequencyHz(gateIndex: number): number {
  if (gateIndex === GATCA_POSITIONS.length - 1) return RIEMANN_ZERO_448_HZ;
  return 718 + 144 * (((gateIndex + 1) * GAMMA_GOLD) % 1);
}

/** All resonance carriers used for bot harmonic-lock detection */
export function sentinelCarrierFrequenciesHz(): number[] {
  const gates = Array.from({ length: GATCA_POSITIONS.length }, (_, i) =>
    gateBaseFrequencyHz(i)
  );
  return [
    RIEMANN_CARRIER_HZ,
    F_EXACT_DNA_HZ,
    RIEMANN_ZERO_448_HZ,
    ...gates,
  ];
}

function nearestHarmonicRatio(value: number, target: number): { mult: number; error: number } {
  if (target <= 0) return { mult: 0, error: 1 };
  const ratio = value / target;
  let bestMult = 1;
  let bestError = Math.abs(ratio - 1);
  for (let m = 1; m <= 24; m++) {
    const e1 = Math.abs(ratio - m);
    const e2 = Math.abs(ratio - 1 / m);
    if (e1 < bestError) {
      bestError = e1;
      bestMult = m;
    }
    if (e2 < bestError) {
      bestError = e2;
      bestMult = -m;
    }
  }
  return { mult: bestMult, error: bestError };
}

/**
 * rCRS interval coherence: distance between adjacent GATCA gates vs f_exact.
 * Returns mean coherence index (0–1) for the 17 intervals.
 */
export function gatcaIntervalCoherence(): number {
  const fExact = F_EXACT_DNA_HZ;
  const pureRatios = [2, 1.5, 4 / 3, 1.25, PHI, GAMMA_GOLD];
  let sum = 0;
  let count = 0;

  for (let i = 0; i < GATCA_POSITIONS.length - 1; i++) {
    const distance = GATCA_POSITIONS[i + 1] - GATCA_POSITIONS[i];
    const coefficient = distance / fExact;
    let minError = 10;
    for (const base of pureRatios) {
      for (let m = 1; m <= 24; m++) {
        minError = Math.min(minError, Math.abs(coefficient - base * m));
        minError = Math.min(minError, Math.abs(coefficient - base / m));
      }
    }
    const coherence = Math.max(0, 1 - minError);
    sum += coherence;
    count++;
  }

  return count > 0 ? sum / count : 0;
}

/** Detect if request deltas align with Sentinel carrier ladder (bot scripts). */
export function harmonicLockScoreSentinel(deltasMs: number[]): number {
  if (deltasMs.length < 3) return 0;
  const carriers = sentinelCarrierFrequenciesHz();
  let hits = 0;

  for (const d of deltasMs) {
    for (const hz of carriers) {
      const periodMs = 1000 / hz;
      const ratio = d / periodMs;
      const nearest = Math.round(ratio);
      if (nearest > 0 && Math.abs(ratio - nearest) < 0.025) {
        hits++;
        break;
      }
    }
  }

  return hits / deltasMs.length;
}

/**
 * Map a single delta (ms) to best GATCA-interval coherence (0–1).
 * Used to flag unnaturally stable “DNA-tuned” bot timing.
 */
export function deltaGatcaCoherence(deltaMs: number): number {
  const coefficient = deltaMs / RIEMANN_CARRIER_HZ;
  const { error } = nearestHarmonicRatio(coefficient, 1);
  return Math.max(0, 1 - error);
}

export function meanDeltaGatcaCoherence(deltasMs: number[]): number {
  if (deltasMs.length === 0) return 0;
  const sum = deltasMs.reduce((acc, d) => acc + deltaGatcaCoherence(d), 0);
  return sum / deltasMs.length;
}

/** Torus closure B18→B1 — intentional low coherence (protocol “Brama Zero”). */
export function torusClosureCoherence(): number {
  const b18 = GATCA_POSITIONS[GATCA_POSITIONS.length - 1];
  const distance = MTDNA_LENGTH - b18 + GATCA_POSITIONS[0];
  const coefficient = distance / F_EXACT_DNA_HZ;
  const { error } = nearestHarmonicRatio(coefficient, 1);
  return Math.max(0, 1 - error);
}

export function isArtificialGatcaLock(deltasMs: number[]): boolean {
  if (deltasMs.length < 6) return false;
  const mean = meanDeltaGatcaCoherence(deltasMs);
  return mean >= COHERENCE_THRESHOLD && harmonicLockScoreSentinel(deltasMs) >= 0.85;
}
