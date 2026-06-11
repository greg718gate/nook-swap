import { Bell, Check, MessageCircle, ShoppingBag, Truck, Star, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { useState } from "react";

const iconFor = (type: string) => {
  switch (type) {
    case "message": return <MessageCircle className="h-4 w-4 text-primary" />;
    case "order_new": return <ShoppingBag className="h-4 w-4 text-accent-orange" />;
    case "order_shipped": return <Truck className="h-4 w-4 text-primary" />;
    case "order_delivered": return <Package className="h-4 w-4 text-green-600" />;
    case "review": return <Star className="h-4 w-4 text-accent" />;
    default: return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
};

interface Props {
  userId?: string;
}

export const NotificationBell = ({ userId }: Props) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(userId);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!userId) return null;

  const handleClick = async (n: Notification) => {
    if (!n.is_read) await markAsRead(n.id);
    setOpen(false);
    if (n.type === 'message' && n.related_id) {
      navigate(`/profile?tab=messages&conversation=${n.related_id}`);
      return;
    }
    if (n.link) navigate(n.link);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-primary/10 hover:text-primary">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-accent-orange text-xs font-bold text-white shadow-lg">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] max-w-[92vw] p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-sm">Powiadomienia</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 text-xs gap-1">
              <Check className="h-3.5 w-3.5" /> Oznacz wszystkie
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[60vh]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Brak powiadomień
            </div>
          ) : (
            <ul className="divide-y">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => handleClick(n)}
                    className={`w-full text-left p-3 hover:bg-muted/50 transition-colors flex gap-3 ${
                      !n.is_read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{iconFor(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.is_read ? "font-semibold" : ""}`}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: pl })}
                      </p>
                    </div>
                    {!n.is_read && <span className="h-2 w-2 rounded-full bg-accent-orange mt-2 shrink-0" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
