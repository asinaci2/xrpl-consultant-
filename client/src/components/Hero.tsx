import { motion } from "framer-motion";
import { Link } from "react-scroll";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-gradient-to-br from-background via-background to-blue-50/50">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-secondary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
              </span>
              Certified Blockchain Consultant
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-display font-bold leading-tight mb-6 text-primary">
              Unlock the Power of <span className="text-secondary">XRPL</span> for Enterprise.
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed">
              Expert guidance on XRP Ledger strategy, tokenization, and cross-border payment solutions. Transform your financial infrastructure with proven blockchain expertise.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link to="contact" smooth={true} duration={500}>
                <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                  Start Your Strategy
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="about" smooth={true} duration={500}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full border-2">
                  View Credentials
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-secondary" />
                <span>Enterprise Grade</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-secondary" />
                <span>Certified Expert</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-secondary" />
                <span>Global Solutions</span>
              </div>
            </div>
          </motion.div>

          {/* Visual/Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 border border-white/20 aspect-square">
               {/* Corporate abstract blockchain concept */}
               <div className="absolute inset-0 bg-primary/5 z-10"></div>
               <img 
                 src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop" 
                 alt="Blockchain Technology Visualization"
                 className="w-full h-full object-cover"
               />
               
               {/* Floating Card 1 */}
               <motion.div 
                 animate={{ y: [0, -10, 0] }}
                 transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                 className="absolute bottom-12 left-12 z-20 bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 max-w-xs"
               >
                 <div className="flex items-center gap-4 mb-3">
                   <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">XR</div>
                   <div>
                     <div className="text-sm font-bold text-primary">Ledger Settlement</div>
                     <div className="text-xs text-muted-foreground">Instant Finality</div>
                   </div>
                 </div>
                 <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full w-full bg-secondary animate-[shimmer_2s_infinite]"></div>
                 </div>
                 <div className="flex justify-between mt-2 text-xs font-medium">
                   <span>Status</span>
                   <span className="text-green-600">Confirmed</span>
                 </div>
               </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
