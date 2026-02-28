import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Hexagon, LayoutDashboard, LogIn, Shield, Users, X, ExternalLink } from "lucide-react";
import { MatrixRain } from "@/components/MatrixRain";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { TEXTRP_APP_URL } from "@/lib/constants";

interface Consultant {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  bio: string;
  avatarUrl: string | null;
  specialties: string[];
  email: string;
  location: string;
  isActive: boolean;
}

export default function Directory() {
  const { data: consultants = [], isLoading } = useQuery<Consultant[]>({
    queryKey: ["/api/consultants"],
  });
  const { isAdmin, isConsultant, isAuthenticated, isLoading: authLoading, displayName } = useAuth();
  const search = useSearch();
  const isVisitor = new URLSearchParams(search).get("visitor") === "1";
  const [dismissedVisitor, setDismissedVisitor] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      <div className="fixed inset-0 z-0">
        <MatrixRain className="opacity-20" />
      </div>

      <div className="relative z-10">
        {/* Visitor Welcome Banner */}
        <AnimatePresence>
          {isVisitor && !dismissedVisitor && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-green-500/10 border-b border-green-500/30 px-4 py-3"
              data-testid="banner-visitor-welcome"
            >
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                  <p className="text-green-300 text-sm font-mono">
                    {displayName ? (
                      <>Welcome, <span className="text-green-400 font-semibold">{displayName}</span> — you're logged in as a visitor.</>
                    ) : (
                      <>You're logged in. Browse our consultants or join the TextRP ecosystem.</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <a
                    href={TEXTRP_APP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 font-mono transition-colors border border-green-500/30 rounded-lg px-3 py-1.5 hover:bg-green-500/10"
                    data-testid="link-textrp-visitor"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open TextRP
                  </a>
                  <button
                    onClick={() => setDismissedVisitor(true)}
                    className="text-gray-500 hover:text-gray-300 transition-colors"
                    aria-label="Dismiss"
                    data-testid="button-dismiss-visitor"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <header className="border-b border-green-500/20 bg-black/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Hexagon className="w-9 h-9 text-green-400" fill="currentColor" fillOpacity={0.15} />
                <span className="absolute inset-0 flex items-center justify-center text-green-400 font-mono font-bold text-xs">T</span>
              </div>
              <div>
                <span className="font-display font-bold text-lg text-white">TextRP</span>
                <span className="text-green-400 font-mono text-sm ml-1">Consultant Network</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-green-400/60 font-mono">
                <Users className="w-4 h-4" />
                <span>{consultants.length} Active Consultants</span>
              </div>
              {!authLoading && (
                <>
                  {isAdmin ? (
                    <Link href="/admin" className="flex items-center gap-1.5 border border-green-500/30 text-green-400 hover:bg-green-500/10 font-mono text-sm rounded-lg px-3 py-1.5 transition-colors" data-testid="link-admin-panel">
                      <Shield className="w-3.5 h-3.5" />
                      Admin Panel
                    </Link>
                  ) : isConsultant ? (
                    <Link href="/dashboard" className="flex items-center gap-1.5 border border-green-500/30 text-green-400 hover:bg-green-500/10 font-mono text-sm rounded-lg px-3 py-1.5 transition-colors" data-testid="link-dashboard">
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      Dashboard
                    </Link>
                  ) : (
                    <Link href="/login" className="flex items-center gap-1.5 border border-green-500/20 text-green-400/70 hover:text-green-400 hover:bg-green-500/10 font-mono text-sm rounded-lg px-3 py-1.5 transition-colors" data-testid="link-sign-in">
                      <LogIn className="w-3.5 h-3.5" />
                      Sign In
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold mb-6 font-mono">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                </span>
                XRPL Ecosystem Experts
              </div>
              <h1 className="text-5xl lg:text-7xl font-display font-bold mb-6 leading-tight">
                Find Your <span className="text-green-400">Web3</span> Consultant
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Connect with vetted XRPL and blockchain consultants powering the TextRP ecosystem. Each consultant brings deep community expertise and proven Web3 strategy.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Consultant Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-2xl border border-green-500/20 bg-black/60 p-6 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-green-900/40" />
                    <div className="flex-1">
                      <div className="h-5 bg-green-900/40 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-green-900/30 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-12 bg-green-900/20 rounded mb-4" />
                  <div className="flex gap-2 flex-wrap mb-4">
                    {[1, 2, 3].map(j => <div key={j} className="h-6 w-16 bg-green-900/30 rounded-full" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : consultants.length === 0 ? (
            <div className="text-center py-24 text-gray-400 font-mono">
              No consultants found yet.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {consultants.map((consultant, i) => (
                <motion.div
                  key={consultant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  data-testid={`card-consultant-${consultant.slug}`}
                >
                  <Link href={`/c/${consultant.slug}`}>
                    <button className="w-full text-left group rounded-2xl border border-green-500/20 bg-black/60 backdrop-blur-sm p-6 hover:border-green-500/50 hover:bg-black/80 transition-[border-color,background-color] duration-300 h-full flex flex-col"
                      style={{ boxShadow: "0 0 0 0 rgba(74,222,128,0)" }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 30px rgba(74,222,128,0.15)")}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 0 0 0 rgba(74,222,128,0)")}
                    >
                      {/* Avatar + name */}
                      <div className="flex items-center gap-4 mb-4">
                        <div
                          className="w-16 h-16 rounded-full p-[2px] flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 0 16px rgba(74,222,128,0.4)" }}
                        >
                          {consultant.avatarUrl ? (
                            <img src={consultant.avatarUrl} alt={consultant.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                              <span className="text-green-400 font-mono font-bold text-2xl">
                                {consultant.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-white text-lg leading-tight group-hover:text-green-400 transition-colors">
                            {consultant.name}
                          </h3>
                          <p className="text-green-400/70 text-sm font-mono mt-0.5">{consultant.location || "Web3 Consultant"}</p>
                        </div>
                      </div>

                      {/* Tagline */}
                      <p className="text-gray-300 text-sm mb-4 leading-relaxed flex-1">{consultant.tagline}</p>

                      {/* Specialties */}
                      <div className="flex flex-wrap gap-2 mb-5">
                        {consultant.specialties.slice(0, 4).map(s => (
                          <span key={s} className="px-2 py-0.5 rounded-full text-xs font-mono font-medium border border-green-500/30 text-green-400 bg-green-500/10">
                            {s}
                          </span>
                        ))}
                        {consultant.specialties.length > 4 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-mono text-gray-400 border border-gray-700">
                            +{consultant.specialties.length - 4}
                          </span>
                        )}
                      </div>

                      {/* CTA */}
                      <div className="flex items-center gap-2 text-green-400 text-sm font-semibold group-hover:gap-3 transition-[gap] duration-200">
                        View Profile <ArrowRight className="w-4 h-4" />
                      </div>
                    </button>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="border-t border-green-500/20 py-8 text-center">
          <p className="text-gray-500 font-mono text-sm">
            Powered by <span className="text-green-400">TextRP</span> &amp; XRPL · <a href={TEXTRP_APP_URL} target="_blank" rel="noopener noreferrer" className="text-green-400/60 hover:text-green-400 transition-colors">app.textrp.io</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
