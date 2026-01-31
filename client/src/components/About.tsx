import { motion } from "framer-motion";
import { Award, BookOpen, UserCheck } from "lucide-react";

export function About() {
  return (
    <section id="about" className="section-padding bg-slate-50 border-y border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image Side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl">
               {/* Professional consultant headshot or working shot */}
              <img 
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2664&auto=format&fit=crop" 
                alt="Edwin Gutierrez Consulting" 
                className="w-full h-auto object-cover"
              />
            </div>
            {/* Decorative background element */}
            <div className="absolute -top-4 -left-4 w-full h-full border-2 border-secondary rounded-2xl -z-0"></div>
            
            <div className="absolute -bottom-8 -right-8 bg-white p-6 rounded-xl shadow-xl border border-slate-100 max-w-xs z-20">
              <div className="flex items-center gap-4">
                <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-primary text-lg">Certified</div>
                  <div className="text-sm text-muted-foreground">Blockchain Consultant</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Text Side */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-secondary font-semibold tracking-wide uppercase text-sm mb-3">About Edwin Gutierrez</h2>
            <h3 className="text-3xl md:text-4xl font-display font-bold text-primary mb-6">
              Strategic Visionary in Blockchain Technology
            </h3>
            
            <div className="space-y-6 text-lg text-muted-foreground">
              <p>
                As a Certified Blockchain Consultant specializing in the XRP Ledger, I help forward-thinking organizations navigate the complexities of decentralized technology.
              </p>
              <p>
                My approach combines deep technical understanding with strategic business acumen. I don't just explain how blockchain works; I demonstrate how it can fundamentally improve your operational efficiency and bottom line.
              </p>
            </div>

            <div className="mt-10 grid sm:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
                <BookOpen className="w-8 h-8 text-secondary mb-3" />
                <h4 className="font-bold text-primary mb-1">Deep Knowledge</h4>
                <p className="text-sm text-muted-foreground">Specialized expertise in XRPL consensus protocol and token standards.</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
                <UserCheck className="w-8 h-8 text-secondary mb-3" />
                <h4 className="font-bold text-primary mb-1">Trusted Advisor</h4>
                <p className="text-sm text-muted-foreground">Guiding enterprises through adoption with risk-managed strategies.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
