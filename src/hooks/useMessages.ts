import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { callMessagingApi } from '@/lib/messagingApi';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  off_platform_flagged?: boolean;
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

const POLL_INTERVAL_MS = 4000;

export const useMessages = (userId: string | undefined) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const previousUnreadRef = useRef(0);

  const fetchConversations = useCallback(async () => {
    if (!userId) return;

    try {
      const result = await callMessagingApi<{
        conversations: Conversation[];
        unreadCount: number;
      }>({ action: 'list_conversations' });

      setConversations(result.conversations);
      setUnreadCount(result.unreadCount);

      if (
        result.unreadCount > previousUnreadRef.current &&
        previousUnreadRef.current > 0
      ) {
        toast.info('New message!', {
          action: {
            label: 'View',
            onClick: () => {
              window.location.href = '/profile?tab=messages';
            },
          },
        });
      }
      previousUnreadRef.current = result.unreadCount;
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
      const result = await callMessagingApi<{ conversationId: string }>({
        action: 'start_conversation',
        otherUserId,
        productId: productId || null,
      });

      await fetchConversations();
      return result.conversationId;
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Could not start conversation');
      return null;
    }
  }, [userId, fetchConversations]);

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!userId) return false;

    try {
      const result = await callMessagingApi<{
        success: boolean;
        offPlatformWarning?: string | null;
      }>({
        action: 'send_message',
        conversationId,
        content,
      });

      if (result.offPlatformWarning) {
        toast.warning(result.offPlatformWarning, { duration: 8000 });
      }

      supabase.functions.invoke('notify-new-message', {
        body: { conversationId, messageContent: content },
      }).catch((err) => console.error('Email notification error:', err));

      await fetchConversations();
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Could not send message');
      return false;
    }
  }, [userId, fetchConversations]);

  const markAsRead = useCallback(async (conversationId: string) => {
    if (!userId) return;

    try {
      await callMessagingApi({
        action: 'mark_read',
        conversationId,
      });

      await fetchConversations();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [userId, fetchConversations]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(fetchConversations, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [userId, fetchConversations]);

  return {
    conversations,
    loading,
    unreadCount,
    startConversation,
    sendMessage,
    markAsRead,
    refetch: fetchConversations,
  };
};

export const useConversationMessages = (conversationId: string | null, userId: string | undefined) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !userId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      const result = await callMessagingApi<{ messages: Message[] }>({
        action: 'get_messages',
        conversationId,
      });
      setMessages(result.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, userId]);

  useEffect(() => {
    setLoading(true);
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!conversationId || !userId) return;

    const interval = setInterval(fetchMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [conversationId, userId, fetchMessages]);

  return { messages, loading, refetch: fetchMessages };
};
