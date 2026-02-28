import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { CachedMedia } from "./types";

export function MediaTab() {
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
