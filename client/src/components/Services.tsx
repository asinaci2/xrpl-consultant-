import { motion, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  SPECIALTY_CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_ORDER,
  getCategoryForSpecialty,
  ALIGNMENT_PILL,
} from "@/lib/constants";
import { ICON_MAP } from "@/components/dashboard/constants";
import type { ConsultantService } from "@shared/schema";

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  Technical:   "XRPL and Web3 technical implementation, integration, and architecture.",
  Innovative:  "Emerging Web3 strategies — NFTs, DAOs, token design, and crypto education.",
  Community:   "Building and growing decentralised communities and ambassador networks.",
  Growth:      "Marketing, content creation, social media, and ecosystem expansion.",
};

const CATEGORY_ICONS: Record<string, string> = {
  Technical:  "⚙️",
  Innovative: "✨",
  Community:  "🤝",
  Growth:     "📈",
};

interface ServicesConsultant {
  specialties: string[];
  expertiseStatement: string;
  ecosystemAlignments: string[];
}

export function Services({ consultant, slug }: { consultant: ServicesConsultant; slug: string }) {
  const shouldReduceMotion = useReducedMotion();

  const { data: serviceEntries = [] } = useQuery<ConsultantService[]>({
    queryKey: ["/api/c", slug, "services"],
  });

  const description = consultant.expertiseStatement?.trim()
    || "Specialist in XRPL strategy, Web3 development, and blockchain consulting.";

  const serviceCards = CATEGORY_ORDER
    .map(category => ({
      category,
      specialties: (consultant.specialties ?? []).filter(s =>
        (SPECIALTY_CATEGORIES[category] ?? []).includes(s)
      ),
    }))
    .filter(({ specialties }) => specialties.length > 0);

  const hasSpecialties = consultant.specialties?.length > 0;
  const hasAlignments = consultant.ecosystemAlignments?.length > 0;
  const hasServiceEntries = serviceEntries.length > 0;

  return (
    <section id="services" className="section-padding bg-black/80 backdrop-blur-sm" data-testid="section-services">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-green-400 font-semibold tracking-wide uppercase text-sm mb-3">Consultant Services</h2>
          <h3 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
            XRPL & Web3 Expertise
          </h3>
          <p className="text-lg text-gray-400" data-testid="text-services-description">
            {description}
          </p>
        </div>

        {/* Service cards — real entries take priority, fallback to specialty categories */}
        {hasServiceEntries ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 mb-20">
            {serviceEntries.map((s, index) => {
              const IconComp = ICON_MAP[s.icon ?? "Briefcase"] ?? ICON_MAP["Briefcase"];
              return (
                <motion.div
                  key={s.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                  whileInView={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
                  transition={shouldReduceMotion ? {} : { duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card
                    className="h-full hover-elevate border border-green-500/20 bg-black/60"
                    data-testid={`card-service-${s.id}`}
                  >
                    <CardContent className="p-8">
                      <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-5">
                        <IconComp className="w-6 h-6 text-green-400" />
                      </div>
                      <h4 className="text-xl font-display font-bold mb-2 text-white">
                        {s.title}
                      </h4>
                      {s.description && (
                        <p className="text-gray-400 text-sm leading-relaxed">
                          {s.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : hasSpecialties ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 mb-20">
            {serviceCards.map(({ category, specialties }, index) => {
              const colors = CATEGORY_COLORS[category];
              return (
                <motion.div
                  key={category}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                  whileInView={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
                  transition={shouldReduceMotion ? {} : { duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card
                    className={`h-full hover-elevate border ${colors.border} bg-black/60`}
                    data-testid={`card-service-${category.toLowerCase()}`}
                  >
                    <CardContent className="p-8">
                      <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-5 text-2xl`}>
                        {CATEGORY_ICONS[category]}
                      </div>
                      <h4 className={`text-xl font-display font-bold mb-2 ${colors.text}`}>
                        {category}
                      </h4>
                      <p className="text-gray-500 text-sm mb-5 leading-relaxed">
                        {CATEGORY_DESCRIPTIONS[category]}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {specialties.map(s => (
                          <span
                            key={s}
                            className={`px-3 py-1 rounded-full text-xs font-mono border ${colors.bg} ${colors.border} ${colors.text}`}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="mb-20 text-center py-12 rounded-xl border border-green-500/10 bg-black/40">
            <p className="text-gray-500 text-sm font-mono">Service specialties not yet published.</p>
          </div>
        )}

        {/* Core Expertise badges */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? {} : { duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h3 className="text-2xl font-display font-bold text-white mb-8" data-testid="text-skills-title">
            Core Expertise
          </h3>

          {hasSpecialties ? (
            <div className="flex flex-wrap justify-center gap-3 mb-10" data-testid="container-skills">
              {(consultant.specialties ?? []).map(specialty => {
                const category = getCategoryForSpecialty(specialty);
                const colors = category ? CATEGORY_COLORS[category] : CATEGORY_COLORS.Technical;
                return (
                  <Badge
                    key={specialty}
                    variant="secondary"
                    className={`flex items-center gap-1.5 px-3 py-1.5 border font-mono text-xs ${colors.bg} ${colors.border} ${colors.text} bg-opacity-100`}
                    data-testid={`badge-skill-${specialty.replace(/\s+/g, "-").toLowerCase()}`}
                  >
                    {specialty}
                  </Badge>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-600 text-sm font-mono mb-10">No specialties selected yet.</p>
          )}

          {/* Ecosystem Focus */}
          {hasAlignments && (
            <div data-testid="container-ecosystem-focus" className="mt-10">
              <h4 className="text-lg font-display font-semibold text-purple-300 mb-4">Ecosystem Focus</h4>
              <div className="flex flex-wrap justify-center gap-2">
                {(consultant.ecosystemAlignments ?? []).map(cat => (
                  <a
                    key={cat}
                    href={`/?view=ecosystem&cat=${encodeURIComponent(cat)}`}
                    data-testid={`badge-ecosystem-${cat.replace(/[\s/()]+/g, "-").toLowerCase()}`}
                    className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-opacity hover:opacity-80 ${ALIGNMENT_PILL.selected.bg} ${ALIGNMENT_PILL.selected.border} ${ALIGNMENT_PILL.selected.text}`}
                  >
                    {cat}
                  </a>
                ))}
              </div>
            </div>
          )}
        </motion.div>

      </div>
    </section>
  );
}
