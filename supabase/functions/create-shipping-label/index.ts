import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { withPhaseShield } from "../_shared/phase-shield/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Address = {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  zip: string;
  country: string;
};

function parseUkAddress(text: string, fallbackName = "Recipient"): Address {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const postcode = text.match(/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i)?.[0] ?? "";
  return {
    name: lines[0] || fallbackName,
    street1: lines[1] || lines[0] || "Address line 1",
    street2: lines.length > 3 ? lines[2] : undefined,
    city: lines.length > 2 ? lines[lines.length - 2] : "London",
    zip: postcode || "SW1A 1AA",
    country: "GB",
  };
}

function carrierMatchers(method: string): string[] {
  const m = (method || "").toLowerCase();
  if (m.includes("inpost")) return ["inpost"];
  if (m.includes("royal")) return ["royal_mail", "royal mail"];
  if (m.includes("evri") || m.includes("hermes")) return ["evri", "hermes"];
  return ["evri", "hermes", "royal_mail", "inpost"];
}

async function shippoRequest(apiKey: string, path: string, body?: unknown) {
  const res = await fetch(`https://api.goshippo.com${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `ShippoToken ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.detail || data?.message || "Shippo API error");
  }
  return data;
}

serve(withPhaseShield({ endpoint: "create-shipping-label", corsHeaders }, async (req) => {
  try {
    const shippoKey = Deno.env.get("SHIPPO_API_KEY");
    if (!shippoKey) {
      return new Response(
        JSON.stringify({
          error:
            "Automated labels are not configured yet. Use manual tracking or contact support.",
          code: "SHIPPO_NOT_CONFIGURED",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id required" }), {
        status: 400,
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
    const sellerId = userData.user.id;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, shipping_method, shipping_address, shipping_label_url, tracking_number")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.status !== "paid") {
      return new Response(JSON.stringify({ error: "Order is not ready to ship" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.shipping_label_url && order.tracking_number) {
      return new Response(
        JSON.stringify({
          success: true,
          label_url: order.shipping_label_url,
          tracking_number: order.tracking_number,
          already_created: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: items } = await supabase
      .from("order_items")
      .select("seller_id")
      .eq("order_id", order_id);

    const isSeller = items?.some((i) => i.seller_id === sellerId);
    if (!isSeller) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "dispatch_name, dispatch_line1, dispatch_line2, dispatch_city, dispatch_postcode, dispatch_country, full_name, username",
      )
      .eq("id", sellerId)
      .single();

    if (!profile?.dispatch_line1 || !profile?.dispatch_postcode) {
      return new Response(
        JSON.stringify({
          error: "Add your dispatch address in Profile before generating a label.",
          code: "DISPATCH_ADDRESS_REQUIRED",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!order.shipping_address) {
      return new Response(JSON.stringify({ error: "Buyer shipping address missing" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const addressFrom: Address = {
      name: profile.dispatch_name || profile.full_name || profile.username,
      street1: profile.dispatch_line1,
      street2: profile.dispatch_line2 || undefined,
      city: profile.dispatch_city || "London",
      zip: profile.dispatch_postcode,
      country: profile.dispatch_country || "GB",
    };

    const addressTo = parseUkAddress(order.shipping_address);

    const shipment = await shippoRequest(shippoKey, "/shipments/", {
      address_from: addressFrom,
      address_to: addressTo,
      parcels: [
        {
          length: "30",
          width: "20",
          height: "10",
          distance_unit: "cm",
          weight: "0.5",
          mass_unit: "kg",
        },
      ],
      async: false,
    });

    const wanted = carrierMatchers(order.shipping_method || "evri");
    const rates = (shipment.rates || []) as Array<{
      object_id: string;
      provider: string;
      servicelevel?: { name?: string };
      amount: string;
    }>;

    const rate = rates.find((r) =>
      wanted.some((w) =>
        `${r.provider} ${r.servicelevel?.name || ""}`.toLowerCase().includes(w)
      ),
    ) || rates[0];

    if (!rate) {
      throw new Error("No shipping rates available for this route");
    }

    const transaction = await shippoRequest(shippoKey, "/transactions/", {
      rate: rate.object_id,
      label_file_type: "PDF",
      async: false,
    });

    if (transaction.status !== "SUCCESS") {
      throw new Error(transaction.messages?.[0]?.text || "Label purchase failed");
    }

    const trackingNumber = transaction.tracking_number as string;
    const labelUrl = transaction.label_url as string;
    const trackingUrl = transaction.tracking_url_provider as string | null;
    const shipmentId = transaction.object_id as string;
    const carrier = rate.provider || order.shipping_method || "Carrier";

    await supabase
      .from("orders")
      .update({
        status: "shipped",
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
        shipping_label_url: labelUrl,
        shipment_id: shipmentId,
        shipment_status: "label_ready",
        carrier,
        shipped_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    return new Response(
      JSON.stringify({
        success: true,
        label_url: labelUrl,
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
        carrier,
        rate_gbp: rate.amount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("create-shipping-label:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}));
