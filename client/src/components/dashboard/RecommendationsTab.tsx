import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Sparkles, ExternalLink } from "lucide-react";
import { 
  getComplementsForSpecialties, 
  rankConsultantsByComplementCoverage,
  getCategoryForSpecialty,
  CATEGORY_COLORS
} from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

type Consultant = {
  id: number;
  name: string;
  slug: string;
  tagline: string | null;
  specialties: string[];
  avatarUrl: string | null;
};

type ContactRecord = {
  id: number;
  consultantSlug: string;
  consultantName: string;
  consultantTagline: string;
  consultantAvatarUrl: string | null;
  note: string | null;
};

export function RecommendationsTab() {
  const { data: allConsultants = [], isLoading: consultantsLoading } = useQuery<Consultant[]>({
    queryKey: ["/api/consultants"],
  });

  const { data: contacts = [], isLoading: contactsLoading } = useQuery<ContactRecord[]>({
    queryKey: ["/api/visitor/contacts"],
    queryFn: () => fetch("/api/visitor/contacts", { credentials: "include" }).then(r => r.json()),
  });

  const isLoading = consultantsLoading || contactsLoading;

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-purple-500/40" data-testid="card-recommendations-loading">
        <CardHeader className="pb-3">
          <CardTitle className="text-purple-400 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Recommended for You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 animate-pulse">
            {[1, 2].map(i => <div key={i} className="h-24 bg-white/10 rounded-xl" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (contacts.length === 0) {
    return (
      <Card className="bg-gray-900 border-purple-500/40" data-testid="card-recommendations-empty">
        <CardHeader className="pb-3">
          <CardTitle className="text-purple-400 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Recommended for You
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Sparkles className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/70 text-sm">Save consultants to get personalized recommendations</p>
        </CardContent>
      </Card>
    );
  }

  // Logic:
  // 1. Collect all unique specialties from saved contacts
  const savedSlugs = new Set(contacts.map(c => c.consultantSlug));
  const savedSpecialties = new Set<string>();
  
  // We need the full consultant data for the contacts to get their specialties
  contacts.forEach(contact => {
    const consultant = allConsultants.find(c => c.slug === contact.consultantSlug);
    if (consultant) {
      consultant.specialties.forEach(s => savedSpecialties.add(s));
    }
  });

  // 2. Get complement areas not yet in saved contacts
  const complementSpecialties = getComplementsForSpecialties(Array.from(savedSpecialties));
  
  // 3. Find consultants covering those gaps
  const recommendations = rankConsultantsByComplementCoverage(
    complementSpecialties,
    allConsultants.filter(c => !savedSlugs.has(c.slug))
  ).slice(0, 3);

  if (recommendations.length === 0) {
    return (
      <Card className="bg-gray-900 border-purple-500/40" data-testid="card-recommendations-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-purple-400 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Recommended for You
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Sparkles className="w-10 h-10 text-green-500/40 mx-auto mb-3" />
          <p className="text-white/70 text-sm">You've got great coverage! Browse the directory to discover more.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-purple-500/40" data-testid="card-recommendations">
      <CardHeader className="pb-3">
        <CardTitle className="text-purple-400 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Recommended for You
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div 
              key={rec.slug} 
              className="group relative rounded-xl border border-purple-500/20 bg-white/5 p-4 hover:bg-white/10 transition-colors"
              data-testid={`card-recommendation-${rec.slug}`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 font-bold text-xl shrink-0">
                  {rec.avatarUrl 
                    ? <img src={rec.avatarUrl} alt={rec.name} className="w-12 h-12 rounded-full object-cover" />
                    : rec.name.charAt(0).toUpperCase()
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-white font-bold text-lg truncate" data-testid={`text-recommendation-name-${rec.slug}`}>{rec.name}</h3>
                    <Link href={`/c/${rec.slug}`}>
                      <Button size="sm" variant="ghost" className="text-purple-400 hover:text-purple-300 -mr-2" data-testid={`link-view-profile-${rec.slug}`}>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                  {rec.tagline && (
                    <p className="text-white/60 text-sm mb-3 line-clamp-1" data-testid={`text-recommendation-tagline-${rec.slug}`}>{rec.tagline}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {rec.matchedSpecialties.map(specialty => {
                      const category = getCategoryForSpecialty(specialty);
                      const colors = category ? CATEGORY_COLORS[category] : { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400" };
                      
                      return (
                        <Badge 
                          key={specialty}
                          variant="outline"
                          className={`${colors.bg} ${colors.border} ${colors.text} text-[10px] font-bold uppercase px-2 py-0 rounded-full border shadow-sm`}
                          data-testid={`badge-recommendation-specialty-${rec.slug}-${specialty.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {specialty}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-purple-400/60 hover:text-purple-300 text-xs w-full mt-2" data-testid="button-browse-more-recommendations">
              Browse directory for more insights
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
