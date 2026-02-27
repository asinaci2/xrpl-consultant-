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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Trash2, Plus, ArrowLeft, User, Briefcase, BookOpen, Phone,
  Image, MessageCircle, ExternalLink, LogOut, Edit2, X, Eye, EyeOff
} from "lucide-react";

const EXPERTISE_OPTIONS = [
  "XRPL", "TextRP", "Web3", "Blockchain", "NFT Strategy", "Community Growth",
  "DeFi", "Smart Contracts", "Tokenomics", "Marketing", "Social Media",
  "Content Creation", "Trading", "Technical Analysis", "Wallet Integration",
  "DAO Governance", "Crypto Education", "Ambassador", "Event Hosting",
];

type ConsultantProfile = {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  bio: string;
  avatarUrl: string | null;
  specialties: string[];
  twitterUsername: string | null;
  email: string;
  phone: string;
  location: string;
  locationLine2: string;
  contactHeadline: string;
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
  isActive: boolean | null;
  consultantSlug: string | null;
};

type Story = {
  id: number;
  content: string;
  imageUrl: string | null;
  authorName: string;
  createdAt: string;
  expiresAt: string;
};

type ContactInfoData = {
  headline: string;
  subheading: string;
  email: string;
  phone: string;
  location: string;
  locationLine2: string;
};

type CachedMedia = {
  id: number;
  source: string;
  sourceUrl: string | null;
  imageUrl: string | null;
  section: string;
  altText: string | null;
  displayOrder: number;
  isActive: boolean | null;
};

type ChatProfileData = {
  displayName: string;
  title: string;
  avatarUrl: string | null;
  statusMessage: string;
  isAvailable: boolean;
};

// ── Profile Tab ────────────────────────────────────────────────────────────────
function ProfileTab({ slug }: { slug: string }) {
  const { toast } = useToast();
  const { data: profile, isLoading } = useQuery<ConsultantProfile>({
    queryKey: ["/api/dashboard/profile"],
  });

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [contactHeadline, setContactHeadline] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [locationLine2, setLocationLine2] = useState("");
  const [twitterUsername, setTwitterUsername] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setTagline(profile.tagline);
      setBio(profile.bio);
      setAvatarUrl(profile.avatarUrl ?? "");
      setSpecialties(profile.specialties ?? []);
      setContactHeadline(profile.contactHeadline);
      setEmail(profile.email);
      setPhone(profile.phone);
      setLocation(profile.location);
      setLocationLine2(profile.locationLine2);
      setTwitterUsername(profile.twitterUsername ?? "");
    }
  }, [profile]);

  const toggleExpertise = (opt: string) => {
    setSpecialties(prev =>
      prev.includes(opt) ? prev.filter(s => s !== opt) : [...prev, opt]
    );
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", "/api/dashboard/profile", {
        name, tagline, bio,
        avatarUrl: avatarUrl || null,
        specialties,
        contactHeadline,
        email, phone, location, locationLine2,
        twitterUsername: twitterUsername || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/consultants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/consultants", slug] });
      toast({ title: "Profile saved", description: "Your public page has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save profile.", variant: "destructive" });
    },
  });

  if (isLoading) return <p className="text-gray-400 p-4">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-black/60 border-green-500/20">
            <CardHeader>
              <CardTitle className="text-green-400 text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Display Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-profile-name" />
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Tagline</label>
                <Input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="XRPL Ledger Consultant & TextRP Ambassador" className="bg-black/40 border-green-500/20 text-white" data-testid="input-profile-tagline" />
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Bio</label>
                <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={5} placeholder="Tell visitors about yourself..." className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600" data-testid="input-profile-bio" />
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Twitter / X Username <span className="text-gray-500 text-xs">(without @)</span></label>
                <Input value={twitterUsername} onChange={e => setTwitterUsername(e.target.value)} placeholder="YourHandle" className="bg-black/40 border-green-500/20 text-white" data-testid="input-profile-twitter" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/60 border-green-500/20">
            <CardHeader>
              <CardTitle className="text-green-400 text-lg flex items-center gap-2">
                <Image className="w-5 h-5" />
                Avatar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full border-2 border-green-500/40 flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #0a1a0a 0%, #0d2010 100%)" }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-green-400/50" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="text-gray-300 text-sm font-medium block mb-1">Avatar URL</label>
                  <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://example.com/your-photo.jpg" className="bg-black/40 border-green-500/20 text-white" data-testid="input-profile-avatar" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/60 border-green-500/20">
            <CardHeader>
              <CardTitle className="text-green-400 text-lg">Expertise</CardTitle>
              <p className="text-gray-500 text-sm">Select the areas you specialize in. These appear as skill badges on your profile and directory card.</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2" data-testid="expertise-selector">
                {EXPERTISE_OPTIONS.map(opt => {
                  const selected = specialties.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleExpertise(opt)}
                      data-testid={`expertise-${opt.replace(/\s+/g, "-").toLowerCase()}`}
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
                <p className="text-green-500/60 text-xs font-mono mt-3">{specialties.length} selected: {specialties.join(", ")}</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-black/60 border-green-500/20">
            <CardHeader>
              <CardTitle className="text-green-400 text-lg flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Contact Section Headline</label>
                <Input value={contactHeadline} onChange={e => setContactHeadline(e.target.value)} placeholder="Ready to Get Started?" className="bg-black/40 border-green-500/20 text-white" data-testid="input-profile-contact-headline" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 text-sm font-medium block mb-1">Email</label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-profile-email" />
                </div>
                <div>
                  <label className="text-gray-300 text-sm font-medium block mb-1">Phone</label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-profile-phone" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 text-sm font-medium block mb-1">Location</label>
                  <Input value={location} onChange={e => setLocation(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-profile-location" />
                </div>
                <div>
                  <label className="text-gray-300 text-sm font-medium block mb-1">Location Line 2</label>
                  <Input value={locationLine2} onChange={e => setLocationLine2(e.target.value)} placeholder="Available Worldwide Remote" className="bg-black/40 border-green-500/20 text-white" data-testid="input-profile-location2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar preview */}
        <div className="space-y-4">
          <h3 className="text-gray-300 text-sm font-medium">Directory Card Preview</h3>
          <div
            className="rounded-lg border border-green-500/20 overflow-hidden p-4"
            style={{ background: "linear-gradient(180deg, #0a0a0a 0%, #0d1f0d 100%)" }}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div
                className="w-20 h-20 rounded-full border-2 border-green-400/30 flex items-center justify-center overflow-hidden"
                style={{ boxShadow: "0 0 15px rgba(0,255,100,0.15)" }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-green-400/40" />
                )}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{name || "Your Name"}</p>
                <p className="text-green-400/60 text-xs mt-0.5 line-clamp-2">{tagline || "Your tagline"}</p>
              </div>
              {specialties.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center">
                  {specialties.slice(0, 4).map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs">{s}</span>
                  ))}
                  {specialties.length > 4 && (
                    <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs">+{specialties.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          </div>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            data-testid="button-save-profile"
          >
            {saveMutation.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Projects Tab ───────────────────────────────────────────────────────────────
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
    queryKey: ["/api/dashboard/projects"],
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/projects"] });
  };

  const createMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/dashboard/projects", data),
    onSuccess: () => { invalidate(); resetForm(); toast({ title: "Project added" }); },
    onError: () => toast({ title: "Error", description: "Failed to add project", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) => apiRequest("PATCH", `/api/dashboard/projects/${id}`, data),
    onSuccess: () => { invalidate(); resetForm(); toast({ title: "Project updated" }); },
    onError: () => toast({ title: "Error", description: "Failed to update project", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/dashboard/projects/${id}`),
    onSuccess: () => { invalidate(); toast({ title: "Project deleted" }); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest("PATCH", `/api/dashboard/projects/${id}`, { isActive }),
    onSuccess: () => invalidate(),
  });

  const resetForm = () => {
    setTitle(""); setSubtitle(""); setDescription(""); setImpact(""); setLink("");
    setIcon("Briefcase"); setColor("bg-green-500"); setTagsInput(""); setDisplayOrder("0"); setEditingId(null);
  };

  const loadForEdit = (p: ProjectEntry) => {
    setTitle(p.title); setSubtitle(p.subtitle); setDescription(p.description); setImpact(p.impact);
    setLink(p.link || ""); setIcon(p.icon); setColor(p.color); setTagsInput(p.tags.join(", "));
    setDisplayOrder(String(p.displayOrder)); setEditingId(p.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    const data = { title, subtitle, description, impact, link: link || null, icon, color, tags, displayOrder: parseInt(displayOrder) || 0 };
    if (editingId) updateMutation.mutate({ id: editingId, data });
    else createMutation.mutate(data);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <Card className="bg-black/60 border-green-500/20">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-green-400 text-lg">{editingId ? "Edit Project" : "Add Project"}</CardTitle>
          {editingId && (
            <Button variant="ghost" size="sm" onClick={resetForm} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Title *</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} required className="bg-black/40 border-green-500/20 text-white" data-testid="input-project-title" />
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Subtitle</label>
                <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-project-subtitle" />
              </div>
            </div>
            <div>
              <label className="text-gray-300 text-sm font-medium block mb-1">Description</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="bg-black/40 border-green-500/20 text-white" data-testid="input-project-description" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Impact / Stats</label>
                <Input value={impact} onChange={e => setImpact(e.target.value)} placeholder="e.g. 500+ members" className="bg-black/40 border-green-500/20 text-white" data-testid="input-project-impact" />
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Link (optional)</label>
                <Input type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." className="bg-black/40 border-green-500/20 text-white" data-testid="input-project-link" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Icon</label>
                <Select value={icon} onValueChange={setIcon}>
                  <SelectTrigger className="bg-black/40 border-green-500/20 text-white" data-testid="select-project-icon">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-green-500/20">
                    {["Briefcase","MessageSquare","Heart","Radio","Gamepad2","Globe","Star","Zap","Shield","Code","Users","Rocket","Award","Target"].map(i => (
                      <SelectItem key={i} value={i} className="text-white hover:bg-green-500/10">{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Color</label>
                <Select value={color} onValueChange={setColor}>
                  <SelectTrigger className="bg-black/40 border-green-500/20 text-white" data-testid="select-project-color">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-green-500/20">
                    {["bg-green-500","bg-blue-500","bg-purple-500","bg-yellow-500","bg-red-500","bg-cyan-500","bg-orange-500"].map(c => (
                      <SelectItem key={c} value={c} className="text-white hover:bg-green-500/10">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Display Order</label>
                <Input type="number" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-project-order" />
              </div>
            </div>
            <div>
              <label className="text-gray-300 text-sm font-medium block mb-1">Tags <span className="text-gray-500 text-xs">(comma-separated)</span></label>
              <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="XRPL, Web3, NFT" className="bg-black/40 border-green-500/20 text-white" data-testid="input-project-tags" />
            </div>
            <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white" data-testid="button-submit-project">
              <Plus className="w-4 h-4 mr-2" />
              {isPending ? "Saving..." : editingId ? "Update Project" : "Add Project"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-black/60 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-400 text-lg">My Projects ({projectsList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-gray-400">Loading...</p> : projectsList.length === 0 ? (
            <p className="text-gray-500 text-sm">No projects yet. Add your first one above.</p>
          ) : (
            <div className="space-y-3">
              {projectsList.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-black/40 border border-green-500/10" data-testid={`row-project-${p.id}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{p.title}</p>
                    <p className="text-gray-500 text-xs truncate">{p.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={!!p.isActive} onCheckedChange={v => toggleMutation.mutate({ id: p.id, isActive: v })} data-testid={`switch-project-${p.id}`} />
                    <Button variant="ghost" size="icon" onClick={() => loadForEdit(p)} className="text-green-400/70 hover:text-green-400 h-8 w-8" data-testid={`button-edit-project-${p.id}`}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(p.id)} className="text-red-400/70 hover:text-red-400 h-8 w-8" data-testid={`button-delete-project-${p.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
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

// ── Stories Tab ────────────────────────────────────────────────────────────────
function StoriesTab({ authorName }: { authorName: string }) {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [storyAuthor, setStoryAuthor] = useState(authorName);

  useEffect(() => { setStoryAuthor(authorName); }, [authorName]);

  const { data: stories = [], isLoading } = useQuery<Story[]>({
    queryKey: ["/api/dashboard/stories"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { content: string; authorName: string; imageUrl?: string }) => {
      const formData = new FormData();
      formData.append("content", data.content);
      formData.append("authorName", data.authorName);
      if (data.imageUrl) formData.append("imageUrl", data.imageUrl);
      const res = await fetch("/api/dashboard/stories", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to create story");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stories"] });
      setContent(""); setImageUrl("");
      toast({ title: "Story created" });
    },
    onError: () => toast({ title: "Failed to create story", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/dashboard/stories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stories"] });
      toast({ title: "Story deleted" });
    },
  });

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <div className="space-y-6">
      <Card className="bg-black/60 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-400 text-lg">Create Story</CardTitle>
          <p className="text-gray-500 text-sm">Stories are visible on your profile for 24 hours.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={e => { e.preventDefault(); if (!content) return; createMutation.mutate({ content, authorName: storyAuthor, imageUrl: imageUrl || undefined }); }} className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm font-medium block mb-1">Content *</label>
              <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="What's on your mind?" rows={3} className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600" data-testid="input-story-content" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Author Name</label>
                <Input value={storyAuthor} onChange={e => setStoryAuthor(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-story-author" />
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Image URL <span className="text-gray-500 text-xs">(optional)</span></label>
                <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600" data-testid="input-story-image" />
              </div>
            </div>
            <Button type="submit" disabled={!content || createMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white" data-testid="button-create-story">
              <Plus className="w-4 h-4 mr-2" />
              {createMutation.isPending ? "Posting..." : "Post Story"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-black/60 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-400 text-lg">My Stories ({stories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-gray-400">Loading...</p> : stories.length === 0 ? (
            <p className="text-gray-500 text-sm">No stories yet.</p>
          ) : (
            <div className="space-y-3">
              {stories.map(s => (
                <div key={s.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-black/40 border border-green-500/10" data-testid={`row-story-${s.id}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm line-clamp-2">{s.content}</p>
                    <p className={`text-xs mt-1 font-mono ${isExpired(s.expiresAt) ? "text-red-400/60" : "text-green-400/50"}`}>
                      {isExpired(s.expiresAt) ? "Expired" : `Expires ${new Date(s.expiresAt).toLocaleString()}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(s.id)} className="text-red-400/70 hover:text-red-400 h-8 w-8 shrink-0" data-testid={`button-delete-story-${s.id}`}>
                    <Trash2 className="w-3.5 h-3.5" />
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

// ── Contact Tab ────────────────────────────────────────────────────────────────
function ContactTab() {
  const { toast } = useToast();
  const { data: info, isLoading } = useQuery<ContactInfoData>({ queryKey: ["/api/dashboard/contact-info"] });

  const [headline, setHeadline] = useState("");
  const [subheading, setSubheading] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [locationLine2, setLocationLine2] = useState("");

  useEffect(() => {
    if (info) {
      setHeadline(info.headline); setSubheading(info.subheading);
      setEmail(info.email); setPhone(info.phone);
      setLocation(info.location); setLocationLine2(info.locationLine2);
    }
  }, [info]);

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/dashboard/contact-info", { headline, subheading, email, phone, location, locationLine2 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/contact-info"] });
      toast({ title: "Saved", description: "Contact section updated." });
    },
    onError: () => toast({ title: "Error", description: "Failed to save.", variant: "destructive" }),
  });

  return (
    <Card className="bg-black/60 border-green-500/20">
      <CardHeader>
        <CardTitle className="text-green-400 text-lg flex items-center gap-2">
          <Phone className="w-5 h-5" />
          Contact Section
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-gray-400">Loading...</p> : (
          <div className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm font-medium block mb-1">Headline</label>
              <Input value={headline} onChange={e => setHeadline(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-contact-headline" />
            </div>
            <div>
              <label className="text-gray-300 text-sm font-medium block mb-1">Description</label>
              <Textarea value={subheading} onChange={e => setSubheading(e.target.value)} rows={3} className="bg-black/40 border-green-500/20 text-white" data-testid="input-contact-subheading" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Email</label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-contact-email" />
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Phone</label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-contact-phone" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Location</label>
                <Input value={location} onChange={e => setLocation(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-contact-location" />
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Location Line 2</label>
                <Input value={locationLine2} onChange={e => setLocationLine2(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-contact-location2" />
              </div>
            </div>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white" data-testid="button-save-contact">
              {saveMutation.isPending ? "Saving..." : "Save Contact Section"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Media Tab ──────────────────────────────────────────────────────────────────
function MediaTab() {
  const { toast } = useToast();
  const [source, setSource] = useState("manual");
  const [sourceUrl, setSourceUrl] = useState("");
  const [section, setSection] = useState("hero");
  const [altText, setAltText] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");

  const { data: media = [], isLoading } = useQuery<CachedMedia[]>({ queryKey: ["/api/dashboard/media"] });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/dashboard/media"] });

  const createMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/dashboard/media", data),
    onSuccess: () => { invalidate(); setSourceUrl(""); setAltText(""); setDisplayOrder("0"); toast({ title: "Media added" }); },
    onError: () => toast({ title: "Error", description: "Failed to add media", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/dashboard/media/${id}`),
    onSuccess: () => { invalidate(); toast({ title: "Media deleted" }); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => apiRequest("PATCH", `/api/dashboard/media/${id}`, { isActive }),
    onSuccess: () => invalidate(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl) return;
    createMutation.mutate({ source, sourceUrl, section, altText: altText || null, displayOrder: parseInt(displayOrder) || 0 });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-black/60 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-400 text-lg">Add Media</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Source Type</label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger className="bg-black/40 border-green-500/20 text-white" data-testid="select-media-source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-green-500/20">
                    <SelectItem value="manual" className="text-white hover:bg-green-500/10">Manual URL</SelectItem>
                    <SelectItem value="instagram" className="text-white hover:bg-green-500/10">Instagram</SelectItem>
                    <SelectItem value="tiktok" className="text-white hover:bg-green-500/10">TikTok</SelectItem>
                    <SelectItem value="gdrive" className="text-white hover:bg-green-500/10">Google Drive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Section</label>
                <Select value={section} onValueChange={setSection}>
                  <SelectTrigger className="bg-black/40 border-green-500/20 text-white" data-testid="select-media-section">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-green-500/20">
                    <SelectItem value="hero" className="text-white hover:bg-green-500/10">Hero</SelectItem>
                    <SelectItem value="about" className="text-white hover:bg-green-500/10">About</SelectItem>
                    <SelectItem value="gallery" className="text-white hover:bg-green-500/10">Gallery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-gray-300 text-sm font-medium block mb-1">URL *</label>
              <Input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://..." className="bg-black/40 border-green-500/20 text-white" required data-testid="input-media-url" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Alt Text</label>
                <Input value={altText} onChange={e => setAltText(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-media-alt" />
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Display Order</label>
                <Input type="number" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-media-order" />
              </div>
            </div>
            <Button type="submit" disabled={createMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white" data-testid="button-add-media">
              <Plus className="w-4 h-4 mr-2" />
              {createMutation.isPending ? "Adding..." : "Add Media"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-black/60 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-400 text-lg">My Media ({media.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-gray-400">Loading...</p> : media.length === 0 ? (
            <p className="text-gray-500 text-sm">No media yet.</p>
          ) : (
            <div className="space-y-3">
              {media.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-green-500/10" data-testid={`row-media-${m.id}`}>
                  {m.imageUrl && (
                    <img src={m.imageUrl} alt={m.altText || ""} className="w-12 h-12 object-cover rounded border border-green-500/20 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300 text-sm truncate">{m.sourceUrl || m.imageUrl}</p>
                    <p className="text-gray-500 text-xs">{m.section} · {m.source}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={!!m.isActive} onCheckedChange={v => toggleMutation.mutate({ id: m.id, isActive: v })} data-testid={`switch-media-${m.id}`} />
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(m.id)} className="text-red-400/70 hover:text-red-400 h-8 w-8" data-testid={`button-delete-media-${m.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
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

// ── Chat Profile Tab ───────────────────────────────────────────────────────────
function ChatProfileTab() {
  const { toast } = useToast();
  const { data: config, isLoading } = useQuery<ChatProfileData>({ queryKey: ["/api/dashboard/chat-profile"] });

  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    if (config) {
      setDisplayName(config.displayName); setTitle(config.title);
      setAvatarUrl(config.avatarUrl ?? ""); setStatusMessage(config.statusMessage);
      setIsAvailable(config.isAvailable);
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/dashboard/chat-profile", {
      displayName, title, avatarUrl: avatarUrl || null, statusMessage, isAvailable,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/chat-profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/host-config"] });
      toast({ title: "Saved", description: "Chat profile updated." });
    },
    onError: () => toast({ title: "Error", description: "Failed to save.", variant: "destructive" }),
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
          {isLoading ? <p className="text-gray-400">Loading...</p> : (
            <div className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Display Name</label>
                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-chat-display-name" />
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Title / Role</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="XRPL Consultant" className="bg-black/40 border-green-500/20 text-white" data-testid="input-chat-title" />
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Avatar URL <span className="text-gray-500 text-xs">(optional)</span></label>
                <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." className="bg-black/40 border-green-500/20 text-white" data-testid="input-chat-avatar-url" />
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Status Message</label>
                <Input value={statusMessage} onChange={e => setStatusMessage(e.target.value)} placeholder="Usually replies within a few hours" className="bg-black/40 border-green-500/20 text-white" data-testid="input-chat-status-message" />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-gray-300 text-sm font-medium">Available</p>
                  <p className="text-gray-500 text-xs mt-0.5">Green dot when on, grey when off</p>
                </div>
                <Switch checked={isAvailable} onCheckedChange={setIsAvailable} data-testid="switch-chat-available" />
              </div>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full bg-green-600 hover:bg-green-700 text-white" data-testid="button-save-chat-profile">
                {saveMutation.isPending ? "Saving..." : "Save Chat Profile"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-gray-300 text-sm font-medium">Preview</h3>
        <div className="rounded-lg border border-green-500/30 overflow-hidden max-w-xs" style={{ background: "linear-gradient(180deg, #0a0a0a 0%, #0d1f0d 100%)" }}>
          <div className="p-3 flex items-center gap-3 border-b border-green-500/30" style={{ background: "linear-gradient(90deg, #0a1a0a 0%, #0d2010 100%)" }}>
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover border border-green-500/30" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-400" />
                </div>
              )}
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black ${isAvailable ? "bg-green-400" : "bg-gray-500"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-green-400 font-mono font-semibold text-sm truncate" style={{ textShadow: "0 0 10px rgba(0,255,100,0.4)" }}>
                {displayName || "Display Name"}
              </p>
              <p className="text-green-500/60 text-xs truncate">{title || "Title / Role"}</p>
            </div>
          </div>
          <div className="px-3 py-2">
            <p className="text-green-400/50 font-mono text-xs">{">"} {statusMessage || "Status message..."}_</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard Page ────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, logout, consultantSlug } = useAuth();
  const slug = consultantSlug ?? "";

  const { data: profile } = useQuery<ConsultantProfile>({
    queryKey: ["/api/dashboard/profile"],
    enabled: !!slug,
  });

  const handleLogout = () => logout.mutate();

  return (
    <div className="min-h-screen bg-black text-white relative">
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(34,197,94,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.1) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <a className="text-green-400/60 hover:text-green-400 transition-colors" data-testid="link-back-directory">
                <ArrowLeft className="w-5 h-5" />
              </a>
            </Link>
            <div>
              <h1 className="text-2xl font-display font-bold text-white" data-testid="text-dashboard-title">
                My Dashboard
              </h1>
              <p className="text-green-400/60 text-sm font-mono">{profile?.name || user?.displayName || slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {slug && (
              <Link href={`/c/${slug}`}>
                <a
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-500/30 text-green-400 text-sm hover:bg-green-500/10 transition-colors font-mono"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-view-page"
                >
                  <ExternalLink className="w-4 h-4" />
                  View My Page
                </a>
              </Link>
            )}
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

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-black/60 border border-green-500/20 p-1 flex-wrap h-auto gap-1">
            <TabsTrigger value="profile" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-400" data-testid="tab-profile">
              <User className="w-4 h-4 mr-2" />Profile
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-400" data-testid="tab-projects">
              <Briefcase className="w-4 h-4 mr-2" />Projects
            </TabsTrigger>
            <TabsTrigger value="stories" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-400" data-testid="tab-stories">
              <BookOpen className="w-4 h-4 mr-2" />Stories
            </TabsTrigger>
            <TabsTrigger value="contact" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-400" data-testid="tab-contact">
              <Phone className="w-4 h-4 mr-2" />Contact
            </TabsTrigger>
            <TabsTrigger value="media" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-400" data-testid="tab-media">
              <Image className="w-4 h-4 mr-2" />Media
            </TabsTrigger>
            <TabsTrigger value="chat-profile" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-400" data-testid="tab-chat-profile">
              <MessageCircle className="w-4 h-4 mr-2" />Chat Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab slug={slug} />
          </TabsContent>
          <TabsContent value="projects">
            <ProjectsTab />
          </TabsContent>
          <TabsContent value="stories">
            <StoriesTab authorName={profile?.name || user?.displayName || ""} />
          </TabsContent>
          <TabsContent value="contact">
            <ContactTab />
          </TabsContent>
          <TabsContent value="media">
            <MediaTab />
          </TabsContent>
          <TabsContent value="chat-profile">
            <ChatProfileTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
