import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  User, Sparkles, FileText, AtSign, Camera, Phone, Mail, MapPin, Globe, Eye, UserCircle, CalendarDays
} from "lucide-react";
import { SectionBanner } from "./SectionBanner";
import { FieldLabel } from "./FieldLabel";
import { useAdminSlug, useSlugParam } from "./context";
import { ConsultantProfile } from "./types";

export function ProfileTab({ slug }: { slug: string }) {
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
      setContactHeadline(profile.contactHeadline);
      setEmail(profile.email);
      setPhone(profile.phone);
      setLocation(profile.location);
      setLocationLine2(profile.locationLine2);
      setTwitterUsername(profile.twitterUsername ?? "");
      setCalendarUrl((profile as any).calendarUrl ?? "");
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", `/api/dashboard/profile${sp}`, {
        name, tagline, bio,
        avatarUrl: avatarUrl || null,
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

const Megaphone = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m3 11 18-5v12L3 14v-3z" />
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </svg>
);
