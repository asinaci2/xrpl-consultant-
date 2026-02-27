import { motion } from "framer-motion";
import { Award, BookOpen, UserCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2664&auto=format&fit=crop";

interface CachedMedia {
  id: number;
  imageUrl: string;
  altText: string | null;
  section: string;
}

export function About() {
  const { data: media = [], isLoading } = useQuery<CachedMedia[]>({
    queryKey: ["/api/media/about"],
  });

  const aboutImage = media.length > 0 ? media[0] : null;
  const imageSrc = aboutImage?.imageUrl || FALLBACK_IMAGE;
  const imageAlt = aboutImage?.altText || "Edwin Gutierrez Consulting";

  return (
    <section id="about" className="section-padding bg-black/80 backdrop-blur-sm border-y border-green-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={imageSrc}
                alt={imageAlt}
                className="w-full h-auto object-cover"
                data-testid="img-about"
              />
            </div>
            <div className="absolute -top-4 -left-4 w-full h-full border-2 border-green-500/30 rounded-2xl -z-0"></div>
            
            <div className="absolute -bottom-8 -right-8 bg-black/80 backdrop-blur-md p-6 rounded-xl shadow-xl border border-green-500/30 max-w-xs z-20">
              <div className="flex items-center gap-4">
                <div className="bg-green-500/20 p-3 rounded-full text-green-400">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-white text-lg">Certified</div>
                  <div className="text-sm text-gray-400">Blockchain Consultant</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-green-400 font-semibold tracking-wide uppercase text-sm mb-3">About Edwin Gutierrez</h2>
            <h3 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
              Strategic Visionary in Blockchain Technology
            </h3>
            
            <div className="space-y-6 text-lg text-gray-300">
              <p>
                As a Certified Blockchain Consultant specializing in the XRP Ledger, I help forward-thinking organizations navigate the complexities of decentralized technology.
              </p>
              <p>
                My approach combines deep technical understanding with strategic business acumen. I don't just explain how blockchain works; I demonstrate how it can fundamentally improve your operational efficiency and bottom line.
              </p>
            </div>

            <div className="mt-10 grid sm:grid-cols-2 gap-6">
              <div className="bg-black/60 p-5 rounded-xl border border-green-500/20 shadow-sm">
                <BookOpen className="w-8 h-8 text-green-400 mb-3" />
                <h4 className="font-bold text-white mb-1">Deep Knowledge</h4>
                <p className="text-sm text-gray-400">Specialized expertise in XRPL consensus protocol and token standards.</p>
              </div>
              <div className="bg-black/60 p-5 rounded-xl border border-green-500/20 shadow-sm">
                <UserCheck className="w-8 h-8 text-green-400 mb-3" />
                <h4 className="font-bold text-white mb-1">Trusted Advisor</h4>
                <p className="text-sm text-gray-400">Guiding enterprises through adoption with risk-managed strategies.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
