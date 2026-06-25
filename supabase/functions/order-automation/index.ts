import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-order-automation-secret",
};

const GHOSTING_DAYS = 7;
const BUYER_EVIDENCE_HOURS = 48;
const SELLER_RESPONSE_HOURS = 48;

function authorizeCron(req: Request): boolean {
  const secret = Deno.env.get("ORDER_AUTOMATION_SECRET");
  if (!secret) {
    console.error("ORDER_AUTOMATION_SECRET not configured");
    return false;
  }
  const header =
    req.headers.get("x-order-automation-secret") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  return header === secret;
}

async function autoRefundGhosting(
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe,
) {
  const now = new Date().toISOString();
  const { data: staleOrders, error } = await supabase
    .from("orders")
    .select("id, buyer_id, stripe_payment_intent_id, status")
    .eq("status", "paid")
    .is("tracking_number", null)
    .not("ship_by_deadline", "is", null)
    .lt("ship_by_deadline", now)
    .is("dispute_status", null);

  if (error) throw error;

  let refunded = 0;
  for (const order of staleOrders ?? []) {
    if (!order.stripe_payment_intent_id) continue;
    try {
      await stripe.refunds.create({
        payment_intent: order.stripe_payment_intent_id,
        reverse_transfer: true,
        metadata: {
          order_id: order.id,
          reason: "seller_ghosting_timeout",
        },
      });

      await supabase
        .from("orders")
        .update({
          status: "refunded",
          cancellation_reason: "Seller did not dispatch within 7 days — automatic refund",
        })
        .eq("id", order.id);

      const { data: items } = await supabase
        .from("order_items")
        .select("product_id")
        .eq("order_id", order.id);
      for (const it of items ?? []) {
        await supabase
          .from("products")
          .update({ status: "active" })
          .eq("id", it.product_id);
      }
      refunded++;
    } catch (e) {
      console.error(`Ghosting refund failed for order ${order.id}:`, e);
    }
  }
  return refunded;
}

async function closeStaleDisputes(supabase: ReturnType<typeof createClient>) {
  const now = new Date().toISOString();

  const { data: expiredBuyer } = await supabase
    .from("order_disputes")
    .select("id, order_id")
    .eq("status", "awaiting_buyer_evidence")
    .lt("buyer_deadline", now);

  for (const d of expiredBuyer ?? []) {
    await supabase
      .from("order_disputes")
      .update({ status: "closed_no_evidence", updated_at: now })
      .eq("id", d.id);
    await supabase
      .from("orders")
      .update({ dispute_status: "resolved", auto_release_frozen: false })
      .eq("id", d.order_id);
  }

  const { data: expiredSeller } = await supabase
    .from("order_disputes")
    .select("id, order_id")
    .eq("status", "awaiting_seller")
    .lt("seller_deadline", now);

  for (const d of expiredSeller ?? []) {
    await supabase
      .from("order_disputes")
      .update({ status: "escalated", updated_at: now })
      .eq("id", d.id);
    await supabase
      .from("orders")
      .update({ dispute_status: "escalated" })
      .eq("id", d.order_id);
  }

  return (expiredBuyer?.length ?? 0) + (expiredSeller?.length ?? 0);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!authorizeCron(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const ghostingRefunds = await autoRefundGhosting(supabase, stripe);
    const disputesProcessed = await closeStaleDisputes(supabase);

    return new Response(
      JSON.stringify({
        ok: true,
        ghosting_refunds: ghostingRefunds,
        disputes_processed: disputesProcessed,
        ghosting_days: GHOSTING_DAYS,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("order-automation:", error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
