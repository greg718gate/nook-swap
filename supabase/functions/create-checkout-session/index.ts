import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { withPhaseShield } from "../_shared/phase-shield/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CartItemRequest {
  product_id: string;
  quantity: number;
}

const COINS_PER_PERCENT = 100;
const MAX_REDEEM_PER_SALE = 250;
const PLATFORM_FEE_RATE = 0.05;

function sellerFeeRate(coinsUsed: number): number {
  const reduction = (Math.min(Math.max(coinsUsed, 0), MAX_REDEEM_PER_SALE) / COINS_PER_PERCENT) * 0.01;
  return Math.max(PLATFORM_FEE_RATE - reduction, 0.025);
}

interface CheckoutRequest {
  items: CartItemRequest[];
  shipping_method: string;
  shipping_address?: string;
  coupon_code?: string;
}

const handler = withPhaseShield({ endpoint: "create-checkout-session", corsHeaders }, async (req: Request): Promise<Response> => {
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

    const body: CheckoutRequest = await req.json();
    const { items: clientItems, shipping_method, shipping_address, coupon_code } = body;

    // Validate input
    if (!Array.isArray(clientItems) || clientItems.length === 0) {
      throw new Error("No items in cart");
    }
    for (const i of clientItems) {
      if (typeof i.product_id !== "string" || !i.product_id) throw new Error("Invalid product_id");
      if (!Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 100) {
        throw new Error("Invalid quantity");
      }
    }
    if (typeof shipping_method !== "string" || shipping_method.length > 50) {
      throw new Error("Invalid shipping method");
    }
    if (shipping_address && (typeof shipping_address !== "string" || shipping_address.length > 1000)) {
      throw new Error("Invalid shipping address");
    }

    // Fetch authoritative product data server-side (NEVER trust client prices)
    const productIds = [...new Set(clientItems.map((i) => i.product_id))];
    const { data: dbProducts, error: prodError } = await supabase
      .from("products")
      .select("id, title, price, seller_id, product_type, status, images, shipping_inpost, shipping_royal_mail, shipping_evri")
      .in("id", productIds);

    if (prodError) throw new Error("Failed to fetch products");
    if (!dbProducts || dbProducts.length !== productIds.length) {
      throw new Error("One or more products not found");
    }

    // Build authoritative items list
    const items = clientItems.map((ci) => {
      const p = dbProducts.find((dp) => dp.id === ci.product_id)!;
      if (p.status !== "active") throw new Error(`Product unavailable: ${p.title}`);
      const shippingCostMap: Record<string, number> = {
        inpost: Number(p.shipping_inpost) || 0,
        royal_mail: Number(p.shipping_royal_mail) || 0,
        evri: Number(p.shipping_evri) || 0,
      };
      const shipping_cost = p.product_type === "physical"
        ? (shippingCostMap[shipping_method] ?? 0)
        : 0;
      return {
        product_id: p.id,
        quantity: ci.quantity,
        title: p.title,
        price: Number(p.price),
        seller_id: p.seller_id,
        image_url: Array.isArray(p.images) && p.images[0] ? p.images[0] : undefined,
        product_type: p.product_type,
        shipping_cost,
      };
    });

    // Verify all sellers have Stripe Connect accounts
    const sellerIds = [...new Set(items.map((i) => i.seller_id))];
    const { data: sellerProfiles, error: sellerError } = await supabase
      .from("profiles")
      .select("id, stripe_account_id, stripe_onboarded, velvet_coins, velvet_coins_auto_apply")
      .in("id", sellerIds);

    if (sellerError) throw new Error("Failed to fetch seller profiles");

    const sellersWithoutStripe = sellerProfiles?.filter(
      (s) => !s.stripe_account_id || !s.stripe_onboarded
    );

    if (sellersWithoutStripe && sellersWithoutStripe.length > 0) {
      throw new Error(
        "Some sellers have not finished Stripe setup. Checkout cannot be completed."
      );
    }

    // Build seller -> stripe_account_id map
    const sellerStripeMap: Record<string, string> = {};
    sellerProfiles?.forEach((s) => {
      sellerStripeMap[s.id] = s.stripe_account_id!;
    });

    // Calculate totals (server-side prices only)
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = items.reduce(
      (sum, item) => sum + (item.product_type === "physical" ? item.shipping_cost : 0),
      0
    );

    // Validate and apply coupon (server-side)
    let discount = 0;
    let appliedCouponCode: string | null = null;
    if (coupon_code && typeof coupon_code === "string") {
      const sellerSet = new Set(items.map((i) => i.seller_id));
      if (sellerSet.size === 1) {
        const sellerId = [...sellerSet][0];
        const { data: cdata } = await supabase.rpc("validate_coupon", {
          _code: coupon_code.trim().toUpperCase(),
          _seller_id: sellerId,
          _subtotal: subtotal,
        });
        if (cdata && cdata[0]?.coupon_id) {
          discount = Number(cdata[0].discount) || 0;
          appliedCouponCode = coupon_code.trim().toUpperCase();
          // Increment uses_count atomically
          const { data: cur } = await supabase
            .from("coupons")
            .select("uses_count")
            .eq("id", cdata[0].coupon_id)
            .single();
          await supabase
            .from("coupons")
            .update({ uses_count: (cur?.uses_count ?? 0) + 1 })
            .eq("id", cdata[0].coupon_id);
        }
      }
    }

    const total = Math.max(0, subtotal + shippingCost - discount);

    const velvetRedemptions: Record<string, number> = {};
    sellerProfiles?.forEach((s) => {
      const coinsToUse = Math.min(
        s.velvet_coins ?? 0,
        s.velvet_coins_auto_apply ?? 0,
        MAX_REDEEM_PER_SALE,
      );
      if (coinsToUse > 0) velvetRedemptions[s.id] = coinsToUse;
    });

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
    // Apply discount proportionally, then seller share after platform fee (Velvet Coin may reduce fee)
    const grossPreDiscount = subtotal + shippingCost;
    const sellerTransfers: Record<string, { amount_cents: number; stripe_account_id: string; velvet_coins_used: number }> = {};
    let platformFeeCents = 0;
    let sellerPayoutCents = 0;
    for (const [sellerId, amount] of Object.entries(sellerAmounts)) {
      const sellerDiscount = grossPreDiscount > 0 ? (amount / grossPreDiscount) * discount : 0;
      const net = amount - sellerDiscount;
      const coinsUsed = velvetRedemptions[sellerId] ?? 0;
      const feeRate = sellerFeeRate(coinsUsed);
      const sellerShare = 1 - feeRate;
      const sellerCents = Math.round(net * sellerShare * 100);
      const feeCents = Math.round(net * feeRate * 100);
      platformFeeCents += feeCents;
      sellerPayoutCents += sellerCents;
      sellerTransfers[sellerId] = {
        amount_cents: sellerCents,
        stripe_account_id: sellerStripeMap[sellerId],
        velvet_coins_used: coinsUsed,
      };
    }

    const platformFee = platformFeeCents;
    const sellerPayout = sellerPayoutCents;

    // Create line items for Stripe (using server-fetched prices/titles)
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
            name: `Shipping (${shipping_method})`,
            images: [],
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    let stripeDiscounts: any[] | undefined;
    if (discount > 0) {
      const stripeCoupon = await stripe.coupons.create({
        amount_off: Math.round(discount * 100),
        currency: "gbp",
        duration: "once",
        name: `Rabat ${appliedCouponCode}`,
      });
      stripeDiscounts = [{ coupon: stripeCoupon.id }];
    }

    const origin = req.headers.get("origin") || "https://nook-swap.lovable.app";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      discounts: stripeDiscounts,
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
        coupon_code: appliedCouponCode || "",
        discount_amount: discount.toFixed(2),
        seller_transfers: JSON.stringify(sellerTransfers),
        velvet_redemptions: JSON.stringify(velvetRedemptions),
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
});

serve(handler);
