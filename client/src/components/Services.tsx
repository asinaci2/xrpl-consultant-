import { motion } from "framer-motion";
import { 
  Rocket, 
  Users, 
  Mic, 
  Leaf, 
  Wrench, 
  TrendingUp,
  Sparkles,
  Target,
  Gem,
  MessageSquare,
  Globe2,
  Handshake,
  Megaphone,
  Heart
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const services = [
  {
    icon: Rocket,
    title: "XRPL Project Consulting & Strategy",
    description: "Guidance on launching/building sustainable XRPL projects, from meme/NFT origins to full ecosystems with utility. Token-gating, rewards, and integrations like TextRP. Emphasis on \"more doers, less talkers\" and evolving memes into real products."
  },
  {
    icon: Users,
    title: "Web3 Community Building & Growth",
    description: "Strategies for growing engaged XRPL communities, including token/NFT gating for chats/rooms, ambassador networks, and cross-project collaborations with Budzy, NexusWater, UgaLabz/GridXRPL, and more."
  },
  {
    icon: Mic,
    title: "Event & On-Ground Representation",
    description: "\"Boots on the ground\" awareness for XRPL/Web3 projects at conferences like Ethereum Denver. Live Spaces hosting, promotion, and networking to connect builders with investors and opportunities."
  },
  {
    icon: Leaf,
    title: "Cannabis & RWA Tokenization Advisory",
    description: "Specialized advice on tokenizing real-world assets (RWAs) in regulated spaces like cannabis. Fractional ownership, liquidity solutions, and bridging traditional industries to XRPL through the Budzy/cannapreneur network."
  },
  {
    icon: Wrench,
    title: "XRPL Integration & Tool Recommendations",
    description: "Consulting on adopting XRPL-native tools—wallets like Xaman, messaging via TextRP, DeFi/NFT utilities—for projects seeking secure, scalable Web3 features without heavy custom development."
  },
  {
    icon: TrendingUp,
    title: "Brand & Ecosystem Development",
    description: "Helping projects evolve from fun/speculative (memes/NFTs) to utility-driven brands. Merch, reward loops, and multi-layer ecosystems inspired by successes like UgaLabz → GridXRPL."
  }
];

const skills = [
  { icon: Gem, label: "XRPL & XRP Ledger Expertise" },
  { icon: MessageSquare, label: "Web3 Community Management" },
  { icon: Sparkles, label: "Tokenomics & Ecosystem Design" },
  { icon: Target, label: "NFT & Meme-to-Utility Transitions" },
  { icon: Globe2, label: "Real-World Asset Tokenization" },
  { icon: Leaf, label: "Cannabis Industry Web3 Innovation" },
  { icon: Mic, label: "Event Hosting & Representation" },
  { icon: Handshake, label: "Strategic Networking & Partnerships" },
  { icon: Megaphone, label: "Project Promotion & Growth" },
  { icon: Heart, label: "Builder Support (Doers > Talkers)" }
];

export function Services() {
  return (
    <section id="services" className="section-padding bg-black/80 backdrop-blur-sm" data-testid="section-services">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-green-400 font-semibold tracking-wide uppercase text-sm mb-3">Consultant Services</h2>
          <h3 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
            XRPL & Web3 Expertise
          </h3>
          <p className="text-lg text-gray-400">
            From meme origins to full ecosystems—strategic guidance for builders who do more and talk less.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card 
                className="h-full hover-elevate"
                data-testid={`card-service-${index}`}
              >
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center mb-6">
                    <service.icon className="w-7 h-7" />
                  </div>
                  <h4 
                    className="text-xl font-display font-bold text-white mb-3"
                    data-testid={`text-service-title-${index}`}
                  >
                    {service.title}
                  </h4>
                  <p className="text-gray-400 leading-relaxed">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h3 className="text-2xl font-display font-bold text-white mb-8" data-testid="text-skills-title">
            Core Expertise
          </h3>
          <div className="flex flex-wrap justify-center gap-3" data-testid="container-skills">
            {skills.map((skill, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="flex items-center gap-2"
                data-testid={`badge-skill-${index}`}
              >
                <skill.icon className="w-4 h-4" />
                {skill.label}
              </Badge>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
