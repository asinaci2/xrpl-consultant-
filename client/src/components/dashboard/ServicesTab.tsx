import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Edit2, X, Wrench, Star, FileText } from "lucide-react";
import { SectionBanner } from "./SectionBanner";
import { FieldLabel } from "./FieldLabel";
import { useAdminSlug, useSlugParam } from "./context";
import { ICON_MAP, ICON_NAMES, EXPERTISE_OPTIONS } from "./constants";
import { ECOSYSTEM_CATEGORIES, ALIGNMENT_PILL } from "@/lib/constants";
import type { ConsultantService } from "@shared/schema";
import type { ConsultantProfile } from "./types";

export function ServicesTab({ slug }: { slug: string }) {
  const { toast } = useToast();
  const sp = useSlugParam();
  const override = useAdminSlug();

  const [expertiseStatement, setExpertiseStatement] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Briefcase");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [serviceAlignments, setServiceAlignments] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: profile } = useQuery<ConsultantProfile>({
    queryKey: ["/api/dashboard/profile", override],
    queryFn: () =>
      fetch(`/api/dashboard/profile${sp}`, { credentials: "include" }).then(r => r.json()),
  });

  useEffect(() => {
    if (profile) {
      setExpertiseStatement(profile.expertiseStatement ?? "");
      setSpecialties(profile.specialties ?? []);
    }
  }, [profile]);

  const toggleSpecialty = (opt: string) => {
    setSpecialties(prev =>
      prev.includes(opt) ? prev.filter(s => s !== opt) : [...prev, opt]
    );
  };

  const profileMutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", `/api/dashboard/profile${sp}`, {
        expertiseStatement,
        specialties,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/profile", override] });
      queryClient.invalidateQueries({ queryKey: ["/api/consultants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/consultants", slug] });
      toast({ title: "Saved" });
    },
    onError: () => toast({ title: "Error", description: "Could not save.", variant: "destructive" }),
  });

  const { data: servicesList = [], isLoading } = useQuery<ConsultantService[]>({
    queryKey: ["/api/dashboard/services", override],
    queryFn: () =>
      fetch(`/api/dashboard/services${sp}`, { credentials: "include" }).then(r => r.json()),
  });

  const invalidateServices = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/services", override] });
    queryClient.invalidateQueries({ queryKey: ["/api/c", slug, "services"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/profile", override] });
    queryClient.invalidateQueries({ queryKey: ["/api/consultants"] });
    queryClient.invalidateQueries({ queryKey: ["/api/consultants", slug] });
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/dashboard/services${sp}`, data),
    onSuccess: () => { invalidateServices(); resetForm(); toast({ title: "Service added" }); },
    onError: () => toast({ title: "Error", description: "Failed to add service", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest("PATCH", `/api/dashboard/services/${id}${sp}`, data),
    onSuccess: () => { invalidateServices(); resetForm(); toast({ title: "Service updated" }); },
    onError: () => toast({ title: "Error", description: "Failed to update service", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/dashboard/services/${id}${sp}`),
    onSuccess: () => { invalidateServices(); toast({ title: "Service deleted" }); },
    onError: () => toast({ title: "Error", description: "Failed to delete service", variant: "destructive" }),
  });

  const resetForm = () => {
    setTitle(""); setDescription(""); setIcon("Briefcase");
    setDisplayOrder("0"); setIsActive(true); setServiceAlignments([]); setEditingId(null); setShowForm(false);
  };

  const startEdit = (s: ConsultantService) => {
    setEditingId(s.id);
    setTitle(s.title);
    setDescription(s.description ?? "");
    setIcon(s.icon ?? "Briefcase");
    setDisplayOrder(String(s.displayOrder ?? 0));
    setIsActive(s.isActive ?? true);
    setServiceAlignments(s.ecosystemAlignments ?? []);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    const data = {
      title: title.trim(),
      description: description.trim(),
      icon,
      displayOrder: parseInt(displayOrder) || 0,
      isActive,
      ecosystemAlignments: serviceAlignments,
    };
    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <SectionBanner
        icon={Wrench}
        iconBg="bg-green-500/10"
        iconColor="text-green-400"
        borderColor="border-green-500"
        section="Services & Expertise"
        description="Configure your service description, specialties, and individual service offerings. Ecosystem alignment is derived automatically from your service tags."
        slug={slug}
        anchor="services"
      />

      {/* Service Description */}
      <Card className="bg-black/60 border-green-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-400 text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Service Description
          </CardTitle>
          <p className="text-gray-500 text-xs">
            Appears as the intro paragraph at the top of your public Services section.
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={expertiseStatement}
            onChange={e => setExpertiseStatement(e.target.value)}
            placeholder="e.g. I specialise in building DeFi liquidity solutions on the XRP Ledger, with hands-on experience deploying AMM pools, cross-border payment corridors, and tokenised real-world asset frameworks."
            className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600 min-h-[100px] resize-none"
            data-testid="textarea-expertise-statement"
          />
          <p className="text-gray-600 text-xs mt-2 font-mono">{expertiseStatement.length} characters</p>
        </CardContent>
      </Card>

      {/* Core Expertise */}
      <Card className="bg-black/60 border-green-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-400 text-base flex items-center gap-2">
            <Star className="w-4 h-4" />
            Core Expertise
          </CardTitle>
          <p className="text-gray-500 text-xs">
            Select skills to determine the fallback service category cards shown on your profile when no custom service entries have been added.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2" data-testid="specialty-selector">
            {EXPERTISE_OPTIONS.map(opt => {
              const selected = specialties.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleSpecialty(opt)}
                  data-testid={`chip-specialty-${opt.replace(/\s+/g, "-").toLowerCase()}`}
                  className={`px-3 py-1.5 rounded-full text-sm font-mono transition-all duration-150 border ${
                    selected
                      ? "bg-green-500/20 border-green-400 text-green-300 shadow-[0_0_8px_rgba(0,255,100,0.2)]"
                      : "bg-black/40 border-green-500/20 text-gray-400 hover:border-green-500/50 hover:text-gray-300"
                  }`}
                >
                  {selected && <span className="mr-1">✓</span>}{opt}
                </button>
              );
            })}
          </div>
          {specialties.length > 0 && (
            <p className="text-green-500/60 text-xs font-mono mt-3">{specialties.length} selected</p>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={() => profileMutation.mutate()}
        disabled={profileMutation.isPending}
        className="bg-green-600 hover:bg-green-700 text-white font-mono"
        data-testid="button-save-expertise"
      >
        {profileMutation.isPending ? "Saving…" : "Save"}
      </Button>

      <div className="border-t border-green-500/10 pt-2">
        <h3 className="text-white font-display font-bold text-base mb-1">Service Offerings</h3>
        <p className="text-gray-500 text-xs mb-4">
          Named services shown as cards on your public profile. When set, these replace the auto-generated category cards.
        </p>

        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
            data-testid="button-add-service"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </Button>
        )}

        {showForm && (
          <Card className="border-green-500/20 bg-black/60 mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base font-display">
                {editingId !== null ? "Edit Service" : "New Service"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <FieldLabel required>Title</FieldLabel>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. XRPL Integration"
                  className="bg-black/60 border-green-500/20 text-white"
                  data-testid="input-service-title"
                />
              </div>

              <div>
                <FieldLabel>Description</FieldLabel>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description of this service offering..."
                  rows={3}
                  className="bg-black/60 border-green-500/20 text-white resize-none"
                  data-testid="input-service-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Icon</FieldLabel>
                  <Select value={icon} onValueChange={setIcon}>
                    <SelectTrigger
                      className="bg-black/60 border-green-500/20 text-white"
                      data-testid="select-service-icon"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-green-500/20">
                      {ICON_NAMES.map(name => {
                        const IconComp = ICON_MAP[name];
                        return (
                          <SelectItem key={name} value={name} className="text-white hover:bg-green-500/10">
                            <span className="flex items-center gap-2">
                              {IconComp && <IconComp className="w-4 h-4" />}
                              {name}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <FieldLabel>Display Order</FieldLabel>
                  <Input
                    type="number"
                    value={displayOrder}
                    onChange={e => setDisplayOrder(e.target.value)}
                    className="bg-black/60 border-green-500/20 text-white"
                    data-testid="input-service-order"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  data-testid="toggle-service-active"
                />
                <span className="text-sm text-gray-400">Active (visible on profile)</span>
              </div>

              <div>
                <FieldLabel>Ecosystem Tags</FieldLabel>
                <p className="text-gray-600 text-xs mb-2">Tag this service with the XRPL ecosystem areas it addresses.</p>
                <div className="flex flex-wrap gap-2" data-testid="service-alignment-selector">
                  {ECOSYSTEM_CATEGORIES.map(cat => {
                    const selected = serviceAlignments.includes(cat);
                    const styles = selected ? ALIGNMENT_PILL.selected : ALIGNMENT_PILL.unselected;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setServiceAlignments(prev =>
                          prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                        )}
                        data-testid={`chip-service-alignment-${cat.replace(/[\s/()]+/g, "-").toLowerCase()}`}
                        className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all duration-150 border ${styles.bg} ${styles.border} ${styles.text}`}
                      >
                        {selected && <span className="mr-1">✓</span>}{cat}
                      </button>
                    );
                  })}
                </div>
                {serviceAlignments.length > 0 && (
                  <p className="text-purple-400/60 text-xs font-mono mt-2">{serviceAlignments.length} tag{serviceAlignments.length !== 1 ? "s" : ""} selected</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-save-service"
                >
                  {isPending ? "Saving..." : editingId !== null ? "Update Service" : "Add Service"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={resetForm}
                  className="text-gray-400 hover:text-white"
                  data-testid="button-cancel-service"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-4 space-y-3">
          {isLoading ? (
            <>
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 rounded-xl bg-green-900/20 animate-pulse" />
              ))}
            </>
          ) : servicesList.length === 0 ? (
            <div className="text-center py-10 rounded-xl border border-green-500/10 bg-black/40">
              <p className="text-gray-500 text-sm font-mono">No services yet. Add one above to get started.</p>
            </div>
          ) : (
            servicesList.map(s => {
              const IconComp = ICON_MAP[s.icon ?? "Briefcase"] ?? ICON_MAP["Briefcase"];
              return (
                <div
                  key={s.id}
                  className="flex items-start gap-4 rounded-xl border border-green-500/10 bg-black/40 hover:border-green-500/20 transition-colors p-4"
                  data-testid={`row-service-${s.id}`}
                >
                  <div className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                    <IconComp className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-sm">{s.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                        s.isActive
                          ? "bg-green-500/10 border-green-500/30 text-green-400"
                          : "bg-gray-700/30 border-gray-600/30 text-gray-500"
                      }`}>
                        {s.isActive ? "Active" : "Hidden"}
                      </span>
                      <span className="text-gray-600 text-[10px] font-mono">order: {s.displayOrder}</span>
                    </div>
                    {s.description && (
                      <p className="text-gray-500 text-xs mt-0.5 truncate">{s.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(s)}
                      className="text-gray-400 hover:text-green-400 h-8 w-8 p-0"
                      data-testid={`button-edit-service-${s.id}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(s.id)}
                      disabled={deleteMutation.isPending}
                      className="text-gray-400 hover:text-red-400 h-8 w-8 p-0"
                      data-testid={`button-delete-service-${s.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
