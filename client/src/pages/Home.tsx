import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Stories } from "@/components/Stories";
import { Services } from "@/components/Services";
import { Projects } from "@/components/Projects";
import { About } from "@/components/About";
import { Testimonials } from "@/components/Testimonials";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { motion, useScroll, useSpring } from "framer-motion";

export default function Home() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-secondary origin-left z-[100]"
        style={{ scaleX }}
      />
      
      <Navigation />
      
      <main className="flex-grow">
        <Hero />
        <Stories />
        <Services />
        <Projects />
        <About />
        <Testimonials />
        <Contact />
      </main>
      
      <Footer />
    </div>
  );
}
