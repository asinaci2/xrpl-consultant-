import { useState, useEffect, createContext, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link, useSearch, useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Trash2, Plus, ArrowLeft, User, Briefcase, BookOpen, Phone,
  MessageCircle, ExternalLink, LogOut, Edit2, X, Eye,
  UserCircle, Sparkles, FileText, AtSign, Camera, Megaphone,
  Mail, MapPin, Globe, Clock, Layout, TrendingUp,
  MessageSquare, Heart, Radio, Gamepad2, Star, Zap,
  Shield, Code, Users, Rocket, Award, Target, Link2, AlertCircle, CheckCircle2, Hash,
  CalendarDays, Quote,
  type LucideIcon,
} from "lucide-react";
import { SiInstagram, SiTiktok, SiX, SiSnapchat } from "react-icons/si";

// Admin override slug context — lets all tab components know when an admin
// is managing a different consultant's data via ?slug= URL param
const AdminSlugContext = createContext<string | null>(null);
function useAdminSlug() { return useContext(AdminSlugContext); }
// Returns the URL suffix to append to dashboard API calls when admin overrides slug
function useSlugParam(): string {
  const override = useAdminSlug();
  return override ? `?slug=${override}` : "";
}

const EXPERTISE_OPTIONS = [
  "XRPL", "TextRP", "Web3", "Blockchain", "NFT Strategy", "Community Growth",
  "DeFi", "Smart Contracts", "Tokenomics", "Marketing", "Social Media",
  "Content Creation", "Trading", "Technical Analysis", "Wallet Integration",
  "DAO Governance", "Crypto Education", "Ambassador", "Event Hosting",
];

const ICON_MAP: Record<string, LucideIcon> = {
  MessageSquare, Heart, Radio, Gamepad2, Briefcase,
  Globe, Star, Zap, Shield, Code, Users, Rocket, Award, Target,
};

const ICON_NAMES = ["Briefcase","MessageSquare","Heart","Radio","Gamepad2","Globe","Star","Zap","Shield","Code","Users","Rocket","Award","Target"];

const COLOR_MAP: Record<string, string> = {
  "bg-green-500": "#22c55e",
  "bg-blue-500": "#3b82f6",
  "bg-purple-500": "#a855f7",
  "bg-yellow-500": "#eab308",
  "bg-red-500": "#ef4444",
  "bg-cyan-500": "#06b6d4",
  "bg-orange-500": "#f97316",
};

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
  profileRoomId: string | null;
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

// ── Section Banner ─────────────────────────────────────────────────────────────
function SectionBanner({
  icon: Icon,
  iconBg,
  iconColor,
  borderColor,
  section,
  description,
  slug,
  anchor,
}: {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  section: string;
  description: string;
  slug: string;
  anchor?: string;
}) {
  const href = `/c/${slug}${anchor ? `#${anchor}` : ""}`;
  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border-l-4 ${borderColor} bg-black/50`}
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderRight: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className={`${iconBg} rounded-lg p-2.5 shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold">{section}</p>
        <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{description}</p>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors whitespace-nowrap"
      >
        <Eye className="w-3.5 h-3.5" />
        View on page
      </a>
    </div>
  );
}

// ── Icon Label ─────────────────────────────────────────────────────────────────
function FieldLabel({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <label className="text-gray-300 text-sm font-medium flex items-center gap-1.5 mb-1">
      <Icon className="w-3.5 h-3.5 text-green-400/50" />
      {children}
    </label>
  );
}

// ── Profile Tab ────────────────────────────────────────────────────────────────
function ProfileTab({ slug }: { slug: string }) {
  const { toast } = useToast();
  const sp = useSlugParam();
  const override = useAdminSlug();
  const { data: profile, isLoading } = useQuery<ConsultantProfile>({
    queryKey: ["/api/dashboard/profile", override],
    queryFn: () => fetch(`/api/dashboard/profile${sp}`, { credentials: "include" }).then(r => r.json()),
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
  const [calendarUrl, setCalendarUrl] = useState("");

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
      setCalendarUrl((profile as any).calendarUrl ?? "");
    }
  }, [profile]);

  const toggleExpertise = (opt: string) => {
    setSpecialties(prev =>
      prev.includes(opt) ? prev.filter(s => s !== opt) : [...prev, opt]
    );
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", `/api/dashboard/profile${sp}`, {
        name, tagline, bio,
        avatarUrl: avatarUrl || null,
        specialties,
        contactHeadline,
        email, phone, location, locationLine2,
        twitterUsername: twitterUsername || null,
        calendarUrl: calendarUrl || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/profile", override] });
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
    <div className="space-y-5">
      <SectionBanner
        icon={UserCircle}
        iconBg="bg-green-500/15"
        iconColor="text-green-400"
        borderColor="border-green-500"
        section="Hero & About Sections"
        description="Your name, photo, bio and expertise badges — the very top of your public profile page, the first thing visitors see."
        slug={slug}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Basic info */}
          <Card className="bg-black/60 border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-400 text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Basic Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <FieldLabel icon={User}>Display Name</FieldLabel>
                <Input value={name} onChange={e => setName(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-profile-name" />
              </div>
              <div>
                <FieldLabel icon={Sparkles}>Tagline</FieldLabel>
                <Input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="XRPL Ledger Consultant & TextRP Ambassador" className="bg-black/40 border-green-500/20 text-white" data-testid="input-profile-tagline" />
              </div>
              <div>
                <FieldLabel icon={FileText}>Bio</FieldLabel>
                <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={5} placeholder="Tell visitors about yourself..." className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600" data-testid="input-profile-bio" />
              </div>
              <div>
                <FieldLabel icon={AtSign}>Twitter / X Username <span className="text-gray-500 text-xs ml-1">(without @)</span></FieldLabel>
                <Input value={twitterUsername} onChange={e => setTwitterUsername(e.target.value)} placeholder="YourHandle" className="bg-black/40 border-green-500/20 text-white" data-testid="input-profile-twitter" />
              </div>
              <div>
                <FieldLabel icon={CalendarDays}>Google Calendar Booking URL</FieldLabel>
                <Input value={calendarUrl} onChange={e => setCalendarUrl(e.target.value)} placeholder="https://calendar.google.com/calendar/appointments/schedules/..." className="bg-black/40 border-green-500/20 text-white" data-testid="input-profile-calendar-url" />
                <p className="text-xs text-gray-500 mt-1">Paste your Google Calendar Appointment Scheduling URL — visitors will see an embedded booking widget on your profile page.</p>
              </div>
            </CardContent>
          </Card>

          {/* Avatar */}
          <Card className="bg-black/60 border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-400 text-base flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Profile Photo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full border-2 border-green-500/40 flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ boxShadow: "0 0 12px rgba(34,197,94,0.2)", background: "linear-gradient(135deg, #0a1a0a 0%, #0d2010 100%)" }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-green-400/50" />
                  )}
                </div>
                <div className="flex-1">
                  <FieldLabel icon={Camera}>Avatar URL</FieldLabel>
                  <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://example.com/your-photo.jpg" className="bg-black/40 border-green-500/20 text-white" data-testid="input-profile-avatar" />
                  <p className="text-gray-500 text-xs mt-1">Paste a direct image link. Square images work best.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expertise */}
          <Card className="bg-black/60 border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-400 text-base flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Expertise & Skills
              </CardTitle>
              <p className="text-gray-500 text-xs">Click to toggle. Selected badges appear on your profile and directory card.</p>
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
                <p className="text-green-500/60 text-xs font-mono mt-3">{specialties.length} selected</p>
              )}
            </CardContent>
          </Card>

          {/* Contact details */}
          <Card className="bg-black/60 border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-400 text-base flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <FieldLabel icon={Megaphone}>Contact Section Headline</FieldLabel>
                <Input value={contactHeadline} onChange={e => setContactHeadline(e.target.value)} placeholder="Ready to Get Started?" className="bg-black/40 border-green-500/20 text-white" data-testid="input-profile-contact-headline" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel icon={Mail}>Email</FieldLabel>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-profile-email" />
                </div>
                <div>
                  <FieldLabel icon={Phone}>Phone</FieldLabel>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-profile-phone" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel icon={MapPin}>Location</FieldLabel>
                  <Input value={location} onChange={e => setLocation(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-profile-location" />
                </div>
                <div>
                  <FieldLabel icon={Globe}>Location Line 2</FieldLabel>
                  <Input value={locationLine2} onChange={e => setLocationLine2(e.target.value)} placeholder="Available Worldwide Remote" className="bg-black/40 border-green-500/20 text-white" data-testid="input-profile-location2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar previews */}
        <div className="space-y-4">
          {/* Hero preview */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-3.5 h-3.5 text-green-400/60" />
              <span className="text-gray-400 text-xs font-medium">Hero Section Preview</span>
            </div>
            <div
              className="rounded-xl border border-green-500/20 overflow-hidden p-5 text-center space-y-3"
              style={{
                background: "linear-gradient(180deg, #050f05 0%, #0a1a0a 100%)",
                backgroundImage: "linear-gradient(rgba(34,197,94,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.04) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            >
              <div className="flex justify-center">
                <div
                  className="w-20 h-20 rounded-full border-2 border-green-400/40 overflow-hidden flex items-center justify-center"
                  style={{ boxShadow: "0 0 20px rgba(34,197,94,0.25), 0 0 40px rgba(34,197,94,0.1)" }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-green-400/30" />
                  )}
                </div>
              </div>
              <div>
                <p className="text-white font-bold text-lg leading-tight">{name || "Your Name"}</p>
                <p className="text-green-400/70 text-xs mt-1 leading-relaxed">{tagline || "Your tagline appears here"}</p>
              </div>
              {bio && (
                <p className="text-gray-400 text-xs line-clamp-3 leading-relaxed px-1">{bio}</p>
              )}
              {specialties.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center pt-1">
                  {specialties.slice(0, 5).map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs">{s}</span>
                  ))}
                  {specialties.length > 5 && (
                    <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs">+{specialties.length - 5} more</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Directory card preview */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-3.5 h-3.5 text-green-400/60" />
              <span className="text-gray-400 text-xs font-medium">Directory Card Preview</span>
            </div>
            <div
              className="rounded-lg border border-green-500/20 overflow-hidden p-4"
              style={{ background: "linear-gradient(180deg, #0a0a0a 0%, #0d1f0d 100%)" }}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div
                  className="w-16 h-16 rounded-full border-2 border-green-400/30 flex items-center justify-center overflow-hidden"
                  style={{ boxShadow: "0 0 15px rgba(0,255,100,0.15)" }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-green-400/40" />
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
function ProjectsTab({ slug }: { slug: string }) {
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
    mutationFn: (data: object) => apiRequest("POST", `/api/dashboard/projects${sp}`, data),
    onSuccess: () => { invalidate(); resetForm(); toast({ title: "Project added" }); },
    onError: () => toast({ title: "Error", description: "Failed to add project", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) => apiRequest("PATCH", `/api/dashboard/projects/${id}${sp}`, data),
    onSuccess: () => { invalidate(); resetForm(); toast({ title: "Project updated" }); },
    onError: () => toast({ title: "Error", description: "Failed to update project", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/dashboard/projects/${id}${sp}`),
    onSuccess: () => { invalidate(); toast({ title: "Project deleted" }); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest("PATCH", `/api/dashboard/projects/${id}${sp}`, { isActive }),
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
  const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
  const PreviewIcon = ICON_MAP[icon] || Briefcase;
  const previewColor = COLOR_MAP[color] || "#22c55e";

  return (
    <div className="space-y-5">
      <SectionBanner
        icon={Briefcase}
        iconBg="bg-purple-500/15"
        iconColor="text-purple-400"
        borderColor="border-purple-500"
        section="Projects Section"
        description="Your featured work and achievements — displayed below the hero on your public profile page."
        slug={slug}
        anchor="projects"
      />

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Form */}
        <div className="lg:col-span-3">
          <Card className="bg-black/60 border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
              <CardTitle className="text-green-400 text-base flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                {editingId ? "Edit Project" : "Add Project"}
              </CardTitle>
              {editingId && (
                <Button variant="ghost" size="sm" onClick={resetForm} className="text-gray-400 hover:text-white h-7 text-xs">
                  <X className="w-3.5 h-3.5 mr-1" /> Cancel
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel icon={FileText}>Title *</FieldLabel>
                    <Input value={title} onChange={e => setTitle(e.target.value)} required className="bg-black/40 border-green-500/20 text-white" data-testid="input-project-title" />
                  </div>
                  <div>
                    <FieldLabel icon={Sparkles}>Subtitle</FieldLabel>
                    <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-project-subtitle" />
                  </div>
                </div>
                <div>
                  <FieldLabel icon={FileText}>Description</FieldLabel>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="bg-black/40 border-green-500/20 text-white" data-testid="input-project-description" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel icon={TrendingUp}>Impact / Stats</FieldLabel>
                    <Input value={impact} onChange={e => setImpact(e.target.value)} placeholder="e.g. 500+ members" className="bg-black/40 border-green-500/20 text-white" data-testid="input-project-impact" />
                  </div>
                  <div>
                    <FieldLabel icon={ExternalLink}>Link (optional)</FieldLabel>
                    <Input type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." className="bg-black/40 border-green-500/20 text-white" data-testid="input-project-link" />
                  </div>
                </div>

                {/* Visual icon picker */}
                <div>
                  <FieldLabel icon={Star}>Icon</FieldLabel>
                  <div className="grid grid-cols-7 gap-1.5 p-3 rounded-lg bg-black/40 border border-green-500/20" data-testid="icon-picker">
                    {ICON_NAMES.map(name => {
                      const IconComp = ICON_MAP[name];
                      const isSelected = icon === name;
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setIcon(name)}
                          title={name}
                          data-testid={`icon-pick-${name.toLowerCase()}`}
                          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-all ${
                            isSelected
                              ? "bg-green-500/20 border border-green-400/60 shadow-[0_0_6px_rgba(34,197,94,0.3)]"
                              : "border border-transparent hover:bg-white/5 hover:border-white/10"
                          }`}
                        >
                          <IconComp className={`w-5 h-5 ${isSelected ? "text-green-300" : "text-gray-400"}`} />
                          <span className={`text-[9px] font-mono leading-tight text-center ${isSelected ? "text-green-400" : "text-gray-600"}`}>
                            {name.replace(/([A-Z])/g, ' $1').trim().split(' ').slice(-1)[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel icon={Star}>Color</FieldLabel>
                    <div className="flex gap-2 flex-wrap p-2.5 rounded-lg bg-black/40 border border-green-500/20">
                      {Object.entries(COLOR_MAP).map(([cls, hex]) => (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => setColor(cls)}
                          title={cls}
                          className={`w-7 h-7 rounded-full transition-all ${color === cls ? "ring-2 ring-white ring-offset-2 ring-offset-black scale-110" : "hover:scale-105"}`}
                          style={{ background: hex }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <FieldLabel icon={Target}>Display Order</FieldLabel>
                    <Input type="number" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-project-order" />
                  </div>
                </div>

                <div>
                  <FieldLabel icon={Zap}>Tags <span className="text-gray-500 text-xs ml-1">(comma-separated)</span></FieldLabel>
                  <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="XRPL, Web3, NFT" className="bg-black/40 border-green-500/20 text-white" data-testid="input-project-tags" />
                </div>
                <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white" data-testid="button-submit-project">
                  <Plus className="w-4 h-4 mr-2" />
                  {isPending ? "Saving..." : editingId ? "Update Project" : "Add Project"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Live card preview */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-green-400/60" />
            <span className="text-gray-400 text-xs font-medium">Card Preview</span>
          </div>
          <div
            className="rounded-xl border border-green-500/15 overflow-hidden p-5 space-y-4"
            style={{ background: "linear-gradient(180deg, #080808 0%, #0a140a 100%)" }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: previewColor + "22", border: `1px solid ${previewColor}44` }}
              >
                <PreviewIcon className="w-5 h-5" style={{ color: previewColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-tight">{title || <span className="text-gray-600 italic">Project title</span>}</p>
                <p className="text-gray-400 text-xs mt-0.5">{subtitle || <span className="text-gray-700 italic">Subtitle</span>}</p>
              </div>
              {link && <ExternalLink className="w-3.5 h-3.5 text-green-400/40 shrink-0 mt-0.5" />}
            </div>
            {description && (
              <p className="text-gray-400 text-xs line-clamp-3 leading-relaxed">{description}</p>
            )}
            {impact && (
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 shrink-0" style={{ color: previewColor }} />
                <span className="text-xs font-mono" style={{ color: previewColor }}>{impact}</span>
              </div>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.slice(0, 4).map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-full text-xs border" style={{ background: previewColor + "12", borderColor: previewColor + "30", color: previewColor }}>
                    {t}
                  </span>
                ))}
              </div>
            )}
            {!title && !description && !impact && (
              <p className="text-gray-700 text-xs italic text-center py-2">Fill in the form to preview your card</p>
            )}
          </div>
        </div>
      </div>

      {/* Project list */}
      <Card className="bg-black/60 border-green-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-400 text-base">My Projects ({projectsList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-gray-400">Loading...</p> : projectsList.length === 0 ? (
            <p className="text-gray-500 text-sm">No projects yet. Add your first one above.</p>
          ) : (
            <div className="space-y-2">
              {projectsList.map(p => {
                const ListIcon = ICON_MAP[p.icon] || Briefcase;
                const listColor = COLOR_MAP[p.color] || "#22c55e";
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-black/40 border border-green-500/10" data-testid={`row-project-${p.id}`}>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: listColor + "20", border: `1px solid ${listColor}30` }}
                    >
                      <ListIcon className="w-4 h-4" style={{ color: listColor }} />
                    </div>
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Stories Tab ────────────────────────────────────────────────────────────────
type ResolvedPost = {
  platform: string;
  imageUrl: string | null;
  title: string | null;
  sourceUrl: string;
  hasImage: boolean;
};

const PLATFORM_INFO: Record<string, {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  note?: string;
}> = {
  instagram: { label: "Instagram", Icon: SiInstagram, color: "#e1306c" },
  tiktok: { label: "TikTok", Icon: SiTiktok, color: "#69c9d0" },
  twitter: { label: "X / Twitter", Icon: SiX, color: "#1d9bf0" },
  snapchat: { label: "Snapchat", Icon: SiSnapchat, color: "#fffc00", note: "Best effort (public Spotlight only)" },
};

function detectPlatformClient(url: string): string | null {
  if (/instagram\.com/.test(url)) return "instagram";
  if (/tiktok\.com/.test(url)) return "tiktok";
  if (/twitter\.com|x\.com/.test(url)) return "twitter";
  if (/snapchat\.com/.test(url)) return "snapchat";
  return null;
}

function StoriesTab({ authorName, avatarUrl, slug }: { authorName: string; avatarUrl: string; slug: string }) {
  const { toast } = useToast();
  const sp = useSlugParam();
  const override = useAdminSlug();
  const [mode, setMode] = useState<"write" | "import">("write");

  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [storyAuthor, setStoryAuthor] = useState(authorName);

  const [importUrl, setImportUrl] = useState("");
  const [importCaption, setImportCaption] = useState("");
  const [resolvedPost, setResolvedPost] = useState<ResolvedPost | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => { setStoryAuthor(authorName); }, [authorName]);

  const detectedPlatform = detectPlatformClient(importUrl);
  const platformInfo = detectedPlatform ? PLATFORM_INFO[detectedPlatform] : null;

  const { data: stories = [], isLoading } = useQuery<Story[]>({
    queryKey: ["/api/dashboard/stories", override],
    queryFn: () => fetch(`/api/dashboard/stories${sp}`, { credentials: "include" }).then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: async (data: { content?: string; authorName: string; imageUrl?: string; sourceType?: string; sourceUrl?: string }) => {
      const formData = new FormData();
      if (data.content) formData.append("content", data.content);
      formData.append("authorName", data.authorName);
      if (data.imageUrl) formData.append("imageUrl", data.imageUrl);
      if (data.sourceType) formData.append("sourceType", data.sourceType);
      if (data.sourceUrl) formData.append("sourceUrl", data.sourceUrl);
      const url = `/api/dashboard/stories${sp}`;
      const res = await fetch(url, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to create story");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stories", override] });
      setContent(""); setImageUrl("");
      setImportUrl(""); setImportCaption(""); setResolvedPost(null); setResolveError(null);
      toast({ title: "Story posted!" });
    },
    onError: () => toast({ title: "Failed to post story", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/dashboard/stories/${id}${sp}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stories", override] });
      toast({ title: "Story deleted" });
    },
  });

  const handleFetchPreview = async () => {
    if (!importUrl) return;
    setIsFetching(true);
    setResolveError(null);
    setResolvedPost(null);
    try {
      const res = await fetch("/api/resolve-story-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResolveError(data.error || "Could not resolve this URL");
      } else {
        setResolvedPost(data);
      }
    } catch {
      setResolveError("Network error — please try again");
    } finally {
      setIsFetching(false);
    }
  };

  const handlePostImport = () => {
    if (!resolvedPost) return;
    const caption = importCaption || resolvedPost.title || undefined;
    if (!resolvedPost.imageUrl && !caption) {
      toast({ title: "Add a caption — this post has no image", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      content: caption,
      authorName: storyAuthor,
      imageUrl: resolvedPost.imageUrl ?? undefined,
      sourceType: resolvedPost.platform,
      sourceUrl: resolvedPost.sourceUrl,
    });
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  const previewImageUrl = mode === "import" ? (resolvedPost?.imageUrl || "") : imageUrl;
  const previewContent = mode === "import" ? (importCaption || resolvedPost?.title || "") : content;

  return (
    <div className="space-y-5">
      <SectionBanner
        icon={Clock}
        iconBg="bg-amber-500/15"
        iconColor="text-amber-400"
        borderColor="border-amber-500"
        section="Stories Ring"
        description="24-hour ephemeral updates shown at the top of your profile — like Instagram Stories. They disappear automatically after a day."
        slug={slug}
      />

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Form */}
        <div className="lg:col-span-3">
          <Card className="bg-black/60 border-green-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-green-400 text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Create Story
                </CardTitle>
                {/* Mode toggle */}
                <div className="flex rounded-lg border border-green-500/20 overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setMode("write")}
                    className={`px-3 py-1.5 font-medium transition-all flex items-center gap-1.5 ${mode === "write" ? "bg-green-600 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"}`}
                    data-testid="mode-write"
                  >
                    <FileText className="w-3 h-3" />
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("import")}
                    className={`px-3 py-1.5 font-medium transition-all flex items-center gap-1.5 ${mode === "import" ? "bg-amber-600 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"}`}
                    data-testid="mode-import"
                  >
                    <Link2 className="w-3 h-3" />
                    Import from Social
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {mode === "write" ? (
                <form onSubmit={e => { e.preventDefault(); if (!content) return; createMutation.mutate({ content, authorName: storyAuthor, imageUrl: imageUrl || undefined }); }} className="space-y-4">
                  <div>
                    <FieldLabel icon={FileText}>Content *</FieldLabel>
                    <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="What's on your mind?" rows={4} className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600" data-testid="input-story-content" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel icon={User}>Author Name</FieldLabel>
                      <Input value={storyAuthor} onChange={e => setStoryAuthor(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-story-author" />
                    </div>
                    <div>
                      <FieldLabel icon={Camera}>Image URL <span className="text-gray-500 text-xs ml-1">(optional)</span></FieldLabel>
                      <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600" data-testid="input-story-image" />
                    </div>
                  </div>
                  <Button type="submit" disabled={!content || createMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white" data-testid="button-create-story">
                    <Plus className="w-4 h-4 mr-2" />
                    {createMutation.isPending ? "Posting..." : "Post Story"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  {/* Platform supported badges */}
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(PLATFORM_INFO).map(([key, info]) => (
                      <div key={key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-black/30 text-xs">
                        <info.Icon className="w-3 h-3" style={{ color: info.color }} />
                        <span className="text-gray-400">{info.label}</span>
                        {info.note && <span className="text-gray-600">·</span>}
                        {info.note && <span className="text-gray-600 text-[10px]">{info.note}</span>}
                      </div>
                    ))}
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

// ── Contact Tab ────────────────────────────────────────────────────────────────
function ContactTab({ slug }: { slug: string }) {
  const { toast } = useToast();
  const sp = useSlugParam();
  const override = useAdminSlug();
  const { data: info, isLoading } = useQuery<ContactInfoData>({
    queryKey: ["/api/dashboard/contact-info", override],
    queryFn: () => fetch(`/api/dashboard/contact-info${sp}`, { credentials: "include" }).then(r => r.json()),
  });

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
    mutationFn: () => apiRequest("PATCH", `/api/dashboard/contact-info${sp}`, { headline, subheading, email, phone, location, locationLine2 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/contact-info", override] });
      toast({ title: "Saved", description: "Contact section updated." });
    },
    onError: () => toast({ title: "Error", description: "Failed to save.", variant: "destructive" }),
  });

  return (
    <div className="space-y-5">
      <SectionBanner
        icon={Mail}
        iconBg="bg-teal-500/15"
        iconColor="text-teal-400"
        borderColor="border-teal-500"
        section="Contact Section"
        description="The 'Get In Touch' area at the very bottom of your public profile — where visitors reach out to you."
        slug={slug}
        anchor="contact"
      />

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Form */}
        <div className="lg:col-span-3">
          <Card className="bg-black/60 border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-400 text-base flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Contact Section
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <p className="text-gray-400">Loading...</p> : (
                <div className="space-y-4">
                  <div>
                    <FieldLabel icon={Megaphone}>Headline</FieldLabel>
                    <Input value={headline} onChange={e => setHeadline(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-contact-headline" />
                  </div>
                  <div>
                    <FieldLabel icon={FileText}>Description</FieldLabel>
                    <Textarea value={subheading} onChange={e => setSubheading(e.target.value)} rows={3} className="bg-black/40 border-green-500/20 text-white" data-testid="input-contact-subheading" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel icon={Mail}>Email</FieldLabel>
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-contact-email" />
                    </div>
                    <div>
                      <FieldLabel icon={Phone}>Phone</FieldLabel>
                      <Input value={phone} onChange={e => setPhone(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-contact-phone" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel icon={MapPin}>Location</FieldLabel>
                      <Input value={location} onChange={e => setLocation(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-contact-location" />
                    </div>
                    <div>
                      <FieldLabel icon={Globe}>Location Line 2</FieldLabel>
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
        </div>

        {/* Contact section preview */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-green-400/60" />
            <span className="text-gray-400 text-xs font-medium">Section Preview</span>
          </div>
          <div
            className="rounded-xl border border-teal-500/20 overflow-hidden p-5 space-y-4"
            style={{
              background: "linear-gradient(180deg, #020e0e 0%, #051a14 100%)",
              backgroundImage: "linear-gradient(rgba(20,184,166,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.04) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            <h3 className="text-white font-bold text-lg leading-tight">
              {headline || <span className="text-gray-600 italic text-base">Your headline here</span>}
            </h3>
            {subheading && (
              <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">{subheading}</p>
            )}
            <div className="space-y-2 pt-1">
              {email && (
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-teal-500/20 bg-teal-500/5">
                  <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span className="text-gray-300 text-xs truncate">{email}</span>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-teal-500/20 bg-teal-500/5">
                  <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span className="text-gray-300 text-xs">{phone}</span>
                </div>
              )}
              {location && (
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-teal-500/20 bg-teal-500/5">
                  <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span className="text-gray-300 text-xs">{location}{locationLine2 ? ` · ${locationLine2}` : ""}</span>
                </div>
              )}
              {!email && !phone && !location && (
                <p className="text-gray-700 text-xs italic text-center py-3">Fill in contact details to see preview</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Media Tab ──────────────────────────────────────────────────────────────────
function MediaTab({ slug }: { slug: string }) {
  const { toast } = useToast();
  const sp = useSlugParam();
  const override = useAdminSlug();
  const [source, setSource] = useState("manual");
  const [sourceUrl, setSourceUrl] = useState("");
  const [section, setSection] = useState("hero");
  const [altText, setAltText] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");

  const { data: media = [], isLoading } = useQuery<CachedMedia[]>({
    queryKey: ["/api/dashboard/media", override],
    queryFn: () => fetch(`/api/dashboard/media${sp}`, { credentials: "include" }).then(r => r.json()),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/dashboard/media", override] });

  const createMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", `/api/dashboard/media${sp}`, data),
    onSuccess: () => { invalidate(); setSourceUrl(""); setAltText(""); setDisplayOrder("0"); toast({ title: "Media added" }); },
    onError: () => toast({ title: "Error", description: "Failed to add media", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/dashboard/media/${id}${sp}`),
    onSuccess: () => { invalidate(); toast({ title: "Media deleted" }); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => apiRequest("PATCH", `/api/dashboard/media/${id}${sp}`, { isActive }),
    onSuccess: () => invalidate(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl) return;
    createMutation.mutate({ source, sourceUrl, section, altText: altText || null, displayOrder: parseInt(displayOrder) || 0 });
  };

  const SECTION_INFO: Record<string, { label: string; desc: string }> = {
    hero: { label: "Hero", desc: "Full-width background of your profile header" },
    about: { label: "About", desc: "Background image for the About section" },
    gallery: { label: "Gallery", desc: "Appears in the media gallery section" },
  };

  return (
    <div className="space-y-5">
      <SectionBanner
        icon={Layout}
        iconBg="bg-orange-500/15"
        iconColor="text-orange-400"
        borderColor="border-orange-500"
        section="Media Sections"
        description="Background images and gallery content for the hero, about, and gallery areas of your profile page."
        slug={slug}
      />

      <Card className="bg-black/60 border-green-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-400 text-base flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Add Media
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel icon={Globe}>Source Type</FieldLabel>
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
                <FieldLabel icon={Layout}>Page Section</FieldLabel>
                <Select value={section} onValueChange={setSection}>
                  <SelectTrigger className="bg-black/40 border-green-500/20 text-white" data-testid="select-media-section">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-green-500/20">
                    {Object.entries(SECTION_INFO).map(([val, info]) => (
                      <SelectItem key={val} value={val} className="text-white hover:bg-green-500/10">
                        {info.label} — <span className="text-gray-500 text-xs">{info.desc}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {section && SECTION_INFO[section] && (
                  <p className="text-orange-400/60 text-xs mt-1.5 flex items-center gap-1">
                    <Layout className="w-3 h-3" />
                    {SECTION_INFO[section].desc}
                  </p>
                )}
              </div>
            </div>
            <div>
              <FieldLabel icon={ExternalLink}>URL *</FieldLabel>
              <Input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://..." className="bg-black/40 border-green-500/20 text-white" required data-testid="input-media-url" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel icon={FileText}>Alt Text</FieldLabel>
                <Input value={altText} onChange={e => setAltText(e.target.value)} placeholder="Describe the image..." className="bg-black/40 border-green-500/20 text-white" data-testid="input-media-alt" />
              </div>
              <div>
                <FieldLabel icon={Target}>Display Order</FieldLabel>
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
        <CardHeader className="pb-3">
          <CardTitle className="text-green-400 text-base">My Media ({media.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-gray-400">Loading...</p> : media.length === 0 ? (
            <p className="text-gray-500 text-sm">No media yet.</p>
          ) : (
            <div className="space-y-2">
              {media.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-green-500/10" data-testid={`row-media-${m.id}`}>
                  {m.imageUrl && (
                    <img src={m.imageUrl} alt={m.altText || ""} className="w-12 h-12 object-cover rounded border border-green-500/20 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300 text-sm truncate">{m.sourceUrl || m.imageUrl}</p>
                    <p className="text-gray-500 text-xs flex items-center gap-1.5">
                      <Layout className="w-3 h-3 text-orange-400/60" />
                      {SECTION_INFO[m.section]?.label || m.section} · {m.source}
                    </p>
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
function ChatProfileTab({ slug, matrixUserId, profileRoomId }: { slug: string; matrixUserId: string | null; profileRoomId?: string | null }) {
  const { toast } = useToast();
  const sp = useSlugParam();
  const override = useAdminSlug();
  const { data: config, isLoading } = useQuery<ChatProfileData>({
    queryKey: ["/api/dashboard/chat-profile", override],
    queryFn: () => fetch(`/api/dashboard/chat-profile${sp}`, { credentials: "include" }).then(r => r.json()),
  });
  const [roomInput, setRoomInput] = useState(profileRoomId ?? "");
  const roomMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/dashboard/profile-room${sp}`, { profileRoomId: roomInput || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/profile", override] });
      toast({ title: "Saved", description: "Profile room updated. Chat profile will sync on next cycle." });
    },
    onError: () => toast({ title: "Error", description: "Failed to save profile room.", variant: "destructive" }),
  });

  useEffect(() => { setRoomInput(profileRoomId ?? ""); }, [profileRoomId]);

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
    mutationFn: () => apiRequest("PATCH", `/api/dashboard/chat-profile${sp}`, {
      displayName, title, avatarUrl: avatarUrl || null, statusMessage, isAvailable,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/chat-profile", override] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/host-config"] });
      toast({ title: "Saved", description: "Chat profile updated." });
    },
    onError: () => toast({ title: "Error", description: "Failed to save.", variant: "destructive" }),
  });

  return (
    <div className="space-y-5">
      <SectionBanner
        icon={MessageCircle}
        iconBg="bg-cyan-500/15"
        iconColor="text-cyan-400"
        borderColor="border-cyan-500"
        section="Chat Widget"
        description="The floating chat bubble in the bottom-right corner of your profile — how you appear to visitors who message you."
        slug={slug}
      />

      {matrixUserId ? (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-green-500/20 bg-green-500/5">
          <MessageCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-green-300 text-sm font-medium">Chat delivery routing</p>
            <p className="text-gray-400 text-xs mt-0.5">
              Visitor messages are delivered to your Matrix account:{" "}
              <span className="font-mono text-green-400 break-all">{matrixUserId}</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
          <MessageCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-amber-300 text-sm font-medium">No Matrix account linked</p>
            <p className="text-gray-400 text-xs mt-0.5">
              Visitors cannot reach you via chat until you sign in with your Matrix account.
            </p>
          </div>
        </div>
      )}

      {/* Profile room linking */}
      <Card className="bg-black/60 border-cyan-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-cyan-400 text-base flex items-center gap-2">
            <Hash className="w-4 h-4" />
            TextRP Profile Room
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {profileRoomId ? (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
              <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.7)] mt-1.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-cyan-300 text-xs font-medium">Room linked — chat profile syncs automatically</p>
                <p className="text-gray-500 text-xs font-mono break-all mt-0.5">{profileRoomId}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">
              Invite the bot to your TextRP room — the room's name, avatar, and topic will automatically populate your chat widget profile every 60 seconds.
            </p>
          )}
          <div className="flex gap-2">
            <Input
              value={roomInput}
              onChange={e => setRoomInput(e.target.value)}
              placeholder="!roomid:synapse.textrp.io"
              className="bg-black/40 border-cyan-500/20 text-white font-mono text-sm flex-1"
              data-testid="input-profile-room-id"
            />
            <Button
              onClick={() => roomMutation.mutate()}
              disabled={roomMutation.isPending}
              variant="outline"
              className="border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 shrink-0"
              data-testid="button-save-profile-room"
            >
              {roomMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-black/60 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-400 text-base flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat Widget Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <p className="text-gray-400">Loading...</p> : (
              <div className="space-y-4">
                <div>
                  <FieldLabel icon={User}>Display Name</FieldLabel>
                  <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-chat-display-name" />
                </div>
                <div>
                  <FieldLabel icon={Sparkles}>Title / Role</FieldLabel>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="XRPL Consultant" className="bg-black/40 border-green-500/20 text-white" data-testid="input-chat-title" />
                </div>
                <div>
                  <FieldLabel icon={Camera}>Avatar URL <span className="text-gray-500 text-xs ml-1">(optional)</span></FieldLabel>
                  <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." className="bg-black/40 border-green-500/20 text-white" data-testid="input-chat-avatar-url" />
                </div>
                <div>
                  <FieldLabel icon={MessageCircle}>Status Message</FieldLabel>
                  <Input value={statusMessage} onChange={e => setStatusMessage(e.target.value)} placeholder="Usually replies within a few hours" className="bg-black/40 border-green-500/20 text-white" data-testid="input-chat-status-message" />
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/30 border border-green-500/10">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${isAvailable ? "bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.6)]" : "bg-gray-500"}`} />
                    <div>
                      <p className="text-gray-300 text-sm font-medium">{isAvailable ? "Available" : "Away"}</p>
                      <p className="text-gray-500 text-xs">Green dot = online, grey = away</p>
                    </div>
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

        {/* Chat widget preview */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-green-400/60" />
            <span className="text-gray-400 text-xs font-medium">Widget Preview</span>
          </div>
          <div className="rounded-xl border border-cyan-500/20 overflow-hidden max-w-xs shadow-[0_0_30px_rgba(6,182,212,0.1)]" style={{ background: "linear-gradient(180deg, #020e0f 0%, #051a1a 100%)" }}>
            <div className="p-3 flex items-center gap-3 border-b border-cyan-500/20" style={{ background: "linear-gradient(90deg, #031010 0%, #061a1a 100%)" }}>
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover border border-cyan-500/30" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-cyan-400" />
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
            <div className="px-3 pb-3">
              <div className="bg-black/40 border border-green-500/10 rounded-lg p-2 flex items-center gap-2">
                <div className="flex-1 h-4 bg-green-500/5 rounded" />
                <div className="w-6 h-6 rounded-lg bg-green-600/80 flex items-center justify-center">
                  <MessageCircle className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
          </div>
          <p className="text-gray-600 text-xs">This widget appears fixed in the bottom-right corner of your profile page.</p>
        </div>
      </div>
    </div>
  );
}

// ── Testimonials Tab ───────────────────────────────────────────────────────────
function TestimonialsTab({ slug }: { slug: string }) {
  const { toast } = useToast();
  const sp = useSlugParam();
  const override = useAdminSlug();

  const { data: testimonials = [], isLoading } = useQuery<{ id: number; authorName: string; authorTitle: string; content: string; sortOrder: number }[]>({
    queryKey: ["/api/dashboard/testimonials", override],
    queryFn: () => fetch(`/api/dashboard/testimonials${sp}`, { credentials: "include" }).then(r => r.json()),
  });

  const [editing, setEditing] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const [addName, setAddName] = useState("");
  const [addTitle, setAddTitle] = useState("");
  const [addContent, setAddContent] = useState("");

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/dashboard/testimonials${sp}`, { authorName: addName, authorTitle: addTitle, content: addContent }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/testimonials", override] });
      queryClient.invalidateQueries({ queryKey: ["/api/c/:slug/testimonials", override || slug] });
      setAddName(""); setAddTitle(""); setAddContent("");
      toast({ title: "Testimonial added" });
    },
    onError: () => toast({ title: "Error", description: "Failed to add testimonial.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/dashboard/testimonials/${id}${sp}`, { authorName: editName, authorTitle: editTitle, content: editContent }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/testimonials", override] });
      queryClient.invalidateQueries({ queryKey: ["/api/c/:slug/testimonials", override || slug] });
      setEditing(null);
      toast({ title: "Testimonial updated" });
    },
    onError: () => toast({ title: "Error", description: "Failed to update testimonial.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/dashboard/testimonials/${id}${sp}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/testimonials", override] });
      queryClient.invalidateQueries({ queryKey: ["/api/c/:slug/testimonials", override || slug] });
      toast({ title: "Testimonial deleted" });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete testimonial.", variant: "destructive" }),
  });

  function startEdit(t: { id: number; authorName: string; authorTitle: string; content: string }) {
    setEditing(t.id);
    setEditName(t.authorName);
    setEditTitle(t.authorTitle);
    setEditContent(t.content);
  }

  if (isLoading) return <p className="text-gray-400 p-4">Loading...</p>;

  return (
    <div className="space-y-5">
      <SectionBanner
        icon={Quote}
        iconBg="bg-yellow-500/15"
        iconColor="text-yellow-400"
        borderColor="border-yellow-500"
        section="Testimonials Section"
        description="Add client testimonials that appear on your public profile page, displayed as quote cards above the contact section."
        slug={slug}
      />

      {/* Add new */}
      <Card className="bg-black/60 border-green-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-400 text-base flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Testimonial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel icon={User}>Client Name</FieldLabel>
              <Input value={addName} onChange={e => setAddName(e.target.value)} placeholder="Jane Smith" className="bg-black/40 border-green-500/20 text-white" data-testid="input-add-testimonial-name" />
            </div>
            <div>
              <FieldLabel icon={Briefcase}>Title / Company <span className="text-gray-500 text-xs ml-1">(optional)</span></FieldLabel>
              <Input value={addTitle} onChange={e => setAddTitle(e.target.value)} placeholder="CEO, Acme Corp" className="bg-black/40 border-green-500/20 text-white" data-testid="input-add-testimonial-title" />
            </div>
          </div>
          <div>
            <FieldLabel icon={FileText}>Testimonial</FieldLabel>
            <Textarea value={addContent} onChange={e => setAddContent(e.target.value)} rows={3} placeholder="What did this client say about working with you?" className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600" data-testid="input-add-testimonial-content" />
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!addName.trim() || !addContent.trim() || createMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
            data-testid="button-add-testimonial"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Testimonial
          </Button>
        </CardContent>
      </Card>

      {/* List */}
      {testimonials.length === 0 ? (
        <Card className="bg-black/40 border-green-500/10">
          <CardContent className="py-10 text-center text-gray-500">
            No testimonials yet — add one above.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {testimonials.map(t => (
            <Card key={t.id} className="bg-black/60 border-green-500/20" data-testid={`card-testimonial-item-${t.id}`}>
              <CardContent className="pt-4 space-y-3">
                {editing === t.id ? (
                  <>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Input value={editName} onChange={e => setEditName(e.target.value)} className="bg-black/40 border-green-500/20 text-white" placeholder="Client Name" data-testid={`input-edit-name-${t.id}`} />
                      <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="bg-black/40 border-green-500/20 text-white" placeholder="Title / Company" data-testid={`input-edit-title-${t.id}`} />
                    </div>
                    <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={3} className="bg-black/40 border-green-500/20 text-white" data-testid={`input-edit-content-${t.id}`} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => updateMutation.mutate(t.id)} disabled={updateMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white" data-testid={`button-save-testimonial-${t.id}`}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(null)} className="border-gray-600 text-gray-400" data-testid={`button-cancel-edit-${t.id}`}>Cancel</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-gray-300 italic text-sm">"{t.content}"</p>
                        <p className="text-white font-semibold text-sm mt-2">{t.authorName}</p>
                        {t.authorTitle && <p className="text-gray-500 text-xs">{t.authorTitle}</p>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => startEdit(t)} className="border-green-500/30 text-green-400 hover:bg-green-500/10" data-testid={`button-edit-testimonial-${t.id}`}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(t.id)} disabled={deleteMutation.isPending} className="border-red-500/30 text-red-400 hover:bg-red-500/10" data-testid={`button-delete-testimonial-${t.id}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard Page ────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, logout, consultantSlug, isAdmin, matrixUserId, displayName } = useAuth();
  const [showMatrixId, setShowMatrixId] = useState(false);
  const search = useSearch();
  const [, setLocation] = useLocation();

  // Admins can pass ?slug=X to manage another consultant's data
  const urlSlug = new URLSearchParams(search).get("slug");
  const overrideSlug = isAdmin && urlSlug ? urlSlug : null;
  const slug = overrideSlug ?? consultantSlug ?? "";

  const { data: profile } = useQuery<ConsultantProfile>({
    queryKey: ["/api/dashboard/profile", overrideSlug],
    queryFn: () => fetch(`/api/dashboard/profile${overrideSlug ? `?slug=${overrideSlug}` : ""}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!slug,
  });

  const handleLogout = () => logout.mutate();

  return (
    <AdminSlugContext.Provider value={overrideSlug}>
    <div className="min-h-screen bg-black text-white relative">
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(34,197,94,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.1) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Identity Banner */}
        <div className={`mb-6 rounded-xl border px-4 py-3 flex items-center justify-between gap-4 flex-wrap ${overrideSlug ? "border-blue-500/30 bg-blue-500/5" : isAdmin ? "border-amber-500/30 bg-amber-500/5" : "border-green-500/20 bg-green-500/5"}`} data-testid="banner-identity">
          <div className="flex items-center gap-3 min-w-0">
            {overrideSlug ? (
              <Shield className="w-4 h-4 text-blue-400 shrink-0" />
            ) : isAdmin ? (
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <User className="w-4 h-4 text-green-400 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {overrideSlug ? (
                  <>
                    <span className="text-sm font-semibold text-blue-400" data-testid="text-role-label">Editing Consultant</span>
                    <span className="text-gray-400 text-sm">·</span>
                    <span className="text-white text-sm font-semibold">{profile?.name || overrideSlug}</span>
                    <span className="text-gray-600 text-sm">·</span>
                    <span className="text-blue-400/70 text-xs font-mono">/{overrideSlug}</span>
                  </>
                ) : (
                  <>
                    <span className={`text-sm font-semibold ${isAdmin ? "text-amber-400" : "text-green-400"}`} data-testid="text-role-label">
                      {isAdmin ? "Admin Mode" : "Consultant"}
                    </span>
                    <span className="text-gray-400 text-sm">·</span>
                    <span className="text-gray-300 text-sm font-mono" data-testid="text-display-name">{displayName || profile?.name || slug}</span>
                    {slug && !isAdmin && (
                      <>
                        <span className="text-gray-600 text-sm">·</span>
                        <span className="text-gray-500 text-xs font-mono">Managing your profile only</span>
                      </>
                    )}
                  </>
                )}
              </div>
              <button
                onClick={() => setShowMatrixId(v => !v)}
                className="text-xs text-gray-600 hover:text-gray-400 font-mono mt-0.5 transition-colors flex items-center gap-1"
                data-testid="button-toggle-matrix-id"
              >
                {showMatrixId ? "hide" : "show"} Matrix ID
              </button>
              {showMatrixId && matrixUserId && (
                <p className="text-xs text-gray-500 font-mono mt-0.5 break-all" data-testid="text-matrix-id">{matrixUserId}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {overrideSlug ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/admin")}
                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-xs"
                data-testid="button-back-to-admin"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back to Admin
              </Button>
            ) : null}
            {slug && (
              <a
                href={`/c/${slug}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-500/30 text-green-400 text-xs hover:bg-green-500/10 transition-colors font-mono"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-view-page"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Page
              </a>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 text-xs"
              data-testid="button-logout"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={overrideSlug ? "/admin" : "/"} className="text-green-400/60 hover:text-green-400 transition-colors" data-testid="link-back-directory">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-white" data-testid="text-dashboard-title">
              {overrideSlug ? `Editing: ${profile?.name || overrideSlug}` : isAdmin ? "My Dashboard" : "My Dashboard"}
            </h1>
            <p className="text-green-400/60 text-sm font-mono">{profile?.name || displayName || slug}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-black/60 border border-green-500/20 p-1 flex-wrap h-auto gap-1">
            <TabsTrigger value="profile" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-400" data-testid="tab-profile">
              <UserCircle className="w-4 h-4 mr-2" />Profile
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400" data-testid="tab-projects">
              <Briefcase className="w-4 h-4 mr-2" />Projects
            </TabsTrigger>
            <TabsTrigger value="stories" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-gray-400" data-testid="tab-stories">
              <Clock className="w-4 h-4 mr-2" />Stories
            </TabsTrigger>
            <TabsTrigger value="contact" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-gray-400" data-testid="tab-contact">
              <Mail className="w-4 h-4 mr-2" />Contact
            </TabsTrigger>
            <TabsTrigger value="media" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-gray-400" data-testid="tab-media">
              <Layout className="w-4 h-4 mr-2" />Media
            </TabsTrigger>
            <TabsTrigger value="chat-profile" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-gray-400" data-testid="tab-chat-profile">
              <MessageCircle className="w-4 h-4 mr-2" />Chat Widget
            </TabsTrigger>
            <TabsTrigger value="testimonials" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white text-gray-400" data-testid="tab-testimonials">
              <Quote className="w-4 h-4 mr-2" />Testimonials
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab slug={slug} />
          </TabsContent>
          <TabsContent value="projects">
            <ProjectsTab slug={slug} />
          </TabsContent>
          <TabsContent value="stories">
            <StoriesTab
              authorName={profile?.name || user?.displayName || ""}
              avatarUrl={profile?.avatarUrl || ""}
              slug={slug}
            />
          </TabsContent>
          <TabsContent value="contact">
            <ContactTab slug={slug} />
          </TabsContent>
          <TabsContent value="media">
            <MediaTab slug={slug} />
          </TabsContent>
          <TabsContent value="chat-profile">
            <ChatProfileTab slug={slug} matrixUserId={profile?.matrixUserId ?? matrixUserId} profileRoomId={profile?.profileRoomId} />
          </TabsContent>
          <TabsContent value="testimonials">
            <TestimonialsTab slug={slug} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </AdminSlugContext.Provider>
  );
}
