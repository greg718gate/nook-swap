import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { withPhaseShield } from "../_shared/phase-shield/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BUYER_EVIDENCE_HOURS = 48;
const SELLER_RESPONSE_HOURS = 48;

type Action =
  | "open_dispute"
  | "submit_buyer_evidence"
  | "seller_respond"
  | "get_dispute";

serve(withPhaseShield({ endpoint: "order-disputes", corsHeaders }, async (req) => {
  try {
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

    const body = await req.json();
    const action = body.action as Action;
    const orderId = body.order_id as string;

    if (!orderId) throw new Error("order_id required");

    const { data: order } = await supabase
      .from("orders")
      .select("id, buyer_id, status, dispute_status, auto_release_frozen")
      .eq("id", orderId)
      .single();
    if (!order) throw new Error("Order not found");

    const { data: sellerItem } = await supabase
      .from("order_items")
      .select("seller_id")
      .eq("order_id", orderId)
      .limit(1)
      .maybeSingle();
    const sellerId = sellerItem?.seller_id;

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    const isBuyer = order.buyer_id === userId;
    const isSeller = sellerId === userId;

    if (action === "get_dispute") {
      const { data: dispute } = await supabase
        .from("order_disputes")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!isBuyer && !isSeller && !isAdmin) throw new Error("Not authorized");
      return json({ dispute });
    }

    if (action === "open_dispute") {
      if (!isBuyer) throw new Error("Only the buyer can open a dispute");
      if (!["paid", "shipped", "delivered"].includes(order.status)) {
        throw new Error("This order cannot be disputed in its current state");
      }
      if (order.dispute_status && order.dispute_status !== "resolved") {
        throw new Error("A dispute is already open for this order");
      }

      const reason = String(body.reason || "").trim();
      if (reason.length < 10) {
        throw new Error("Please describe the problem (at least 10 characters)");
      }

      const buyerDeadline = new Date();
      buyerDeadline.setHours(buyerDeadline.getHours() + BUYER_EVIDENCE_HOURS);

      const { data: dispute, error } = await supabase
        .from("order_disputes")
        .insert({
          order_id: orderId,
          opened_by: userId,
          status: "awaiting_buyer_evidence",
          reason,
          buyer_deadline: buyerDeadline.toISOString(),
        })
        .select()
        .single();
      if (error) throw error;

      await supabase
        .from("orders")
        .update({
          dispute_status: "open",
          auto_release_frozen: true,
        })
        .eq("id", orderId);

      return json({
        success: true,
        dispute,
        message:
          "Dispute opened. Submit photos or details within 48 hours or the dispute will close in the seller's favour.",
      });
    }

    if (action === "submit_buyer_evidence") {
      if (!isBuyer) throw new Error("Only the buyer can submit evidence");
      const evidence = String(body.evidence || "").trim();
      if (evidence.length < 10) throw new Error("Evidence description too short");

      const { data: dispute } = await supabase
        .from("order_disputes")
        .select("*")
        .eq("order_id", orderId)
        .in("status", ["open", "awaiting_buyer_evidence"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!dispute) throw new Error("No open dispute found");

      const sellerDeadline = new Date();
      sellerDeadline.setHours(sellerDeadline.getHours() + SELLER_RESPONSE_HOURS);

      await supabase
        .from("order_disputes")
        .update({
          buyer_evidence: evidence,
          status: "awaiting_seller",
          seller_deadline: sellerDeadline.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", dispute.id);

      await supabase
        .from("orders")
        .update({ dispute_status: "awaiting_seller" })
        .eq("id", orderId);

      return json({
        success: true,
        message: "Evidence submitted. The seller has 48 hours to respond.",
      });
    }

    if (action === "seller_respond") {
      if (!isSeller && !isAdmin) throw new Error("Only the seller can respond");
      const decision = body.decision as "accept_return" | "reject";
      const response = String(body.response || "").trim();
      if (!["accept_return", "reject"].includes(decision)) {
        throw new Error("decision must be accept_return or reject");
      }

      const { data: dispute } = await supabase
        .from("order_disputes")
        .select("*")
        .eq("order_id", orderId)
        .eq("status", "awaiting_seller")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!dispute) throw new Error("No dispute awaiting seller response");

      const resolvedStatus =
        decision === "accept_return" ? "resolved_buyer" : "escalated";

      await supabase
        .from("order_disputes")
        .update({
          seller_decision: decision,
          seller_response: response || null,
          status: resolvedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", dispute.id);

      await supabase
        .from("orders")
        .update({
          dispute_status: decision === "accept_return" ? "resolved" : "escalated",
          auto_release_frozen: decision === "reject",
        })
        .eq("id", orderId);

      return json({
        success: true,
        message:
          decision === "accept_return"
            ? "You accepted the return. Admin will process the refund."
            : "You rejected the claim. The case has been escalated to VelvetBazzar support.",
      });
    }

    throw new Error("Unknown action");
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return json({ error: msg }, 400);
  }
}));

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
