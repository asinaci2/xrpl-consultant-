import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, useScroll, useSpring } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { MatrixRain } from "@/components/MatrixRain";
import { Services } from "@/components/Services";
import { About } from "@/components/About";
import { Testimonials } from "@/components/Testimonials";
import { Footer } from "@/components/Footer";
import { ConsultantNavigation } from "@/components/ConsultantNavigation";
import { ConsultantHero } from "@/components/ConsultantHero";
import { ConsultantProjects } from "@/components/ConsultantProjects";
import { ConsultantContact } from "@/components/ConsultantContact";
import { ConsultantComplements } from "@/components/ConsultantComplements";
import { MatrixTweets } from "@/components/MatrixTweets";
import { useTheme } from "@/hooks/useTheme";

interface Consultant {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  bio: string;
  avatarUrl: string | null;
  specialties: string[];
  twitterUsername: string | null;
  matrixUserId: string | null;
  calendarUrl: string | null;
  expertiseStatement: string;
  ecosystemAlignments: string[];
  email: string;
  phone: string;
  location: string;
  locationLine2: string;
  contactHeadline: string;
}

export default function ConsultantPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const { theme } = useTheme();
  const isDay = theme === "day";

  const { data: consultant, isLoading, isError } = useQuery<Consultant>({
    queryKey: ["/api/consultants", slug],
    queryFn: async () => {
      const res = await fetch(`/api/consultants/${slug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const { data: allConsultants = [] } = useQuery<Consultant[]>({
    queryKey: ["/api/consultants"],
    queryFn: async () => {
      const res = await fetch("/api/consultants");
      if (!res.ok) throw new Error("Failed to fetch consultants");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400 font-mono animate-pulse text-xl">Loading…</div>
      </div>
    );
  }

  if (isError || !consultant) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 text-center px-4">
        <div className="text-6xl font-display font-bold text-green-400/30">404</div>
        <h1 className="text-2xl font-display text-white">Consultant not found</h1>
        <p className="text-gray-400">This profile doesn't exist or has been removed.</p>
        <Link href="/">
          <button className="flex items-center gap-2 text-green-400 hover:text-green-300 font-mono transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Directory
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans text-foreground relative ${isDay ? "bg-green-50" : "bg-black"}`}>
      <MatrixRain className="fixed inset-0 w-full h-full opacity-20 pointer-events-none" />

      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-green-500 origin-left z-[100]"
        style={{ scaleX }}
      />

      <ConsultantNavigation consultant={consultant} slug={slug} />

      <main className="flex-grow relative z-10">
        <ConsultantHero consultant={consultant} slug={slug} />
        <Services consultant={consultant} />
        <ConsultantProjects slug={slug} />
        <ConsultantComplements consultant={consultant} allConsultants={allConsultants} />
        {consultant.twitterUsername && <MatrixTweets />}
        <About />
        <Testimonials slug={slug} />
        <ConsultantContact consultant={consultant} slug={slug} />
      </main>

      <Footer />
    </div>
  );
}
