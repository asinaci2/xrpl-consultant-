import { Link as ScrollLink } from "react-scroll";
import { useState, useEffect } from "react";
import { Menu, X, Hexagon, LogIn, Sun, Moon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import StoryViewer from "./StoryViewer";
import { Link as RouterLink } from "wouter";
import { useTheme } from "@/hooks/useTheme";

interface Story {
  id: number;
  content: string | null;
  imageUrl: string | null;
  authorName: string;
  authorImage: string | null;
  createdAt: string | null;
  expiresAt: string;
  sourceType?: string | null;
  sourceUrl?: string | null;
}

interface Consultant {
  name: string;
  slug: string;
}

function StoriesInConsultantNav({ slug }: { slug: string }) {
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    stories: Story[];
    startIndex: number;
  }>({ isOpen: false, stories: [], startIndex: 0 });

  const { data: stories = [] } = useQuery<Story[]>({
    queryKey: ["/api/c/:slug/stories", slug],
    queryFn: async () => {
      const res = await fetch(`/api/c/${slug}/stories`);
      return res.json();
    },
    refetchInterval: 60000,
  });

  if (stories.length === 0) return null;

  const groupedByAuthor = stories.reduce((acc, story) => {
    const key = story.authorName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(story);
    return acc;
  }, {} as Record<string, Story[]>);

  return (
    <>
      <div
        className="flex gap-2 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {Object.entries(groupedByAuthor).map(([authorName, authorStories]) => {
          const latestStory = authorStories[authorStories.length - 1];
          const hasMultiple = authorStories.length > 1;
          return (
            <button
              key={authorName}
              onClick={() => setViewerState({ isOpen: true, stories, startIndex: stories.findIndex(s => s.id === authorStories[0].id) })}
              className="flex items-center gap-2 shrink-0 group"
            >
              <div
                className={`relative w-10 h-10 rounded-full p-[2px] transition-all duration-300 group-hover:scale-110 ${
                  hasMultiple ? "bg-gradient-to-tr from-green-400 via-green-500 to-emerald-400" : "bg-gradient-to-tr from-green-500 to-green-400"
                }`}
                style={{ boxShadow: "0 0 10px rgba(74, 222, 128, 0.5)" }}
              >
                <div className="w-full h-full rounded-full bg-[#0a0a0a] p-[1px] overflow-hidden">
                  {latestStory.authorImage ? (
                    <img src={latestStory.authorImage} alt={authorName} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-green-900/50 to-green-950 flex items-center justify-center">
                      <span className="text-green-400 font-mono text-sm font-bold">{authorName.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                </div>
                {hasMultiple && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-[9px] font-bold text-black border border-[#0a0a0a]">
                    {authorStories.length}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {viewerState.isOpen && (
        <StoryViewer
          stories={viewerState.stories}
          startIndex={viewerState.startIndex}
          onClose={() => setViewerState(prev => ({ ...prev, isOpen: false }))}
        />
      )}
    </>
  );
}

export function ConsultantNavigation({ consultant, slug }: { consultant: Consultant; slug: string }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Services", to: "services" },
    { name: "Projects", to: "projects" },
    { name: "About", to: "about" },
  ];

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled || isMobileMenuOpen ? "glass-nav shadow-sm" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-4 flex-shrink-0">
            <RouterLink href="/">
              <button className="flex items-center gap-1 text-gray-400 hover:text-green-400 transition-colors text-sm font-mono">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Directory</span>
              </button>
            </RouterLink>
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <Hexagon className="w-8 h-8 text-green-400 fill-green-400/20" />
              <span className="font-display font-bold text-xl tracking-tight text-white">{consultant.name}</span>
            </div>
          </div>

          <div className="hidden md:block flex-1 mx-8">
            <StoriesInConsultantNav slug={slug} />
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map(link => (
              <ScrollLink
                key={link.name}
                to={link.to}
                smooth={true}
                duration={500}
                className="text-sm font-medium text-gray-300 hover:text-green-400 transition-colors cursor-pointer"
              >
                {link.name}
              </ScrollLink>
            ))}
            <ScrollLink to="contact" smooth={true} duration={500}>
              <Button className="bg-green-500 hover:bg-green-600 text-black font-bold rounded-full px-6">
                Consultation
              </Button>
            </ScrollLink>
            <RouterLink href="/login">
              <Button variant="outline" className="border-green-500/40 text-green-400 hover:bg-green-500/10 rounded-full px-4">
                <LogIn className="w-4 h-4 mr-1" />
                Login
              </Button>
            </RouterLink>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="theme-toggle text-gray-300 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-full"
              title={theme === "matrix" ? "Switch to Day Mode" : "Switch to Matrix Mode"}
            >
              {theme === "matrix" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:text-green-400 transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-black/95 backdrop-blur-md border-b border-green-500/20 shadow-lg">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {navLinks.map(link => (
              <ScrollLink
                key={link.name}
                to={link.to}
                smooth={true}
                duration={500}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-3 text-base font-medium text-gray-300 hover:bg-green-500/10 hover:text-green-400 rounded-lg cursor-pointer"
              >
                {link.name}
              </ScrollLink>
            ))}
            <div className="pt-4 space-y-2">
              <ScrollLink to="contact" smooth={true} duration={500} onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full bg-green-500 hover:bg-green-600 text-black font-bold rounded-lg">Book Consultation</Button>
              </ScrollLink>
              <RouterLink href="/" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full border-green-500/40 text-green-400 hover:bg-green-500/10 rounded-lg mt-2">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back to Directory
                </Button>
              </RouterLink>
              <Button
                variant="outline"
                onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }}
                className="w-full border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10 rounded-lg mt-2"
              >
                {theme === "matrix" ? <><Sun className="w-4 h-4 mr-2" />Day Mode</> : <><Moon className="w-4 h-4 mr-2" />Matrix Mode</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
