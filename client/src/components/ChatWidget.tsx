import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ChatMessage {
  id: number;
  sessionId: string;
  content: string;
  isFromVisitor: boolean | null;
  createdAt: string | null;
}

function generateSessionId(): string {
  return `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("chat_session_id");
    if (stored) {
      setSessionId(stored);
    }
  }, []);

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/sessions", sessionId, "messages"],
    enabled: !!sessionId && isOpen,
  });

  useEffect(() => {
    if (messages.length > 0) {
      setLocalMessages(messages);
    }
  }, [messages]);

  useEffect(() => {
    if (sessionId && isOpen) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws?sessionId=${sessionId}`);
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        setLocalMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      };

      wsRef.current = ws;

      return () => {
        ws.close();
      };
    }
  }, [sessionId, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  const createSessionMutation = useMutation({
    mutationFn: async (newSessionId: string) => {
      const res = await apiRequest("POST", "/api/chat/sessions", { sessionId: newSessionId });
      return res.json();
    },
    onSuccess: (_, newSessionId) => {
      setSessionId(newSessionId);
      localStorage.setItem("chat_session_id", newSessionId);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      const res = await apiRequest("POST", `/api/chat/sessions/${sessionId}/messages`, {
        content,
        isFromVisitor: true,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions", sessionId, "messages"] });
    },
  });

  const startSession = () => {
    const newSessionId = generateSessionId();
    createSessionMutation.mutate(newSessionId);
  };

  const sendMessage = () => {
    if (!inputValue.trim() || !sessionId) return;
    const content = inputValue.trim();
    setInputValue("");
    sendMessageMutation.mutate({ content });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 bg-background border border-border rounded-lg shadow-xl z-50 flex flex-col overflow-hidden"
            style={{ maxHeight: "500px" }}
            data-testid="chat-widget-container"
          >
            <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <span className="font-display font-semibold" data-testid="text-chat-header">Live Chat</span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                data-testid="button-close-chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {!sessionId ? (
              <div className="p-6 flex flex-col items-center justify-center flex-1">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-center text-muted-foreground mb-4" data-testid="text-chat-welcome">
                  Hi! Start a conversation with Edwin.
                </p>
                <Button 
                  onClick={startSession} 
                  disabled={createSessionMutation.isPending}
                  data-testid="button-start-chat"
                >
                  {createSessionMutation.isPending ? "Starting..." : "Start Chat"}
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 p-4 bg-background overflow-y-auto" style={{ height: "300px" }}>
                  {localMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <p data-testid="text-empty-chat">Send a message to start the conversation!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {localMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.isFromVisitor ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                              msg.isFromVisitor
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground"
                            }`}
                            data-testid={`chat-message-${msg.id}`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-border flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1"
                    data-testid="input-chat-message"
                  />
                  <Button
                    size="icon"
                    onClick={sendMessage}
                    disabled={!inputValue.trim() || sendMessageMutation.isPending}
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50"
        data-testid="button-open-chat"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
    </>
  );
}
