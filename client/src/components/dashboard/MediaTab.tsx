import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Layout, Camera, Trash2, Globe, FileText, ExternalLink
} from "lucide-react";
import { SectionBanner } from "./SectionBanner";
import { FieldLabel } from "./FieldLabel";
import { useAdminSlug, useSlugParam } from "./context";
import { MediaEntry } from "./types";

export function MediaTab({ slug }: { slug: string }) {
  const { toast } = useToast();
  const sp = useSlugParam();
  const override = useAdminSlug();
  const [source, setSource] = useState("manual");
  const [sourceUrl, setSourceUrl] = useState("");
  const [section, setSection] = useState("hero");
  const [altText, setAltText] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");

  const { data: media = [], isLoading } = useQuery<MediaEntry[]>({
    queryKey: ["/api/dashboard/media", override],
    queryFn: () => fetch(`/api/dashboard/media${sp}`, { credentials: "include" }).then(r => r.json()),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/dashboard/media", override] });

  const createMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", `/api/dashboard/media${sp}`, data),
    onSuccess: () => { invalidate(); setSourceUrl(""); setAltText(""); setDisplayOrder("0"); toast({ title: "Media added" }); },
    onError: () => toast({ title: "Error", description: "Failed to add media", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/dashboard/media/${id}${sp}`),
    onSuccess: () => { invalidate(); toast({ title: "Media deleted" }); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => apiRequest("PATCH", `/api/dashboard/media/${id}${sp}`, { isActive }),
    onSuccess: () => invalidate(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl) return;
    createMutation.mutate({ source, sourceUrl, section, altText: altText || null, displayOrder: parseInt(displayOrder) || 0 });
  };

  const SECTION_INFO: Record<string, { label: string; desc: string }> = {
    hero: { label: "Hero", desc: "Full-width background of your profile header" },
    about: { label: "About", desc: "Background image for the About section" },
    gallery: { label: "Gallery", desc: "Appears in the media gallery section" },
  };

  return (
    <div className="space-y-5">
      <SectionBanner
        icon={Layout}
        iconBg="bg-orange-500/15"
        iconColor="text-orange-400"
        borderColor="border-orange-500"
        section="Media Sections"
        description="Background images and gallery content for the hero, about, and gallery areas of your profile page."
        slug={slug}
      />

      <Card className="bg-black/60 border-green-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-400 text-base flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Add Media
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel icon={Globe}>Source Type</FieldLabel>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger className="bg-black/40 border-green-500/20 text-white" data-testid="select-media-source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-green-500/20">
                    <SelectItem value="manual" className="text-white hover:bg-green-500/10">Manual URL</SelectItem>
                    <SelectItem value="instagram" className="text-white hover:bg-green-500/10">Instagram</SelectItem>
                    <SelectItem value="tiktok" className="text-white hover:bg-green-500/10">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel icon={Layout}>Target Section</FieldLabel>
                <Select value={section} onValueChange={setSection}>
                  <SelectTrigger className="bg-black/40 border-green-500/20 text-white" data-testid="select-media-section">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-green-500/20">
                    {Object.entries(SECTION_INFO).map(([key, info]) => (
                      <SelectItem key={key} value={key} className="text-white hover:bg-green-500/10">
                        {info.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-gray-500 mt-1">{SECTION_INFO[section].desc}</p>
              </div>
            </div>
            <div>
              <FieldLabel icon={ExternalLink}>Media URL *</FieldLabel>
              <Input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://..." required className="bg-black/40 border-green-500/20 text-white" data-testid="input-media-url" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel icon={FileText}>Alt Text</FieldLabel>
                <Input value={altText} onChange={e => setAltText(e.target.value)} placeholder="Image description" className="bg-black/40 border-green-500/20 text-white" data-testid="input-media-alt" />
              </div>
              <div>
                <FieldLabel icon={Layout}>Display Order</FieldLabel>
                <Input type="number" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-media-order" />
              </div>
            </div>
            <Button type="submit" disabled={createMutation.isPending} className="w-full bg-orange-600 hover:bg-orange-700 text-white" data-testid="button-add-media">
              {createMutation.isPending ? "Adding..." : "Add Media"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? <p className="text-gray-400">Loading...</p> : media.map(m => (
          <Card key={m.id} className="bg-black/60 border-green-500/10 overflow-hidden" data-testid={`card-media-${m.id}`}>
            <div className="aspect-video relative group">
              {m.imageUrl ? (
                <img src={m.imageUrl} alt={m.altText || ""} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-black/60 flex items-center justify-center text-gray-600 text-xs">No preview</div>
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(m.id)} className="h-7 w-7 bg-black/60 text-red-400 hover:text-red-300 hover:bg-black" data-testid={`button-delete-media-${m.id}`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-white font-mono uppercase tracking-wider border border-white/10">
                {m.section}
              </div>
            </div>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={m.isActive ?? true}
                  onCheckedChange={(checked) => toggleMutation.mutate({ id: m.id, isActive: checked })}
                  data-testid={`switch-media-active-${m.id}`}
                />
                <span className="text-xs text-gray-400">Active</span>
              </div>
              <span className="text-[10px] text-gray-600 font-mono"># {m.displayOrder}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
