import { Link } from "wouter";
import { Link as LinkIcon, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  getComplementsForSpecialties,
  getCategoryForSpecialty,
  CATEGORY_COLORS,
  rankConsultantsByComplementCoverage
} from "@/lib/constants";

interface Consultant {
  name: string;
  slug: string;
  tagline: string;
  specialties: string[];
}

interface Props {
  consultant: Consultant;
  allConsultants: Consultant[];
}

export function ConsultantComplements({ consultant, allConsultants }: Props) {
  const complementSpecialties = getComplementsForSpecialties(consultant.specialties);

  // Group complements by category
  const complementsByCategory: Record<string, string[]> = {};
  complementSpecialties.forEach((s) => {
    const cat = getCategoryForSpecialty(s);
    if (cat) {
      if (!complementsByCategory[cat]) complementsByCategory[cat] = [];
      complementsByCategory[cat].push(s);
    }
  });

  // Find partner consultants (exclude self)
  const otherConsultants = allConsultants.filter((c) => c.slug !== consultant.slug);
  const partners = rankConsultantsByComplementCoverage(complementSpecialties, otherConsultants).slice(0, 3);

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center gap-3 mb-12">
          <div className="p-3 rounded-2xl bg-purple-500/20 border border-purple-500/30">
            <LinkIcon className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold text-white">Pairs Well With</h2>
            <p className="text-gray-400">Strategic synergies to amplify your project's impact</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Complement Areas */}
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-xl font-display font-semibold text-white mb-4">Complementary Expertise</h3>
            <div className="space-y-4">
              {Object.entries(complementsByCategory).length > 0 ? (
                Object.entries(complementsByCategory).map(([category, specialties]) => {
                  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.Technical;
                  return (
                    <div key={category} className="space-y-2">
                      <div className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
                        {category}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {specialties.map((s) => (
                          <Badge
                            key={s}
                            variant="outline"
                            className={`${colors.bg} ${colors.border} ${colors.text} border`}
                          >
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 italic">No specific complements identified.</p>
              )}
            </div>
          </div>

          {/* Partner Consultants */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-display font-semibold text-white mb-6">Recommended Partners</h3>
            {partners.length > 0 ? (
              <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                {partners.map((partner) => (
                  <Card
                    key={partner.slug}
                    className="bg-black/40 border-white/5 hover-elevate transition-all overflow-hidden"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12 border-2 border-purple-500/20">
                          <AvatarFallback className="bg-purple-500/10 text-purple-400 font-bold">
                            {partner.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-bold text-white truncate">{partner.name}</h4>
                          <p className="text-sm text-gray-400 line-clamp-1 mb-3">{partner.tagline}</p>
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {partner.matchedSpecialties.slice(0, 3).map((s) => (
                              <Badge
                                key={s}
                                variant="secondary"
                                className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[10px] h-5"
                              >
                                {s}
                              </Badge>
                            ))}
                          </div>
                          <Link href={`/consultant/${partner.slug}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-between text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 group px-0 h-auto py-2"
                              data-testid={`link-view-profile-${partner.slug}`}
                            >
                              <span>View Profile</span>
                              <User className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed border-white/5 bg-white/5 text-center">
                <p className="text-gray-400 font-medium">More consultants coming soon</p>
                <p className="text-sm text-gray-500 mt-1">We're expanding the network to cover more synergies.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
