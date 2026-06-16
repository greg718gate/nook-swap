import {
  FLOAT64_EPS_COMPENSATION,
  PHASE_HEADERS,
  RIEMANN_CARRIER_HZ,
  TOKEN_TTL_NS,
} from "./constants.ts";
import { compensatedCarrierPhase } from "./compensated-phase.ts";

let cachedKey: CryptoKey | null = null;

async function phaseHmacKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  const secret =
    Deno.env.get("PHASE_SHIELD_SECRET") ??
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    "velvetbazzar-phase-shield-718";
  cachedKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  return cachedKey;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function perfCounterNs(): bigint {
  const origin = Number.isFinite(performance.timeOrigin) ? performance.timeOrigin : Date.now();
  const now = Number.isFinite(performance.now()) ? performance.now() : 0;
  return BigInt(Math.round((origin + now) * 1e6));
}

export async function mintPhaseToken(anchorNs: bigint): Promise<{
  token: string;
  phase: number;
  compensation: number;
}> {
  const phase = compensatedCarrierPhase(anchorNs);
  const payload =
    `${anchorNs.toString()}|${phase.toFixed(17)}|${RIEMANN_CARRIER_HZ}|vb`;
  const key = await phaseHmacKey();
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return {
    token: bytesToBase64Url(new Uint8Array(sig)),
    phase,
    compensation: FLOAT64_EPS_COMPENSATION,
  };
}

export async function verifyPhaseToken(
  token: string | null,
  anchorRaw: string | null,
): Promise<boolean> {
  if (!token || !anchorRaw) return false;
  let anchorNs: bigint;
  try {
    anchorNs = BigInt(anchorRaw);
  } catch {
    return false;
  }

  const nowNs = perfCounterNs();
  if (anchorNs > nowNs + 5_000_000_000n) return false;
  if (nowNs - anchorNs > TOKEN_TTL_NS) return false;

  const { token: expected } = await mintPhaseToken(anchorNs);
  return timingSafeEqual(token, expected);
}

export function phaseResponseHeaders(
  anchorNs: bigint,
  token: string,
  compensation: number,
  integrity: string,
): Record<string, string> {
  return {
    [PHASE_HEADERS.token]: token,
    [PHASE_HEADERS.anchor]: anchorNs.toString(),
    [PHASE_HEADERS.compensation]: compensation.toExponential(6),
    [PHASE_HEADERS.integrity]: integrity,
  };
}
