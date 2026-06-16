import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { withPhaseShield } from "../_shared/phase-shield/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// 100 VC = 1% lower platform fee (max 250 VC = 2.5% off the standard 5% fee)
export const COINS_PER_PERCENT = 100;
export const MAX_REDEEM_PER_SALE = 250;
export const PLATFORM_FEE_RATE = 0.05;

export const REWARDS = {
  signup: 25,
  referral_signup: 50,
  first_sale: 100,
  referral_first_sale: 75,
} as const;

serve(withPhaseShield({ endpoint: "velvet-coin-api", corsHeaders }, async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const body = await req.json();
    const action = body.action as string;

    if (action === "balance") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("velvet_coins, velvet_coins_auto_apply, referral_code")
        .eq("id", userId)
        .single();

      const { data: ledger } = await supabase
        .from("velvet_coin_ledger")
        .select("amount, reason, created_at, balance_after")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      return new Response(
        JSON.stringify({ profile, ledger: ledger || [], rewards: REWARDS, coins_per_percent: COINS_PER_PERCENT }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "set_auto_apply") {
      const coins = Math.max(0, Math.min(MAX_REDEEM_PER_SALE, Number(body.coins) || 0));
      const { data: profile } = await supabase
        .from("profiles")
        .select("velvet_coins")
        .eq("id", userId)
        .single();

      const balance = profile?.velvet_coins ?? 0;
      const applied = Math.min(coins, balance);

      await supabase
        .from("profiles")
        .update({ velvet_coins_auto_apply: applied })
        .eq("id", userId);

      return new Response(JSON.stringify({ velvet_coins_auto_apply: applied }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}));
