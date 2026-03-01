import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ExternalLink } from "lucide-react";
import { type EcosystemProject } from "@shared/schema";
import { ECOSYSTEM_CATEGORIES, ECOSYSTEM_STATUS_COLORS } from "@/lib/constants";

interface Consultant {
  id: number;
  slug: string;
  name: string;
  avatarUrl: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const colors = ECOSYSTEM_STATUS_COLORS[status] ?? ECOSYSTEM_STATUS_COLORS["Live"];
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${colors.bg} ${colors.border} ${colors.text}`}>
      {status}
    </span>
  );
}

function ConsultantBadge({ consultant, slug }: { consultant: Consultant; slug: string }) {
  return (
    <Link href={`/c/${slug}`}>
      <a
        className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-mono hover:bg-purple-500/20 hover:border-purple-500/40 transition-colors"
        data-testid={`badge-consultant-${slug}`}
      >
        {consultant.avatarUrl ? (
          <img src={consultant.avatarUrl} alt={consultant.name} className="w-4 h-4 rounded-full object-cover shrink-0" />
        ) : (
          <span className="w-4 h-4 rounded-full bg-purple-500/30 flex items-center justify-center text-[9px] font-bold shrink-0">
            {consultant.name.charAt(0)}
          </span>
        )}
        {consultant.name}
      </a>
    </Link>
  );
}

function SkeletonRow() {
  return (
    <div className="p-4 rounded-xl border border-green-500/10 bg-black/30 animate-pulse space-y-2">
      <div className="h-4 bg-green-900/30 rounded w-1/3" />
      <div className="h-3 bg-green-900/20 rounded w-2/3" />
      <div className="flex gap-2">
        <div className="h-5 w-12 bg-green-900/20 rounded-full" />
        <div className="h-5 w-16 bg-green-900/20 rounded-full" />
      </div>
    </div>
  );
}

export function EcosystemDirectory() {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const { data: projects = [], isLoading } = useQuery<EcosystemProject[]>({
    queryKey: ["/api/ecosystem"],
  });

  const { data: consultants = [] } = useQuery<Consultant[]>({
    queryKey: ["/api/consultants"],
  });

  const consultantMap = useMemo(() => {
    const m = new Map<string, Consultant>();
    consultants.forEach(c => m.set(c.slug, c));
    return m;
  }, [consultants]);

  const filtered = useMemo(() =>
    activeCategory === "All" ? projects : projects.filter(p => p.category === activeCategory),
    [projects, activeCategory]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, EcosystemProject[]>();
    ECOSYSTEM_CATEGORIES.forEach(cat => map.set(cat, []));
    filtered.forEach(p => {
      const list = map.get(p.category);
      if (list) list.push(p);
    });
    return map;
  }, [filtered]);

  const visibleCategories = useMemo(() =>
    ECOSYSTEM_CATEGORIES.filter(cat => (grouped.get(cat)?.length ?? 0) > 0),
    [grouped]
  );

  return (
    <div className="space-y-8">
      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        {["All", ...ECOSYSTEM_CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all duration-200 ${
              activeCategory === cat
                ? "bg-green-500/20 border-green-500/50 text-green-400"
                : "bg-black/40 border-green-500/10 text-gray-500 hover:border-green-500/30 hover:text-green-400/70"
            }`}
            data-testid={`button-ecosystem-filter-${cat.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-3">
              <div className="h-5 bg-green-900/30 rounded w-48 animate-pulse" />
              {[1, 2].map(j => <SkeletonRow key={j} />)}
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 font-mono text-sm">No ecosystem projects listed yet.</p>
          <p className="text-gray-600 text-xs mt-2">Check back soon — the XRPL ecosystem is growing fast.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {visibleCategories.map(category => {
            const items = grouped.get(category) ?? [];
            return (
              <section key={category} data-testid={`section-ecosystem-${category.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-white font-display font-bold text-lg">{category}</h2>
                  <span className="text-green-400/50 font-mono text-xs">{items.length} project{items.length !== 1 ? "s" : ""}</span>
                  <div className="flex-1 h-px bg-green-500/10" />
                </div>

                <div className="space-y-3">
                  {items.map(project => {
                    const linkedConsultants = (project.consultantSlugs ?? [])
                      .map(s => consultantMap.get(s))
                      .filter(Boolean) as Consultant[];

                    return (
                      <div
                        key={project.id}
                        className="group rounded-xl border border-green-500/10 bg-black/40 hover:border-green-500/25 hover:bg-black/60 transition-[border-color,background-color] duration-200 p-4"
                        data-testid={`card-ecosystem-${project.id}`}
                      >
                        <div className="flex items-start gap-4 flex-wrap md:flex-nowrap">
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white font-semibold text-sm" data-testid={`text-ecosystem-name-${project.id}`}>
                                {project.name}
                              </span>
                              {project.token && (
                                <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/25 text-green-400 text-[10px] font-mono font-bold" data-testid={`badge-token-${project.id}`}>
                                  {project.token}
                                </span>
                              )}
                              <StatusBadge status={project.status ?? "Live"} />
                            </div>

                            {project.description && (
                              <p className="text-white/50 text-xs leading-relaxed" data-testid={`text-ecosystem-desc-${project.id}`}>
                                {project.description}
                              </p>
                            )}

                            {(project.xrplFeatures ?? []).length > 0 && (
                              <div className="flex flex-wrap gap-1" data-testid={`features-${project.id}`}>
                                {(project.xrplFeatures ?? []).map(f => (
                                  <span key={f} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-white/40 font-mono">
                                    {f}
                                  </span>
                                ))}
                              </div>
                            )}

                            {linkedConsultants.length > 0 && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-gray-600 text-[10px] font-mono">Experts:</span>
                                {linkedConsultants.map(c => (
                                  <ConsultantBadge key={c.slug} consultant={c} slug={c.slug} />
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
                            {project.website && (
                              <a
                                href={project.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-400/60 hover:text-blue-400 transition-colors"
                                data-testid={`link-ecosystem-website-${project.id}`}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Website
                              </a>
                            )}
                            {project.xHandle && (
                              <a
                                href={`https://x.com/${project.xHandle}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-500 hover:text-white transition-colors"
                                data-testid={`link-ecosystem-x-${project.id}`}
                              >
                                @{project.xHandle}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
