import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";
import { CachedTweet } from "./types";

export function TweetsTab() {
  const { toast } = useToast();

  const { data: tweets = [], isLoading } = useQuery<CachedTweet[]>({
    queryKey: ["/api/twitter/tweets"],
  });

  const refreshMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/twitter/refresh"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/twitter/tweets"] });
      toast({ title: "Twitter cache refreshed" });
    },
    onError: () => {
      toast({ title: "Failed to refresh", description: "Check API credentials", variant: "destructive" });
    },
  });

  return (
    <Card className="bg-black/60 border-green-500/20">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-green-400 text-lg">Cached Tweets</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          className="border-green-500/30 text-green-400 hover:bg-green-500/10"
          data-testid="button-refresh-tweets"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
          {refreshMutation.isPending ? "Refreshing..." : "Refresh Cache"}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-gray-400">Loading...</p>
        ) : tweets.length === 0 ? (
          <p className="text-gray-400">No cached tweets.</p>
        ) : (
          <div className="space-y-3">
            {tweets.map((tweet, index) => (
              <div
                key={tweet.tweetId || index}
                className="p-4 rounded-lg border border-green-500/10 bg-black/30"
                data-testid={`card-tweet-${index}`}
              >
                <div className="flex items-start gap-3">
                  {tweet.authorImage && (
                    <img
                      src={tweet.authorImage}
                      alt={tweet.authorName}
                      className="w-10 h-10 rounded-full border border-green-500/20 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium text-sm">{tweet.authorName}</span>
                      <span className="text-gray-500 text-xs">@{tweet.authorUsername}</span>
                    </div>
                    <p className="text-gray-300 text-sm mt-1">{tweet.text}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                      <span>{tweet.likes} likes</span>
                      <span>{tweet.retweets} retweets</span>
                      <span>{tweet.replies} replies</span>
                      {tweet.fetchedAt && (
                        <span>Cached: {new Date(tweet.fetchedAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
