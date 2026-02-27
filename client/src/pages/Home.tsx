import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { Projects } from "@/components/Projects";
import { About } from "@/components/About";
import { Testimonials } from "@/components/Testimonials";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { MatrixRain } from "@/components/MatrixRain";
import { motion, useScroll, useSpring } from "framer-motion";

export default function Home() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans text-foreground relative">
      <div className="fixed inset-0 z-0">
        <MatrixRain className="opacity-20" />
      </div>

      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-green-500 origin-left z-[100]"
        style={{ scaleX }}
      />
      
      <Navigation />
      
      <main className="flex-grow relative z-10">
        <Hero />
        <Services />
        <Projects />
        <About />
        <Testimonials />
        <Contact />
      </main>
      
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
