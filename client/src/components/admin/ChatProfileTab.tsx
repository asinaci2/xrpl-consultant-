import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle } from "lucide-react";
import { ConsultantEntry } from "./types";

type ChatHostConfigData = {
  id: number;
  consultantSlug: string;
  displayName: string;
  title: string;
  avatarUrl: string | null;
  statusMessage: string;
  isAvailable: boolean;
};

export function ChatProfileTab() {
  const { toast } = useToast();

  const { data: consultants = [] } = useQuery<ConsultantEntry[]>({
    queryKey: ["/api/consultants"],
  });
  const [selectedSlug, setSelectedSlug] = useState<string>("");

  useEffect(() => {
    if (consultants.length > 0 && !selectedSlug) {
      setSelectedSlug(consultants[0].slug);
    }
  }, [consultants, selectedSlug]);

  const { data: config, isLoading } = useQuery<ChatHostConfigData>({
    queryKey: ["/api/chat/host-config", selectedSlug],
    queryFn: () => fetch(`/api/chat/host-config/${selectedSlug}`).then(r => r.json()),
    enabled: !!selectedSlug,
  });

  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    if (config) {
      setDisplayName(config.displayName);
      setTitle(config.title);
      setAvatarUrl(config.avatarUrl ?? "");
      setStatusMessage(config.statusMessage);
      setIsAvailable(config.isAvailable);
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", `/api/dashboard/chat-profile?slug=${selectedSlug}`, {
        displayName,
        title,
        avatarUrl: avatarUrl || null,
        statusMessage,
        isAvailable,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/host-config", selectedSlug] });
      toast({ title: "Saved", description: "Chat profile updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save chat profile.", variant: "destructive" });
    },
  });

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="bg-black/60 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-400 text-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Chat Widget Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="text-gray-300 text-sm font-medium block mb-1">Consultant</label>
            <Select value={selectedSlug} onValueChange={setSelectedSlug}>
              <SelectTrigger className="bg-black/40 border-green-500/20 text-white" data-testid="select-chat-profile-consultant">
                <SelectValue placeholder="Select consultant..." />
              </SelectTrigger>
              <SelectContent>
                {consultants.map(c => (
                  <SelectItem key={c.slug} value={c.slug} data-testid={`option-consultant-${c.slug}`}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isLoading ? (
            <p className="text-gray-400">Loading...</p>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Display Name</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Edwin"
                  className="bg-black/40 border-green-500/20 text-white"
                  data-testid="input-chat-display-name"
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Title / Role</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="XRPL Consultant"
                  className="bg-black/40 border-green-500/20 text-white"
                  data-testid="input-chat-title"
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Avatar URL <span className="text-gray-500 text-xs">(optional)</span></label>
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="bg-black/40 border-green-500/20 text-white"
                  data-testid="input-chat-avatar-url"
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Status Message</label>
                <Input
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  placeholder="Usually replies within a few hours"
                  className="bg-black/40 border-green-500/20 text-white"
                  data-testid="input-chat-status-message"
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-gray-300 text-sm font-medium">Available</p>
                  <p className="text-gray-500 text-xs mt-0.5">Shows green dot when on, grey dot when off</p>
                </div>
                <Switch
                  checked={isAvailable}
                  onCheckedChange={setIsAvailable}
                  data-testid="switch-chat-available"
                />
              </div>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                data-testid="button-save-chat-profile"
              >
                {saveMutation.isPending ? "Saving..." : "Save Chat Profile"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Preview */}
      <div className="space-y-4">
        <h3 className="text-gray-300 text-sm font-medium">Live Preview</h3>
        <div
          className="rounded-lg border border-green-500/30 overflow-hidden max-w-xs"
          style={{ background: "linear-gradient(180deg, #0a0a0a 0%, #0d1f0d 100%)" }}
        >
          {/* Widget header preview */}
          <div
            className="p-3 flex items-center gap-3 border-b border-green-500/30"
            style={{ background: "linear-gradient(90deg, #0a1a0a 0%, #0d2010 100%)" }}
          >
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover border border-green-500/30" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-400" />
                </div>
              )}
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black ${isAvailable ? "bg-green-400" : "bg-gray-500"}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-green-400 font-mono font-semibold text-sm truncate" style={{ textShadow: "0 0 10px rgba(0,255,100,0.4)" }}>
                {displayName || "Display Name"}
              </p>
              <p className="text-green-500/60 text-xs truncate">{title || "Title / Role"}</p>
            </div>
          </div>
          {/* Status message preview */}
          <div className="px-3 py-2">
            <p className="text-green-400/50 font-mono text-xs">{">"} {statusMessage || "Status message..."}_</p>
          </div>
        </div>
        <p className="text-gray-500 text-xs">Changes appear in the chat widget immediately after saving.</p>
      </div>
    </div>
  );
}
