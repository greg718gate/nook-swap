/**
 * Anti-Bot Phase Shield — client-side phase token relay.
 * Attaches X-Phase-* headers to Supabase edge function calls.
 */

const STORAGE_KEY = "vb_phase_shield_v1";

const H = {
  token: "X-Phase-Token",
  anchor: "X-Phase-Anchor",
  compensation: "X-Phase-Compensation",
  seq: "X-Phase-Seq",
  requestTime: "X-Request-Time",
} as const;

type PhaseState = {
  token: string;
  anchor: string;
  compensation: string;
  seq: number;
};

function loadState(): PhaseState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PhaseState;
  } catch {
    return null;
  }
}

function saveState(state: PhaseState): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function absorbPhaseShieldHeaders(response: Response): void {
  const token = response.headers.get(H.token);
  const anchor = response.headers.get(H.anchor);
  if (!token || !anchor) return;

  const prev = loadState();
  saveState({
    token,
    anchor,
    compensation: response.headers.get(H.compensation) ?? prev?.compensation ?? "",
    seq: (prev?.seq ?? 0) + 1,
  });
}

export function getPhaseShieldHeaders(): Record<string, string> {
  const state = loadState();
  const headers: Record<string, string> = {
    [H.requestTime]: String(Math.round(performance.timeOrigin * 1e6 + performance.now() * 1e6)),
    [H.seq]: String((state?.seq ?? 0) + 1),
  };
  if (state?.token) headers[H.token] = state.token;
  if (state?.anchor) headers[H.anchor] = state.anchor;
  return headers;
}

function isSupabaseFunctionsUrl(url: string): boolean {
  return url.includes("/functions/v1/");
}

export function createPhaseShieldFetch(
  baseFetch: typeof fetch = globalThis.fetch.bind(globalThis),
): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

    if (!isSupabaseFunctionsUrl(url)) {
      return baseFetch(input, init);
    }

    const headers = new Headers(init?.headers);
    for (const [key, value] of Object.entries(getPhaseShieldHeaders())) {
      headers.set(key, value);
    }

    const response = await baseFetch(input, { ...init, headers });
    absorbPhaseShieldHeaders(response.clone());

    if (response.status === 403 && isSupabaseFunctionsUrl(url)) {
      try {
        const clone = response.clone();
        const body = await clone.json() as { code?: string };
        if (body.code === "PHASE_DROP" || body.code === "PHASE_TOKEN_INVALID") {
          handshakePromise = null;
          const supabaseUrl = url.split("/functions/v1/")[0];
          const anonKey = headers.get("apikey") || headers.get("Authorization")?.replace("Bearer ", "");
          if (anonKey) {
            await bootstrapPhaseShield(supabaseUrl, anonKey);
          }
        }
      } catch {
        /* ignore parse errors */
      }
    }

    return response;
  };
}

let handshakePromise: Promise<void> | null = null;

export async function bootstrapPhaseShield(
  supabaseUrl: string,
  anonKey: string,
): Promise<void> {
  if (handshakePromise) return handshakePromise;

  handshakePromise = (async () => {
    try {
      const res = await createPhaseShieldFetch()( 
        `${supabaseUrl}/functions/v1/phase-shield-handshake`,
        {
          method: "GET",
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
        },
      );
      absorbPhaseShieldHeaders(res);
    } catch (e) {
      console.warn("[phase-shield] handshake failed", e);
      handshakePromise = null;
    }
  })();

  return handshakePromise;
}
