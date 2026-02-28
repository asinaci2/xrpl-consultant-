import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, X } from "lucide-react";
import { ProjectEntry } from "./types";

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

export function ProjectsTab() {
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
