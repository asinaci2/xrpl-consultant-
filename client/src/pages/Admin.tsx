import { useState, useEffect } from "react";
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
import { Trash2, Plus, RefreshCw, ArrowLeft, Image, BookOpen, Mail, Twitter, Briefcase, Edit2, X, LogOut, User, ExternalLink, Phone, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

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

type ProjectEntry = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  impact: string;
  link: string | null;
  icon: string;
  color: string;
  tags: string[];
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
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

const ICON_OPTIONS = [
  "MessageSquare", "Heart", "Radio", "Gamepad2", "Briefcase",
  "Globe", "Star", "Zap", "Shield", "Code", "Users", "Rocket", "Award", "Target",
];

const COLOR_OPTIONS = [
  { value: "bg-blue-500", label: "Blue" },
  { value: "bg-green-500", label: "Green" },
  { value: "bg-purple-500", label: "Purple" },
  { value: "bg-pink-500", label: "Pink" },
  { value: "bg-orange-500", label: "Orange" },
  { value: "bg-red-500", label: "Red" },
  { value: "bg-yellow-500", label: "Yellow" },
  { value: "bg-cyan-500", label: "Cyan" },
  { value: "bg-indigo-500", label: "Indigo" },
];

function ProjectsTab() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [impact, setImpact] = useState("");
  const [link, setLink] = useState("");
  const [icon, setIcon] = useState("Briefcase");
  const [color, setColor] = useState("bg-green-500");
  const [tagsInput, setTagsInput] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: projectsList = [], isLoading } = useQuery<ProjectEntry[]>({
    queryKey: ["/api/projects/all"],
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/projects", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      resetForm();
      toast({ title: "Project added" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to add project", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) =>
      apiRequest("PATCH", `/api/projects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      resetForm();
      toast({ title: "Project updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update project", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Project deleted" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest("PATCH", `/api/projects/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });

  const resetForm = () => {
    setTitle("");
    setSubtitle("");
    setDescription("");
    setImpact("");
    setLink("");
    setIcon("Briefcase");
    setColor("bg-green-500");
    setTagsInput("");
    setDisplayOrder("0");
    setEditingId(null);
  };

  const loadForEdit = (project: ProjectEntry) => {
    setTitle(project.title);
    setSubtitle(project.subtitle);
    setDescription(project.description);
    setImpact(project.impact);
    setLink(project.link || "");
    setIcon(project.icon);
    setColor(project.color);
    setTagsInput(project.tags.join(", "));
    setDisplayOrder(String(project.displayOrder));
    setEditingId(project.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    const data = {
      title,
      subtitle,
      description,
      impact,
      link: link || null,
      icon,
      color,
      tags,
      displayOrder: parseInt(displayOrder) || 0,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <Card className="bg-black/60 border-green-500/20">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-green-400 text-lg">
            {editingId ? "Edit Project" : "Add Project"}
          </CardTitle>
          {editingId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetForm}
              className="text-gray-400 hover:text-white"
              data-testid="button-cancel-edit-project"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Project name"
                  className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600"
                  data-testid="input-project-title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Subtitle</label>
                <Input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Brief tagline"
                  className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600"
                  data-testid="input-project-subtitle"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this project do?"
                className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600 min-h-[80px]"
                data-testid="input-project-description"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Impact</label>
              <Textarea
                value={impact}
                onChange={(e) => setImpact(e.target.value)}
                placeholder="Key results or community value"
                className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600 min-h-[60px]"
                data-testid="input-project-impact"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Project URL (optional)</label>
                <Input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://..."
                  className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600"
                  data-testid="input-project-link"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Tags (comma-separated)</label>
                <Input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="GameFi, NFT, Community"
                  className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600"
                  data-testid="input-project-tags"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Icon</label>
                <Select value={icon} onValueChange={setIcon}>
                  <SelectTrigger className="bg-black/40 border-green-500/20 text-white" data-testid="select-project-icon">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((ic) => (
                      <SelectItem key={ic} value={ic}>{ic}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Color</label>
                <Select value={color} onValueChange={setColor}>
                  <SelectTrigger className="bg-black/40 border-green-500/20 text-white" data-testid="select-project-color">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${c.value}`} />
                          {c.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Display Order</label>
                <Input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  className="bg-black/40 border-green-500/20 text-white"
                  data-testid="input-project-order"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={isPending || !title || !subtitle || !description || !impact}
              className="bg-green-600 hover:bg-green-700 text-white"
              data-testid="button-save-project"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isPending ? "Saving..." : editingId ? "Update Project" : "Add Project"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-black/60 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-400 text-lg">All Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-400">Loading...</p>
          ) : projectsList.length === 0 ? (
            <p className="text-gray-400">No projects yet.</p>
          ) : (
            <div className="space-y-3">
              {projectsList.map((project) => (
                <div
                  key={project.id}
                  className="p-4 rounded-lg border border-green-500/10 bg-black/30"
                  data-testid={`card-admin-project-${project.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`w-8 h-8 rounded-lg ${project.color} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white text-xs font-bold">
                            {project.icon.substring(0, 2)}
                          </span>
                        </span>
                        <div>
                          <span className="text-white font-medium" data-testid={`text-admin-project-title-${project.id}`}>
                            {project.title}
                          </span>
                          <p className="text-green-400 text-xs">{project.subtitle}</p>
                        </div>
                        {project.link && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 text-xs hover:text-green-400 truncate max-w-[200px]"
                            data-testid={`link-admin-project-${project.id}`}
                          >
                            {project.link}
                          </a>
                        )}
                        {!project.isActive && (
                          <Badge variant="outline" className="border-red-500/30 text-red-400 text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mt-2 line-clamp-2">{project.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {project.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Switch
                        checked={project.isActive ?? true}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: project.id, isActive: checked })
                        }
                        data-testid={`switch-project-active-${project.id}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => loadForEdit(project)}
                        className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                        data-testid={`button-edit-project-${project.id}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(project.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        data-testid={`button-delete-project-${project.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type ContactInfoData = {
  id: number;
  headline: string;
  subheading: string;
  email: string;
  phone: string;
  location: string;
  locationLine2: string;
};

type ChatHostConfigData = {
  id: number;
  consultantSlug: string;
  displayName: string;
  title: string;
  avatarUrl: string | null;
  statusMessage: string;
  isAvailable: boolean;
};

function ChatProfileTab() {
  const { toast } = useToast();

  const { data: config, isLoading } = useQuery<ChatHostConfigData>({
    queryKey: ["/api/chat/host-config"],
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
      apiRequest("PATCH", "/api/chat/host-config", {
        displayName,
        title,
        avatarUrl: avatarUrl || null,
        statusMessage,
        isAvailable,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/host-config"] });
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

function ContactTab() {
  const { toast } = useToast();

  const { data: info, isLoading } = useQuery<ContactInfoData>({
    queryKey: ["/api/contact-info"],
  });

  const [headline, setHeadline] = useState("");
  const [subheading, setSubheading] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [locationLine2, setLocationLine2] = useState("");

  useEffect(() => {
    if (info) {
      setHeadline(info.headline);
      setSubheading(info.subheading);
      setEmail(info.email);
      setPhone(info.phone);
      setLocation(info.location);
      setLocationLine2(info.locationLine2);
    }
  }, [info]);

  const updateMutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", "/api/contact-info", {
        headline,
        subheading,
        email,
        phone,
        location,
        locationLine2,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-info"] });
      toast({ title: "Saved", description: "Contact section updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save contact info.", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <Card className="bg-black/60 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-400 text-lg flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Edit "Get in Touch" Section
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-400">Loading...</p>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Headline</label>
                <Input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Ready to Innovate?"
                  className="bg-black/40 border-green-500/20 text-white"
                  data-testid="input-contact-headline"
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Description</label>
                <Textarea
                  value={subheading}
                  onChange={(e) => setSubheading(e.target.value)}
                  placeholder="Schedule a consultation..."
                  className="bg-black/40 border-green-500/20 text-white min-h-[100px] resize-none"
                  data-testid="input-contact-subheading"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 text-sm font-medium block mb-1">Email</label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@example.com"
                    className="bg-black/40 border-green-500/20 text-white"
                    data-testid="input-contact-email"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-sm font-medium block mb-1">Phone</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="bg-black/40 border-green-500/20 text-white"
                    data-testid="input-contact-phone"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 text-sm font-medium block mb-1">Office Location</label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="San Francisco, CA"
                    className="bg-black/40 border-green-500/20 text-white"
                    data-testid="input-contact-location"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-sm font-medium block mb-1">Location Line 2</label>
                  <Input
                    value={locationLine2}
                    onChange={(e) => setLocationLine2(e.target.value)}
                    placeholder="Available Worldwide Remote"
                    className="bg-black/40 border-green-500/20 text-white"
                    data-testid="input-contact-location2"
                  />
                </div>
              </div>
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
                data-testid="button-save-contact"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Admin() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => setLocation("/login"),
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
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
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 text-sm text-gray-400 font-mono" data-testid="text-admin-user">
                <User className="w-4 h-4 text-green-400" />
                <span>{user.displayName}</span>
              </div>
            )}
            <a
              href="https://app.textrp.io/#/room/#budzy-vibe:synapse.textrp.io"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-textrp"
            >
              <Button
                variant="ghost"
                className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                TextRP
              </Button>
            </a>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
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
              value="projects"
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-400"
              data-testid="tab-projects"
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Projects
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
            <TabsTrigger
              value="contact"
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-400"
              data-testid="tab-contact"
            >
              <Phone className="w-4 h-4 mr-2" />
              Contact
            </TabsTrigger>
            <TabsTrigger
              value="chat-profile"
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-400"
              data-testid="tab-chat-profile"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="media">
            <MediaTab />
          </TabsContent>
          <TabsContent value="projects">
            <ProjectsTab />
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
          <TabsContent value="contact">
            <ContactTab />
          </TabsContent>
          <TabsContent value="chat-profile">
            <ChatProfileTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
