import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, ExternalLink, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { SectionBanner } from "./SectionBanner";
import { useAdminSlug } from "./context";
import { ConsultantProfile } from "./types";

type SchedulingProvider = "calendly" | "google" | "other" | null;

function detectProvider(url: string): SchedulingProvider {
  if (!url) return null;
  if (url.includes("calendly.com")) return "calendly";
  if (url.includes("calendar.google.com") || url.includes("cal.google.com")) return "google";
  if (url.trim().startsWith("http")) return "other";
  return null;
}

function getEmbedUrl(url: string, provider: SchedulingProvider): string | null {
  if (!url || !provider) return null;
  if (provider === "calendly") return url;
  if (provider === "google") {
    try {
      const parsed = new URL(url);
      if (parsed.searchParams.get("action") === "TEMPLATE") return null;
      return url;
    } catch {
      return null;
    }
  }
  return null;
}

export function SchedulingTab({ slug }: { slug: string }) {
  const { toast } = useToast();
  const override = useAdminSlug();
  const sp = override ? `?slug=${override}` : "";

  const { data: profile } = useQuery<ConsultantProfile>({
    queryKey: ["/api/dashboard/profile", override],
    queryFn: () => fetch(`/api/dashboard/profile${sp}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!slug,
  });

  const [calendarUrl, setCalendarUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.calendarUrl) {
      setCalendarUrl(profile.calendarUrl);
    }
  }, [profile]);

  const provider = detectProvider(calendarUrl);
  const embedUrl = getEmbedUrl(calendarUrl, provider);

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/dashboard/profile${sp}`, { calendarUrl: calendarUrl || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/profile", override] });
      toast({ title: "Saved", description: "Scheduling link updated on your profile." });
    },
    onError: () => toast({ title: "Error", description: "Failed to save.", variant: "destructive" }),
  });

  const clearMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/dashboard/profile${sp}`, { calendarUrl: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/profile", override] });
      setCalendarUrl("");
      setPreviewUrl(null);
      toast({ title: "Cleared", description: "Scheduling link removed." });
    },
  });

  return (
    <div className="space-y-5">
      <SectionBanner
        icon={Calendar}
        iconBg="bg-indigo-500/15"
        iconColor="text-indigo-400"
        borderColor="border-indigo-500"
        section="Scheduling"
        description="Add a booking link so visitors can schedule time with you directly from your profile."
        slug={slug}
        anchor="contact"
      />

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <Card className="bg-black/60 border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-400 text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Booking Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Calendar or Booking URL</label>
                <Input
                  value={calendarUrl}
                  onChange={e => setCalendarUrl(e.target.value)}
                  placeholder="https://calendly.com/your-username/meeting"
                  className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600"
                  data-testid="input-calendar-url"
                />
                {provider && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    <span className="text-xs text-green-400">
                      {provider === "calendly" && "Calendly link detected"}
                      {provider === "google" && "Google Calendar link detected"}
                      {provider === "other" && "Custom booking link"}
                    </span>
                  </div>
                )}
                {calendarUrl && !provider && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-xs text-amber-400">Enter a full URL starting with https://</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || !calendarUrl || !provider}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-save-calendar"
                >
                  {saveMutation.isPending ? "Saving..." : "Save Link"}
                </Button>
                {profile?.calendarUrl && (
                  <Button
                    variant="ghost"
                    onClick={() => clearMutation.mutate()}
                    disabled={clearMutation.isPending}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    data-testid="button-clear-calendar"
                  >
                    Remove
                  </Button>
                )}
                {calendarUrl && provider && (
                  <a
                    href={calendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-gray-400 hover:text-green-400 border border-green-500/20 hover:bg-green-500/10 transition-colors"
                    data-testid="link-open-calendar"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/60 border-green-500/10">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-gray-400">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-wide">Supported Platforms</span>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-start gap-3">
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px] shrink-0 mt-0.5">Calendly</Badge>
                  <div>
                    <p className="text-xs text-gray-300">Share your Calendly scheduling page</p>
                    <p className="text-[11px] text-gray-600 font-mono">calendly.com/your-name/meeting</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px] shrink-0 mt-0.5">Google Cal</Badge>
                  <div>
                    <p className="text-xs text-gray-300">Use your Google Calendar appointment URL</p>
                    <p className="text-[11px] text-gray-600 font-mono">calendar.google.com/calendar/appointments/...</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30 text-[10px] shrink-0 mt-0.5">Other</Badge>
                  <div>
                    <p className="text-xs text-gray-300">Any booking link (Cal.com, Doodle, etc.)</p>
                    <p className="text-[11px] text-gray-600 font-mono">Any full https:// URL works</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-indigo-400/60" />
            <span className="text-gray-400 text-xs font-medium">Preview on your profile</span>
          </div>

          {embedUrl && provider === "calendly" ? (
            <div
              className="rounded-xl border border-indigo-500/20 overflow-hidden"
              style={{ height: "480px" }}
              data-testid="div-calendar-embed"
            >
              <iframe
                src={`${embedUrl}?embed_domain=localhost&embed_type=Inline&hide_gdpr_banner=1`}
                width="100%"
                height="100%"
                frameBorder="0"
                title="Calendly Scheduling"
                style={{ border: "none" }}
              />
            </div>
          ) : calendarUrl && provider ? (
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-6 text-center space-y-3" style={{ minHeight: "200px" }}>
              <Calendar className="w-10 h-10 text-indigo-400/60 mx-auto" />
              <div>
                <p className="text-white text-sm font-medium">Booking link saved</p>
                <p className="text-gray-500 text-xs mt-1">Visitors will see a "Book a Call" button on your profile that opens this link.</p>
              </div>
              <a
                href={calendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-indigo-400 text-xs hover:text-indigo-300 transition-colors"
                data-testid="link-preview-calendar"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open booking page
              </a>
            </div>
          ) : (
            <div className="rounded-xl border border-green-500/10 bg-black/20 p-6 text-center space-y-2" style={{ minHeight: "200px" }}>
              <Calendar className="w-10 h-10 text-gray-700 mx-auto" />
              <p className="text-gray-600 text-sm">Enter a booking link to preview</p>
              <p className="text-gray-700 text-xs">Calendly links will show an inline embed. Other platforms open in a new tab.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
