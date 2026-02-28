import { Switch, Route, Redirect, useRoute } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Directory from "@/pages/Directory";
import ConsultantPage from "@/pages/ConsultantPage";
import Admin from "@/pages/Admin";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Welcome from "@/pages/Welcome";
import NotFound from "@/pages/not-found";
import { ChatWidget } from "@/components/ChatWidget";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon } from "lucide-react";

function ProtectedAdmin() {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400 font-mono animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Redirect to="/login" />;
  }

  return <Admin />;
}

function ProtectedDashboard() {
  const { isConsultant, isAdmin, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400 font-mono animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Dashboard />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Directory} />
      <Route path="/c/:slug" component={ConsultantPage} />
      <Route path="/login" component={Login} />
      <Route path="/welcome" component={Welcome} />
      <Route path="/admin" component={ProtectedAdmin} />
      <Route path="/dashboard" component={ProtectedDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function GlobalThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-5 left-5 z-50 w-10 h-10 rounded-full bg-black/60 border border-green-500/30 backdrop-blur-md flex items-center justify-center text-gray-300 hover:text-yellow-400 hover:border-yellow-400/40 hover:bg-black/80 transition-all duration-200 shadow-lg"
      data-testid="button-theme-toggle-global"
      title={theme === "matrix" ? "Switch to Day Mode" : "Switch to Night Mode"}
    >
      {theme === "matrix" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

function AppInner() {
  const [isConsultantPage, params] = useRoute("/c/:slug");
  const consultantSlug = isConsultantPage ? params?.slug : undefined;

  return (
    <>
      <Router />
      <ChatWidget consultantSlug={consultantSlug} />
      <GlobalThemeToggle />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppInner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
