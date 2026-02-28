import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare, Heart, Radio, Gamepad2, ExternalLink, Briefcase,
  Globe, Star, Zap, Shield, Code, Users, Rocket, Award, Target,
  type LucideIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const ICON_MAP: Record<string, LucideIcon> = {
  MessageSquare, Heart, Radio, Gamepad2, Briefcase,
  Globe, Star, Zap, Shield, Code, Users, Rocket, Award, Target,
};

type ProjectData = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  impact: string;
  link: string | null;
  icon: string;
  color: string;
  tags: string[];
  displayOrder: number;
  isActive: boolean;
};

export function ConsultantProjects({ slug }: { slug: string }) {
  const { data: projectsData = [] } = useQuery<ProjectData[]>({
    queryKey: ["/api/c/:slug/projects", slug],
    queryFn: async () => {
      const res = await fetch(`/api/c/${slug}/projects`);
      return res.json();
    },
  });

  if (projectsData.length === 0) return null;

  return (
    <section id="projects" className="section-padding bg-black/70 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-green-400 font-semibold tracking-wide uppercase text-sm mb-3">Featured Projects</h2>
          <h3 className="text-3xl md:text-5xl font-display font-bold text-white">
            Work That Drives Impact
          </h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {projectsData.map((project, i) => {
            const IconComponent = ICON_MAP[project.icon] || Briefcase;
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                data-testid={`card-project-${project.id}`}
              >
                <Card className="h-full bg-black/60 border-green-500/20 hover:border-green-500/50 transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl ${project.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-display font-bold text-white text-lg leading-tight">{project.title}</h4>
                            <p className="text-green-400/80 text-sm font-medium mt-0.5">{project.subtitle}</p>
                          </div>
                          {project.link && (
                            <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-green-400 transition-colors shrink-0">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm leading-relaxed mb-4">{project.description}</p>

                    <div className="bg-green-500/5 border border-green-500/15 rounded-lg p-3 mb-4">
                      <p className="text-green-400/90 text-xs font-medium leading-relaxed">
                        <span className="text-green-400 font-bold impact-label">Impact: </span>{project.impact}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {project.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="skill-badge text-xs border-green-500/30 text-green-400/80">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
