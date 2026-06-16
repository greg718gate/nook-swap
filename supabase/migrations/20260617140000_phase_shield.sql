-- Anti-Bot Phase Shield: jitter state + audit log (service role only)

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
