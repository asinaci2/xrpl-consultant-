import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { Story } from "./types";

export function StoriesTab() {
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
