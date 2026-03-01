import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-scroll";
import { ArrowRight, CheckCircle2, ExternalLink, BookmarkPlus, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { TEXTRP_APP_URL, ALIGNMENT_PILL } from "@/lib/constants";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop";

interface CachedMedia {
  id: number;
  imageUrl: string;
  altText: string | null;
  section: string;
}

interface Consultant {
  name: string;
  tagline: string;
  bio: string;
  specialties: string[];
  avatarUrl: string | null;
  matrixUserId: string | null;
  expertiseStatement?: string;
  ecosystemAlignments?: string[];
}

export function ConsultantHero({ consultant, slug }: { consultant: Consultant; slug: string }) {
  const shouldReduceMotion = useReducedMotion();
  const { toast } = useToast();
  const { matrixUserId, consultantSlug: mySlug, isAdmin, isAuthenticated } = useAuth();

  const isVisitor = isAuthenticated && !mySlug && !isAdmin;

  const { data: media = [] } = useQuery<CachedMedia[]>({
    queryKey: ["/api/c/:slug/media/hero", slug],
    queryFn: async () => {
      const res = await fetch(`/api/c/${slug}/media/hero`);
      return res.json();
    },
  });

  const { data: contactStatus } = useQuery<{ saved: boolean }>({
    queryKey: ["/api/visitor/contacts/:slug", slug],
    queryFn: async () => {
      const res = await fetch(`/api/visitor/contacts/${slug}`, { credentials: "include" });
      if (!res.ok) return { saved: false };
      return res.json();
    },
    enabled: isVisitor,
  });

  const isSaved = contactStatus?.saved ?? false;

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/visitor/contacts", { consultantSlug: slug }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visitor/contacts/:slug", slug] });
      queryClient.invalidateQueries({ queryKey: ["/api/visitor/contacts"] });
      toast({ title: "Saved to contacts", description: `${consultant.name} has been added to your contacts.` });
    },
    onError: () => toast({ title: "Error", description: "Could not save contact.", variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/visitor/contacts/${slug}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visitor/contacts/:slug", slug] });
      queryClient.invalidateQueries({ queryKey: ["/api/visitor/contacts"] });
      toast({ title: "Removed from contacts", description: `${consultant.name} was removed from your contacts.` });
    },
    onError: () => toast({ title: "Error", description: "Could not remove contact.", variant: "destructive" }),
  });

  const heroImage = media.length > 0 ? media[0] : null;
  const imageSrc = consultant.avatarUrl || heroImage?.imageUrl || FALLBACK_IMAGE;
  const imageAlt = `${consultant.name} - XRPL Consultant`;

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
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              XRPL Blockchain Consultant
            </div>

            <h1 className="text-5xl lg:text-7xl font-display font-bold leading-tight mb-4 text-white">
              {consultant.name}
            </h1>

            <p className="text-2xl text-green-400 font-mono mb-6">{consultant.tagline}</p>

            <p className="text-xl text-gray-300 mb-8 max-w-lg leading-relaxed">
              {consultant.bio || "Expert guidance on XRP Ledger strategy, tokenization, and cross-border payment solutions."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
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

            {isVisitor && (
              <div className="mb-6">
                {isSaved ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeMutation.mutate()}
                    disabled={removeMutation.isPending}
                    className="border-green-500/40 text-green-400 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400 rounded-full gap-2 transition-colors"
                    data-testid="button-unsave-contact"
                  >
                    <BookmarkCheck className="w-4 h-4" />
                    Saved to My Contacts
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className="border-green-500/30 text-green-400/80 hover:bg-green-500/10 hover:border-green-500/60 hover:text-green-400 rounded-full gap-2"
                    data-testid="button-save-contact"
                  >
                    <BookmarkPlus className="w-4 h-4" />
                    Save to My Contacts
                  </Button>
                )}
              </div>
            )}

            <div className="flex items-center gap-6 text-sm text-gray-400 font-medium flex-wrap">
              {consultant.specialties.slice(0, 3).map(s => (
                <div key={s} className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span>{s}</span>
                </div>
              ))}
            </div>

            {(consultant.expertiseStatement || (consultant.ecosystemAlignments && consultant.ecosystemAlignments.length > 0)) && (
              <div className="mt-6 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-3" data-testid="section-ecosystem-expertise">
                {consultant.expertiseStatement && (
                  <p className="text-gray-300 text-sm leading-relaxed" data-testid="text-expertise-statement">
                    {consultant.expertiseStatement}
                  </p>
                )}
                {consultant.ecosystemAlignments && consultant.ecosystemAlignments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {consultant.ecosystemAlignments.map(cat => (
                      <span
                        key={cat}
                        data-testid={`badge-alignment-${cat.replace(/[\s/()]+/g, "-").toLowerCase()}`}
                        className={`px-2.5 py-1 rounded-full text-xs font-mono border ${ALIGNMENT_PILL.selected.bg} ${ALIGNMENT_PILL.selected.border} ${ALIGNMENT_PILL.selected.text}`}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {consultant.matrixUserId && (
              <a
                href={`${TEXTRP_APP_URL}/#/user/${consultant.matrixUserId}`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-textrp-profile"
                className="inline-flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors font-mono mt-4"
              >
                <ExternalLink className="w-4 h-4" />
                View TextRP Profile
              </a>
            )}
          </motion.div>

          <motion.div
            {...imageMotionProps}
            className="relative hidden lg:block"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-green-500/10 border border-green-500/20 aspect-square">
              <div className="absolute inset-0 bg-black/20 z-10" />
              <img
                src={imageSrc}
                alt={imageAlt}
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
                    <div className="text-sm font-bold text-white">XRPL Expert</div>
                    <div className="text-xs text-gray-400">Verified Consultant</div>
                  </div>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-green-500 animate-[shimmer_2s_infinite]" />
                </div>
                <div className="flex justify-between mt-2 text-xs font-medium">
                  <span className="text-gray-400">Status</span>
                  <span className="text-green-400">Available</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
