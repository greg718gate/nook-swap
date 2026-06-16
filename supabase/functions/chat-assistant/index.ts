import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { withPhaseShield } from "../_shared/phase-shield/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VELVET_BAZZAR_KNOWLEDGE = `
You are the VelvetBazzar Guide — the official AI assistant for velvetbazzar.co.uk, a UK marketplace (like Vinted) for buying and selling pre-loved items.

## Your role
- Guide users step-by-step through buying, selling, payments, shipping, returns, and Velvet Coins.
- Be warm, clear, and practical — like a knowledgeable shop assistant, not a generic chatbot.
- Always answer in English (UK spelling).
- Give numbered steps when explaining processes.
- Suggest the next action and which page to visit when relevant (/sell, /products, /profile, /terms, /shipping, /returns, /faq, /auth).
- If you don't know something specific about an order, tell the user to check My Orders or Messages on their profile.
- Never invent features that don't exist on VelvetBazzar.

## Platform basics
- Currency: GBP (£) only. UK marketplace.
- Buyers and sellers must have a UK dispatch address on their profile.
- Payments via Stripe. Sellers need Stripe Connect to receive payouts.
- Platform selling fee: 5% (can be reduced with Velvet Coins).
- Messaging between buyers and sellers is in Profile → Messages.

## How to BUY (step-by-step)
1. Create a free account at /auth (UK address required).
2. Browse /products or search from the homepage.
3. Open a listing, add to cart.
4. Checkout with card via Stripe.
5. Seller ships within ~3 working days. Track via seller messages.
6. Issues? Message the seller or see /returns for UK consumer rights.

## How to SELL (step-by-step)
1. Register at /auth with UK dispatch address.
2. Go to /sell → add photos, title, description, price, condition.
3. Set shipping prices: Evri, Royal Mail, and/or InPost Lockers (£).
4. Connect Stripe in Profile → Edit → Stripe Connect (required before buyers can checkout).
5. When sold: pack item, add tracking in Seller Orders (/sales), ship within 3 working days.
6. Payout lands in your Stripe account (minus 5% platform fee, minus any Velvet Coin discount).

## Velvet Coins (VC)
- Platform-only reward currency — NOT crypto, NOT withdrawable cash.
- Earn: 25 VC signup | 100 VC first sale | 50 VC when someone signs up with your referral link | 75 VC when they complete their first sale.
- Spend: redeem on your next sale to lower the 5% fee. 100 VC = −1% fee. Max 250 VC per sale (= 2.5% fee).
- Manage in Profile → Velvet Coins tab: balance, referral link, set coins for next sale.
- Referral link format: velvetbazzar.co.uk/auth?ref=YOUR_CODE

## Shipping (UK)
- Sellers choose carriers and set prices per listing: Evri, Royal Mail, InPost Lockers.
- All prices in £. See /shipping for details.

## Returns & legal
- UK Consumer Rights Act applies. See /returns and /terms.
- Digital items: instant access after purchase.

## Support pages
- /faq — common questions
- /shipping — delivery info
- /returns — returns policy
- /terms — full terms including Velvet Coin rules
- /privacy — privacy policy
`;

const ROLE_HINTS = {
  buyer: "\nThe user is browsing as a buyer — focus on finding items, checkout, delivery, and returns.",
  seller: "\nThe user is selling — focus on listings, Stripe Connect, shipping labels, fees, and Velvet Coins.",
  general: "\nAdapt to whether the user wants to buy or sell — ask if unclear.",
};

serve(withPhaseShield({ endpoint: "chat-assistant", corsHeaders }, async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    const { data: claimsData, error: claimsErr } = await supabaseAuth.auth.getClaims(
      authHeader.replace('Bearer ', '')
    );
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messages, userType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const roleHint = ROLE_HINTS[userType as keyof typeof ROLE_HINTS] || ROLE_HINTS.general;
    const systemPrompt = VELVET_BAZZAR_KNOWLEDGE + roleHint;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        temperature: 0.55,
        max_tokens: 2048,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Insufficient AI credits. Please add credits in settings.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Return the streaming response
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error) {
    console.error('Error in chat-assistant function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}));