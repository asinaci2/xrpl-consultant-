import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Copy, ExternalLink, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { WalletData } from "./types";

export function WalletTab() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: wallet, isLoading: walletLoading } = useQuery<WalletData & { unfunded?: boolean; xrpBalance?: number; drops?: number; ownerCount?: number; nftCount?: number; sequence?: number; xrplAddress: string }>({
    queryKey: ["/api/visitor/wallet"],
    queryFn: () => fetch("/api/visitor/wallet", { credentials: "include" }).then(r => r.json()),
  });

  const copyAddress = () => {
    if (!wallet?.xrplAddress) return;
    navigator.clipboard.writeText(wallet.xrplAddress);
    setCopied(true);
    toast({ title: "Address copied", description: "XRPL address copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-black/60 border-green-500/20" data-testid="card-wallet">
      <CardHeader className="pb-3 border-b border-green-500/10">
        <CardTitle className="text-green-400 flex items-center gap-2 text-base">
          <Wallet className="w-5 h-5" />
          XRPL Ledger Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {walletLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-6 bg-green-500/10 rounded w-3/4" />
            <div className="h-12 bg-green-500/10 rounded w-1/2" />
            <div className="flex gap-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-green-500/10 rounded flex-1" />)}
            </div>
          </div>
        ) : !wallet?.xrplAddress ? (
          <p className="text-black/60 dark:text-white/60 text-sm">No XRPL wallet address found for your account.</p>
        ) : wallet.unfunded ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="text-green-400 font-mono text-sm break-all">{wallet.xrplAddress}</code>
              <button onClick={copyAddress} className="text-black/40 dark:text-white/40 hover:text-green-400 shrink-0" data-testid="button-copy-address">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-yellow-400/80 text-sm">This account hasn't been activated on the XRPL yet (requires 10 XRP reserve).</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-green-400 font-mono text-sm break-all" data-testid="text-xrpl-address">{wallet.xrplAddress}</code>
              <button onClick={copyAddress} className="text-black/40 dark:text-white/40 hover:text-green-400 transition-colors shrink-0" data-testid="button-copy-address">
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div>
              <p className="text-4xl font-display font-bold text-black dark:text-white" data-testid="text-xrp-balance">
                {wallet.xrpBalance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} <span className="text-green-400 text-2xl">XRP</span>
              </p>
              <p className="text-black/50 dark:text-white/50 text-xs font-mono mt-1">{wallet.drops?.toLocaleString()} drops</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Owner Count", value: wallet.ownerCount ?? 0, testid: "text-owner-count" },
                { label: "NFTs", value: wallet.nftCount ?? 0, testid: "text-nft-count" },
                { label: "Sequence", value: wallet.sequence ?? 0, testid: "text-sequence" },
              ].map(stat => (
                <div key={stat.label} className="bg-white/10 dark:bg-black/40 rounded-xl p-3 border border-green-500/10 text-center">
                  <p className="text-black dark:text-white font-bold text-lg" data-testid={stat.testid}>{stat.value.toLocaleString()}</p>
                  <p className="text-black/60 dark:text-white/60 text-xs">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3 flex-wrap">
              <a href={`https://bithomp.com/explorer/${wallet.xrplAddress}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-green-400/80 hover:text-green-400 border border-green-500/20 hover:border-green-500/40 rounded-full px-3 py-1.5 transition-colors" data-testid="link-bithomp">
                <ExternalLink className="w-3.5 h-3.5" />Bithomp
              </a>
              <a href={`https://xrpscan.com/account/${wallet.xrplAddress}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-green-400/80 hover:text-green-400 border border-green-500/20 hover:border-green-500/40 rounded-full px-3 py-1.5 transition-colors" data-testid="link-xrpscan">
                <ExternalLink className="w-3.5 h-3.5" />XRPScan
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
