import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/ui/sidebar";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import { ChatWidget } from "@/components/ChatWidget";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <Router />
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <DashboardLayout />
        <ChatWidget />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
