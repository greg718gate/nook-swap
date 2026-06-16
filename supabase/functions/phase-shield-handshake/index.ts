import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { withPhaseShield, RIEMANN_CARRIER_HZ } from "../_shared/phase-shield/mod.ts";
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
        shield: "anti-bot-phase",
        carrier_hz: RIEMANN_CARRIER_HZ,
        tables_ready: verified,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  }),
);
