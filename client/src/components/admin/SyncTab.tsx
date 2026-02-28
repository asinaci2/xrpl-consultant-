import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Activity, RefreshCw, Clock, UserPlus, CheckCircle2 } from "lucide-react";

type SyncStatus = {
  lastSyncAt: string | null;
  adminCount: number;
  consultantRoomMembers: number;
  consultantsSynced: number;
  adminRoomId: string;
  consultantRoomId: string | null;
};

export function SyncTab() {
  const { toast } = useToast();
  const { data: status, isLoading, refetch, isFetching } = useQuery<SyncStatus>({
    queryKey: ["/api/admin/sync-status"],
    refetchInterval: 30_000,
  });

  const { data: pendingData, isLoading: pendingLoading } = useQuery<{ pending: string[] }>({
    queryKey: ["/api/admin/pending-invites"],
    refetchInterval: 30_000,
  });
  const pendingInvites = pendingData?.pending ?? [];

  const [matrixId, setMatrixId] = useState("");
  const [addedConsultant, setAddedConsultant] = useState<{ name: string; slug: string } | null>(null);

  const addMutation = useMutation({
    mutationFn: async (matrixUserId: string) => {
      const res = await apiRequest("POST", "/api/admin/add-consultant", { matrixUserId });
      return res.json();
    },
    onSuccess: (data) => {
      const { consultant, created, reactivated } = data;
      setAddedConsultant({ name: consultant.name, slug: consultant.slug });
      setMatrixId("");
      queryClient.invalidateQueries({ queryKey: ["/api/consultants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-invites"] });
      if (created) {
        toast({ title: "Consultant created", description: `${consultant.name} added with slug /${consultant.slug}` });
      } else if (reactivated) {
        toast({ title: "Consultant reactivated", description: `${consultant.name} (/${consultant.slug}) is now active again` });
      } else {
        toast({ title: "Already exists", description: `${consultant.name} (/${consultant.slug}) already has an active account` });
      }
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to add consultant", variant: "destructive" });
    },
  });

  const handleAdd = () => {
    const id = matrixId.trim();
    if (!id) return;
    if (!id.startsWith("@") || !id.includes(":")) {
      toast({ title: "Invalid Matrix ID", description: "Format should be @username:server.com", variant: "destructive" });
      return;
    }
    setAddedConsultant(null);
    addMutation.mutate(id);
  };

  return (
    <div className="space-y-5">
      <Card className="bg-black/60 border-green-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-400 text-base flex items-center gap-2">
            <Activity className="w-4 h-4" />
            TextRP Room Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-400 text-sm">Loading sync status...</p>
          ) : status ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/40 rounded-lg p-3 border border-green-500/10">
                  <p className="text-gray-500 text-xs mb-1">Last Sync</p>
                  <p className="text-green-300 text-sm font-mono">
                    {status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleTimeString() : "Pending..."}
                  </p>
                </div>
                <div className="bg-black/40 rounded-lg p-3 border border-green-500/10">
                  <p className="text-gray-500 text-xs mb-1">Admin Room Members</p>
                  <p className="text-green-300 text-sm font-mono">{status.adminCount}</p>
                </div>
                <div className="bg-black/40 rounded-lg p-3 border border-green-500/10">
                  <p className="text-gray-500 text-xs mb-1">Consultant Room Members</p>
                  <p className="text-green-300 text-sm font-mono">
                    {status.consultantRoomId ? status.consultantRoomMembers : "Room not configured"}
                  </p>
                </div>
                <div className="bg-black/40 rounded-lg p-3 border border-green-500/10">
                  <p className="text-gray-500 text-xs mb-1">Last Sync Changes</p>
                  <p className="text-green-300 text-sm font-mono">{status.consultantsSynced} updates</p>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-gray-500 text-xs mb-1">Admin Room ID</p>
                  <p className="text-gray-300 text-xs font-mono break-all bg-black/30 p-2 rounded">{status.adminRoomId}</p>
                </div>
                {status.consultantRoomId ? (
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Consultant Room ID</p>
                    <p className="text-gray-300 text-xs font-mono break-all bg-black/30 p-2 rounded">{status.consultantRoomId}</p>
                  </div>
                ) : (
                  <div className="px-3 py-2 rounded border border-amber-500/30 bg-amber-500/5">
                    <p className="text-amber-300 text-xs">
                      No <span className="font-mono">CONSULTANT_MATRIX_ROOM</span> environment variable set.
                      Set it to a TextRP room ID to enable automatic consultant sync.
                    </p>
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching}
                className="border-green-500/30 text-green-400"
                data-testid="button-refresh-sync"
              >
                <RefreshCw className={`w-3 h-3 mr-2 ${isFetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Could not load sync status.</p>
          )}
        </CardContent>
      </Card>

      {(pendingLoading || pendingInvites.length > 0) && (
        <Card className="bg-black/60 border-amber-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-amber-400 text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Invites
              {pendingInvites.length > 0 && (
                <Badge className="ml-1 bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                  {pendingInvites.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-400 text-sm">
              These users were invited to the consultant room but haven't accepted yet.
              Click <span className="text-amber-300">Add</span> to create their consultant account immediately.
            </p>
            {pendingLoading ? (
              <p className="text-gray-500 text-sm">Checking invites...</p>
            ) : (
              <div className="space-y-2">
                {pendingInvites.map((id) => (
                  <div key={id} className="flex items-center gap-2 bg-black/40 rounded-lg px-3 py-2 border border-amber-500/10" data-testid={`pending-invite-${id}`}>
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-gray-300 text-xs font-mono flex-1 break-all">{id}</span>
                    <Button
                      size="sm"
                      onClick={() => addMutation.mutate(id)}
                      disabled={addMutation.isPending}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 shrink-0"
                      data-testid={`button-add-pending-${id}`}
                    >
                      {addMutation.isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                      <span className="ml-1.5">Add</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-black/60 border-blue-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-blue-400 text-base flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Manually Add Consultant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-400 text-sm">
            Use this to add a user who was invited to the TextRP consultant room but hasn't accepted yet.
            Paste their TextRP Matrix ID below to create their consultant account immediately.
          </p>
          <div className="flex gap-2">
            <Input
              value={matrixId}
              onChange={(e) => setMatrixId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="@username:synapse.textrp.io"
              className="flex-1 bg-black/40 border-blue-500/20 text-gray-200 font-mono text-sm placeholder:text-gray-600"
              data-testid="input-matrix-id"
            />
            <Button
              onClick={handleAdd}
              disabled={addMutation.isPending || !matrixId.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
              data-testid="button-add-consultant"
            >
              {addMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span className="ml-2">{addMutation.isPending ? "Adding..." : "Add"}</span>
            </Button>
          </div>
          {addedConsultant && (
            <div className="flex items-start gap-2 px-3 py-2 rounded border border-green-500/30 bg-green-500/5" data-testid="alert-consultant-added">
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-green-300 text-sm font-semibold">{addedConsultant.name}</p>
                <p className="text-gray-400 text-xs font-mono mt-0.5">
                  slug: /{addedConsultant.slug} — they can now log in and access their dashboard
                </p>
              </div>
            </div>
          )}
          <p className="text-gray-600 text-xs">
            To find someone's Matrix ID: open TextRP, go to their profile, and copy their full ID (starts with @).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
