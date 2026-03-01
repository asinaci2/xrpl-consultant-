import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Layers, FileText, Globe2, Eye } from "lucide-react";
import { SectionBanner } from "./SectionBanner";
import { FieldLabel } from "./FieldLabel";
import { useAdminSlug, useSlugParam } from "./context";
import { ECOSYSTEM_CATEGORIES, ALIGNMENT_PILL } from "@/lib/constants";
import { ConsultantProfile } from "./types";

function slugify(cat: string) {
  return cat.replace(/[\s/()]+/g, "-").toLowerCase();
}

export function ExpertiseTab({ slug }: { slug: string }) {
  const { toast } = useToast();
  const sp = useSlugParam();
  const override = useAdminSlug();

  const { data: profile, isLoading } = useQuery<ConsultantProfile>({
    queryKey: ["/api/dashboard/profile", override],
    queryFn: () => fetch(`/api/dashboard/profile${sp}`, { credentials: "include" }).then(r => r.json()),
  });

  const [expertiseStatement, setExpertiseStatement] = useState("");
  const [ecosystemAlignments, setEcosystemAlignments] = useState<string[]>([]);

  useEffect(() => {
    if (profile) {
      setExpertiseStatement(profile.expertiseStatement ?? "");
      setEcosystemAlignments(profile.ecosystemAlignments ?? []);
    }
  }, [profile]);

  const toggleAlignment = (cat: string) => {
    setEcosystemAlignments(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", `/api/dashboard/profile${sp}`, {
        expertiseStatement,
        ecosystemAlignments,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/profile", override] });
      queryClient.invalidateQueries({ queryKey: ["/api/consultants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/consultants", slug] });
      toast({ title: "Expertise saved", description: "Your ecosystem profile has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not save expertise.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionBanner
        icon={Layers}
        title="Ecosystem Expertise"
        description="Describe your XRPL/Web3 depth and declare which areas of the ecosystem you work in. This enriches how you appear when linked to ecosystem projects in the directory."
      />

      {/* Ecosystem Alignment */}
      <Card className="bg-black/60 border-green-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-400 text-base flex items-center gap-2">
            <Globe2 className="w-4 h-4" />
            Ecosystem Alignment
          </CardTitle>
          <p className="text-gray-500 text-xs">
            Which areas of the XRPL ecosystem do you work in? These map directly to the XRPL Ecosystem Directory categories and help admin match you to the right projects.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2" data-testid="alignment-selector">
            {ECOSYSTEM_CATEGORIES.map(cat => {
              const selected = ecosystemAlignments.includes(cat);
              const styles = selected ? ALIGNMENT_PILL.selected : ALIGNMENT_PILL.unselected;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleAlignment(cat)}
                  data-testid={`chip-alignment-${slugify(cat)}`}
                  className={`px-3 py-1.5 rounded-full text-sm font-mono transition-all duration-150 border ${styles.bg} ${styles.border} ${styles.text} ${
                    selected
                      ? "shadow-[0_0_8px_rgba(168,85,247,0.25)]"
                      : "hover:border-purple-500/40 hover:text-gray-300"
                  }`}
                >
                  {selected && <span className="mr-1">✓</span>}{cat}
                </button>
              );
            })}
          </div>
          {ecosystemAlignments.length > 0 && (
            <p className="text-purple-400/60 text-xs font-mono mt-3">{ecosystemAlignments.length} area{ecosystemAlignments.length !== 1 ? "s" : ""} selected</p>
          )}
        </CardContent>
      </Card>

      {/* Expertise Statement */}
      <Card className="bg-black/60 border-green-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-400 text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Expertise Statement
          </CardTitle>
          <p className="text-gray-500 text-xs">
            A focused statement about your Web3/XRPL expertise — distinct from your general bio. Appears on your public profile and helps connect you to ecosystem projects.
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={expertiseStatement}
            onChange={e => setExpertiseStatement(e.target.value)}
            placeholder="e.g. I specialize in building DeFi liquidity solutions on the XRP Ledger, with hands-on experience deploying AMM pools, cross-border payment corridors, and tokenized real-world asset frameworks for institutional clients."
            className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600 min-h-[120px] resize-none"
            data-testid="textarea-expertise-statement"
          />
          <p className="text-gray-600 text-xs mt-2 font-mono">{expertiseStatement.length} characters</p>
        </CardContent>
      </Card>

      {/* Live preview */}
      {(expertiseStatement || ecosystemAlignments.length > 0) && (
        <Card className="bg-black/60 border-purple-500/20" data-testid="panel-expertise-preview">
          <CardHeader className="pb-3">
            <CardTitle className="text-purple-400/80 text-sm flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview — how you appear when linked to an ecosystem project
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-purple-500/5 border border-purple-500/15 p-4 space-y-3">
              {profile?.avatarUrl && (
                <div className="flex items-center gap-2">
                  <img src={profile.avatarUrl} alt={profile.name} className="w-7 h-7 rounded-full object-cover border border-purple-500/30" />
                  <span className="text-white text-sm font-medium">{profile.name}</span>
                </div>
              )}
              {expertiseStatement && (
                <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">{expertiseStatement}</p>
              )}
              {ecosystemAlignments.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {ecosystemAlignments.map(cat => (
                    <span
                      key={cat}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-mono border ${ALIGNMENT_PILL.selected.bg} ${ALIGNMENT_PILL.selected.border} ${ALIGNMENT_PILL.selected.text}`}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="bg-green-600 hover:bg-green-700 text-white font-mono"
        data-testid="button-save-expertise"
      >
        {saveMutation.isPending ? "Saving…" : "Save Expertise"}
      </Button>
    </div>
  );
}
