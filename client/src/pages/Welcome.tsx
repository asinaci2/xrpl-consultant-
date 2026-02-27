import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Shield,
  User,
  LayoutDashboard,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  LogOut,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

export default function Welcome() {
  const { isAdmin, isConsultant, isAuthenticated, isLoading, displayName, matrixUserId, consultantSlug } = useAuth();
  const [showIdentity, setShowIdentity] = useState(false);
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await apiRequest("POST", "/api/auth/logout");
    queryClient.setQueryData(["/api/auth/me"], null);
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    setLocation("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400 font-mono animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  const roleBadge = isAdmin ? (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold uppercase tracking-widest"
      data-testid="badge-role"
    >
      <Shield className="w-3.5 h-3.5" />
      Admin
    </span>
  ) : isConsultant ? (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-mono font-semibold uppercase tracking-widest"
      data-testid="badge-role"
    >
      <User className="w-3.5 h-3.5" />
      Consultant
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-500/15 border border-gray-500/30 text-gray-400 text-xs font-mono font-semibold uppercase tracking-widest"
      data-testid="badge-role"
    >
      <AlertCircle className="w-3.5 h-3.5" />
      No Role Assigned
    </span>
  );

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(0deg, transparent 24%, rgba(34,197,94,0.04) 25%, rgba(34,197,94,0.04) 26%, transparent 27%, transparent 74%, rgba(34,197,94,0.04) 75%, rgba(34,197,94,0.04) 76%, transparent 77%), linear-gradient(90deg, transparent 24%, rgba(34,197,94,0.04) 25%, rgba(34,197,94,0.04) 26%, transparent 27%, transparent 74%, rgba(34,197,94,0.04) 75%, rgba(34,197,94,0.04) 76%, transparent 77%)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg space-y-6">
        {/* Header card */}
        <div
          className="bg-black/80 border border-green-500/20 rounded-2xl p-6 backdrop-blur-xl shadow-2xl shadow-green-500/5"
          data-testid="card-welcome"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">Signed in as</p>
              <h1 className="text-white text-2xl font-display font-bold" data-testid="text-displayname">
                {displayName ?? "Unknown"}
              </h1>
              {roleBadge}
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors font-mono shrink-0 mt-1"
              data-testid="button-logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>

          {/* Identity toggle */}
          <div className="mt-4 border-t border-white/5 pt-4">
            <button
              onClick={() => setShowIdentity(!showIdentity)}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors font-mono"
              data-testid="button-toggle-identity"
            >
              {showIdentity ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showIdentity ? "Hide" : "Show"} Matrix identity
            </button>
            {showIdentity && (
              <p
                className="mt-2 text-xs font-mono text-green-400/70 bg-green-500/5 border border-green-500/10 rounded px-3 py-2 break-all"
                data-testid="text-matrix-id"
              >
                {matrixUserId}
              </p>
            )}
          </div>
        </div>

        {/* Navigation cards */}
        {isAdmin && (
          <div className="space-y-3">
            <p className="text-gray-600 text-xs font-mono uppercase tracking-widest px-1">Where would you like to go?</p>

            <Link href="/admin">
              <div
                className="group bg-black/80 border border-amber-500/20 hover:border-amber-500/50 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/5 backdrop-blur-xl"
                data-testid="card-nav-admin"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors shrink-0">
                    <Shield className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold font-display">Admin Panel</p>
                    <p className="text-gray-500 text-sm font-mono mt-0.5">Manage consultants, media, content &amp; settings</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-700 group-hover:text-amber-400 transition-colors shrink-0" />
                </div>
              </div>
            </Link>

            {consultantSlug ? (
              <Link href="/dashboard">
                <div
                  className="group bg-black/80 border border-green-500/20 hover:border-green-500/50 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-green-500/5 backdrop-blur-xl"
                  data-testid="card-nav-dashboard"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center group-hover:bg-green-500/20 transition-colors shrink-0">
                      <LayoutDashboard className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold font-display">My Dashboard</p>
                      <p className="text-gray-500 text-sm font-mono mt-0.5">Manage your consultant profile &amp; content</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-700 group-hover:text-green-400 transition-colors shrink-0" />
                  </div>
                </div>
              </Link>
            ) : (
              <div
                className="bg-black/40 border border-white/5 rounded-xl p-5 opacity-40 cursor-not-allowed"
                data-testid="card-nav-dashboard-disabled"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                    <LayoutDashboard className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-500 font-semibold font-display">My Dashboard</p>
                    <p className="text-gray-700 text-sm font-mono mt-0.5">No consultant profile linked to this account</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!isAdmin && isConsultant && (
          <div className="space-y-3">
            <p className="text-gray-600 text-xs font-mono uppercase tracking-widest px-1">Where would you like to go?</p>

            <Link href="/dashboard">
              <div
                className="group bg-black/80 border border-green-500/20 hover:border-green-500/50 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-green-500/5 backdrop-blur-xl"
                data-testid="card-nav-dashboard"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center group-hover:bg-green-500/20 transition-colors shrink-0">
                    <LayoutDashboard className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold font-display">My Dashboard</p>
                    <p className="text-gray-500 text-sm font-mono mt-0.5">Manage your consultant profile &amp; content</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-700 group-hover:text-green-400 transition-colors shrink-0" />
                </div>
              </div>
            </Link>

            {consultantSlug && (
              <Link href={`/c/${consultantSlug}`}>
                <div
                  className="group bg-black/80 border border-white/10 hover:border-white/20 rounded-xl p-4 cursor-pointer transition-all duration-200 backdrop-blur-xl"
                  data-testid="card-nav-profile"
                >
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                    <p className="text-gray-400 text-sm font-mono group-hover:text-gray-300 transition-colors">
                      View your public profile page
                    </p>
                  </div>
                </div>
              </Link>
            )}
          </div>
        )}

        {!isAdmin && !isConsultant && (
          <div
            className="bg-black/80 border border-red-500/20 rounded-xl p-5 backdrop-blur-xl space-y-4"
            data-testid="card-no-role"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 font-semibold font-display text-sm">No role assigned</p>
                <p className="text-gray-500 text-sm font-mono mt-1">
                  Your XRPL wallet is not registered as a consultant or admin on this network. Contact your network administrator to be added.
                </p>
              </div>
            </div>
            <Link href="/">
              <Button
                variant="outline"
                className="w-full border-white/10 text-gray-400 hover:text-white hover:border-white/20 font-mono text-sm"
                data-testid="button-back-directory"
              >
                Back to Directory
              </Button>
            </Link>
          </div>
        )}

        {/* Footer link */}
        <div className="text-center">
          <Link href="/">
            <span
              className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-green-400 transition-colors font-mono"
              data-testid="link-back-directory"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to directory
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
