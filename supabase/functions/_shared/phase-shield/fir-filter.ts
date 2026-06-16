import { FIR_KERNEL } from "./constants.ts";

function convolve(signal: number[], kernel: readonly number[]): number[] {
  const out: number[] = new Array(signal.length).fill(0);
  const half = Math.floor(kernel.length / 2);

  for (let i = 0; i < signal.length; i++) {
    let acc = 0;
    for (let k = 0; k < kernel.length; k++) {
      const idx = i + k - half;
      if (idx >= 0 && idx < signal.length) {
        acc += signal[idx] * kernel[k];
      }
    }
    out[i] = acc;
  }
  return out;
}

/** Zero-phase FIR (forward → reverse → forward → reverse) */
export function zeroPhaseFir(
  signal: number[],
  kernel: readonly number[] = FIR_KERNEL,
): number[] {
  if (signal.length === 0) return [];
  const forward = convolve(signal, kernel);
  const rev1 = forward.slice().reverse();
  const backward = convolve(rev1, kernel);
  return backward.reverse();
}
