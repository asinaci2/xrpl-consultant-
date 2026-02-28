import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Trash2, Plus, Clock, User, Eye, FileText, Link2, ExternalLink, AlertCircle, CheckCircle2
} from "lucide-react";
import { SiInstagram, SiTiktok, SiX, SiSnapchat } from "react-icons/si";
import { SectionBanner } from "./SectionBanner";
import { FieldLabel } from "./FieldLabel";
import { useAdminSlug, useSlugParam } from "./context";
import { Story, ConsultantProfile } from "./types";

const PLATFORM_INFO: Record<string, { Icon: any; color: string; label: string }> = {
  instagram: { Icon: SiInstagram, color: "#E4405F", label: "Instagram" },
  tiktok: { Icon: SiTiktok, color: "#000000", label: "TikTok" },
  twitter: { Icon: SiX, color: "#1DA1F2", label: "Twitter" },
  snapchat: { Icon: SiSnapchat, color: "#FFFC00", label: "Snapchat" },
};

export function StoriesTab({ slug }: { slug: string }) {
  const { toast } = useToast();
  const sp = useSlugParam();
  const override = useAdminSlug();
  const [mode, setMode] = useState<"manual" | "import">("manual");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [storyAuthor, setStoryAuthor] = useState("");

  const [importUrl, setImportUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [resolvedPost, setResolvedPost] = useState<any>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [importCaption, setImportCaption] = useState("");

  const { data: profile } = useQuery<ConsultantProfile>({
    queryKey: ["/api/dashboard/profile", override],
    queryFn: () => fetch(`/api/dashboard/profile${sp}`, { credentials: "include" }).then(r => r.json()),
  });

  const avatarUrl = profile?.avatarUrl;

  useEffect(() => {
    if (profile) setStoryAuthor(profile.name);
  }, [profile]);

  const { data: stories = [], isLoading } = useQuery<Story[]>({
    queryKey: ["/api/dashboard/stories", override],
    queryFn: () => fetch(`/api/dashboard/stories${sp}`, { credentials: "include" }).then(r => r.json()),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stories", override] });

  const createMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", `/api/dashboard/stories${sp}`, data),
    onSuccess: () => {
      invalidate();
      setContent(""); setImageUrl("");
      setImportUrl(""); setResolvedPost(null); setImportCaption("");
      toast({ title: "Story posted", description: "It will be visible for 24 hours." });
    },
    onError: () => toast({ title: "Error", description: "Failed to post story", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/dashboard/stories/${id}${sp}`),
    onSuccess: () => { invalidate(); toast({ title: "Story deleted" }); },
  });

  const handleFetchPreview = async () => {
    if (!importUrl) return;
    setIsFetching(true);
    setResolveError(null);
    setResolvedPost(null);
    try {
      const res = await apiRequest("POST", "/api/matrix/resolve-post", { url: importUrl });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResolvedPost(data);
    } catch (err: any) {
      setResolveError(err.message);
    } finally {
      setIsFetching(false);
    }
  };

  const handlePostImport = () => {
    if (!resolvedPost) return;
    createMutation.mutate({
      content: importCaption || resolvedPost.title || "",
      imageUrl: resolvedPost.imageUrl,
      sourceType: resolvedPost.platform,
      sourceUrl: resolvedPost.sourceUrl,
      authorName: storyAuthor,
    });
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  const previewContent = mode === "import" ? (importCaption || resolvedPost?.title || "") : content;
  const previewImageUrl = mode === "import" ? resolvedPost?.imageUrl : imageUrl;

  const detectedPlatform = Object.keys(PLATFORM_INFO).find(p =>
    importUrl.toLowerCase().includes(p === "twitter" ? "x.com" : p) || (p === "twitter" && importUrl.toLowerCase().includes("twitter.com"))
  );
  const platformInfo = detectedPlatform ? PLATFORM_INFO[detectedPlatform] : null;

  return (
    <div className="space-y-5">
      <SectionBanner
        icon={BookOpen}
        iconBg="bg-amber-500/15"
        iconColor="text-amber-400"
        borderColor="border-amber-500"
        section="Story Updates"
        description="Share temporary 24-hour updates — manually created or imported from Instagram, TikTok and Twitter/X."
        slug={slug}
      />

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Creator */}
        <div className="lg:col-span-3">
          <Card className="bg-black/60 border-green-500/20 h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-green-400 text-base flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Story
                </CardTitle>
                <div className="flex bg-black/40 p-1 rounded-lg border border-green-500/10">
                  <button
                    onClick={() => setMode("manual")}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${mode === "manual" ? "bg-green-500/20 text-green-400" : "text-gray-500 hover:text-gray-300"}`}
                  >
                    Manual
                  </button>
                  <button
                    onClick={() => setMode("import")}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${mode === "import" ? "bg-amber-500/20 text-amber-400" : "text-gray-500 hover:text-gray-300"}`}
                  >
                    Import Social
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {mode === "manual" ? (
                <div className="space-y-4">
                  <div>
                    <FieldLabel icon={FileText}>Story Content *</FieldLabel>
                    <Textarea
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      placeholder="What's happening? (Max 280 chars)"
                      maxLength={280}
                      rows={4}
                      className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600"
                      data-testid="input-story-content"
                    />
                  </div>
                  <div>
                    <FieldLabel icon={Clock}>Image URL <span className="text-gray-500 text-xs ml-1">(optional)</span></FieldLabel>
                    <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="bg-black/40 border-green-500/20 text-white" data-testid="input-story-image" />
                  </div>
                  <div>
                    <FieldLabel icon={User}>Author Name</FieldLabel>
                    <Input value={storyAuthor} onChange={e => setStoryAuthor(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-story-author" />
                  </div>
                  <Button
                    onClick={() => createMutation.mutate({ content, imageUrl: imageUrl || null, authorName: storyAuthor })}
                    disabled={!content || createMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    data-testid="button-post-story"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {createMutation.isPending ? "Posting..." : "Post Story"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 space-y-2">
                    <p className="text-amber-400/80 text-xs font-medium">Automatic Social Import</p>
                    <p className="text-gray-500 text-[11px] leading-relaxed">Paste a link to an Instagram post, TikTok, or X/Twitter post. We'll attempt to fetch the image and caption to create a story update.</p>
                  </div>

                  {/* URL input + detect */}
                  <div>
                    <FieldLabel icon={Link2}>Post URL *</FieldLabel>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          value={importUrl}
                          onChange={e => { setImportUrl(e.target.value); setResolvedPost(null); setResolveError(null); }}
                          placeholder="https://www.instagram.com/p/... or tiktok.com/... or x.com/..."
                          className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600 pr-28"
                          data-testid="input-import-url"
                        />
                        {platformInfo && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                            <platformInfo.Icon className="w-3.5 h-3.5" style={{ color: platformInfo.color }} />
                            <span className="text-xs font-medium" style={{ color: platformInfo.color }}>{platformInfo.label}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        onClick={handleFetchPreview}
                        disabled={!importUrl || !detectedPlatform || isFetching}
                        className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                        data-testid="button-fetch-preview"
                      >
                        {isFetching ? "Fetching..." : "Fetch"}
                      </Button>
                    </div>
                    {!detectedPlatform && importUrl && (
                      <p className="text-gray-500 text-xs mt-1.5">Paste an Instagram, TikTok, X/Twitter, or Snapchat URL</p>
                    )}
                  </div>

                  {/* Error */}
                  {resolveError && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20" data-testid="import-error">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-400 text-sm font-medium">Could not load this post</p>
                        <p className="text-red-400/70 text-xs mt-0.5">{resolveError} — make sure the post is public</p>
                      </div>
                    </div>
                  )}

                  {/* Success preview */}
                  {resolvedPost && (
                    <div className="rounded-lg border border-green-500/20 bg-black/40 overflow-hidden" data-testid="import-preview">
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-green-500/10">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400 text-xs font-medium">Post loaded successfully</span>
                        {(() => {
                          const pi = PLATFORM_INFO[resolvedPost.platform];
                          if (!pi) return null;
                          return (
                            <div className="flex items-center gap-1 ml-auto">
                              <pi.Icon className="w-3 h-3" style={{ color: pi.color }} />
                              <span className="text-xs" style={{ color: pi.color }}>{pi.label}</span>
                            </div>
                          );
                        })()}
                      </div>
                      <div className="flex gap-3 p-3">
                        {resolvedPost.imageUrl ? (
                          <img
                            src={resolvedPost.imageUrl}
                            alt="Post thumbnail"
                            className="w-20 h-20 object-cover rounded-lg shrink-0 border border-white/10"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-lg shrink-0 border border-white/10 bg-black/60 flex flex-col items-center justify-center gap-1">
                            {(() => {
                              const pi = PLATFORM_INFO[resolvedPost.platform];
                              if (!pi) return null;
                              return <pi.Icon className="w-5 h-5 opacity-60" style={{ color: pi.color }} />;
                            })()}
                            <span className="text-gray-500 text-[10px] text-center px-1">No image</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          {!resolvedPost.imageUrl && (
                            <p className="text-amber-400/80 text-xs mb-1.5">This post has no thumbnail — it will be posted as a text/caption story.</p>
                          )}
                          {resolvedPost.title && (
                            <p className="text-gray-300 text-xs line-clamp-3 leading-relaxed">{resolvedPost.title}</p>
                          )}
                          <a href={resolvedPost.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-green-400/60 hover:text-green-400 flex items-center gap-1 mt-1.5">
                            <ExternalLink className="w-3 h-3" />
                            View original post
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Caption */}
                  <div>
                    <FieldLabel icon={FileText}>Caption <span className="text-gray-500 text-xs ml-1">(optional — uses post title if blank)</span></FieldLabel>
                    <Textarea
                      value={importCaption}
                      onChange={e => setImportCaption(e.target.value)}
                      placeholder="Add your own caption..."
                      rows={3}
                      className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600"
                      data-testid="input-import-caption"
                    />
                  </div>

                  <div>
                    <FieldLabel icon={User}>Author Name</FieldLabel>
                    <Input value={storyAuthor} onChange={e => setStoryAuthor(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-import-author" />
                  </div>

                  <Button
                    type="button"
                    onClick={handlePostImport}
                    disabled={!resolvedPost || createMutation.isPending}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    data-testid="button-post-import"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {createMutation.isPending ? "Posting..." : "Post as Story"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Story preview */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-green-400/60" />
            <span className="text-gray-400 text-xs font-medium">Story Preview</span>
          </div>

          {/* Story ring avatar */}
          <div className="flex flex-col items-center gap-2">
            <div className="p-1 rounded-full" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a, #065f46)" }}>
              <div className="w-16 h-16 rounded-full border-2 border-black overflow-hidden flex items-center justify-center bg-black/60">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={storyAuthor} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-green-400/40" />
                )}
              </div>
            </div>
            <p className="text-white text-xs font-medium text-center">{storyAuthor || "Your Name"}</p>
            <p className="text-green-400/60 text-xs font-mono">New Story</p>
          </div>

          {/* Story card */}
          <div
            className="rounded-xl border border-green-500/15 overflow-hidden min-h-[160px] relative flex flex-col justify-end"
            style={{
              background: previewImageUrl
                ? `url(${previewImageUrl}) center/cover, #050f05`
                : "linear-gradient(180deg, #050f05 0%, #0a1a0a 100%)",
            }}
          >
            {previewImageUrl && <div className="absolute inset-0 bg-black/50" />}
            {/* Platform badge in preview */}
            {mode === "import" && resolvedPost && (() => {
              const pi = PLATFORM_INFO[resolvedPost.platform];
              if (!pi) return null;
              return (
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded-full border border-white/20 bg-black/70 text-xs">
                  <pi.Icon className="w-3 h-3" style={{ color: pi.color }} />
                  <span className="text-white/80">{pi.label}</span>
                </div>
              );
            })()}
            <div className="relative z-10 p-4 space-y-2">
              {previewContent ? (
                <p className="text-white text-sm leading-relaxed line-clamp-4">{previewContent.slice(0, 140)}{previewContent.length > 140 ? "..." : ""}</p>
              ) : (
                <p className="text-gray-600 text-sm italic">
                  {mode === "import" ? "Fetch a post to preview..." : "Start typing to preview..."}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-amber-400/60">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-mono">Visible for 24 hours</span>
          </div>
        </div>
      </div>

      {/* Stories list */}
      <Card className="bg-black/60 border-green-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-400 text-base">My Stories ({stories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-gray-400">Loading...</p> : stories.length === 0 ? (
            <p className="text-gray-500 text-sm">No stories yet.</p>
          ) : (
            <div className="space-y-2">
              {stories.map((s: Story & { sourceType?: string | null; sourceUrl?: string | null }) => {
                const pi = s.sourceType ? PLATFORM_INFO[s.sourceType] : null;
                return (
                  <div key={s.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-black/40 border border-green-500/10" data-testid={`row-story-${s.id}`}>
                    {s.imageUrl && (
                      <img src={s.imageUrl} alt="" className="w-10 h-10 object-cover rounded border border-white/10 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {pi && (
                          <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border border-white/10 bg-black/40">
                            <pi.Icon className="w-2.5 h-2.5" style={{ color: pi.color }} />
                            <span style={{ color: pi.color }}>{pi.label}</span>
                          </span>
                        )}
                        <p className="text-white text-sm line-clamp-1">{s.content || (pi ? `${pi.label} post` : "No text")}</p>
                      </div>
                      <p className={`text-xs mt-1 font-mono ${isExpired(s.expiresAt) ? "text-red-400/60" : "text-amber-400/50"}`}>
                        <Clock className="w-3 h-3 inline mr-1" />
                        {isExpired(s.expiresAt) ? "Expired" : `Expires ${new Date(s.expiresAt).toLocaleString()}`}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(s.id)} className="text-red-400/70 hover:text-red-400 h-8 w-8 shrink-0" data-testid={`button-delete-story-${s.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
