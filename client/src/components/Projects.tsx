import { motion } from "framer-motion";
import { MessageSquare, Heart, Radio, Gamepad2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const projects = [
  {
    icon: MessageSquare,
    title: "TextRP Ambassador",
    subtitle: "XRPL-Native Messaging Platform",
    description: "Drove visibility for app.textrp.io through X Spaces hosting, beta launches, and community Q&A sessions. Promoted $TXT token utility for rewards and gating, wallet integration, and cross-platform bridging.",
    impact: "Built a tight-knit XRPL network with consistent daily engagement and scam-resistant growth messaging.",
    tags: ["Privacy-Focused", "$TXT Utility", "Community Growth"],
    link: "https://app.textrp.io",
    color: "bg-blue-500 dark:bg-blue-600"
  },
  {
    icon: Heart,
    title: "Budzy Movement",
    subtitle: "Community Morale & Engagement Brand",
    description: "A motivational community ethos centered on 'get yo budzy on' - a positive mindset for staying locked in, grinding, and manifesting success. Fosters morale and long-term holder energy across XRPL projects.",
    impact: "Used in Spaces hosting and daily updates to rally the fam - helps combat burnout in bearish or slow-build phases.",
    tags: ["Morale Building", "Content Strategy", "Holder Energy"],
    color: "bg-pink-500 dark:bg-pink-600"
  },
  {
    icon: Radio,
    title: "Crypto Fam Radio",
    subtitle: "X Spaces Hosting & Community Voice",
    description: "Frequent co-hosting and participation in X Spaces featuring XRPL discussions, project spotlights, and welcoming newcomers. Positions as a reliable community voice bridging builders and audiences.",
    impact: "Regular engagement establishing trust as a connector between XRPL projects and their communities.",
    tags: ["X Spaces", "AMA Facilitation", "Networking"],
    link: "https://x.com/cryptofamradio",
    color: "bg-purple-500 dark:bg-purple-600"
  },
  {
    icon: Gamepad2,
    title: "XRP Warlords Strategy",
    subtitle: "XRPL NFT/GameFi Community Growth",
    description: "Supporting XRPL gaming innovators through visibility boosts, contest-style engagement, and builder shoutouts. Advise on token-gating chats, community morale, and scam-resistant onboarding for gaming communities.",
    impact: "Aligned with #Budzy's 'locked in' grind mentality for real utility launches in the NFT/GameFi space.",
    tags: ["GameFi", "NFT Strategy", "PVP Utility"],
    link: "https://xrp.cafe",
    color: "bg-orange-500 dark:bg-orange-600"
  }
];

export function Projects() {
  return (
    <section id="projects" className="section-padding bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-secondary font-semibold tracking-wide uppercase text-sm mb-3">Featured Projects</h2>
          <h3 className="text-3xl md:text-5xl font-display font-bold text-primary mb-6">
            XRPL Ecosystem Work
          </h3>
          <p className="text-lg text-muted-foreground">
            Real projects, real utility. Here's how I help XRPL builders grow their communities and drive adoption.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card 
                className="h-full hover-elevate"
                data-testid={`card-project-${index}`}
              >
                <CardContent className="p-8">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl ${project.color} text-white flex items-center justify-center flex-shrink-0`}>
                      <project.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 
                          className="text-xl font-display font-bold text-primary"
                          data-testid={`text-project-title-${index}`}
                        >
                          {project.title}
                        </h4>
                        {project.link && (
                          <a 
                            href={project.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-muted-foreground"
                            data-testid={`link-project-${index}`}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-secondary font-medium" data-testid={`text-project-subtitle-${index}`}>
                        {project.subtitle}
                      </p>
                    </div>
                  </div>

                  <p className="text-muted-foreground leading-relaxed mb-4" data-testid={`text-project-description-${index}`}>
                    {project.description}
                  </p>

                  <div className="bg-muted rounded-lg p-3 mb-4">
                    <p className="text-sm text-foreground" data-testid={`text-project-impact-${index}`}>
                      <span className="font-semibold text-secondary">Impact:</span> {project.impact}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, tagIndex) => (
                      <Badge 
                        key={tagIndex} 
                        variant="secondary"
                        className="text-xs"
                        data-testid={`badge-project-${index}-tag-${tagIndex}`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground mb-4">
            Want to grow your XRPL project with authentic community strategy?
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 text-secondary font-semibold"
            data-testid="link-contact-from-projects"
          >
            Let's connect and build together
          </a>
        </motion.div>
      </div>
    </section>
  );
}
