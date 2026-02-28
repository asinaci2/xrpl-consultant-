import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-scroll";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop";

interface CachedMedia {
  id: number;
  imageUrl: string;
  altText: string | null;
  section: string;
}

export function Hero() {
  const shouldReduceMotion = useReducedMotion();
  const { data: allMedia = [], isLoading } = useQuery<CachedMedia[]>({
    queryKey: ["/api/media"],
  });
  const media = allMedia.filter(m => m.section === "hero");

  const heroImage = media.length > 0 ? media[0] : null;
  const imageSrc = heroImage?.imageUrl || FALLBACK_IMAGE;
  const imageAlt = heroImage?.altText || "Blockchain Technology Visualization";

  const motionProps = shouldReduceMotion ? {} : {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const imageMotionProps = shouldReduceMotion ? {} : {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.6, delay: 0.2 }
  };

  const floatMotionProps = shouldReduceMotion ? {} : {
    animate: { y: [0, -10, 0] },
    transition: { repeat: Infinity, duration: 4, ease: "easeInOut" }
  };

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70 z-[1]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          <motion.div
            {...motionProps}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
              </span>
              Certified Blockchain Consultant
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-display font-bold leading-tight mb-6 text-white">
              Unlock the Power of <span className="text-green-400">XRPL</span> for Enterprise.
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-lg leading-relaxed">
              Expert guidance on XRP Ledger strategy, tokenization, and cross-border payment solutions. Transform your financial infrastructure with proven blockchain expertise.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link to="contact" smooth={true} duration={500}>
                <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full bg-green-500 hover:bg-green-600 text-black font-bold shadow-lg shadow-green-500/30">
                  Start Your Strategy
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="about" smooth={true} duration={500}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full border-2 border-green-400/50 text-green-400 hover:bg-green-400/10">
                  View Credentials
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-400 font-medium flex-wrap">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Enterprise Grade</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Certified Expert</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Global Solutions</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            {...imageMotionProps}
            className="relative hidden lg:block"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-green-500/10 border border-green-500/20 aspect-square">
               <div className="absolute inset-0 bg-black/20 z-10"></div>
               <img 
                 src={imageSrc}
                 alt={imageAlt}
                 width={1200}
                 height={800}
                 loading="eager"
                 fetchPriority="high"
                 className="w-full h-full object-cover"
                 data-testid="img-hero"
               />
               
               <motion.div 
                 {...floatMotionProps}
                 className="absolute bottom-12 left-12 z-20 bg-black/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-green-500/30 max-w-xs"
               >
                 <div className="flex items-center gap-4 mb-3">
                   <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">XR</div>
                   <div>
                     <div className="text-sm font-bold text-white">Ledger Settlement</div>
                     <div className="text-xs text-gray-400">Instant Finality</div>
                   </div>
                 </div>
                 <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                   <div className="h-full w-full bg-green-500 animate-[shimmer_2s_infinite]"></div>
                 </div>
                 <div className="flex justify-between mt-2 text-xs font-medium">
                   <span className="text-gray-400">Status</span>
                   <span className="text-green-400">Confirmed</span>
                 </div>
               </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
