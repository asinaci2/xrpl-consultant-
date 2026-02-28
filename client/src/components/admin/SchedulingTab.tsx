import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, CheckCircle2, XCircle, ExternalLink, Edit2, X, Save } from "lucide-react";
import { ConsultantEntry } from "./types";

type SchedulingProvider = "calendly" | "google" | "other" | null;

function detectProvider(url: string): SchedulingProvider {
  if (!url) return null;
  if (url.includes("calendly.com")) return "calendly";
  if (url.includes("calendar.google.com") || url.includes("cal.google.com")) return "google";
  if (url.trim().startsWith("http")) return "other";
  return null;
}

function ProviderBadge({ url }: { url: string | null }) {
  if (!url) return <span className="text-gray-600 text-xs font-mono">Not configured</span>;
  const p = detectProvider(url);
  if (p === "calendly") return <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px]">Calendly</Badge>;
  if (p === "google") return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px]">Google Cal</Badge>;
  return <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30 text-[10px]">Custom</Badge>;
}

type ConsultantWithCalendar = ConsultantEntry & { calendarUrl?: string | null };

function ConsultantSchedulingRow({ consultant }: { consultant: ConsultantWithCalendar }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(consultant.calendarUrl ?? "");

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/consultants/${consultant.slug}`, { calendarUrl: url || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultants"] });
      setEditing(false);
      toast({ title: "Saved", description: `Scheduling link updated for ${consultant.name}.` });
    },
    onError: () => toast({ title: "Error", description: "Failed to save.", variant: "destructive" }),
  });

  const clearMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/consultants/${consultant.slug}`, { calendarUrl: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultants"] });
      setUrl("");
      setEditing(false);
      toast({ title: "Cleared" });
    },
  });

  return (
    <div className="p-4 rounded-lg border border-green-500/10 bg-black/30 space-y-3" data-testid={`card-scheduling-${consultant.slug}`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <span className="text-indigo-300 text-xs font-bold">{(consultant.name || consultant.slug).charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{consultant.name || consultant.slug}</p>
            <p className="text-gray-600 text-xs font-mono truncate">/{consultant.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {consultant.calendarUrl ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              <ProviderBadge url={consultant.calendarUrl} />
            </>
          ) : (
            <>
              <XCircle className="w-3.5 h-3.5 text-gray-600" />
              <ProviderBadge url={null} />
            </>
          )}
          {consultant.calendarUrl && !editing && (
            <a
              href={consultant.calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-indigo-400 transition-colors"
              data-testid={`link-calendar-${consultant.slug}`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setEditing(e => !e); setUrl(consultant.calendarUrl ?? ""); }}
            className="text-green-400 hover:text-green-300 hover:bg-green-500/10 h-7 w-7"
            data-testid={`button-edit-scheduling-${consultant.slug}`}
          >
            {editing ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {!editing && consultant.calendarUrl && (
        <p className="text-gray-500 text-xs font-mono truncate pl-11">{consultant.calendarUrl}</p>
      )}

      {editing && (
        <div className="pl-11 space-y-2">
          <Input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://calendly.com/username/meeting"
            className="bg-black/40 border-green-500/20 text-white text-sm placeholder:text-gray-600"
            data-testid={`input-scheduling-url-${consultant.slug}`}
          />
          {url && <ProviderBadge url={url} />}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-xs"
              data-testid={`button-save-scheduling-${consultant.slug}`}
            >
              <Save className="w-3 h-3 mr-1" />
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
            {consultant.calendarUrl && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => clearMutation.mutate()}
                disabled={clearMutation.isPending}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 text-xs"
                data-testid={`button-clear-scheduling-${consultant.slug}`}
              >
                Remove Link
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function SchedulingTab() {
  const { data: consultants = [], isLoading } = useQuery<ConsultantWithCalendar[]>({
    queryKey: ["/api/consultants"],
  });

  const configured = consultants.filter(c => c.calendarUrl);
  const unconfigured = consultants.filter(c => !c.calendarUrl);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-black/60 border-green-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-black/40 border border-indigo-500/20 text-indigo-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-mono">Total Consultants</p>
              <p className="text-2xl font-bold text-white font-mono">{consultants.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/60 border-green-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-black/40 border border-green-500/20 text-green-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-mono">Booking Configured</p>
              <p className="text-2xl font-bold text-white font-mono">{configured.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/60 border-green-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-black/40 border border-amber-500/20 text-amber-400">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-mono">Not Configured</p>
              <p className="text-2xl font-bold text-white font-mono">{unconfigured.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black/60 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-400 text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Consultant Scheduling Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : consultants.length === 0 ? (
            <p className="text-gray-400 text-sm">No consultants found.</p>
          ) : (
            <div className="space-y-3">
              {configured.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-green-400/60">Configured</p>
                  {configured.map(c => <ConsultantSchedulingRow key={c.slug} consultant={c} />)}
                </div>
              )}
              {unconfigured.length > 0 && (
                <div className="space-y-2">
                  {configured.length > 0 && <div className="border-t border-green-500/10 pt-2" />}
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/60">Not Configured</p>
                  {unconfigured.map(c => <ConsultantSchedulingRow key={c.slug} consultant={c} />)}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
