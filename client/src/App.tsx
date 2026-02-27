import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Directory from "@/pages/Directory";
import ConsultantPage from "@/pages/ConsultantPage";
import Admin from "@/pages/Admin";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { ChatWidget } from "@/components/ChatWidget";
import { useAuth } from "@/hooks/useAuth";

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

  if (!isConsultant && !isAdmin) {
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
      <Route path="/admin" component={ProtectedAdmin} />
      <Route path="/dashboard" component={ProtectedDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <ChatWidget />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
