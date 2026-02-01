import { Link } from "react-scroll";
import { useState, useEffect } from "react";
import { Menu, X, Hexagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stories } from "./Stories";

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
            <Hexagon className="w-8 h-8 text-secondary fill-secondary/20" />
            <span className="font-display font-bold text-xl tracking-tight text-primary">
              Edwin Gutierrez
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.to}
                smooth={true}
                duration={500}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                data-testid={`link-nav-${link.to}`}
              >
                {link.name}
              </Link>
            ))}
            <Link to="contact" smooth={true} duration={500} data-testid="link-nav-contact">
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-6" data-testid="button-consultation">
                Consultation
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-primary hover:text-primary/80 transition-colors"
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-background border-b border-border shadow-lg" data-testid="mobile-menu">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.to}
                smooth={true}
                duration={500}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-3 text-base font-medium text-foreground hover:bg-muted rounded-lg cursor-pointer"
                data-testid={`link-mobile-nav-${link.to}`}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4">
              <Link to="contact" smooth={true} duration={500} onClick={() => setIsMobileMenuOpen(false)} data-testid="link-mobile-nav-contact">
                <Button className="w-full bg-primary text-white rounded-lg" data-testid="button-mobile-consultation">
                  Book Consultation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stories Sub-header */}
      <Stories />
    </nav>
  );
}
