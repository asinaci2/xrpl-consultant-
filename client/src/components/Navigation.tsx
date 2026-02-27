import { Link } from "react-scroll";
import { useState, useEffect } from "react";
import { Menu, X, Hexagon, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import StoryViewer from "./StoryViewer";
import { Link as RouterLink } from "wouter";

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

function StoriesInNav() {
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    stories: Story[];
    startIndex: number;
  }>({
    isOpen: false,
    stories: [],
    startIndex: 0,
  });

  const { data: stories = [] } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
    refetchInterval: 60000,
  });

  if (stories.length === 0) return null;

  const groupedByAuthor = stories.reduce((acc, story) => {
    const key = story.authorName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(story);
    return acc;
  }, {} as Record<string, Story[]>);

  const handleStoryClick = (allStories: Story[], startIndex: number) => {
    setViewerState({ isOpen: true, stories: allStories, startIndex });
  };

  return (
    <>
      <div 
        className="flex gap-2 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        data-testid="stories-header"
      >
        {Object.entries(groupedByAuthor).map(([authorName, authorStories]) => {
          const latestStory = authorStories[authorStories.length - 1];
          const hasMultiple = authorStories.length > 1;
          
          return (
            <button
              key={authorName}
              onClick={() => handleStoryClick(stories, stories.findIndex(s => s.id === authorStories[0].id))}
              className="flex items-center gap-2 shrink-0 group"
              data-testid={`story-bubble-${authorName.replace(/\s+/g, "-").toLowerCase()}`}
            >
              <div 
                className={`relative w-10 h-10 rounded-full p-[2px] transition-all duration-300 group-hover:scale-110 ${
                  hasMultiple 
                    ? "bg-gradient-to-tr from-green-400 via-green-500 to-emerald-400" 
                    : "bg-gradient-to-tr from-green-500 to-green-400"
                }`}
                style={{
                  boxShadow: "0 0 10px rgba(74, 222, 128, 0.5)",
                }}
              >
                <div className="w-full h-full rounded-full bg-[#0a0a0a] p-[1px] overflow-hidden">
                  {latestStory.authorImage ? (
                    <img
                      src={latestStory.authorImage}
                      alt={authorName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-green-900/50 to-green-950 flex items-center justify-center">
                      <span className="text-green-400 font-mono text-sm font-bold">
                        {authorName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                {hasMultiple && (
                  <div 
                    className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-[9px] font-bold text-black border border-[#0a0a0a]"
                  >
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

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Services", to: "services" },
    { name: "Projects", to: "projects" },
    { name: "About", to: "about" },
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled || isMobileMenuOpen ? "glass-nav shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div 
            className="flex-shrink-0 flex items-center gap-2 cursor-pointer" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            data-testid="button-logo-home"
          >
            <Hexagon className="w-8 h-8 text-green-400 fill-green-400/20" />
            <span className="font-display font-bold text-xl tracking-tight text-white">
              Edwin Gutierrez
            </span>
          </div>

          {/* Stories in Nav */}
          <div className="hidden md:block flex-1 mx-8">
            <StoriesInNav />
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.to}
                smooth={true}
                duration={500}
                className="text-sm font-medium text-gray-300 hover:text-green-400 transition-colors cursor-pointer"
                data-testid={`link-nav-${link.to}`}
              >
                {link.name}
              </Link>
            ))}
            <Link to="contact" smooth={true} duration={500} data-testid="link-nav-contact">
              <Button className="bg-green-500 hover:bg-green-600 text-black font-bold rounded-full px-6" data-testid="button-consultation">
                Consultation
              </Button>
            </Link>
            <RouterLink href="/login" data-testid="link-nav-login">
              <Button variant="outline" className="border-green-500/40 text-green-400 hover:bg-green-500/10 rounded-full px-4" data-testid="button-login-nav">
                <LogIn className="w-4 h-4 mr-1" />
                Login
              </Button>
            </RouterLink>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:text-green-400 transition-colors"
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-black/95 backdrop-blur-md border-b border-green-500/20 shadow-lg" data-testid="mobile-menu">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.to}
                smooth={true}
                duration={500}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-3 text-base font-medium text-gray-300 hover:bg-green-500/10 hover:text-green-400 rounded-lg cursor-pointer"
                data-testid={`link-mobile-nav-${link.to}`}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 space-y-2">
              <Link to="contact" smooth={true} duration={500} onClick={() => setIsMobileMenuOpen(false)} data-testid="link-mobile-nav-contact">
                <Button className="w-full bg-green-500 hover:bg-green-600 text-black font-bold rounded-lg" data-testid="button-mobile-consultation">
                  Book Consultation
                </Button>
              </Link>
              <RouterLink href="/login" onClick={() => setIsMobileMenuOpen(false)} data-testid="link-mobile-nav-login">
                <Button variant="outline" className="w-full border-green-500/40 text-green-400 hover:bg-green-500/10 rounded-lg mt-2" data-testid="button-mobile-login">
                  <LogIn className="w-4 h-4 mr-1" />
                  Login
                </Button>
              </RouterLink>
            </div>
          </div>
        </div>
      )}

    </nav>
  );
}
