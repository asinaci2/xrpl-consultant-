import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Quote, CheckCircle2, XCircle, Trash2, Plus, Star, ChevronDown } from "lucide-react";
import { ConsultantEntry } from "./types";

type Testimonial = {
  id: number;
  authorName: string;
  authorTitle: string | null;
  content: string;
  rating: number;
  status: string;
  displayOrder: number;
  isActive: boolean;
  consultantSlug: string;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-3 h-3 ${i <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-700"}`} />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">Approved</Badge>;
  if (status === "pending") return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">Pending</Badge>;
  return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">Rejected</Badge>;
}

export function TestimonialsTab() {
  const { toast } = useToast();
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [authorTitle, setAuthorTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState("5");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const { data: consultants = [] } = useQuery<ConsultantEntry[]>({
    queryKey: ["/api/consultants"],
  });

  const { data: testimonials = [], isLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/dashboard/testimonials", selectedSlug],
    queryFn: () => fetch(`/api/dashboard/testimonials${selectedSlug ? `?slug=${selectedSlug}` : ""}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!selectedSlug,
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/dashboard/testimonials/${id}/approve${selectedSlug ? `?slug=${selectedSlug}` : ""}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/testimonials", selectedSlug] });
      toast({ title: "Approved" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/dashboard/testimonials/${id}${selectedSlug ? `?slug=${selectedSlug}` : ""}`, { status: "rejected" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/testimonials", selectedSlug] });
      toast({ title: "Rejected" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/dashboard/testimonials/${id}${selectedSlug ? `?slug=${selectedSlug}` : ""}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/testimonials", selectedSlug] });
      toast({ title: "Deleted" });
    },
  });

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/dashboard/testimonials${selectedSlug ? `?slug=${selectedSlug}` : ""}`, {
      authorName, authorTitle: authorTitle || null, content, rating: parseInt(rating), sortOrder: 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/testimonials", selectedSlug] });
      setAuthorName(""); setAuthorTitle(""); setContent(""); setRating("5");
      setShowAddForm(false);
      toast({ title: "Testimonial added" });
    },
    onError: () => toast({ title: "Error", description: "Failed to add testimonial.", variant: "destructive" }),
  });

  const filtered = filterStatus === "all" ? testimonials : testimonials.filter(t => t.status === filterStatus);
  const pendingCount = testimonials.filter(t => t.status === "pending").length;
  const approvedCount = testimonials.filter(t => t.status === "approved").length;

  return (
    <div className="space-y-6">
      <Card className="bg-black/60 border-green-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-400 text-base flex items-center gap-2">
            <Quote className="w-4 h-4" />
            Testimonials Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-xs text-gray-400 font-medium">Select Consultant</label>
              <Select value={selectedSlug} onValueChange={setSelectedSlug}>
                <SelectTrigger className="bg-black/40 border-green-500/20 text-white" data-testid="select-testimonials-consultant">
                  <SelectValue placeholder="Choose a consultant..." />
                </SelectTrigger>
                <SelectContent>
                  {consultants.map(c => (
                    <SelectItem key={c.slug} value={c.slug}>
                      {c.name || c.slug}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedSlug && (
              <Button
                size="sm"
                onClick={() => setShowAddForm(v => !v)}
                className="bg-green-600 hover:bg-green-700 text-white"
                data-testid="button-toggle-add-testimonial"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Testimonial
              </Button>
            )}
          </div>

          {showAddForm && selectedSlug && (
            <div className="border border-green-500/20 rounded-lg p-4 bg-black/20 space-y-3">
              <p className="text-xs text-green-400 font-semibold uppercase tracking-wider">New Testimonial (auto-approved)</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Author Name</label>
                  <Input value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder="Jane Smith" className="bg-black/40 border-green-500/20 text-white text-sm" data-testid="input-testimonial-author" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Title / Role (optional)</label>
                  <Input value={authorTitle} onChange={e => setAuthorTitle(e.target.value)} placeholder="Founder, XRPL Project" className="bg-black/40 border-green-500/20 text-white text-sm" data-testid="input-testimonial-title" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Testimonial</label>
                <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write the testimonial content..." rows={3} className="bg-black/40 border-green-500/20 text-white text-sm resize-none" data-testid="input-testimonial-content" />
              </div>
              <div className="flex items-center gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Rating</label>
                  <Select value={rating} onValueChange={setRating}>
                    <SelectTrigger className="bg-black/40 border-green-500/20 text-white w-24" data-testid="select-testimonial-rating">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["5", "4", "3", "2", "1"].map(r => (
                        <SelectItem key={r} value={r}>{r} ★</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !authorName || !content} className="bg-green-600 hover:bg-green-700 text-white" data-testid="button-submit-testimonial">
                    {addMutation.isPending ? "Adding..." : "Add"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-white" data-testid="button-cancel-add-testimonial">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedSlug && (
        <Card className="bg-black/60 border-green-500/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-green-400 text-base">
                {consultants.find(c => c.slug === selectedSlug)?.name || selectedSlug} — Testimonials
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                {pendingCount > 0 && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    {pendingCount} pending
                  </Badge>
                )}
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  {approvedCount} approved
                </Badge>
                <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                  <SelectTrigger className="bg-black/40 border-green-500/20 text-white h-7 text-xs w-28" data-testid="select-filter-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-gray-500 text-sm italic">
                {filterStatus === "all" ? "No testimonials yet." : `No ${filterStatus} testimonials.`}
              </p>
            ) : (
              <div className="space-y-3">
                {filtered.map(t => (
                  <div
                    key={t.id}
                    className={`p-4 rounded-lg border bg-black/20 space-y-2 ${
                      t.status === "pending" ? "border-amber-500/30" :
                      t.status === "approved" ? "border-green-500/20" :
                      "border-red-500/20"
                    }`}
                    data-testid={`card-testimonial-${t.id}`}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                          <span className="text-purple-300 text-xs font-bold">{t.authorName.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <span className="text-white text-sm font-medium" data-testid={`text-testimonial-author-${t.id}`}>{t.authorName}</span>
                          {t.authorTitle && <span className="text-gray-500 text-xs ml-2">{t.authorTitle}</span>}
                        </div>
                        <StarRating rating={t.rating} />
                        <StatusBadge status={t.status} />
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {t.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => approveMutation.mutate(t.id)}
                              disabled={approveMutation.isPending}
                              className="text-green-400 hover:text-green-300 hover:bg-green-500/10 h-7 w-7"
                              data-testid={`button-approve-testimonial-${t.id}`}
                              title="Approve"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => rejectMutation.mutate(t.id)}
                              disabled={rejectMutation.isPending}
                              className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 h-7 w-7"
                              data-testid={`button-reject-testimonial-${t.id}`}
                              title="Reject"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                        {t.status === "rejected" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => approveMutation.mutate(t.id)}
                            disabled={approveMutation.isPending}
                            className="text-green-400 hover:text-green-300 hover:bg-green-500/10 h-7 w-7"
                            data-testid={`button-approve-rejected-${t.id}`}
                            title="Approve"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(t.id)}
                          disabled={deleteMutation.isPending}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 w-7"
                          data-testid={`button-delete-testimonial-${t.id}`}
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed pl-9" data-testid={`text-testimonial-content-${t.id}`}>{t.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
