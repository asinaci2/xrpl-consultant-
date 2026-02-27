import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hexagon, LogIn, AlertCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [error, setError] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [, setLocation] = useLocation();
  const { isAdmin, isConsultant, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errParam = params.get("error");
    if (errParam === "missing_token") {
      setError("Authentication failed — no token received.");
    } else if (errParam === "session_failed") {
      setError("Failed to create session. Please try again.");
    } else if (errParam === "auth_failed") {
      setError("Authentication failed. Please try again.");
    }
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (isAdmin) {
        setLocation("/admin");
      } else if (isConsultant) {
        setLocation("/dashboard");
      } else {
        window.location.href = "https://app.textrp.io/#/room/#budzy-vibe:synapse.textrp.io";
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, isConsultant, setLocation]);

  const handleLogin = async () => {
    setError("");
    setIsRedirecting(true);
    try {
      const res = await apiRequest("GET", "/api/auth/sso-redirect");
      const data = await res.json();
      window.location.href = data.url;
    } catch (err: any) {
      setError("Failed to start login. Please try again.");
      setIsRedirecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400 font-mono animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(0deg, transparent 24%, rgba(34, 197, 94, 0.04) 25%, rgba(34, 197, 94, 0.04) 26%, transparent 27%, transparent 74%, rgba(34, 197, 94, 0.04) 75%, rgba(34, 197, 94, 0.04) 76%, transparent 77%), linear-gradient(90deg, transparent 24%, rgba(34, 197, 94, 0.04) 25%, rgba(34, 197, 94, 0.04) 26%, transparent 27%, transparent 74%, rgba(34, 197, 94, 0.04) 75%, rgba(34, 197, 94, 0.04) 76%, transparent 77%)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <Card className="w-full max-w-md bg-black/80 border border-green-500/30 backdrop-blur-xl shadow-2xl shadow-green-500/10" data-testid="card-login">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Hexagon className="w-16 h-16 text-green-400 fill-green-400/20" />
              <div className="absolute inset-0 animate-pulse">
                <Hexagon className="w-16 h-16 text-green-400/30" />
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl font-display text-white">
            Connect with Xumm
          </CardTitle>
          <p className="text-gray-400 text-sm font-mono mt-1">
            Sign in via XRPL wallet
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm" data-testid="text-login-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            onClick={handleLogin}
            disabled={isRedirecting}
            className="w-full bg-green-500 hover:bg-green-600 text-black font-bold font-mono py-6 text-base transition-all duration-300"
            data-testid="button-login"
          >
            {isRedirecting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Redirecting to Xumm...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="w-5 h-5" />
                Sign in with Xumm
              </span>
            )}
          </Button>

          <p className="text-center text-xs text-gray-600 font-mono">
            Powered by synapse.textrp.io
          </p>

          <div className="pt-2 text-center">
            <a
              href="/"
              className="text-sm text-gray-500 hover:text-green-400 transition-colors font-mono"
              data-testid="link-back-home"
            >
              ← Back to site
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
