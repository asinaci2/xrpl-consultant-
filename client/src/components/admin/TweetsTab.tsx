import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Twitter, User, MessageSquare, Heart, Repeat } from "lucide-react";
import { CachedTweet } from "./types";
import { Consultant } from "@shared/schema";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function TweetsTab() {
  const { toast } = useToast();
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);

  const { data: consultants = [] } = useQuery<Consultant[]>({
    queryKey: ["/api/consultants"],
  });

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

  const stats = useMemo(() => {
    if (!tweets.length) return null;
    const totalLikes = tweets.reduce((sum, t) => sum + (t.likes || 0), 0);
    const totalRetweets = tweets.reduce((sum, t) => sum + (t.retweets || 0), 0);
    const lastRefreshed = tweets.reduce((latest, t) => {
      const current = new Date(t.fetchedAt).getTime();
      return current > latest ? current : latest;
    }, 0);

    return {
      total: tweets.length,
      likes: totalLikes,
      retweets: totalRetweets,
      lastRefreshed: lastRefreshed ? new Date(lastRefreshed).toLocaleString() : "Never",
    };
  }, [tweets]);

  const authorSlugs = useMemo(() => {
    const authors = new Set(tweets.map(t => t.authorUsername));
    return Array.from(authors);
  }, [tweets]);

  const filteredTweets = useMemo(() => {
    if (!selectedAuthor) return tweets;
    return tweets.filter(t => t.authorUsername === selectedAuthor);
  }, [tweets, selectedAuthor]);

  const twitterAccounts = useMemo(() => {
    return consultants.map(c => {
      const userTweets = tweets.filter(t => t.authorUsername === c.twitterUsername);
      const engagement = userTweets.reduce((sum, t) => sum + (t.likes || 0) + (t.retweets || 0) + (t.replies || 0), 0);
      const lastTweet = userTweets.length > 0 
        ? userTweets.reduce((latest, t) => {
            const current = new Date(t.fetchedAt).getTime();
            return current > latest ? current : latest;
          }, 0)
        : null;

      return {
        consultant: c,
        tweetCount: userTweets.length,
        engagement,
        lastCached: lastTweet ? new Date(lastTweet).toLocaleString() : "Never",
        status: userTweets.length > 0 ? "Connected" : (c.twitterUsername ? "Configured" : "Not configured")
      };
    });
  }, [consultants, tweets]);

  return (
    <div className="space-y-6">
      {/* Top: Engagement Summary strip */}
      <div className="flex items-center justify-between text-sm text-green-400/80 bg-green-500/5 p-3 rounded-lg border border-green-500/10">
        <div className="flex gap-4 flex-wrap">
          <span>{stats?.total || 0} tweets cached</span>
          <span>{stats?.likes || 0} total likes</span>
          <span>{stats?.retweets || 0} total retweets</span>
          <span>Last refreshed: {stats?.lastRefreshed}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          className="border-green-500/30 text-green-400 hover:bg-green-500/10 h-8"
          data-testid="button-refresh-tweets"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
          {refreshMutation.isPending ? "Refreshing..." : "Refresh Cache"}
        </Button>
      </div>

      {/* Section 1 — Twitter Account Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {twitterAccounts.map(({ consultant, tweetCount, engagement, lastCached, status }) => (
          <Card key={consultant.id} className="bg-black/40 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 border border-green-500/20">
                  <AvatarImage src={consultant.avatarUrl || undefined} />
                  <AvatarFallback className="bg-green-500/10 text-green-400">
                    {consultant.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white truncate">{consultant.name}</p>
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] px-1.5 py-0 h-4 ${
                        status === "Connected" ? "border-green-500/50 text-green-400 bg-green-500/5" :
                        status === "Configured" ? "border-yellow-500/50 text-yellow-400 bg-yellow-500/5" :
                        "border-gray-500/50 text-gray-400 bg-gray-500/5"
                      }`}
                    >
                      {status}
                    </Badge>
                  </div>
                  {consultant.twitterUsername ? (
                    <>
                      <p className="text-xs text-green-500/60 truncate">@{consultant.twitterUsername}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                        <div className="text-gray-400">
                          <span className="block text-white font-medium">{tweetCount}</span>
                          Tweets
                        </div>
                        <div className="text-gray-400">
                          <span className="block text-white font-medium">{engagement}</span>
                          Engagement
                        </div>
                      </div>
                      <p className="mt-2 text-[10px] text-gray-500">
                        Cached: {lastCached}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-xs text-gray-500 italic">Not configured</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section 2 — Cached Tweets list */}
      <Card className="bg-black/60 border-green-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-400 text-lg">Cached Tweets</CardTitle>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={selectedAuthor === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedAuthor(null)}
              className={selectedAuthor === null ? "bg-green-600 hover:bg-green-700" : "border-green-500/30 text-green-400"}
              data-testid="pill-filter-all"
            >
              All
            </Button>
            {authorSlugs.map(username => {
              const consultant = consultants.find(c => c.twitterUsername === username);
              const label = consultant ? consultant.name : `@${username}`;
              return (
                <Button
                  key={username}
                  variant={selectedAuthor === username ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedAuthor(username)}
                  className={selectedAuthor === username ? "bg-green-600 hover:bg-green-700" : "border-green-500/30 text-green-400"}
                  data-testid={`pill-filter-${username}`}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-400">Loading...</p>
          ) : filteredTweets.length === 0 ? (
            <p className="text-gray-400">No cached tweets.</p>
          ) : (
            <div className="space-y-3">
              {filteredTweets.map((tweet, index) => (
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
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {tweet.likes}</span>
                        <span className="flex items-center gap-1"><Repeat className="w-3 h-3" /> {tweet.retweets}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {tweet.replies}</span>
                        {tweet.fetchedAt && (
                          <span className="ml-auto">Cached: {new Date(tweet.fetchedAt).toLocaleString()}</span>
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
    </div>
  );
}
