import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { withPhaseShield } from "../_shared/phase-shield/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(withPhaseShield({ endpoint: "refund-order", corsHeaders }, async (req: Request) => {
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Invalid token");
    const userId = userData.user.id;

    const { order_id, reason } = await req.json();
    if (!order_id) throw new Error("order_id required");

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();
    if (orderError || !order) throw new Error("Order not found");

    // Authorization: buyer, admin, or seller of items
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    let authorized = order.buyer_id === userId || isAdmin === true;
    if (!authorized) {
      const { data: items } = await supabase
        .from("order_items")
        .select("seller_id")
        .eq("order_id", order_id);
      authorized = !!items?.some((i) => i.seller_id === userId);
    }
    if (!authorized) throw new Error("Not authorized to refund this order");

    if (order.status === "refunded") {
      return new Response(JSON.stringify({ error: "Already refunded" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!order.stripe_payment_intent_id) {
      throw new Error("Order has no payment intent to refund");
    }

    // Refund the charge AND reverse the connected transfers
    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      reverse_transfer: true,
      refund_application_fee: false,
      metadata: { order_id, refunded_by: userId, reason: reason || "" },
    });

    await supabase
      .from("orders")
      .update({
        status: "refunded",
        refund_amount: (refund.amount || 0) / 100,
        cancellation_reason: reason || null,
      })
      .eq("id", order_id);

    // Re-list products that were in the order (so they can be sold again)
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_id")
      .eq("order_id", order_id);
    if (orderItems) {
      for (const it of orderItems) {
        await supabase
          .from("products")
          .update({ status: "active" })
          .eq("id", it.product_id);
      }
    }

    return new Response(
      JSON.stringify({ success: true, refund_id: refund.id, amount: refund.amount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Refund error:", error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
}));
