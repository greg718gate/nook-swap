import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { withPhaseShield } from "../_shared/phase-shield/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function normalizeUsername(raw: string, email: string): string {
  const base = (raw?.trim() || email.split("@")[0])
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);

  return base.length >= 3 ? base : `user${Date.now().toString(36).slice(-6)}`;
}

serve(withPhaseShield({ endpoint: "auth-signup", corsHeaders }, async (req) => {
  try {
    const { email, password, username, referral_code } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = normalizeUsername(username, cleanEmail);

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", cleanUsername)
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: "Username is already taken — please choose another" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        username: cleanUsername,
      },
    });

    if (error) {
      let msg = error.message;
      if (error.message.includes("already") || error.message.includes("registered")) {
        msg = "An account with this email already exists — please sign in";
      } else if (error.message.includes("Database error")) {
        msg = "Could not create account — check that username and email are available";
      }
      return new Response(JSON.stringify({ error: msg }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newUserId = data.user?.id;
    if (newUserId) {
      let referrerId: string | null = null;
      if (referral_code && typeof referral_code === "string") {
        const code = referral_code.trim().toUpperCase();
        const { data: referrer } = await supabase
          .from("profiles")
          .select("id")
          .eq("referral_code", code)
          .maybeSingle();
        if (referrer?.id && referrer.id !== newUserId) {
          referrerId = referrer.id;
          await supabase
            .from("profiles")
            .update({ referred_by: referrerId })
            .eq("id", newUserId);
        }
      }

      await supabase.rpc("grant_velvet_coins", {
        p_user_id: newUserId,
        p_amount: 25,
        p_reason: "signup_bonus",
      });

      if (referrerId) {
        await supabase.rpc("grant_velvet_coins", {
          p_user_id: referrerId,
          p_amount: 50,
          p_reason: "referral_signup",
          p_reference_id: newUserId,
        });
      }
    }

    return new Response(JSON.stringify({ success: true, userId: data.user?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("auth-signup error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}));
