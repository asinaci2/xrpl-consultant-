import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEcosystemProjectSchema, type EcosystemProject, type InsertEcosystemProject } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, X, Globe, ExternalLink, CheckCircle2, Tag, LayoutGrid } from "lucide-react";
import { ECOSYSTEM_CATEGORIES, ECOSYSTEM_STATUS_OPTIONS, ECOSYSTEM_STATUS_COLORS } from "@/lib/constants";

const STAT_CARDS = (list: EcosystemProject[]) => [
  { label: "Total Projects", value: list.length, color: "text-blue-400" },
  { label: "Active", value: list.filter(p => p.isActive).length, color: "text-green-400" },
  { label: "Categories Covered", value: new Set(list.map(p => p.category)).size, color: "text-purple-400" },
  { label: "With Websites", value: list.filter(p => p.website).length, color: "text-orange-400" },
];

const EMPTY_FORM: InsertEcosystemProject = {
  category: ECOSYSTEM_CATEGORIES[0],
  name: "",
  description: "",
  website: "",
  xHandle: "",
  token: "",
  xrplFeatures: [],
  status: "Live",
  displayOrder: 0,
  isActive: true,
};

export function EcosystemTab() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("All");

  const { data: projectsList = [], isLoading } = useQuery<EcosystemProject[]>({
    queryKey: ["/api/ecosystem/all"],
  });

  const form = useForm<InsertEcosystemProject>({
    resolver: zodResolver(insertEcosystemProjectSchema),
    defaultValues: EMPTY_FORM,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/ecosystem/all"] });

  const createMutation = useMutation({
    mutationFn: (data: InsertEcosystemProject) => apiRequest("POST", "/api/ecosystem", data),
    onSuccess: () => { invalidate(); resetForm(); toast({ title: "Project added" }); },
    onError: () => toast({ title: "Error", description: "Failed to add project", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertEcosystemProject> }) =>
      apiRequest("PATCH", `/api/ecosystem/${id}`, data),
    onSuccess: () => { invalidate(); resetForm(); toast({ title: "Project updated" }); },
    onError: () => toast({ title: "Error", description: "Failed to update project", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/ecosystem/${id}`),
    onSuccess: () => { invalidate(); toast({ title: "Project deleted" }); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest("PATCH", `/api/ecosystem/${id}`, { isActive }),
    onSuccess: () => invalidate(),
  });

  const resetForm = () => {
    setEditingId(null);
    form.reset(EMPTY_FORM);
  };

  const startEdit = (p: EcosystemProject) => {
    setEditingId(p.id);
    form.reset({
      category: p.category,
      name: p.name,
      description: p.description ?? "",
      website: p.website ?? "",
      xHandle: p.xHandle ?? "",
      token: p.token ?? "",
      xrplFeatures: p.xrplFeatures ?? [],
      status: p.status ?? "Live",
      displayOrder: p.displayOrder ?? 0,
      isActive: p.isActive ?? true,
    });
  };

  const onSubmit = (data: InsertEcosystemProject) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredList = useMemo(() =>
    filterCategory === "All" ? projectsList : projectsList.filter(p => p.category === filterCategory),
    [projectsList, filterCategory]
  );

  const grouped = useMemo(() => {
    const map: Record<string, EcosystemProject[]> = {};
    filteredList.forEach(p => {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    });
    return map;
  }, [filteredList]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const statusColors = (status: string) =>
    ECOSYSTEM_STATUS_COLORS[status] ?? ECOSYSTEM_STATUS_COLORS["Live"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS(projectsList).map(stat => (
          <Card key={stat.label} className="bg-black/60 border-green-500/20">
            <CardContent className="p-4">
              <p className="text-gray-500 text-xs font-mono">{stat.label}</p>
              <p className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-black/60 border-green-500/20">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-green-400 text-lg flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {editingId ? "Edit Project" : "Add Ecosystem Project"}
          </CardTitle>
          {editingId && (
            <Button variant="ghost" size="sm" onClick={resetForm} className="text-gray-400 hover:text-white" data-testid="button-cancel-edit">
              <X className="w-4 h-4 mr-1" />Cancel
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-400 text-sm">Project Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Sologenic" className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600" data-testid="input-ecosystem-name" />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-400 text-sm">Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-black/40 border-green-500/20 text-white" data-testid="select-ecosystem-category">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-950 border-green-500/20">
                        {ECOSYSTEM_CATEGORIES.map(c => (
                          <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-400 text-sm">Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="What does this project do?" className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600 min-h-[70px]" data-testid="input-ecosystem-description" />
                  </FormControl>
                </FormItem>
              )} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="website" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-400 text-sm">Website</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="https://..." className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600" data-testid="input-ecosystem-website" />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="xHandle" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-400 text-sm">X Handle</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="@handle (without @)" className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600" data-testid="input-ecosystem-xhandle" />
                    </FormControl>
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="token" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-400 text-sm">Token Ticker</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="e.g. SOLO" className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600" data-testid="input-ecosystem-token" />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="xrplFeatures" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-400 text-sm">XRPL Features (comma-separated)</FormLabel>
                    <FormControl>
                      <Input
                        value={(field.value ?? []).join(", ")}
                        onChange={e => field.onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                        placeholder="AMM, DEX, NFTs"
                        className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600"
                        data-testid="input-ecosystem-features"
                      />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-400 text-sm">Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? "Live"}>
                      <FormControl>
                        <SelectTrigger className="bg-black/40 border-green-500/20 text-white" data-testid="select-ecosystem-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-950 border-green-500/20">
                        {ECOSYSTEM_STATUS_OPTIONS.map(s => (
                          <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>

              <div className="flex items-center gap-6">
                <FormField control={form.control} name="displayOrder" render={({ field }) => (
                  <FormItem className="flex-1 max-w-[140px]">
                    <FormLabel className="text-gray-400 text-sm">Display Order</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-ecosystem-order" />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex items-center gap-3 mt-5">
                    <FormControl>
                      <Switch checked={field.value ?? true} onCheckedChange={field.onChange} data-testid="switch-ecosystem-active" />
                    </FormControl>
                    <FormLabel className="text-gray-400 text-sm cursor-pointer">Active (visible publicly)</FormLabel>
                  </FormItem>
                )} />
              </div>

              <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white" data-testid="button-save-ecosystem">
                <Plus className="w-4 h-4 mr-2" />
                {isPending ? "Saving..." : editingId ? "Update Project" : "Add Project"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {["All", ...ECOSYSTEM_CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${filterCategory === cat ? "bg-green-600 border-green-500 text-white" : "bg-black/40 border-green-500/20 text-gray-400 hover:border-green-500/40 hover:text-gray-200"}`}
            data-testid={`button-filter-${cat.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <Card className="bg-black/60 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-400 text-lg">Ecosystem Registry</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : projectsList.length === 0 ? (
            <p className="text-gray-500 text-sm">No ecosystem projects added yet.</p>
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-green-500/10">
                    <LayoutGrid className="w-3.5 h-3.5 text-green-400/60" />
                    <h3 className="text-green-400 text-sm font-semibold">{category}</h3>
                    <span className="text-gray-600 text-xs font-mono">({items.length})</span>
                  </div>
                  <div className="space-y-2">
                    {items.map(p => {
                      const sc = statusColors(p.status ?? "Live");
                      return (
                        <div key={p.id} className="flex items-start justify-between gap-4 p-3 rounded-lg bg-black/30 border border-green-500/10" data-testid={`row-ecosystem-${p.id}`}>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white font-medium text-sm" data-testid={`text-ecosystem-name-${p.id}`}>{p.name}</span>
                              {p.token && <span className="px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-mono">{p.token}</span>}
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono border ${sc.bg} ${sc.border} ${sc.text}`}>{p.status}</span>
                              {!p.isActive && <Badge variant="outline" className="border-red-500/30 text-red-400 text-[10px]">Inactive</Badge>}
                            </div>
                            {p.description && <p className="text-white/50 text-xs leading-relaxed line-clamp-1">{p.description}</p>}
                            <div className="flex items-center gap-3 flex-wrap">
                              {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-blue-400/70 hover:text-blue-400 text-xs flex items-center gap-1" data-testid={`link-ecosystem-website-${p.id}`}><ExternalLink className="w-3 h-3" />{p.website.replace(/^https?:\/\//, "")}</a>}
                              {p.xHandle && <a href={`https://x.com/${p.xHandle}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-xs" data-testid={`link-ecosystem-x-${p.id}`}>@{p.xHandle}</a>}
                              {(p.xrplFeatures ?? []).map(f => <span key={f} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-white/40">{f}</span>)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Switch
                              checked={p.isActive ?? true}
                              onCheckedChange={checked => toggleMutation.mutate({ id: p.id, isActive: checked })}
                              data-testid={`switch-active-${p.id}`}
                            />
                            <Button variant="ghost" size="icon" onClick={() => startEdit(p)} className="h-7 w-7 text-green-400 hover:text-green-300 hover:bg-green-500/10" data-testid={`button-edit-ecosystem-${p.id}`}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(p.id)} className="h-7 w-7 text-red-400/60 hover:text-red-400 hover:bg-red-500/10" data-testid={`button-delete-ecosystem-${p.id}`}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
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
