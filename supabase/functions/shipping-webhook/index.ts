import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, shippo-api-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const event = payload.event as string | undefined;
    const data = payload.data as Record<string, unknown> | undefined;

    if (!event || !data) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const trackingNumber =
      (data.tracking_number as string) ||
      (data.tracking as { tracking_number?: string })?.tracking_number;

    if (!trackingNumber) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trackingStatus =
      (data.tracking_status as { status?: string })?.status ||
      (data.status as string) ||
      "";

    const statusLower = String(trackingStatus).toLowerCase();
    let shipmentStatus = "in_transit";
    let orderStatus: string | null = null;

    if (statusLower.includes("delivered")) {
      shipmentStatus = "delivered";
      orderStatus = "delivered";
    } else if (statusLower.includes("transit") || statusLower.includes("picked")) {
      shipmentStatus = "in_transit";
      orderStatus = "shipped";
    }

    const update: Record<string, string> = { shipment_status: shipmentStatus };
    if (orderStatus) update.status = orderStatus;
    if (orderStatus === "delivered") {
      update.delivered_at = new Date().toISOString();
    }

    const trackingUrl = data.tracking_url_provider as string | undefined;
    if (trackingUrl) update.tracking_url = trackingUrl;

    await supabase
      .from("orders")
      .update(update)
      .eq("tracking_number", trackingNumber);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("shipping-webhook:", error);
    return new Response(JSON.stringify({ error: "Webhook failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
