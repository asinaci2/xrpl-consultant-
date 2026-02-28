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

const FALLBACK_PROJECTS: ProjectData[] = [
  {
    id: 0, title: "TextRP Ambassador", subtitle: "XRPL-Native Messaging Platform",
    description: "Drove visibility for app.textrp.io through X Spaces hosting, beta launches, and community Q&A sessions.",
    impact: "Built a tight-knit XRPL network with consistent daily engagement.",
    tags: ["Privacy-Focused", "$TXT Utility", "Community Growth"],
    link: "https://app.textrp.io", icon: "MessageSquare", color: "bg-blue-500",
    displayOrder: 0, isActive: true,
  },
];

export function Projects() {
  const { data: projectsData = [] } = useQuery<ProjectData[]>({
    queryKey: ["/api/projects"],
  });

  const displayProjects = projectsData.length > 0 ? projectsData : FALLBACK_PROJECTS;

  return (
    <section id="projects" className="section-padding bg-black/70 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-green-400 font-semibold tracking-wide uppercase text-sm mb-3">Featured Projects</h2>
          <h3 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
            XRPL Ecosystem Work
          </h3>
          <p className="text-lg text-gray-400">
            Real projects, real utility. Here's how I help XRPL builders grow their communities and drive adoption.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {displayProjects.map((project, index) => {
            const IconComponent = ICON_MAP[project.icon] || Briefcase;
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card
                  className="h-full hover-elevate"
                  data-testid={`card-project-${project.id}`}
                >
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl ${project.color} text-white flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className="text-xl font-display font-bold text-white"
                            data-testid={`text-project-title-${project.id}`}
                          >
                            {project.title}
                          </h4>
                          {project.link && (
                            <a
                              href={project.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-green-400"
                              data-testid={`link-project-${project.id}`}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-green-400 font-medium" data-testid={`text-project-subtitle-${project.id}`}>
                          {project.subtitle}
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-400 leading-relaxed mb-4" data-testid={`text-project-description-${project.id}`}>
                      {project.description}
                    </p>

                    <div className="bg-black/40 rounded-lg p-3 mb-4 border border-green-500/10">
                      <p className="text-sm text-gray-300" data-testid={`text-project-impact-${project.id}`}>
                        <span className="font-semibold text-green-400">Impact:</span> {project.impact}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag, tagIndex) => (
                        <Badge
                          key={tagIndex}
                          variant="secondary"
                          className="text-xs"
                          data-testid={`badge-project-${project.id}-tag-${tagIndex}`}
                        >
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-gray-400 mb-4">
            Want to grow your XRPL project with authentic community strategy?
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 text-green-400 font-semibold hover:text-green-300"
            data-testid="link-contact-from-projects"
          >
            Let's connect and build together
          </a>
        </motion.div>
      </div>
    </section>
  );
}
