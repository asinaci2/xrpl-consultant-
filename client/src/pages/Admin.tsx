import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { TEXTRP_APP_URL } from "@/lib/constants";
import {
  Image,
  Briefcase,
  BookOpen,
  Mail,
  Twitter,
  Phone,
  MessageCircle,
  User,
  Activity,
  ArrowLeft,
  Shield,
  ExternalLink,
  LogOut
} from "lucide-react";

import { MediaTab } from "@/components/admin/MediaTab";
import { ProjectsTab } from "@/components/admin/ProjectsTab";
import { StoriesTab } from "@/components/admin/StoriesTab";
import { InquiriesTab } from "@/components/admin/InquiriesTab";
import { TweetsTab } from "@/components/admin/TweetsTab";
import { ContactTab } from "@/components/admin/ContactTab";
import { ChatProfileTab } from "@/components/admin/ChatProfileTab";
import { ConsultantsTab } from "@/components/admin/ConsultantsTab";
import { SyncTab } from "@/components/admin/SyncTab";

export default function Admin() {
  const { user, logout, matrixUserId } = useAuth();
  const [, setLocation] = useLocation();
  const [showMatrixId, setShowMatrixId] = useState(false);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => setLocation("/"),
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Identity Banner */}
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-center justify-between gap-4 flex-wrap" data-testid="banner-admin-identity">
          <div className="flex items-center gap-3 min-w-0">
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-amber-400">Admin Mode</span>
                {user && (
                  <>
                    <span className="text-gray-400 text-sm">·</span>
                    <span className="text-gray-300 text-sm font-mono" data-testid="text-admin-display-name">{user.displayName}</span>
                  </>
                )}
                <span className="text-gray-600 text-sm">·</span>
                <span className="text-gray-500 text-xs font-mono">Full site access</span>
              </div>
              <button
                onClick={() => setShowMatrixId(v => !v)}
                className="text-xs text-gray-600 hover:text-gray-400 font-mono mt-0.5 transition-colors"
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
            <a
              href={`${TEXTRP_APP_URL}/#/room/#budzy-vibe:synapse.textrp.io`}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-textrp"
            >
              <Button variant="ghost" size="sm" className="text-green-400 hover:text-green-300 hover:bg-green-500/10 text-xs">
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                TextRP
              </Button>
            </a>
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
              <p className="text-gray-500 text-sm">Full site management</p>
            </div>
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
            <TabsTrigger
              value="consultants"
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-400"
              data-testid="tab-consultants"
            >
              <User className="w-4 h-4 mr-2" />
              Consultants
            </TabsTrigger>
            <TabsTrigger
              value="sync"
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-400"
              data-testid="tab-sync"
            >
              <Activity className="w-4 h-4 mr-2" />
              Sync
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
          <TabsContent value="consultants">
            <ConsultantsTab />
          </TabsContent>
          <TabsContent value="sync">
            <SyncTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
