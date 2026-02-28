import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, LayoutDashboard, BadgeCheck, BadgeX, ExternalLink } from "lucide-react";
import { ConsultantEntry } from "./types";

export function ConsultantsTab() {
  const [, setLocation] = useLocation();
  const { data: consultants = [], isLoading } = useQuery<ConsultantEntry[]>({
    queryKey: ["/api/consultants"],
  });

  return (
    <div className="space-y-4">
      <Card className="bg-black/60 border-green-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-400 text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            All Consultants
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : consultants.length === 0 ? (
            <p className="text-gray-500 text-sm font-mono">No consultants found.</p>
          ) : (
            <div className="space-y-3">
              {consultants.map(c => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg border border-green-500/10 bg-black/30 hover:border-green-500/30 transition-colors"
                  data-testid={`row-consultant-${c.slug}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-green-900/40 flex items-center justify-center shrink-0">
                      {c.avatarUrl ? (
                        <img src={c.avatarUrl} alt={c.name} className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <span className="text-green-400 font-mono font-bold text-sm">{c.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white text-sm font-semibold truncate" data-testid={`text-consultant-name-${c.slug}`}>{c.name}</span>
                        {c.isActive ? (
                          <span className="text-xs text-green-400 font-mono border border-green-500/30 rounded-full px-2 py-0.5 flex items-center gap-1">
                            <BadgeCheck className="w-3 h-3" />active
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 font-mono border border-gray-700 rounded-full px-2 py-0.5 flex items-center gap-1">
                            <BadgeX className="w-3 h-3" />inactive
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs font-mono truncate">/{c.slug}</p>
                      {c.matrixUserId && (
                        <p className="text-gray-600 text-xs font-mono truncate max-w-[240px]">{c.matrixUserId}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-500/30 text-green-400 hover:bg-green-500/10 text-xs h-8"
                      onClick={() => setLocation(`/dashboard?slug=${c.slug}`)}
                      data-testid={`button-open-dashboard-${c.slug}`}
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
                      Dashboard
                    </Button>
                    <a
                      href={`/c/${c.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`link-view-page-${c.slug}`}
                    >
                      <Button size="sm" variant="ghost" className="text-gray-400 hover:text-green-400 hover:bg-green-500/10 text-xs h-8">
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                        Page
                      </Button>
                    </a>
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
