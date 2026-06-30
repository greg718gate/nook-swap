import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  withPhaseShield,
  F_EXACT_HZ,
  F_ZETA_CORE_HZ,
  F_DELTA_DNA_ZETA_HZ,
  SENTINEL_PROTOCOL_VERSION,
  PHI,
  GAMMA_GOLD,
  COHERENCE_THRESHOLD,
} from "../_shared/phase-shield/mod.ts";
import {
  gatcaIntervalCoherence,
  torusClosureCoherence,
} from "../_shared/phase-shield/gatca-resonance.ts";
import {
  ensurePhaseShieldTables,
  verifyPhaseShieldTablesExist,
} from "../_shared/phase-shield/provision.ts";

serve(
  withPhaseShield({ endpoint: "phase-shield-handshake", bootstrap: true }, async () => {
    const provisioned = await ensurePhaseShieldTables();
    const verified = provisioned ? await verifyPhaseShieldTablesExist() : false;

    return new Response(
      JSON.stringify({
        ok: true,
        shield: "SENTINEL-718",
        protocol: SENTINEL_PROTOCOL_VERSION,
        f_exact_hz: F_EXACT_HZ,
        f_zeta_core_hz: F_ZETA_CORE_HZ,
        f_delta_dna_zeta_hz: F_DELTA_DNA_ZETA_HZ,
        phi: PHI,
        gamma: GAMMA_GOLD,
        gatca_mean_coherence: gatcaIntervalCoherence(),
        torus_closure_coherence: torusClosureCoherence(),
        coherence_threshold: COHERENCE_THRESHOLD,
        tables_ready: verified,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  }),
);
