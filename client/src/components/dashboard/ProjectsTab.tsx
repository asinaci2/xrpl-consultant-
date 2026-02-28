import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Briefcase, Trash2, Plus, Edit2, X, Eye, FileText, Zap, Link2, LucideIcon, Sparkles
} from "lucide-react";
import { SectionBanner } from "./SectionBanner";
import { FieldLabel } from "./FieldLabel";
import { useAdminSlug, useSlugParam } from "./context";
import { ICON_MAP, ICON_NAMES, COLOR_MAP } from "./constants";
import { ProjectEntry } from "./types";

export function ProjectsTab({ slug }: { slug: string }) {
  const { toast } = useToast();
  const sp = useSlugParam();
  const override = useAdminSlug();
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
    queryKey: ["/api/dashboard/projects", override],
    queryFn: () => fetch(`/api/dashboard/projects${sp}`, { credentials: "include" }).then(r => r.json()),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/projects", override] });
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/dashboard/projects${sp}`, data),
    onSuccess: () => {
      invalidate();
      resetForm();
      toast({ title: "Project added" });
    },
    onError: () => toast({ title: "Error", description: "Failed to add project", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/dashboard/projects/${id}${sp}`, data),
    onSuccess: () => {
      invalidate();
      resetForm();
      toast({ title: "Project updated" });
    },
    onError: () => toast({ title: "Error", description: "Failed to update project", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/dashboard/projects/${id}${sp}`),
    onSuccess: () => {
      invalidate();
      toast({ title: "Project deleted" });
    },
  });

  const resetForm = () => {
    setTitle(""); setSubtitle(""); setDescription(""); setImpact("");
    setLink(""); setIcon("Briefcase"); setColor("bg-green-500");
    setTagsInput(""); setDisplayOrder("0"); setEditingId(null);
  };

  const startEdit = (p: ProjectEntry) => {
    setEditingId(p.id);
    setTitle(p.title);
    setSubtitle(p.subtitle);
    setDescription(p.description);
    setImpact(p.impact);
    setLink(p.link ?? "");
    setIcon(p.icon);
    setColor(p.color);
    setTagsInput(p.tags.join(", "));
    setDisplayOrder(p.displayOrder.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      title, subtitle, description, impact,
      link: link || null,
      icon, color,
      tags: tagsInput.split(",").map(s => s.trim()).filter(Boolean),
      displayOrder: parseInt(displayOrder) || 0,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-5">
      <SectionBanner
        icon={Briefcase}
        iconBg="bg-blue-500/15"
        iconColor="text-blue-400"
        borderColor="border-blue-500"
        section="Experience & Projects"
        description="Showcase your professional milestones, active projects, and past successes with rich descriptions and impact metrics."
        slug={slug}
        anchor="projects"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card className="bg-black/60 border-green-500/20">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-green-400 text-base flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {editingId ? "Edit Project" : "Add Project"}
            </CardTitle>
            {editingId && (
              <Button variant="ghost" size="sm" onClick={resetForm} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel icon={Briefcase}>Project Title *</FieldLabel>
                  <Input value={title} onChange={e => setTitle(e.target.value)} required className="bg-black/40 border-green-500/20 text-white" data-testid="input-project-title" />
                </div>
                <div>
                  <FieldLabel icon={Sparkles}>Subtitle / Role</FieldLabel>
                  <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Lead Consultant" className="bg-black/40 border-green-500/20 text-white" data-testid="input-project-subtitle" />
                </div>
              </div>
              <div>
                <FieldLabel icon={FileText}>Description</FieldLabel>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="bg-black/40 border-green-500/20 text-white" data-testid="input-project-description" />
              </div>
              <div>
                <FieldLabel icon={Zap}>Impact / Outcome</FieldLabel>
                <Input value={impact} onChange={e => setImpact(e.target.value)} placeholder="Increased TVL by 40%" className="bg-black/40 border-green-500/20 text-white" data-testid="input-project-impact" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel icon={Link2}>Project Link (optional)</FieldLabel>
                  <Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." className="bg-black/40 border-green-500/20 text-white" data-testid="input-project-link" />
                </div>
                <div>
                  <FieldLabel icon={Plus}>Tags (comma separated)</FieldLabel>
                  <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="XRPL, DeFi, Marketing" className="bg-black/40 border-green-500/20 text-white" data-testid="input-project-tags" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <FieldLabel icon={Briefcase}>Icon</FieldLabel>
                  <Select value={icon} onValueChange={setIcon}>
                    <SelectTrigger className="bg-black/40 border-green-500/20 text-white" data-testid="select-project-icon">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-green-500/20">
                      {ICON_NAMES.map(name => {
                        const Icon = ICON_MAP[name];
                        return (
                          <SelectItem key={name} value={name} className="text-white hover:bg-green-500/10">
                            <div className="flex items-center gap-2">
                              {Icon && <Icon className="w-4 h-4" />}
                              <span>{name}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <FieldLabel icon={Zap}>Color Theme</FieldLabel>
                  <Select value={color} onValueChange={setColor}>
                    <SelectTrigger className="bg-black/40 border-green-500/20 text-white" data-testid="select-project-color">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-green-500/20">
                      {Object.keys(COLOR_MAP).map(c => (
                        <SelectItem key={c} value={c} className="text-white hover:bg-green-500/10">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${c}`} />
                            <span className="capitalize">{c.split('-')[1]}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <FieldLabel icon={Plus}>Display Order</FieldLabel>
                  <Input type="number" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-project-order" />
                </div>
              </div>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-save-project">
                {editingId ? "Update Project" : "Add Project"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* List */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-blue-400/60" />
            <span className="text-gray-400 text-xs font-medium">My Projects ({projectsList.length})</span>
          </div>
          {isLoading ? <p className="text-gray-400">Loading...</p> : projectsList.length === 0 ? (
            <p className="text-gray-500 text-sm">No projects added yet.</p>
          ) : (
            <div className="space-y-3">
              {projectsList.map(p => {
                const Icon = ICON_MAP[p.icon] || Briefcase;
                const hexColor = COLOR_MAP[p.color] || "#22c55e";
                return (
                  <Card key={p.id} className="bg-black/60 border-green-500/10 overflow-hidden" data-testid={`card-project-${p.id}`}>
                    <div className="p-4 flex items-start gap-4">
                      <div className={`p-2.5 rounded-lg shrink-0 ${p.color}/10 border border-${p.color.split('-')[1]}-500/20`}>
                        <Icon className="w-5 h-5" style={{ color: hexColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-white font-semibold text-sm truncate">{p.title}</h4>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="icon" onClick={() => startEdit(p)} className="h-7 w-7 text-gray-400 hover:text-white" data-testid={`button-edit-project-${p.id}`}>
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(p.id)} className="h-7 w-7 text-red-400/60 hover:text-red-400" data-testid={`button-delete-project-${p.id}`}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-blue-400/80 text-xs font-medium">{p.subtitle}</p>
                        <p className="text-gray-400 text-xs mt-2 line-clamp-2 leading-relaxed">{p.description}</p>
                        {p.impact && (
                          <div className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded bg-green-500/5 border border-green-500/10 w-fit">
                            <Zap className="w-3 h-3 text-green-400" />
                            <span className="text-[10px] text-green-400/80 font-mono uppercase tracking-wider">{p.impact}</span>
                          </div>
                        )}
                        {p.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {p.tags.map(t => (
                              <span key={t} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-gray-500">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
