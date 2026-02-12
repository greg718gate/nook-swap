import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CartItem {
  product_id: string;
  quantity: number;
  title: string;
  price: number;
  seller_id: string;
  image_url?: string;
  product_type: string;
  shipping_cost: number;
}

interface CheckoutRequest {
  items: CartItem[];
  shipping_method: string;
  shipping_address?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe secret key not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Invalid user token");

    const { items, shipping_method, shipping_address }: CheckoutRequest = await req.json();
    if (!items || items.length === 0) throw new Error("No items in cart");

    // Verify all sellers have Stripe Connect accounts
    const sellerIds = [...new Set(items.map((i) => i.seller_id))];
    const { data: sellerProfiles, error: sellerError } = await supabase
      .from("profiles")
      .select("id, stripe_account_id, stripe_onboarded")
      .in("id", sellerIds);

    if (sellerError) throw new Error("Failed to fetch seller profiles");

    const sellersWithoutStripe = sellerProfiles?.filter(
      (s) => !s.stripe_account_id || !s.stripe_onboarded
    );

    if (sellersWithoutStripe && sellersWithoutStripe.length > 0) {
      throw new Error(
        "Niektórzy sprzedawcy nie mają jeszcze skonfigurowanego konta Stripe. Nie można dokończyć zamówienia."
      );
    }

    // Build seller -> stripe_account_id map
    const sellerStripeMap: Record<string, string> = {};
    sellerProfiles?.forEach((s) => {
      sellerStripeMap[s.id] = s.stripe_account_id!;
    });

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = items.reduce(
      (sum, item) => sum + (item.product_type === "physical" ? item.shipping_cost : 0),
      0
    );
    const total = subtotal + shippingCost;
    const platformFee = Math.round(total * 0.05 * 100); // 5% in cents
    const sellerPayout = Math.round(total * 0.95 * 100); // 95% in cents

    // Calculate per-seller amounts for transfers (stored in metadata)
    const sellerAmounts: Record<string, number> = {};
    for (const item of items) {
      const itemTotal = item.price * item.quantity;
      sellerAmounts[item.seller_id] = (sellerAmounts[item.seller_id] || 0) + itemTotal;
    }
    // Distribute shipping proportionally to sellers
    if (shippingCost > 0) {
      for (const sellerId of Object.keys(sellerAmounts)) {
        const proportion = sellerAmounts[sellerId] / subtotal;
        sellerAmounts[sellerId] += shippingCost * proportion;
      }
    }
    // Apply 95% to each seller
    const sellerTransfers: Record<string, { amount_cents: number; stripe_account_id: string }> = {};
    for (const [sellerId, amount] of Object.entries(sellerAmounts)) {
      sellerTransfers[sellerId] = {
        amount_cents: Math.round(amount * 0.95 * 100),
        stripe_account_id: sellerStripeMap[sellerId],
      };
    }

    // Create line items for Stripe
    const lineItems = items.map((item) => ({
      price_data: {
        currency: "gbp",
        product_data: {
          name: item.title,
          images: item.image_url ? [item.image_url] : [],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "gbp",
          product_data: {
            name: `Wysyłka (${shipping_method})`,
            images: [],
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const origin = req.headers.get("origin") || "https://nook-swap.lovable.app";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      customer_email: userData.user.email,
      metadata: {
        user_id: userData.user.id,
        shipping_method,
        shipping_address: shipping_address || "",
        platform_fee: platformFee.toString(),
        seller_payout: sellerPayout.toString(),
        seller_transfers: JSON.stringify(sellerTransfers),
        items_json: JSON.stringify(
          items.map((i) => ({
            product_id: i.product_id,
            seller_id: i.seller_id,
            quantity: i.quantity,
            price: i.price,
            product_type: i.product_type,
          }))
        ),
      },
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Checkout error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
};

serve(handler);
