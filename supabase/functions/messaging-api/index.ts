import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Action =
  | "list_conversations"
  | "get_messages"
  | "start_conversation"
  | "send_message"
  | "mark_read";

async function getUserId(req: Request, admin: SupabaseClient): Promise<string> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Not authenticated");

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new Error("Invalid user token");
  return data.user.id;
}

async function assertParticipant(
  admin: SupabaseClient,
  userId: string,
  conversationId: string,
) {
  const { data, error } = await admin
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Forbidden");
}

async function listConversations(admin: SupabaseClient, userId: string) {
  const { data: participantData, error: participantError } = await admin
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);

  if (participantError) throw participantError;

  if (!participantData?.length) {
    return { conversations: [], unreadCount: 0 };
  }

  const conversationIds = participantData.map((p) => p.conversation_id);

  const { data: conversationsData, error: conversationsError } = await admin
    .from("conversations")
    .select("*")
    .in("id", conversationIds)
    .order("last_message_at", { ascending: false });

  if (conversationsError) throw conversationsError;

  const { data: allParticipants, error: allParticipantsError } = await admin
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .in("conversation_id", conversationIds);

  if (allParticipantsError) throw allParticipantsError;

  const userIds = [...new Set(allParticipants?.map((p) => p.user_id) || [])];

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);

  if (profilesError) throw profilesError;

  const { data: messages, error: messagesError } = await admin
    .from("messages")
    .select("*")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  if (messagesError) throw messagesError;

  const productIds = conversationsData
    ?.filter((c) => c.product_id)
    .map((c) => c.product_id) || [];

  let products: { id: string; title: string; images: string[] }[] = [];
  if (productIds.length > 0) {
    const { data: productsData } = await admin
      .from("products")
      .select("id, title, images")
      .in("id", productIds);
    products = productsData || [];
  }

  const enrichedConversations = conversationsData?.map((conv) => {
    const convParticipants =
      allParticipants
        ?.filter((p) => p.conversation_id === conv.id && p.user_id !== userId)
        .map((p) => {
          const profile = profiles?.find((pr) => pr.id === p.user_id);
          return {
            user_id: p.user_id,
            username: profile?.username || "Unknown",
            avatar_url: profile?.avatar_url ?? null,
          };
        }) || [];

    const convMessages = messages?.filter((m) => m.conversation_id === conv.id) || [];
    const lastMessage = convMessages[0];
    const unreadMessages = convMessages.filter(
      (m) => !m.is_read && m.sender_id !== userId,
    );

    const product = products.find((p) => p.id === conv.product_id);

    return {
      ...conv,
      participants: convParticipants,
      last_message: lastMessage,
      unread_count: unreadMessages.length,
      product,
    };
  }) || [];

  const unreadCount = enrichedConversations.reduce(
    (acc, c) => acc + c.unread_count,
    0,
  );

  return { conversations: enrichedConversations, unreadCount };
}

async function getMessages(
  admin: SupabaseClient,
  userId: string,
  conversationId: string,
) {
  await assertParticipant(admin, userId, conversationId);

  const { data, error } = await admin
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return { messages: data || [] };
}

async function startConversation(
  admin: SupabaseClient,
  userId: string,
  otherUserId: string,
  productId?: string | null,
) {
  if (userId === otherUserId) throw new Error("Cannot message yourself");

  const { data: existingParticipations } = await admin
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);

  if (existingParticipations?.length) {
    const convIds = existingParticipations.map((p) => p.conversation_id);

    const { data: otherParticipations } = await admin
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", otherUserId)
      .in("conversation_id", convIds);

    if (otherParticipations?.length) {
      for (const op of otherParticipations) {
        const { data: conv } = await admin
          .from("conversations")
          .select("id, product_id")
          .eq("id", op.conversation_id)
          .single();

        if (
          conv &&
          (conv.product_id === productId || (!conv.product_id && !productId))
        ) {
          return { conversationId: conv.id };
        }
      }
    }
  }

  const { data: newConv, error: convError } = await admin
    .from("conversations")
    .insert({ product_id: productId || null })
    .select()
    .single();

  if (convError) throw convError;

  const { error: selfError } = await admin
    .from("conversation_participants")
    .insert({ conversation_id: newConv.id, user_id: userId });

  if (selfError) throw selfError;

  const { error: otherError } = await admin
    .from("conversation_participants")
    .insert({ conversation_id: newConv.id, user_id: otherUserId });

  if (otherError) throw otherError;

  return { conversationId: newConv.id };
}

async function sendMessage(
  admin: SupabaseClient,
  userId: string,
  conversationId: string,
  content: string,
) {
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Message cannot be empty");

  await assertParticipant(admin, userId, conversationId);

  const { error } = await admin.from("messages").insert({
    conversation_id: conversationId,
    sender_id: userId,
    content: trimmed,
  });

  if (error) throw error;
  return { success: true };
}

async function markRead(
  admin: SupabaseClient,
  userId: string,
  conversationId: string,
) {
  await assertParticipant(admin, userId, conversationId);

  await admin
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId);

  await admin
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  return { success: true };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, supabaseServiceKey);

    const userId = await getUserId(req, admin);
    const body = await req.json();
    const action = body.action as Action;

    let result: unknown;

    switch (action) {
      case "list_conversations":
        result = await listConversations(admin, userId);
        break;
      case "get_messages":
        result = await getMessages(admin, userId, body.conversationId);
        break;
      case "start_conversation":
        result = await startConversation(
          admin,
          userId,
          body.otherUserId,
          body.productId,
        );
        break;
      case "send_message":
        result = await sendMessage(
          admin,
          userId,
          body.conversationId,
          body.content,
        );
        break;
      case "mark_read":
        result = await markRead(admin, userId, body.conversationId);
        break;
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Forbidden" ? 403 : message.includes("auth") ? 401 : 500;
    console.error("messaging-api error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
