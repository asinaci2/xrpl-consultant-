import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Quote, Plus, Trash2, User, Star, Camera, FileText, Layout, Eye
} from "lucide-react";
import { SectionBanner } from "./SectionBanner";
import { FieldLabel } from "./FieldLabel";
import { useAdminSlug, useSlugParam } from "./context";
import { Testimonial } from "./types";

export function TestimonialsTab({ slug }: { slug: string }) {
  const { toast } = useToast();
  const sp = useSlugParam();
  const override = useAdminSlug();
  const [authorName, setAuthorName] = useState("");
  const [authorTitle, setAuthorTitle] = useState("");
  const [content, setContent] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");

  const { data: testimonials = [], isLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/dashboard/testimonials", override],
    queryFn: () => fetch(`/api/dashboard/testimonials${sp}`, { credentials: "include" }).then(r => r.json()),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/dashboard/testimonials", override] });

  const createMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", `/api/dashboard/testimonials${sp}`, data),
    onSuccess: () => {
      invalidate();
      setAuthorName(""); setAuthorTitle(""); setContent(""); setAvatarUrl(""); setDisplayOrder("0");
      toast({ title: "Testimonial added" });
    },
    onError: () => toast({ title: "Error", description: "Failed to add testimonial", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/dashboard/testimonials/${id}${sp}`),
    onSuccess: () => { invalidate(); toast({ title: "Testimonial deleted" }); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => apiRequest("PATCH", `/api/dashboard/testimonials/${id}${sp}`, { isActive }),
    onSuccess: () => invalidate(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName || !content) return;
    createMutation.mutate({ authorName, authorTitle, content, avatarUrl: avatarUrl || null, displayOrder: parseInt(displayOrder) || 0 });
  };

  return (
    <div className="space-y-5">
      <SectionBanner
        icon={Quote}
        iconBg="bg-yellow-500/15"
        iconColor="text-yellow-400"
        borderColor="border-yellow-500"
        section="Client Testimonials"
        description="Display feedback and endorsements from your clients and partners to build social proof and trust."
        slug={slug}
        anchor="testimonials"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-black/60 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-400 text-base flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Testimonial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel icon={User}>Client Name *</FieldLabel>
                  <Input value={authorName} onChange={e => setAuthorName(e.target.value)} required className="bg-black/40 border-green-500/20 text-white" data-testid="input-testimonial-name" />
                </div>
                <div>
                  <FieldLabel icon={Star}>Client Title</FieldLabel>
                  <Input value={authorTitle} onChange={e => setAuthorTitle(e.target.value)} placeholder="CEO, Tech Ventures" className="bg-black/40 border-green-500/20 text-white" data-testid="input-testimonial-title" />
                </div>
              </div>
              <div>
                <FieldLabel icon={Camera}>Avatar URL (optional)</FieldLabel>
                <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." className="bg-black/40 border-green-500/20 text-white" data-testid="input-testimonial-avatar" />
              </div>
              <div>
                <FieldLabel icon={FileText}>Testimonial Content *</FieldLabel>
                <Textarea value={content} onChange={e => setContent(e.target.value)} required rows={3} className="bg-black/40 border-green-500/20 text-white" data-testid="input-testimonial-content" />
              </div>
              <div>
                <FieldLabel icon={Layout}>Display Order</FieldLabel>
                <Input type="number" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-testimonial-order" />
              </div>
              <Button type="submit" disabled={createMutation.isPending} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white" data-testid="button-add-testimonial">
                {createMutation.isPending ? "Adding..." : "Add Testimonial"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-yellow-400/60" />
            <span className="text-gray-400 text-xs font-medium">Testimonials ({testimonials.length})</span>
          </div>
          {isLoading ? <p className="text-gray-400">Loading...</p> : testimonials.map(t => (
            <Card key={t.id} className="bg-black/60 border-green-500/10" data-testid={`card-testimonial-${t.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-yellow-500/30 overflow-hidden bg-black/60">
                      {t.avatarUrl ? (
                        <img src={t.avatarUrl} alt={t.authorName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-yellow-500/40 text-sm font-bold">{t.authorName.charAt(0)}</div>
                      )}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{t.authorName}</p>
                      <p className="text-gray-500 text-[11px] truncate max-w-[140px]">{t.authorTitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={t.isActive}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: t.id, isActive: checked })}
                      data-testid={`switch-testimonial-active-${t.id}`}
                    />
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(t.id)} className="h-8 w-8 text-red-400/60 hover:text-red-400" data-testid={`button-delete-testimonial-${t.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-gray-400 text-xs italic leading-relaxed">"{t.content}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
