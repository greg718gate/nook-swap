import { useState, useEffect, useRef } from "react";
import { ConversationList } from "./ConversationList";
import { ChatDialog } from "./ChatDialog";
import { useMessages } from "@/hooks/useMessages";

interface MessagesSectionProps {
  userId: string;
  initialConversationId?: string | null;
}

export const MessagesSection = ({ userId, initialConversationId }: MessagesSectionProps) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const appliedInitialRef = useRef(false);
  
  const { 
    conversations, 
    loading, 
    sendMessage, 
    markAsRead 
  } = useMessages(userId);

  useEffect(() => {
    appliedInitialRef.current = false;
  }, [initialConversationId]);

  useEffect(() => {
    if (appliedInitialRef.current || !initialConversationId || loading) return;
    if (conversations.some((c) => c.id === initialConversationId)) {
      setSelectedConversationId(initialConversationId);
      appliedInitialRef.current = true;
    }
  }, [initialConversationId, loading, conversations]);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId) || null;

  return (
    <div className="grid gap-4 lg:grid-cols-[350px_1fr] h-[600px]">
      <div className="overflow-auto">
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversationId}
          onSelect={setSelectedConversationId}
          loading={loading}
        />
      </div>
      <div className="hidden lg:block">
        <ChatDialog
          conversation={selectedConversation}
          currentUserId={userId}
          onSendMessage={sendMessage}
          onMarkAsRead={markAsRead}
        />
      </div>
      {/* Mobile: Show chat in place of list when selected */}
      {selectedConversationId && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background p-4">
          <button 
            onClick={() => setSelectedConversationId(null)}
            className="mb-4 text-sm text-primary hover:underline"
          >
            ← Back to list
          </button>
          <div className="h-[calc(100vh-80px)]">
            <ChatDialog
              conversation={selectedConversation}
              currentUserId={userId}
              onSendMessage={sendMessage}
              onMarkAsRead={markAsRead}
            />
          </div>
        </div>
      )}
    </div>
  );
};
