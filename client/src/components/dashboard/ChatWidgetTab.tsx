import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  MessageCircle, Camera, User, FileText, Zap, Sparkles, MessageSquare, Eye
} from "lucide-react";
import { SectionBanner } from "./SectionBanner";
import { FieldLabel } from "./FieldLabel";
import { useAdminSlug, useSlugParam } from "./context";
import { ChatHostConfig } from "./types";

export function ChatWidgetTab({ slug }: { slug: string }) {
  const { toast } = useToast();
  const sp = useSlugParam();
  const override = useAdminSlug();
  const { data: chatProfile, isLoading } = useQuery<ChatHostConfig>({
    queryKey: ["/api/dashboard/chat-profile", override],
    queryFn: () => fetch(`/api/dashboard/chat-profile${sp}`, { credentials: "include" }).then(r => r.json()),
  });

  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    if (chatProfile) {
      setDisplayName(chatProfile.displayName);
      setTitle(chatProfile.title);
      setAvatarUrl(chatProfile.avatarUrl ?? "");
      setStatusMessage(chatProfile.statusMessage);
      setIsAvailable(chatProfile.isAvailable);
    }
  }, [chatProfile]);

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/dashboard/chat-profile${sp}`, { displayName, title, avatarUrl: avatarUrl || null, statusMessage, isAvailable }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/chat-profile", override] });
      toast({ title: "Chat profile saved" });
    },
    onError: () => toast({ title: "Error", description: "Failed to save.", variant: "destructive" }),
  });

  return (
    <div className="space-y-5">
      <SectionBanner
        icon={MessageCircle}
        iconBg="bg-cyan-500/15"
        iconColor="text-cyan-400"
        borderColor="border-cyan-500"
        section="Chat Widget"
        description="Configure the floating chat widget on your profile page — how you appear to visitors when they want to talk."
        slug={slug}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-black/60 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-400 text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <p className="text-gray-400">Loading...</p> : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel icon={User}>Host Name</FieldLabel>
                    <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-chat-name" />
                  </div>
                  <div>
                    <FieldLabel icon={Sparkles}>Host Title</FieldLabel>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Available for Hire" className="bg-black/40 border-green-500/20 text-white" data-testid="input-chat-title" />
                  </div>
                </div>
                <div>
                  <FieldLabel icon={Camera}>Host Avatar URL</FieldLabel>
                  <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." className="bg-black/40 border-green-500/20 text-white" data-testid="input-chat-avatar" />
                </div>
                <div>
                  <FieldLabel icon={FileText}>Status Message</FieldLabel>
                  <Input value={statusMessage} onChange={e => setStatusMessage(e.target.value)} placeholder="Typically replies in minutes" className="bg-black/40 border-green-500/20 text-white" data-testid="input-chat-status" />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-green-500/10">
                  <div className="space-y-0.5">
                    <FieldLabel icon={Zap}>Availability Switch</FieldLabel>
                    <p className="text-gray-500 text-[11px]">Shows an 'Online' indicator when enabled.</p>
                  </div>
                  <Switch checked={isAvailable} onCheckedChange={setIsAvailable} data-testid="switch-chat-available" />
                </div>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white" data-testid="button-save-chat">
                  {saveMutation.isPending ? "Saving..." : "Save Chat Profile"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Widget preview */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-cyan-400/60" />
            <span className="text-gray-400 text-xs font-medium">Widget Preview</span>
          </div>
          <div className="rounded-xl border border-cyan-500/20 bg-[#050f0f] overflow-hidden shadow-2xl max-w-[320px] mx-auto">
            <div className="bg-gradient-to-r from-cyan-900 to-black p-4 flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full border border-cyan-400/30 overflow-hidden bg-black/60">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-cyan-400 font-bold">{displayName?.charAt(0)}</div>
                  )}
                </div>
                {isAvailable && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#050f0f]" />}
              </div>
              <div>
                <p className="text-white text-sm font-bold leading-tight">{displayName || "Your Name"}</p>
                <p className="text-cyan-400/80 text-[10px] uppercase tracking-wider font-mono">{title || "Available"}</p>
              </div>
            </div>
            <div className="p-4 space-y-3 min-h-[120px] bg-black/40">
              <div className="bg-cyan-500/10 rounded-2xl rounded-tl-none p-3 max-w-[85%] border border-cyan-500/20">
                <p className="text-cyan-100/90 text-xs leading-relaxed">
                  Hi there! {statusMessage ? statusMessage : "How can I help you today?"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
