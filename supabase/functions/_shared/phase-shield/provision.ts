import postgres from "npm:postgres@3.4.5";

let provisionPromise: Promise<boolean> | null = null;

const PHASE_SHIELD_DDL = `
CREATE TABLE IF NOT EXISTS public.phase_shield_state (
  client_key text PRIMARY KEY,
  request_count integer NOT NULL DEFAULT 0,
  delta_history_ms double precision[] NOT NULL DEFAULT '{}',
  last_request_ns bigint,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.phase_shield_jitter_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_key text NOT NULL,
  endpoint text NOT NULL,
  request_ns bigint NOT NULL,
  delta_ms double precision,
  phase_rad double precision,
  zero_phase_residual double precision,
  harmonic_lock double precision,
  dropped boolean NOT NULL DEFAULT false,
  drop_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS phase_shield_jitter_log_client_idx
  ON public.phase_shield_jitter_log (client_key, created_at DESC);

ALTER TABLE public.phase_shield_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase_shield_jitter_log ENABLE ROW LEVEL SECURITY;
`;

async function runProvision(): Promise<boolean> {
  const dbUrl = Deno.env.get("SUPABASE_DB_URL");
  if (!dbUrl) {
    console.error("[phase-shield] SUPABASE_DB_URL missing — cannot provision tables");
    return false;
  }

  const sql = postgres(dbUrl, { prepare: false, max: 1 });
  try {
    await sql.unsafe(PHASE_SHIELD_DDL);
    console.log("[phase-shield] Tables provisioned (phase_shield_state, phase_shield_jitter_log)");
    return true;
  } catch (error) {
    console.error("[phase-shield] DDL provision failed:", error);
    return false;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

/** Idempotent — runs migration SQL on production via SUPABASE_DB_URL (edge default secret). */
export function ensurePhaseShieldTables(): Promise<boolean> {
  if (!provisionPromise) {
    provisionPromise = runProvision();
  }
  return provisionPromise;
}

export async function verifyPhaseShieldTablesExist(): Promise<boolean> {
  const dbUrl = Deno.env.get("SUPABASE_DB_URL");
  if (!dbUrl) return false;

  const sql = postgres(dbUrl, { prepare: false, max: 1 });
  try {
    const rows = await sql`
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'phase_shield_state'
      LIMIT 1
    `;
    return rows.length > 0;
  } catch {
    return false;
  } finally {
    await sql.end({ timeout: 5 });
  }
}
