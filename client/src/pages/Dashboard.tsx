import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearch, useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, User, MessageCircle, ExternalLink, LogOut, Shield,
  UserCircle, Briefcase, Clock, Mail, Layout, Quote, Wallet,
  ChevronDown, ChevronUp
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AdminSlugContext } from "@/components/dashboard/context";
import { ProfileTab } from "@/components/dashboard/ProfileTab";
import { ProjectsTab } from "@/components/dashboard/ProjectsTab";
import { StoriesTab } from "@/components/dashboard/StoriesTab";
import { ContactInfoTab } from "@/components/dashboard/ContactInfoTab";
import { MediaTab } from "@/components/dashboard/MediaTab";
import { ChatWidgetTab } from "@/components/dashboard/ChatWidgetTab";
import { TestimonialsTab } from "@/components/dashboard/TestimonialsTab";
import { WalletTab } from "@/components/dashboard/WalletTab";
import { VisitorContactsTab } from "@/components/dashboard/VisitorContactsTab";
import { VisitorTestimonialsTab } from "@/components/dashboard/VisitorTestimonialsTab";
import { ConsultantProfile } from "@/components/dashboard/types";

function VisitorDashboard() {
  const { displayName, matrixUserId, logout } = useAuth();

  return (
    <div className="min-h-screen bg-black text-white relative">
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(34,197,94,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.1) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <Wallet className="w-4 h-4 text-green-400 shrink-0" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-green-400">Visitor</span>
                <span className="text-white/40 text-sm">·</span>
                <span className="text-white text-sm font-mono">{displayName}</span>
              </div>
              <p className="text-xs text-white/60 font-mono">{matrixUserId}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => logout.mutate()} className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 text-xs" data-testid="button-logout">
            <LogOut className="w-3.5 h-3.5 mr-1" />Sign Out
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/" className="text-green-400/60 hover:text-green-400 transition-colors" data-testid="link-back-directory">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-white" data-testid="text-dashboard-title">Your Activity</h1>
            <p className="text-green-400/60 text-sm font-mono">TextRP Consultant Network</p>
          </div>
        </div>

        <WalletTab />
        <VisitorContactsTab />
        <VisitorTestimonialsTab />

        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6 text-center">
          <p className="text-white/80 text-sm mb-4">Discover consultants in the TextRP ecosystem and build your personal network.</p>
          <Link href="/">
            <Button className="bg-green-500 hover:bg-green-600 text-black font-bold rounded-full px-6" data-testid="button-explore-directory">
              Explore the Directory
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { logout, consultantSlug, isAdmin, matrixUserId, displayName, isAuthenticated, isConsultant } = useAuth();
  const [showMatrixId, setShowMatrixId] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const search = useSearch();
  const [, setLocation] = useLocation();

  const urlSlug = new URLSearchParams(search).get("slug");
  const overrideSlug = isAdmin && urlSlug ? urlSlug : null;
  const slug = overrideSlug ?? consultantSlug ?? "";

  const { data: profile } = useQuery<ConsultantProfile>({
    queryKey: ["/api/dashboard/profile", overrideSlug],
    queryFn: () => fetch(`/api/dashboard/profile${overrideSlug ? `?slug=${overrideSlug}` : ""}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!slug,
  });

  if (!isAuthenticated) return null;
  if (isAuthenticated && !isConsultant && !isAdmin) return <VisitorDashboard />;

  return (
    <AdminSlugContext.Provider value={overrideSlug}>
      <div className="min-h-screen bg-black text-white relative">
        <div className="fixed inset-0 opacity-5 pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(34,197,94,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
          <div className={`mb-6 rounded-xl border px-4 py-3 flex items-center justify-between gap-4 flex-wrap ${overrideSlug ? "border-blue-500/30 bg-blue-500/5" : isAdmin ? "border-amber-500/30 bg-amber-500/5" : "border-green-500/20 bg-green-500/5"}`} data-testid="banner-identity">
            <div className="flex items-center gap-3 min-w-0">
              {overrideSlug ? <Shield className="w-4 h-4 text-blue-400 shrink-0" /> : isAdmin ? <Shield className="w-4 h-4 text-amber-400 shrink-0" /> : <User className="w-4 h-4 text-green-400 shrink-0" />}
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
                      <span className={`text-sm font-semibold ${isAdmin ? "text-amber-400" : "text-green-400"}`} data-testid="text-role-label">{isAdmin ? "Admin Mode" : "Consultant"}</span>
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
                <button onClick={() => setShowMatrixId(v => !v)} className="text-xs text-gray-600 hover:text-gray-400 font-mono mt-0.5 transition-colors flex items-center gap-1" data-testid="button-toggle-matrix-id">
                  {showMatrixId ? "hide" : "show"} Matrix ID
                </button>
                {showMatrixId && matrixUserId && <p className="text-xs text-gray-500 font-mono mt-0.5 break-all" data-testid="text-matrix-id">{matrixUserId}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {overrideSlug && (
                <Button variant="outline" size="sm" onClick={() => setLocation("/admin")} className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-xs" data-testid="button-back-to-admin">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />Back to Admin
                </Button>
              )}
              {slug && (
                <a href={`/c/${slug}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-500/30 text-green-400 text-xs hover:bg-green-500/10 transition-colors font-mono" target="_blank" rel="noopener noreferrer" data-testid="link-view-page">
                  <ExternalLink className="w-3.5 h-3.5" />View Page
                </a>
              )}
              <Button variant="ghost" size="sm" onClick={() => logout.mutate()} className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 text-xs" data-testid="button-logout">
                <LogOut className="w-3.5 h-3.5 mr-1" />Sign Out
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <Link href={overrideSlug ? "/admin" : "/"} className="text-green-400/60 hover:text-green-400 transition-colors" data-testid="link-back-directory">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-display font-bold text-white" data-testid="text-dashboard-title">
                {overrideSlug ? `Editing: ${profile?.name || overrideSlug}` : "My Dashboard"}
              </h1>
              <p className="text-green-400/60 text-sm font-mono">{profile?.name || displayName || slug}</p>
            </div>
          </div>

          <div className="mb-6" data-testid="section-wallet-panel">
            <button onClick={() => setWalletOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-green-500/20 bg-black/40 hover:bg-black/60 hover:border-green-500/30 transition-[border-color,background-color] text-sm group" data-testid="button-toggle-wallet">
              <div className="flex items-center gap-2 text-green-400/80 group-hover:text-green-400 transition-colors">
                <Wallet className="w-4 h-4" />
                <span className="font-mono">XRPL Wallet</span>
              </div>
              {walletOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>
            {walletOpen && <div className="mt-2"><WalletTab /></div>}
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-black/60 border border-green-500/20 p-1 flex-wrap h-auto gap-1">
              <TabsTrigger value="profile" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-400" data-testid="tab-profile"><UserCircle className="w-4 h-4 mr-2" />Profile</TabsTrigger>
              <TabsTrigger value="projects" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400" data-testid="tab-projects"><Briefcase className="w-4 h-4 mr-2" />Projects</TabsTrigger>
              <TabsTrigger value="stories" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-gray-400" data-testid="tab-stories"><Clock className="w-4 h-4 mr-2" />Stories</TabsTrigger>
              <TabsTrigger value="contact" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-gray-400" data-testid="tab-contact"><Mail className="w-4 h-4 mr-2" />Contact</TabsTrigger>
              <TabsTrigger value="media" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-gray-400" data-testid="tab-media"><Layout className="w-4 h-4 mr-2" />Media</TabsTrigger>
              <TabsTrigger value="chat-profile" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-gray-400" data-testid="tab-chat-profile"><MessageCircle className="w-4 h-4 mr-2" />Chat Widget</TabsTrigger>
              <TabsTrigger value="testimonials" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white text-gray-400" data-testid="tab-testimonials"><Quote className="w-4 h-4 mr-2" />Testimonials</TabsTrigger>
            </TabsList>

            <TabsContent value="profile"><ProfileTab slug={slug} /></TabsContent>
            <TabsContent value="projects"><ProjectsTab slug={slug} /></TabsContent>
            <TabsContent value="stories"><StoriesTab slug={slug} /></TabsContent>
            <TabsContent value="contact"><ContactInfoTab slug={slug} /></TabsContent>
            <TabsContent value="media"><MediaTab slug={slug} /></TabsContent>
            <TabsContent value="chat-profile"><ChatWidgetTab slug={slug} /></TabsContent>
            <TabsContent value="testimonials"><TestimonialsTab slug={slug} /></TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminSlugContext.Provider>
  );
}
