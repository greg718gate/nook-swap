import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { withPhaseShield, RIEMANN_CARRIER_HZ } from "../_shared/phase-shield/mod.ts";

serve(
  withPhaseShield({ endpoint: "phase-shield-handshake", bootstrap: true }, async () => {
    return new Response(
      JSON.stringify({
        ok: true,
        shield: "anti-bot-phase",
        carrier_hz: RIEMANN_CARRIER_HZ,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  }),
);
