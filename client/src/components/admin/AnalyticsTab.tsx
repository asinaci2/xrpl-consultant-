import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart2, 
  Users, 
  CheckCircle2, 
  Activity,
  Shield,
  Zap,
  Link as LinkIcon
} from "lucide-react";
import { 
  SPECIALTY_CATEGORIES, 
  CATEGORY_ORDER, 
  CATEGORY_COLORS,
  SPECIALTY_COMPLEMENTS
} from "@/lib/constants";
import { Consultant } from "@shared/schema";

export function AnalyticsTab() {
  const { data: consultants = [], isLoading } = useQuery<Consultant[]>({
    queryKey: ["/api/consultants"],
  });

  if (isLoading) {
    return <div className="text-green-400 font-mono text-sm">Loading analytics...</div>;
  }

  const activeConsultants = consultants.filter(c => c.isActive);
  const totalConsultants = consultants.length;
  
  const allSpecialtiesInNetwork = new Set<string>();
  consultants.forEach(c => (c.specialties || []).forEach((s: string) => allSpecialtiesInNetwork.add(s)));
  
  const categoriesWithCoverage = CATEGORY_ORDER.filter(cat => 
    SPECIALTY_CATEGORIES[cat].some(s => allSpecialtiesInNetwork.has(s))
  ).length;

  // 1. Network Health Stats
  const stats = [
    { label: "Total Consultants", value: totalConsultants, icon: Users, color: "text-blue-400" },
    { label: "Active Consultants", value: activeConsultants.length, icon: CheckCircle2, color: "text-green-400" },
    { label: "Specialties Covered", value: allSpecialtiesInNetwork.size, icon: Zap, color: "text-purple-400" },
    { label: "Categories Covered", value: `${categoriesWithCoverage}/4`, icon: Shield, color: "text-orange-400" },
  ];

  // Helper for specialty counts
  const getSpecialtyCount = (specialty: string) => 
    consultants.filter(c => (c.specialties || []).includes(specialty)).length;

  // 4. Complement Chain Coverage
  const complementPairs: { from: string; to: string; status: "Strong" | "Thin" | "Gap" }[] = [];
  const processedPairs = new Set<string>();

  Object.entries(SPECIALTY_COMPLEMENTS).forEach(([from, complements]) => {
    complements.forEach(to => {
      const pairKey = [from, to].sort().join("-");
      if (processedPairs.has(pairKey)) return;
      processedPairs.add(pairKey);

      const countFrom = getSpecialtyCount(from);
      const countTo = getSpecialtyCount(to);

      if (countFrom > 0 || countTo > 0) {
        let status: "Strong" | "Thin" | "Gap";
        if (countFrom >= 2 && countTo >= 2) status = "Strong";
        else if (countFrom >= 1 && countTo >= 1) status = "Thin";
        else status = "Gap";

        complementPairs.push({ from, to, status });
      }
    });
  });

  return (
    <div className="space-y-6">
      {/* 1. Network Health */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-black/60 border-green-500/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-2 rounded-lg bg-black/40 border border-green-500/10 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-gray-500 text-xs font-mono">{stat.label}</p>
                <p className="text-xl font-bold text-white font-mono">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. Specialty Coverage */}
        <Card className="bg-black/60 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-green-400 text-base flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Specialty Coverage Heatmap
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {CATEGORY_ORDER.map(category => (
              <div key={category} className="space-y-2">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${CATEGORY_COLORS[category].text}`}>
                  {category}
                </h4>
                <div className="space-y-3">
                  {SPECIALTY_CATEGORIES[category].map(specialty => {
                    const count = getSpecialtyCount(specialty);
                    const percentage = totalConsultants > 0 ? (count / totalConsultants) * 100 : 0;
                    return (
                      <div key={specialty} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className={count === 0 ? "text-amber-500" : "text-gray-300"}>
                            {specialty} {count === 0 && "(GAP)"}
                          </span>
                          <span className="text-gray-500">{count} consultants</span>
                        </div>
                        <Progress 
                          value={percentage} 
                          className="h-1 bg-black/40" 
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* 3. Category Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CATEGORY_ORDER.map(category => {
              const categorySpecialties = SPECIALTY_CATEGORIES[category];
              const consultantsInCat = consultants.filter(c => 
                (c.specialties || []).some((s: string) => categorySpecialties.includes(s))
              ).length;
              const coveredSpecialties = categorySpecialties.filter(s => allSpecialtiesInNetwork.has(s));
              const missingSpecialties = categorySpecialties.filter(s => !allSpecialtiesInNetwork.has(s));
              
              return (
                <Card key={category} className="bg-black/60 border-green-500/10">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className={`text-sm font-bold ${CATEGORY_COLORS[category].text}`}>{category}</h4>
                      <span className="text-xs font-mono text-gray-500">
                        {Math.round((consultantsInCat / (totalConsultants || 1)) * 100)}%
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-white font-mono">{consultantsInCat}</div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Coverage</p>
                      <div className="flex flex-wrap gap-1">
                        {coveredSpecialties.map(s => (
                          <span key={s} className="w-1.5 h-1.5 rounded-full bg-green-500" title={s} />
                        ))}
                        {missingSpecialties.map(s => (
                          <span key={s} className="w-1.5 h-1.5 rounded-full bg-amber-500" title={s} />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 4. Complement Chain Coverage */}
          <Card className="bg-black/60 border-green-500/20">
            <CardHeader>
              <CardTitle className="text-green-400 text-base flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Complement Chain Coverage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2">
                {complementPairs.map((pair, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-2 rounded border border-green-500/5 bg-black/20 text-[10px] font-mono"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-gray-300 truncate max-w-[80px]">{pair.from}</span>
                      <span className="text-gray-600">↔</span>
                      <span className="text-gray-300 truncate max-w-[80px]">{pair.to}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold ${
                      pair.status === "Strong" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                      pair.status === "Thin" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                      "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}>
                      {pair.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
