import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, RefreshCw, ArrowLeft, Image, BookOpen, Mail, Twitter } from "lucide-react";

type CachedMedia = {
  id: number;
  source: string;
  sourceUrl: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  title: string | null;
  section: string;
  altText: string | null;
  isActive: boolean;
  displayOrder: number;
  fetchedAt: string;
  createdAt: string;
};

type Story = {
  id: number;
  content: string | null;
  imageUrl: string | null;
  authorName: string;
  authorImage: string | null;
  createdAt: string;
  expiresAt: string;
};

type Inquiry = {
  id: number;
  name: string;
  email: string;
  message: string;
  createdAt: string;
};

type CachedTweet = {
  id: number;
  tweetId: string;
  text: string;
  createdAt: string;
  authorName: string;
  authorUsername: string;
  authorImage: string | null;
  likes: number;
  retweets: number;
  replies: number;
  fetchedAt: string;
};

function MediaTab() {
  const { toast } = useToast();
  const [source, setSource] = useState("manual");
  const [sourceUrl, setSourceUrl] = useState("");
  const [section, setSection] = useState("hero");
  const [altText, setAltText] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");

  const { data: media = [], isLoading } = useQuery<CachedMedia[]>({
    queryKey: ["/api/media"],
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/media", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media/hero"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media/about"] });
      setSourceUrl("");
      setAltText("");
      setDisplayOrder("0");
      toast({ title: "Media added" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to add media", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/media/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media/hero"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media/about"] });
      toast({ title: "Media deleted" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest("PATCH", `/api/media/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media/hero"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media/about"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      source,
      sourceUrl,
      section,
      altText: altText || null,
      displayOrder: parseInt(displayOrder) || 0,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-black/60 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-400 text-lg">Add Media</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Source</label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="bg-black/40 border-green-500/20 text-white" data-testid="select-media-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual URL</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="gdrive">Google Drive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Section</label>
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger className="bg-black/40 border-green-500/20 text-white" data-testid="select-media-section">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hero">Hero</SelectItem>
                  <SelectItem value="about">About</SelectItem>
                  <SelectItem value="gallery">Gallery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-gray-400">Source URL</label>
              <Input
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
                className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600"
                data-testid="input-media-url"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Alt Text</label>
              <Input
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Image description"
                className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600"
                data-testid="input-media-alt"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Display Order</label>
              <Input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="bg-black/40 border-green-500/20 text-white"
                data-testid="input-media-order"
              />
            </div>
            <div className="md:col-span-2">
              <Button
                type="submit"
                disabled={createMutation.isPending || !sourceUrl}
                className="bg-green-600 hover:bg-green-700 text-white"
                data-testid="button-add-media"
              >
                <Plus className="w-4 h-4 mr-2" />
                {createMutation.isPending ? "Adding..." : "Add Media"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-black/60 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-400 text-lg">Media Library</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-400">Loading...</p>
          ) : media.length === 0 ? (
            <p className="text-gray-400">No media entries yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-green-500/20 hover:bg-transparent">
                    <TableHead className="text-green-400">Preview</TableHead>
                    <TableHead className="text-green-400">Source</TableHead>
                    <TableHead className="text-green-400">Section</TableHead>
                    <TableHead className="text-green-400">Alt Text</TableHead>
                    <TableHead className="text-green-400">Order</TableHead>
                    <TableHead className="text-green-400">Active</TableHead>
                    <TableHead className="text-green-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {media.map((item) => (
                    <TableRow key={item.id} className="border-green-500/10 hover:bg-green-500/5" data-testid={`row-media-${item.id}`}>
                      <TableCell>
                        <img
                          src={item.imageUrl}
                          alt={item.altText || ""}
                          className="w-16 h-12 object-cover rounded border border-green-500/20"
                          data-testid={`img-media-preview-${item.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-green-500/30 text-green-400">
                          {item.source}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">{item.section}</TableCell>
                      <TableCell className="text-gray-300 max-w-[150px] truncate">{item.altText || "—"}</TableCell>
                      <TableCell className="text-gray-300">{item.displayOrder}</TableCell>
                      <TableCell>
                        <Switch
                          checked={item.isActive}
                          onCheckedChange={(checked) =>
                            toggleMutation.mutate({ id: item.id, isActive: checked })
                          }
                          data-testid={`switch-media-active-${item.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(item.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          data-testid={`button-delete-media-${item.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StoriesTab() {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [authorName, setAuthorName] = useState("Edwin Gutierrez");

  const { data: stories = [], isLoading } = useQuery<Story[]>({
    queryKey: ["/api/stories/all"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { content: string; authorName: string; imageUrl?: string }) => {
      const formData = new FormData();
      formData.append("content", data.content);
      formData.append("authorName", data.authorName);
      if (data.imageUrl) {
        formData.append("imageUrl", data.imageUrl);
      }
      const res = await fetch("/api/stories", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to create story");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      setContent("");
      setImageUrl("");
      toast({ title: "Story created" });
    },
    onError: () => {
      toast({ title: "Failed to create story", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/stories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      toast({ title: "Story deleted" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;
    createMutation.mutate({ content, authorName, imageUrl: imageUrl || undefined });
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <div className="space-y-6">
      <Card className="bg-black/60 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-400 text-lg">Create Story</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Content</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening?"
                className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600 min-h-[80px]"
                data-testid="input-story-content"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Author Name</label>
                <Input
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="bg-black/40 border-green-500/20 text-white"
                  data-testid="input-story-author"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Image URL (optional)</label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600"
                  data-testid="input-story-image"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={createMutation.isPending || !content}
              className="bg-green-600 hover:bg-green-700 text-white"
              data-testid="button-create-story"
            >
              <Plus className="w-4 h-4 mr-2" />
              {createMutation.isPending ? "Creating..." : "Create Story"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-black/60 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-400 text-lg">All Stories</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-400">Loading...</p>
          ) : stories.length === 0 ? (
            <p className="text-gray-400">No stories yet.</p>
          ) : (
            <div className="space-y-3">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-green-500/10 bg-black/30"
                  data-testid={`card-story-${story.id}`}
                >
                  {story.imageUrl && (
                    <img
                      src={story.imageUrl}
                      alt=""
                      className="w-16 h-16 rounded object-cover border border-green-500/20 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm">{story.content || "(Image only)"}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-gray-500 text-xs">by {story.authorName}</span>
                      <span className="text-gray-600 text-xs">
                        {new Date(story.createdAt).toLocaleDateString()}
                      </span>
                      {isExpired(story.expiresAt) ? (
                        <Badge variant="outline" className="border-red-500/30 text-red-400 text-xs">
                          Expired
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(story.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex-shrink-0"
                    data-testid={`button-delete-story-${story.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InquiriesTab() {
  const { toast } = useToast();

  const { data: inquiries = [], isLoading } = useQuery<Inquiry[]>({
    queryKey: ["/api/inquiries"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/inquiries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      toast({ title: "Inquiry deleted" });
    },
  });

  return (
    <Card className="bg-black/60 border-green-500/20">
      <CardHeader>
        <CardTitle className="text-green-400 text-lg">Contact Inquiries</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-gray-400">Loading...</p>
        ) : inquiries.length === 0 ? (
          <p className="text-gray-400">No inquiries yet.</p>
        ) : (
          <div className="space-y-3">
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="p-4 rounded-lg border border-green-500/10 bg-black/30"
                data-testid={`card-inquiry-${inquiry.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-white font-medium" data-testid={`text-inquiry-name-${inquiry.id}`}>
                        {inquiry.name}
                      </span>
                      <span className="text-green-400 text-sm">{inquiry.email}</span>
                      <span className="text-gray-600 text-xs">
                        {new Date(inquiry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mt-2">{inquiry.message}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(inquiry.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex-shrink-0"
                    data-testid={`button-delete-inquiry-${inquiry.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TweetsTab() {
  const { toast } = useToast();

  const { data: tweets = [], isLoading } = useQuery<CachedTweet[]>({
    queryKey: ["/api/twitter/tweets"],
  });

  const refreshMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/twitter/refresh"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/twitter/tweets"] });
      toast({ title: "Twitter cache refreshed" });
    },
    onError: () => {
      toast({ title: "Failed to refresh", description: "Check API credentials", variant: "destructive" });
    },
  });

  return (
    <Card className="bg-black/60 border-green-500/20">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-green-400 text-lg">Cached Tweets</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          className="border-green-500/30 text-green-400 hover:bg-green-500/10"
          data-testid="button-refresh-tweets"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
          {refreshMutation.isPending ? "Refreshing..." : "Refresh Cache"}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-gray-400">Loading...</p>
        ) : tweets.length === 0 ? (
          <p className="text-gray-400">No cached tweets.</p>
        ) : (
          <div className="space-y-3">
            {tweets.map((tweet, index) => (
              <div
                key={tweet.tweetId || index}
                className="p-4 rounded-lg border border-green-500/10 bg-black/30"
                data-testid={`card-tweet-${index}`}
              >
                <div className="flex items-start gap-3">
                  {tweet.authorImage && (
                    <img
                      src={tweet.authorImage}
                      alt={tweet.authorName}
                      className="w-10 h-10 rounded-full border border-green-500/20 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium text-sm">{tweet.authorName}</span>
                      <span className="text-gray-500 text-xs">@{tweet.authorUsername}</span>
                    </div>
                    <p className="text-gray-300 text-sm mt-1">{tweet.text}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                      <span>{tweet.likes} likes</span>
                      <span>{tweet.retweets} retweets</span>
                      <span>{tweet.replies} replies</span>
                      {tweet.fetchedAt && (
                        <span>Cached: {new Date(tweet.fetchedAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Admin() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-green-400 hover:bg-green-500/10" data-testid="button-back-home">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-green-400 font-mono" data-testid="text-admin-title">
              Admin Dashboard
            </h1>
            <p className="text-gray-500 text-sm">Manage your site content</p>
          </div>
        </div>

        <Tabs defaultValue="media" className="space-y-6">
          <TabsList className="bg-black/60 border border-green-500/20 p-1">
            <TabsTrigger
              value="media"
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-400"
              data-testid="tab-media"
            >
              <Image className="w-4 h-4 mr-2" />
              Media
            </TabsTrigger>
            <TabsTrigger
              value="stories"
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-400"
              data-testid="tab-stories"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Stories
            </TabsTrigger>
            <TabsTrigger
              value="inquiries"
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-400"
              data-testid="tab-inquiries"
            >
              <Mail className="w-4 h-4 mr-2" />
              Inquiries
            </TabsTrigger>
            <TabsTrigger
              value="tweets"
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-400"
              data-testid="tab-tweets"
            >
              <Twitter className="w-4 h-4 mr-2" />
              Tweets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="media">
            <MediaTab />
          </TabsContent>
          <TabsContent value="stories">
            <StoriesTab />
          </TabsContent>
          <TabsContent value="inquiries">
            <InquiriesTab />
          </TabsContent>
          <TabsContent value="tweets">
            <TweetsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
