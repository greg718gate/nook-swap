import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  product_id: string | null;
  last_message_at: string;
  participants: {
    user_id: string;
    username: string;
    avatar_url: string | null;
  }[];
  last_message?: Message;
  unread_count: number;
  product?: {
    id: string;
    title: string;
    images: string[];
  };
}

export const useMessages = (userId: string | undefined) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchConversations = useCallback(async () => {
    if (!userId) return;

    try {
      // Get conversations where user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      if (participantError) throw participantError;

      if (!participantData || participantData.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const conversationIds = participantData.map(p => p.conversation_id);

      // Get conversation details
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('last_message_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      // Get all participants for these conversations
      const { data: allParticipants, error: allParticipantsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id')
        .in('conversation_id', conversationIds);

      if (allParticipantsError) throw allParticipantsError;

      // Get unique user IDs
      const userIds = [...new Set(allParticipants?.map(p => p.user_id) || [])];

      // Get profiles for all participants
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Get last message for each conversation
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Get product details if applicable
      const productIds = conversationsData
        ?.filter(c => c.product_id)
        .map(c => c.product_id) || [];

      let products: any[] = [];
      if (productIds.length > 0) {
        const { data: productsData } = await supabase
          .from('products')
          .select('id, title, images')
          .in('id', productIds);
        products = productsData || [];
      }

      // Combine all data
      const enrichedConversations = conversationsData?.map(conv => {
        const convParticipants = allParticipants
          ?.filter(p => p.conversation_id === conv.id && p.user_id !== userId)
          .map(p => {
            const profile = profiles?.find(pr => pr.id === p.user_id);
            return {
              user_id: p.user_id,
              username: profile?.username || 'Unknown',
              avatar_url: profile?.avatar_url
            };
          }) || [];

        const convMessages = messages?.filter(m => m.conversation_id === conv.id) || [];
        const lastMessage = convMessages[0];
        const unreadMessages = convMessages.filter(m => !m.is_read && m.sender_id !== userId);

        const product = products.find(p => p.id === conv.product_id);

        return {
          ...conv,
          participants: convParticipants,
          last_message: lastMessage,
          unread_count: unreadMessages.length,
          product
        };
      }) || [];

      setConversations(enrichedConversations);
      setUnreadCount(enrichedConversations.reduce((acc, c) => acc + c.unread_count, 0));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const startConversation = useCallback(async (
    otherUserId: string,
    productId?: string
  ): Promise<string | null> => {
    if (!userId) return null;

    try {
      // Check if conversation already exists between these users for this product
      const { data: existingParticipations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      if (existingParticipations && existingParticipations.length > 0) {
        const convIds = existingParticipations.map(p => p.conversation_id);
        
        const { data: otherParticipations } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', otherUserId)
          .in('conversation_id', convIds);

        if (otherParticipations && otherParticipations.length > 0) {
          // Check if any of these conversations are about the same product
          for (const op of otherParticipations) {
            const { data: conv } = await supabase
              .from('conversations')
              .select('id, product_id')
              .eq('id', op.conversation_id)
              .single();

            if (conv && (conv.product_id === productId || (!conv.product_id && !productId))) {
              return conv.id;
            }
          }
        }
      }

      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({ product_id: productId || null })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants sequentially (RLS requires creator to join before adding the other user)
      const { error: selfParticipantError } = await supabase
        .from('conversation_participants')
        .insert({ conversation_id: newConv.id, user_id: userId });

      if (selfParticipantError) throw selfParticipantError;

      const { error: otherParticipantError } = await supabase
        .from('conversation_participants')
        .insert({ conversation_id: newConv.id, user_id: otherUserId });

      if (otherParticipantError) throw otherParticipantError;

      await fetchConversations();
      return newConv.id;
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Nie udało się rozpocząć rozmowy');
      return null;
    }
  }, [userId, fetchConversations]);

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content
        });

      if (error) throw error;

      // Send email notification to the other participant (fire-and-forget)
      supabase.functions.invoke('notify-new-message', {
        body: { conversationId, messageContent: content }
      }).catch(err => console.error('Email notification error:', err));

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Nie udało się wysłać wiadomości');
      return false;
    }
  }, [userId]);

  const markAsRead = useCallback(async (conversationId: string) => {
    if (!userId) return;

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId);

      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      await fetchConversations();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [userId, fetchConversations]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('messages_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('New message received:', payload);
          fetchConversations();
          
          // Show toast notification for new messages from others
          if (payload.new && (payload.new as Message).sender_id !== userId) {
            const conversationId = (payload.new as Message).conversation_id;
            toast.info('Masz nową wiadomość!', {
              action: {
                label: 'Zobacz',
                onClick: () => {
                  window.location.href = `/profile?tab=messages&conversation=${conversationId}`;
                }
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchConversations]);

  return {
    conversations,
    loading,
    unreadCount,
    startConversation,
    sendMessage,
    markAsRead,
    refetch: fetchConversations
  };
};

export const useConversationMessages = (conversationId: string | null, userId: string | undefined) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to realtime updates for this conversation
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`conversation_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return { messages, loading, refetch: fetchMessages };
};
