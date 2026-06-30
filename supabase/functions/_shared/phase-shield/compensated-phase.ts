import {
  FLOAT64_EPS_COMPENSATION,
  PHASE_SHIFT_ZETA,
  RIEMANN_CARRIER_HZ,
  ZERO_PHASE_TARGET_RAD,
} from "./constants.ts";

/** Kahan-style drift compensation for ω·t at f_exact (718.570125… Hz) */
export function compensatedCarrierPhase(timestampNs: bigint): number {
  const tSec = Number(timestampNs) / 1e9;
  const omega = 2 * Math.PI * RIEMANN_CARRIER_HZ;

  const raw = omega * tSec;
  const cycles = Math.floor(raw / (2 * Math.PI));
  const correction = FLOAT64_EPS_COMPENSATION * cycles;
  let phase = raw - correction - PHASE_SHIFT_ZETA;

  phase %= 2 * Math.PI;
  if (phase > Math.PI) phase -= 2 * Math.PI;
  if (phase < -Math.PI) phase += 2 * Math.PI;

  return phase;
}

export function zeroPhaseResidualRad(filteredTail: [number, number]): number {
  const [prev, last] = filteredTail;
  const phase = Math.atan2(last, prev === 0 ? Number.EPSILON : prev);
  let residual = phase - ZERO_PHASE_TARGET_RAD;
  if (residual > Math.PI) residual -= 2 * Math.PI;
  if (residual < -Math.PI) residual += 2 * Math.PI;
  return Math.abs(residual);
}
