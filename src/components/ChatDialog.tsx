import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, Package } from "lucide-react";
import { Message, Conversation, useConversationMessages } from "@/hooks/useMessages";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

interface ChatDialogProps {
  conversation: Conversation | null;
  currentUserId: string;
  onSendMessage: (conversationId: string, content: string) => Promise<boolean>;
  onMarkAsRead: (conversationId: string) => void;
}

export const ChatDialog = ({ 
  conversation, 
  currentUserId, 
  onSendMessage,
  onMarkAsRead 
}: ChatDialogProps) => {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { messages, loading } = useConversationMessages(
    conversation?.id || null, 
    currentUserId
  );

  const otherUser = conversation?.participants[0];

  // Mark as read when opening conversation
  useEffect(() => {
    if (conversation?.id && conversation.unread_count > 0) {
      onMarkAsRead(conversation.id);
    }
  }, [conversation?.id, conversation?.unread_count, onMarkAsRead]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !conversation || sending) return;

    setSending(true);
    const success = await onSendMessage(conversation.id, input.trim());
    if (success) {
      setInput('');
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversation) {
    return (
      <Card className="h-full flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Wybierz rozmowę, aby zobaczyć wiadomości</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-hero">
          <User className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">{otherUser?.username || 'Użytkownik'}</p>
          {conversation.product && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Package className="h-3 w-3" />
              <span>{conversation.product.title}</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-2 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="h-12 w-48 rounded-lg bg-muted" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>Brak wiadomości</p>
            <p className="text-sm">Rozpocznij rozmowę!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwn = message.sender_id === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
                    isOwn ? 'bg-primary' : 'bg-gradient-hero'
                  }`}>
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className={`max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
                    <div
                      className={`inline-block rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                        locale: pl
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Napisz wiadomość..."
            disabled={sending}
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim() || sending}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
};
