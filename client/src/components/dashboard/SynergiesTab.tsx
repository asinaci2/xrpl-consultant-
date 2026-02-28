import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, Link as LinkIcon, CheckCircle2, Circle, Users, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { 
  SPECIALTY_CATEGORIES, 
  CATEGORY_ORDER, 
  CATEGORY_COLORS, 
  getCategoryForSpecialty, 
  getComplementsForSpecialties,
  rankConsultantsByComplementCoverage
} from "@/lib/constants";
import { ConsultantProfile } from "./types";

interface Consultant {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  specialties: string[];
}

export function SynergiesTab({ slug }: { slug: string }) {
  const { data: profile } = useQuery<ConsultantProfile>({
    queryKey: ["/api/dashboard/profile", slug],
    enabled: !!slug,
  });

  const { data: allConsultants = [] } = useQuery<Consultant[]>({
    queryKey: ["/api/consultants"],
  });

  if (!profile) return null;

  const mySpecialties = profile.specialties || [];
  
  // 1. Ecosystem Position
  const coveredCategories = new Set(mySpecialties.map(s => getCategoryForSpecialty(s)).filter(Boolean));

  // 2. Complementary Areas
  const complementSpecialties = getComplementsForSpecialties(mySpecialties);
  
  const networkSpecialties = new Set<string>();
  allConsultants.forEach(c => {
    if (c.slug !== slug) {
      c.specialties.forEach(s => networkSpecialties.add(s));
    }
  });

  const coveredInNetwork = complementSpecialties.filter(s => networkSpecialties.has(s));
  const gapsInNetwork = complementSpecialties.filter(s => !networkSpecialties.has(s));

  // 3. Potential Partners
  const otherConsultants = allConsultants.filter(c => c.slug !== slug);
  const partners = rankConsultantsByComplementCoverage(complementSpecialties, otherConsultants).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Ecosystem Position */}
      <Card className="bg-gray-900 border-indigo-500/40" data-testid="card-ecosystem-position">
        <CardHeader className="pb-3 border-b border-indigo-500/20">
          <CardTitle className="text-indigo-400 flex items-center gap-2 text-base font-display">
            <Network className="w-5 h-5" />
            Ecosystem Position
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            {CATEGORY_ORDER.map(category => {
              const isCovered = coveredCategories.has(category);
              const colors = CATEGORY_COLORS[category];
              return (
                <div 
                  key={category}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                    isCovered 
                      ? `${colors.bg} ${colors.border} ${colors.text}` 
                      : "bg-gray-800/40 border-gray-700/50 text-gray-500"
                  }`}
                  data-testid={`badge-category-${category.toLowerCase()}`}
                >
                  {isCovered ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                  <span className="text-xs font-bold uppercase tracking-wider">{category}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-gray-400 leading-relaxed">
            Your current specialties cover <span className="text-white font-semibold">{coveredCategories.size} of {CATEGORY_ORDER.length}</span> ecosystem pillars. 
            Expanding into missing categories increases your strategic value in the network.
          </p>
        </CardContent>
      </Card>

      {/* Complementary Areas */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-green-500/20" data-testid="card-covered-network">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-400 text-sm flex items-center gap-2 font-display uppercase tracking-widest">
              <Users className="w-4 h-4" />
              Covered in Network
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {coveredInNetwork.length > 0 ? (
                coveredInNetwork.map(s => (
                  <Badge key={s} variant="outline" className="bg-green-500/5 border-green-500/20 text-green-400/80 text-[10px]" data-testid={`badge-covered-${s}`}>
                    {s}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-gray-500 italic">No covered complements identified</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-amber-500/20" data-testid="card-network-gaps">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-400 text-sm flex items-center gap-2 font-display uppercase tracking-widest">
              <LinkIcon className="w-4 h-4" />
              Gap in Network
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {gapsInNetwork.length > 0 ? (
                gapsInNetwork.map(s => (
                  <Badge key={s} variant="outline" className="bg-amber-500/5 border-amber-500/20 text-amber-400/80 text-[10px]" data-testid={`badge-gap-${s}`}>
                    {s}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-gray-500 italic">No network gaps identified</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Potential Partners */}
      <div className="space-y-4">
        <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" />
          Potential Partners
        </h3>
        <div className="grid gap-3">
          {partners.length > 0 ? (
            partners.map(partner => (
              <Card key={partner.slug} className="bg-gray-950 border-gray-800 hover:border-indigo-500/30 transition-colors group" data-testid={`card-partner-${partner.slug}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                        {partner.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors" data-testid={`text-partner-name-${partner.slug}`}>{partner.name}</h4>
                        <p className="text-xs text-gray-500 line-clamp-1 mb-2" data-testid={`text-partner-tagline-${partner.slug}`}>{partner.tagline}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {partner.matchedSpecialties.map(s => (
                            <Badge key={s} className="bg-indigo-500/10 text-indigo-400 border-none text-[9px] px-1.5 h-4" data-testid={`badge-match-${partner.slug}-${s}`}>
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Link href={`/c/${partner.slug}`}>
                      <a className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-indigo-500/50 transition-all shrink-0" data-testid={`link-partner-profile-${partner.slug}`}>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-sm text-gray-500 italic py-4 text-center border border-dashed border-gray-800 rounded-xl">
              No direct synergy partners found. Try expanding your specialties to discover new connections.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
