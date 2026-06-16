import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createPhaseShieldFetch, getPhaseShieldHeaders } from "@/lib/phaseShield";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatAssistantProps = {
  userType?: "buyer" | "seller" | "general";
};

const QUICK_PROMPTS = [
  "I'm new — how do I buy something?",
  "How do I list my first item for sale?",
  "What are Velvet Coins and how do I earn them?",
  "What shipping options do you offer in the UK?",
  "How do payments and seller payouts work?",
  "How do I connect Stripe to get paid?",
];

const WELCOME_MESSAGE = `Hi! I'm the VelvetBazzar guide — here to walk you through buying, selling, Velvet Coins, shipping, and payments on our UK marketplace.

Pick a topic below or ask me anything. I'll give you clear step-by-step help.`;

export const ChatAssistant = ({ userType = "general" }: ChatAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const shieldFetch = createPhaseShieldFetch();
      const response = await shieldFetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            ...getPhaseShieldHeaders(),
          },
          body: JSON.stringify({
            messages: newMessages,
            userType,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      if (!reader) throw new Error("No reader available");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;

              if (content) {
                assistantMessage += content;
                setMessages([
                  ...newMessages,
                  { role: "assistant", content: assistantMessage },
                ]);
              }
            } catch {
              // skip malformed SSE chunk
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(
        error instanceof Error ? error.message : "Could not reach the assistant. Try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    streamChat(input.trim());
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 gap-2 rounded-full shadow-lg z-50 px-5"
      >
        <Sparkles className="h-5 w-5" />
        <span className="hidden sm:inline font-medium">Need help?</span>
        <MessageCircle className="h-5 w-5 sm:hidden" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[min(100vw-2rem,28rem)] h-[min(100vh-6rem,36rem)] flex flex-col shadow-2xl z-50">
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-hero shrink-0">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">VelvetBazzar Guide</h3>
            <p className="text-xs text-muted-foreground">Buying · Selling · Velvet Coins</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Close">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/60 px-4 py-3 text-sm text-muted-foreground leading-relaxed">
                {WELCOME_MESSAGE}
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={isLoading}
                    onClick={() => streamChat(prompt)}
                    className="text-left text-xs rounded-full border border-border/80 bg-background px-3 py-2 hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-lg px-4 py-2 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking…
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about buying, selling, coins…"
          disabled={isLoading}
        />
        <Button type="submit" size="icon" disabled={isLoading || !input.trim()} aria-label="Send">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
};
