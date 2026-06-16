import { TPDF_DITHER_AMPLITUDE_US } from "./constants.ts";

/** Triangular PDF dither — masks deterministic server clock structure */
export function tpdfDitherMicroseconds(
  amplitudeUs = TPDF_DITHER_AMPLITUDE_US,
): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return (u1 + u2 - 1) * amplitudeUs;
}

export function delayMicroseconds(us: number): Promise<void> {
  if (us <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, us / 1000));
}
