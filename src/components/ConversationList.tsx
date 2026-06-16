import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Package } from "lucide-react";
import { Conversation } from "@/hooks/useMessages";
import { formatDistanceToNow } from "date-fns";
import { enGB } from "date-fns/locale";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}

export const ConversationList = ({ 
  conversations, 
  selectedId, 
  onSelect, 
  loading 
}: ConversationListProps) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex gap-3">
              <div className="h-12 w-12 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No messages</p>
        <p className="text-sm text-muted-foreground mt-2">
          Start a conversation by contacting a seller
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map(conv => {
        const otherUser = conv.participants[0];
        const isSelected = selectedId === conv.id;
        
        return (
          <Card 
            key={conv.id}
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
            } ${conv.unread_count > 0 ? 'bg-accent/10' : ''}`}
            onClick={() => onSelect(conv.id)}
          >
            <div className="flex gap-3">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-hero">
                  <User className="h-6 w-6 text-white" />
                </div>
                {conv.unread_count > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-accent-orange text-white"
                  >
                    {conv.unread_count}
                  </Badge>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`font-semibold truncate ${conv.unread_count > 0 ? 'text-foreground' : ''}`}>
                    {otherUser?.username || 'User'}
                  </p>
                  {conv.last_message && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(conv.last_message.created_at), { 
                        addSuffix: true, 
                        locale: enGB 
                      })}
                    </span>
                  )}
                </div>
                
                {conv.product && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Package className="h-3 w-3" />
                    <span className="truncate">{conv.product.title}</span>
                  </div>
                )}
                
                {conv.last_message && (
                  <p className={`text-sm truncate mt-1 ${
                    conv.unread_count > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}>
                    {conv.last_message.content}
                  </p>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
