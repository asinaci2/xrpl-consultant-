import { Hexagon, Linkedin, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-white border-t border-white/10 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="flex items-center gap-2">
            <Hexagon className="w-6 h-6 text-secondary fill-secondary/20" />
            <span className="font-display font-bold text-xl tracking-tight">
              Edwin Gutierrez
            </span>
          </div>
          
          <div className="text-sm text-blue-200/60">
            &copy; {new Date().getFullYear()} Edwin Gutierrez. All rights reserved.
          </div>
          
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <Linkedin className="w-5 h-5 text-white" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <Twitter className="w-5 h-5 text-white" />
            </a>
          </div>
          
        </div>
      </div>
    </footer>
  );
}
