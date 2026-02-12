import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!stripeKey) throw new Error("Stripe secret key not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: corsHeaders,
        });
      }
    } else {
      event = JSON.parse(body);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata!;

      const userId = metadata.user_id;
      const shippingMethod = metadata.shipping_method;
      const shippingAddress = metadata.shipping_address;
      const platformFee = parseFloat(metadata.platform_fee) / 100;
      const sellerPayout = parseFloat(metadata.seller_payout) / 100;
      const items = JSON.parse(metadata.items_json);
      const sellerTransfers = metadata.seller_transfers
        ? JSON.parse(metadata.seller_transfers)
        : null;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          buyer_id: userId,
          total_amount: (session.amount_total || 0) / 100,
          shipping_method: shippingMethod,
          shipping_address: shippingAddress,
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          platform_fee: platformFee,
          seller_payout: sellerPayout,
          status: "paid",
        })
        .select()
        .single();

      if (orderError) {
        console.error("Error creating order:", orderError);
        throw orderError;
      }

      // Create order items
      for (const item of items) {
        await supabase.from("order_items").insert({
          order_id: order.id,
          product_id: item.product_id,
          seller_id: item.seller_id,
          quantity: item.quantity,
          price: item.price,
        });

        if (item.product_type === "digital") {
          await supabase.from("purchases").insert({
            order_id: order.id,
            buyer_id: userId,
            product_id: item.product_id,
            seller_id: item.seller_id,
          });
        }

        await supabase
          .from("products")
          .update({ status: "sold" })
          .eq("id", item.product_id);
      }

      // Clear cart
      await supabase.from("cart_items").delete().eq("user_id", userId);

      // ====== STRIPE CONNECT TRANSFERS ======
      if (sellerTransfers && session.payment_intent) {
        for (const [sellerId, transferInfo] of Object.entries(sellerTransfers)) {
          const { amount_cents, stripe_account_id } = transferInfo as {
            amount_cents: number;
            stripe_account_id: string;
          };

          try {
            const transfer = await stripe.transfers.create({
              amount: amount_cents,
              currency: "gbp",
              destination: stripe_account_id,
              transfer_group: order.id,
              source_transaction: undefined,
              metadata: {
                order_id: order.id,
                seller_id: sellerId,
              },
            });
            console.log(
              `Transfer created for seller ${sellerId}: ${transfer.id}, amount: ${amount_cents}`
            );
          } catch (transferError) {
            console.error(
              `Failed to transfer to seller ${sellerId} (${stripe_account_id}):`,
              transferError
            );
            // Continue with other sellers even if one fails
          }
        }
      }

      // ====== EMAIL NOTIFICATIONS ======
      const { data: buyerProfile } = await supabase
        .from("profiles")
        .select("username, full_name")
        .eq("id", userId)
        .single();

      if (resendKey) {
        const resend = new Resend(resendKey);
        const { data: authUser } = await supabase.auth.admin.getUserById(userId);
        const buyerEmail = authUser?.user?.email;

        if (buyerEmail) {
          await resend.emails.send({
            from: "VelvetBazzar <noreply@resend.dev>",
            to: [buyerEmail],
            subject: "Potwierdzenie zamówienia - VelvetBazzar",
            html: `
              <h1>Dziękujemy za zamówienie!</h1>
              <p>Cześć ${buyerProfile?.full_name || buyerProfile?.username || "Kupujący"},</p>
              <p>Twoje zamówienie #${order.id.slice(0, 8)} zostało potwierdzone.</p>
              <p><strong>Kwota:</strong> £${((session.amount_total || 0) / 100).toFixed(2)}</p>
              <p>Sprzedawca został powiadomiony i wkrótce nada przesyłkę.</p>
              <p>Z pozdrowieniami,<br>Zespół VelvetBazzar</p>
            `,
          });
        }

        const sellerIds = [...new Set(items.map((i: any) => i.seller_id))];
        for (const sellerId of sellerIds) {
          const { data: sellerAuth } = await supabase.auth.admin.getUserById(
            sellerId as string
          );
          const sellerEmail = sellerAuth?.user?.email;

          if (sellerEmail) {
            const sellerItems = items.filter((i: any) => i.seller_id === sellerId);
            const sellerTotal = sellerItems.reduce(
              (sum: number, i: any) => sum + i.price * i.quantity,
              0
            );
            const sellerTransferAmount = sellerTransfers?.[sellerId as string]
              ? (sellerTransfers[sellerId as string] as any).amount_cents / 100
              : sellerTotal * 0.95;

            await resend.emails.send({
              from: "VelvetBazzar <noreply@resend.dev>",
              to: [sellerEmail],
              subject: "Nowe zamówienie - VelvetBazzar",
              html: `
                <h1>Masz nowe zamówienie!</h1>
                <p>Kupujący: ${buyerProfile?.username || "Kupujący"}</p>
                <p><strong>Produkty:</strong></p>
                <ul>
                  ${sellerItems.map((i: any) => `<li>${i.quantity}x - £${i.price}</li>`).join("")}
                </ul>
                <p><strong>Wypłata (95%):</strong> £${sellerTransferAmount.toFixed(2)}</p>
                <p>💰 Pieniądze zostały automatycznie przelane na Twoje konto Stripe.</p>
                <p>Proszę przygotować i nadać przesyłkę.</p>
                <p>Z pozdrowieniami,<br>Zespół VelvetBazzar</p>
              `,
            });
          }
        }
      }

      console.log("Order processed successfully:", order.id);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
