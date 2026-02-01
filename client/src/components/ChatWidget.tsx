import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Paperclip, Image, Loader2 } from "lucide-react";
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
  fileUrl?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
}

function generateSessionId(): string {
  return `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("chat_session_id");
    const storedName = localStorage.getItem("chat_visitor_name");
    if (stored) {
      setSessionId(stored);
    }
    if (storedName) {
      setVisitorName(storedName);
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
    mutationFn: async ({ newSessionId, name, email }: { newSessionId: string; name: string; email: string }) => {
      const res = await apiRequest("POST", "/api/chat/sessions", { 
        sessionId: newSessionId,
        visitorName: name,
        visitorEmail: email
      });
      return res.json();
    },
    onSuccess: (_, { newSessionId, name }) => {
      setSessionId(newSessionId);
      localStorage.setItem("chat_session_id", newSessionId);
      localStorage.setItem("chat_visitor_name", name);
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

  const startSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !visitorEmail.trim()) return;
    const newSessionId = generateSessionId();
    createSessionMutation.mutate({ 
      newSessionId, 
      name: visitorName.trim(), 
      email: visitorEmail.trim() 
    });
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const canStartChat = visitorName.trim().length > 0 && isValidEmail(visitorEmail);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionId) return;
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch(`/api/chat/sessions/${sessionId}/upload`, {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error("Upload failed");
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions", sessionId, "messages"] });
    } catch (error) {
      console.error("File upload error:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const renderMessageContent = (msg: ChatMessage) => {
    const isImage = msg.mimeType?.startsWith("image/");
    const hasFile = msg.fileUrl && msg.fileName;
    
    if (hasFile && isImage) {
      return (
        <a 
          href={msg.fileUrl ?? undefined} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block"
          data-testid={`link-file-${msg.id}`}
        >
          <img 
            src={msg.fileUrl ?? undefined} 
            alt={msg.fileName || "Image"} 
            className="max-w-full max-h-32 rounded border border-green-500/30"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />
          <div className="hidden flex items-center gap-2 py-1">
            <Image className="w-4 h-4 text-green-400" />
            <span className="text-xs">{msg.fileName}</span>
          </div>
        </a>
      );
    }
    
    if (hasFile) {
      return (
        <a 
          href={msg.fileUrl ?? undefined} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 py-1 underline decoration-green-500/50"
          data-testid={`link-file-${msg.id}`}
        >
          <div className="w-8 h-8 bg-green-500/20 rounded flex items-center justify-center shrink-0">
            <Paperclip className="w-4 h-4 text-green-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium">{msg.fileName}</span>
            <span className="text-xs opacity-60">Click to download</span>
          </div>
        </a>
      );
    }
    
    const isImageMatch = msg.content.match(/\[Image: (.+)\]/);
    const isFileMatch = msg.content.match(/\[File: (.+)\]/);
    
    if (isImageMatch) {
      return (
        <div className="flex items-center gap-2 py-1">
          <Image className="w-4 h-4 text-green-400" />
          <span className="text-xs opacity-80">{isImageMatch[1]}</span>
        </div>
      );
    }
    
    if (isFileMatch) {
      return (
        <div className="flex items-center gap-2 py-1">
          <Paperclip className="w-4 h-4 text-green-400" />
          <span className="text-xs opacity-80">{isFileMatch[1]}</span>
        </div>
      );
    }
    
    return msg.content;
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
        data-testid="input-file-upload"
      />
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden border border-green-500/30"
            style={{ 
              maxHeight: "500px",
              background: "linear-gradient(180deg, #0a0a0a 0%, #0d1f0d 100%)",
              boxShadow: "0 0 30px rgba(0, 255, 100, 0.15), 0 0 60px rgba(0, 255, 100, 0.05)"
            }}
            data-testid="chat-widget-container"
          >
            <div 
              className="p-4 flex items-center justify-between gap-2 border-b border-green-500/30"
              style={{ background: "linear-gradient(90deg, #0a1a0a 0%, #0d2010 100%)" }}
            >
              <div className="flex items-center gap-2">
                <div className="relative">
                  <MessageCircle className="h-5 w-5 text-green-400" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
                <span 
                  className="font-mono font-semibold text-green-400 tracking-wider" 
                  data-testid="text-chat-header"
                  style={{ textShadow: "0 0 10px rgba(0, 255, 100, 0.5)" }}
                >
                  MATRIX_CHAT
                </span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="text-green-400/70"
                data-testid="button-close-chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {!sessionId ? (
              <form onSubmit={startSession} className="p-6 flex flex-col flex-1">
                <div 
                  className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-green-500/50 flex items-center justify-center"
                  style={{ 
                    background: "linear-gradient(135deg, #0a1a0a 0%, #0d2010 100%)",
                    boxShadow: "0 0 20px rgba(0, 255, 100, 0.2)"
                  }}
                >
                  <MessageCircle className="h-8 w-8 text-green-400" />
                </div>
                <p 
                  className="text-center text-green-400/70 mb-4 text-sm font-mono" 
                  data-testid="text-chat-welcome"
                >
                  {">"} Initialize connection with Edwin_
                </p>
                <div className="space-y-3 mb-4">
                  <div>
                    <label htmlFor="visitor-name" className="text-sm font-mono text-green-400/60 mb-1 block">
                      IDENTITY
                    </label>
                    <Input
                      id="visitor-name"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      placeholder="Enter your name"
                      required
                      className="bg-black/50 border-green-500/30 text-green-300 placeholder:text-green-500/40 font-mono focus:border-green-400 focus:ring-green-400/20"
                      data-testid="input-visitor-name"
                    />
                  </div>
                  <div>
                    <label htmlFor="visitor-email" className="text-sm font-mono text-green-400/60 mb-1 block">
                      EMAIL_ADDR
                    </label>
                    <Input
                      id="visitor-email"
                      type="email"
                      value={visitorEmail}
                      onChange={(e) => setVisitorEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="bg-black/50 border-green-500/30 text-green-300 placeholder:text-green-500/40 font-mono focus:border-green-400 focus:ring-green-400/20"
                      data-testid="input-visitor-email"
                    />
                  </div>
                </div>
                <Button 
                  type="submit"
                  disabled={!canStartChat || createSessionMutation.isPending}
                  className="w-full bg-green-500/20 border border-green-500/50 text-green-400 font-mono tracking-wider"
                  style={{ textShadow: "0 0 10px rgba(0, 255, 100, 0.5)" }}
                  data-testid="button-start-chat"
                >
                  {createSessionMutation.isPending ? "CONNECTING..." : "[ CONNECT ]"}
                </Button>
              </form>
            ) : (
              <>
                <div 
                  className="flex-1 p-4 overflow-y-auto" 
                  style={{ height: "300px", background: "rgba(0, 10, 0, 0.5)" }}
                >
                  {localMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-green-500/50 font-mono text-sm" data-testid="text-empty-chat">
                        {">"} Connection established_
                        <br />
                        {">"} Awaiting transmission...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {localMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.isFromVisitor ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] px-3 py-2 rounded-lg text-sm font-mono ${
                              msg.isFromVisitor
                                ? "bg-green-500/20 text-green-300 border border-green-500/40"
                                : "bg-green-900/30 text-green-400 border border-green-600/30"
                            }`}
                            style={{ 
                              textShadow: msg.isFromVisitor 
                                ? "0 0 5px rgba(0, 255, 100, 0.3)" 
                                : "none" 
                            }}
                            data-testid={`chat-message-${msg.id}`}
                          >
                            {renderMessageContent(msg)}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-green-500/30 flex gap-2" style={{ background: "rgba(0, 15, 0, 0.8)" }}>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-green-400/70 shrink-0"
                    data-testid="button-attach-file"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Paperclip className="h-4 w-4" />
                    )}
                  </Button>
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="> Enter message..."
                    className="flex-1 bg-black/50 border-green-500/30 text-green-300 placeholder:text-green-500/40 font-mono focus:border-green-400 focus:ring-green-400/20"
                    data-testid="input-chat-message"
                  />
                  <Button
                    size="icon"
                    onClick={sendMessage}
                    disabled={!inputValue.trim() || sendMessageMutation.isPending}
                    className="bg-green-500/20 border border-green-500/50 text-green-400 shrink-0"
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

      <div 
        className="fixed bottom-6 right-6 z-50"
        style={{ 
          boxShadow: "0 0 20px rgba(0, 255, 100, 0.3), 0 0 40px rgba(0, 255, 100, 0.1)",
          animation: isOpen ? "none" : "pulse-glow 2s infinite",
          borderRadius: "50%"
        }}
      >
        <Button
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full shadow-lg bg-green-500/20 border-2 border-green-500/50 text-green-400"
          data-testid="button-open-chat"
        >
          {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        </Button>
      </div>
      
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 100, 0.3), 0 0 40px rgba(0, 255, 100, 0.1); }
          50% { box-shadow: 0 0 30px rgba(0, 255, 100, 0.5), 0 0 60px rgba(0, 255, 100, 0.2); }
        }
      `}</style>
    </>
  );
}
