import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.log("RESEND_API_KEY not configured, skipping email notification");
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the sender
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }
    const senderId = claimsData.claims.sub;

    const { conversationId, messageContent } = await req.json();

    if (!conversationId || !messageContent) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Get other participants in the conversation
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .neq("user_id", senderId);

    if (!participants || participants.length === 0) {
      return new Response(JSON.stringify({ skipped: true, reason: "no recipients" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get sender profile
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("username, full_name")
      .eq("id", senderId)
      .single();

    const senderName = senderProfile?.full_name || senderProfile?.username || "Użytkownik";

    // Get conversation product info
    const { data: conversation } = await supabase
      .from("conversations")
      .select("product_id")
      .eq("id", conversationId)
      .single();

    let productTitle = "";
    if (conversation?.product_id) {
      const { data: product } = await supabase
        .from("products")
        .select("title")
        .eq("id", conversation.product_id)
        .single();
      productTitle = product?.title || "";
    }

    const resend = new Resend(resendKey);

    // Send email to each recipient
    for (const participant of participants) {
      const { data: authUser } = await supabase.auth.admin.getUserById(participant.user_id);
      const recipientEmail = authUser?.user?.email;

      if (!recipientEmail) continue;

      const truncatedMessage = messageContent.length > 200
        ? messageContent.substring(0, 200) + "..."
        : messageContent;

      await resend.emails.send({
        from: "VelvetBazzar <noreply@resend.dev>",
        to: [recipientEmail],
        subject: `Nowa wiadomość od ${senderName} - VelvetBazzar`,
        html: `
          <h2>Masz nową wiadomość!</h2>
          <p><strong>${senderName}</strong> wysłał(a) Ci wiadomość${productTitle ? ` w sprawie produktu <em>"${productTitle}"</em>` : ""}:</p>
          <blockquote style="border-left: 3px solid #8B5CF6; padding: 12px 16px; margin: 16px 0; background: #f9f9f9; border-radius: 4px;">
            ${truncatedMessage}
          </blockquote>
          <p><a href="https://nook-swap.lovable.app/profile?tab=messages" style="background: #8B5CF6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Odpowiedz na wiadomość</a></p>
          <p style="color: #666; font-size: 12px; margin-top: 24px;">Z pozdrowieniami,<br>Zespół VelvetBazzar</p>
        `,
      });

      console.log(`Email notification sent to ${recipientEmail}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Notify error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
