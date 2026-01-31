import { motion } from "framer-motion";
import { Coins, Globe2, ShieldCheck, Zap, Layers, BarChart3 } from "lucide-react";

const services = [
  {
    icon: Globe2,
    title: "Cross-Border Payments",
    description: "Leverage XRPL for instant, low-cost international settlements. Eliminate pre-funding and reduce liquidity costs dramatically."
  },
  {
    icon: Coins,
    title: "Asset Tokenization",
    description: "Represent real-world assets (RWA) on the blockchain. From real estate to commodities, unlock liquidity through digital ownership."
  },
  {
    icon: Zap,
    title: "XRPL Strategy",
    description: "Comprehensive consulting on integrating XRP Ledger into your existing financial infrastructure with minimal disruption."
  },
  {
    icon: ShieldCheck,
    title: "Compliance & Security",
    description: "Navigate the regulatory landscape with confidence. Secure implementation of blockchain solutions adhering to global standards."
  },
  {
    icon: Layers,
    title: "DeFi Integration",
    description: "Explore decentralized finance opportunities on XRPL including AMMs (Automated Market Makers) and lending protocols."
  },
  {
    icon: BarChart3,
    title: "Treasury Management",
    description: "Optimize corporate treasury operations using blockchain-based liquidity management and settlement solutions."
  }
];

export function Services() {
  return (
    <section id="services" className="section-padding bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-secondary font-semibold tracking-wide uppercase text-sm mb-3">Our Expertise</h2>
          <h3 className="text-3xl md:text-5xl font-display font-bold text-primary mb-6">
            Enterprise Solutions on the XRP Ledger
          </h3>
          <p className="text-lg text-muted-foreground">
            Bridging the gap between traditional finance and blockchain innovation with tailored strategies for scalability and security.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group p-8 rounded-2xl bg-white border border-border hover:border-secondary/30 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-secondary/5 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-blue-50 text-primary group-hover:bg-secondary group-hover:text-white flex items-center justify-center mb-6 transition-colors duration-300">
                <service.icon className="w-7 h-7" />
              </div>
              <h4 className="text-xl font-display font-bold text-primary mb-3 group-hover:text-secondary transition-colors">
                {service.title}
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
