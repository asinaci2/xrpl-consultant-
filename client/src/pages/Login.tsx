import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hexagon, LogIn, AlertCircle } from "lucide-react";

const TEXTRP_ROOM_URL = "https://app.textrp.io/#/room/#budzy-vibe:synapse.textrp.io";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    login.mutate(
      { username, password },
      {
        onSuccess: (data) => {
          if (data.isAdmin) {
            setLocation("/admin");
          } else {
            window.location.href = TEXTRP_ROOM_URL;
          }
        },
        onError: (err: any) => {
          const msg = err?.message || "Login failed";
          const cleaned = msg.replace(/^\d+:\s*/, "").replace(/^"(.*)"$/, "$1");
          try {
            const parsed = JSON.parse(cleaned);
            setError(parsed.message || "Invalid credentials");
          } catch {
            setError(cleaned || "Invalid credentials");
          }
        },
      }
    );
  };

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
            Matrix Login
          </CardTitle>
          <p className="text-gray-400 text-sm font-mono mt-1">
            synapse.textrp.io
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm" data-testid="text-login-error">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-mono text-green-400" htmlFor="username">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="matrix_username"
                required
                className="bg-black/60 border-green-500/30 text-white placeholder:text-gray-600 focus:border-green-400 focus:ring-green-400/20 font-mono"
                data-testid="input-username"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-mono text-green-400" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-black/60 border-green-500/30 text-white placeholder:text-gray-600 focus:border-green-400 focus:ring-green-400/20 font-mono"
                data-testid="input-password"
              />
            </div>

            <Button
              type="submit"
              disabled={login.isPending}
              className="w-full bg-green-500 hover:bg-green-600 text-black font-bold font-mono py-5 transition-all duration-300"
              data-testid="button-login"
            >
              {login.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⟳</span>
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Connect
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
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
