import { db } from "./db";
import { cachedTweets } from "@shared/schema";
import { desc } from "drizzle-orm";

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
}

interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
}

interface TwitterApiResponse {
  data?: Tweet[];
  includes?: {
    users?: TwitterUser[];
  };
  meta?: {
    result_count: number;
    newest_id?: string;
    oldest_id?: string;
    next_token?: string;
  };
  errors?: Array<{ message: string }>;
}

export interface FormattedTweet {
  id: string;
  text: string;
  createdAt: string;
  authorName: string;
  authorUsername: string;
  authorImage?: string;
  likes: number;
  retweets: number;
  replies: number;
}

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const TARGET_USERNAME = "AsiNaci2";

const FALLBACK_TWEETS: FormattedTweet[] = [
  {
    id: "1",
    text: "Building the future of Web3 communication with TextRP. Token-gated rooms, true ownership of your conversations. Join the revolution.",
    createdAt: new Date().toISOString(),
    authorName: "Asi_Naci | TextRP",
    authorUsername: "AsiNaci2",
    likes: 42,
    retweets: 12,
    replies: 8,
  },
  {
    id: "2", 
    text: "XRPL is the backbone of the future financial system. Fast settlements, low fees, sustainable technology. This is what enterprise blockchain looks like.",
    createdAt: new Date().toISOString(),
    authorName: "Asi_Naci | TextRP",
    authorUsername: "AsiNaci2",
    likes: 89,
    retweets: 23,
    replies: 15,
  },
  {
    id: "3",
    text: "The Budzy Movement is growing! Supporting artists, creators, and builders in the XRPL ecosystem. Together we build.",
    createdAt: new Date().toISOString(),
    authorName: "Asi_Naci | TextRP",
    authorUsername: "AsiNaci2",
    likes: 156,
    retweets: 45,
    replies: 32,
  },
  {
    id: "4",
    text: "Consulting session complete! Another enterprise ready to leverage XRPL for cross-border payments. The adoption wave is here.",
    createdAt: new Date().toISOString(),
    authorName: "Asi_Naci | TextRP",
    authorUsername: "AsiNaci2",
    likes: 67,
    retweets: 18,
    replies: 11,
  },
];

// 2 hours in milliseconds
const CACHE_DURATION = 2 * 60 * 60 * 1000;
// 15 minute backoff after rate limit
const RATE_LIMIT_BACKOFF = 15 * 60 * 1000;

let lastRateLimitTime = 0;

async function getCachedTweetsFromDb(): Promise<FormattedTweet[]> {
  try {
    const tweets = await db.select().from(cachedTweets).orderBy(desc(cachedTweets.fetchedAt));
    return tweets.map(t => ({
      id: t.tweetId,
      text: t.text,
      createdAt: t.createdAt,
      authorName: t.authorName,
      authorUsername: t.authorUsername,
      authorImage: t.authorImage || undefined,
      likes: t.likes,
      retweets: t.retweets,
      replies: t.replies,
    }));
  } catch (error) {
    console.error("Error reading cached tweets from database:", error);
    return [];
  }
}

async function isCacheValid(): Promise<boolean> {
  try {
    const result = await db.select({ fetchedAt: cachedTweets.fetchedAt })
      .from(cachedTweets)
      .orderBy(desc(cachedTweets.fetchedAt))
      .limit(1);
    
    if (result.length === 0 || !result[0].fetchedAt) {
      return false;
    }
    
    const cacheAge = Date.now() - result[0].fetchedAt.getTime();
    return cacheAge < CACHE_DURATION;
  } catch (error) {
    console.error("Error checking cache validity:", error);
    return false;
  }
}

async function saveTweetsToDb(tweets: FormattedTweet[]): Promise<void> {
  if (tweets.length === 0) return;
  
  try {
    const tweetRecords = tweets.map(t => ({
      tweetId: t.id,
      text: t.text,
      createdAt: t.createdAt,
      authorName: t.authorName,
      authorUsername: t.authorUsername,
      authorImage: t.authorImage || null,
      likes: t.likes,
      retweets: t.retweets,
      replies: t.replies,
    }));
    
    // Use transaction to ensure atomicity - delete and insert together
    await db.transaction(async (tx) => {
      await tx.delete(cachedTweets);
      await tx.insert(cachedTweets).values(tweetRecords);
    });
    
    console.log(`Saved ${tweets.length} tweets to database cache`);
  } catch (error) {
    console.error("Error saving tweets to database:", error);
  }
}

async function getAvailableTweets(count: number): Promise<FormattedTweet[]> {
  const dbTweets = await getCachedTweetsFromDb();
  if (dbTweets.length > 0) {
    return dbTweets.slice(0, count);
  }
  return FALLBACK_TWEETS.slice(0, count);
}

async function fetchTweetsFromApi(): Promise<FormattedTweet[]> {
  if (!BEARER_TOKEN) {
    console.error("Twitter Bearer Token not configured");
    return [];
  }

  try {
    // First get user ID from username
    const userResponse = await fetch(
      `https://api.twitter.com/2/users/by/username/${TARGET_USERNAME}`,
      {
        headers: {
          Authorization: `Bearer ${BEARER_TOKEN}`,
        },
      }
    );

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error("Twitter API user lookup error:", userResponse.status, errorText);
      if (userResponse.status === 429) {
        lastRateLimitTime = Date.now();
        console.log("Rate limit hit, backing off for 15 minutes");
      }
      return [];
    }

    const userData = (await userResponse.json()) as { data?: { id: string } };
    const userId = userData.data?.id;

    if (!userId) {
      console.error("Could not find Twitter user ID");
      return [];
    }

    // Fetch user's tweets
    const tweetsResponse = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?` +
        new URLSearchParams({
          max_results: "20",
          "tweet.fields": "created_at,public_metrics,author_id",
          "user.fields": "name,username,profile_image_url",
          expansions: "author_id",
          exclude: "retweets,replies",
        }),
      {
        headers: {
          Authorization: `Bearer ${BEARER_TOKEN}`,
        },
      }
    );

    if (!tweetsResponse.ok) {
      const errorText = await tweetsResponse.text();
      console.error("Twitter API tweets error:", tweetsResponse.status, errorText);
      if (tweetsResponse.status === 429) {
        lastRateLimitTime = Date.now();
        console.log("Rate limit hit, backing off for 15 minutes");
      }
      return [];
    }

    const tweetsData = (await tweetsResponse.json()) as TwitterApiResponse;

    if (!tweetsData.data || tweetsData.data.length === 0) {
      console.log("No tweets found from API");
      return [];
    }

    const users = tweetsData.includes?.users || [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const formattedTweets = tweetsData.data.map((tweet) => {
      const author = userMap.get(tweet.author_id);
      return {
        id: tweet.id,
        text: tweet.text,
        createdAt: tweet.created_at,
        authorName: author?.name || TARGET_USERNAME,
        authorUsername: author?.username || TARGET_USERNAME,
        authorImage: author?.profile_image_url,
        likes: tweet.public_metrics?.like_count || 0,
        retweets: tweet.public_metrics?.retweet_count || 0,
        replies: tweet.public_metrics?.reply_count || 0,
      };
    });

    console.log(`Fetched ${formattedTweets.length} tweets from Twitter API`);
    return formattedTweets;
  } catch (error) {
    console.error("Twitter API error:", error);
    return [];
  }
}

export async function getUserTweets(count: number = 10): Promise<FormattedTweet[]> {
  const now = Date.now();
  
  // Check if database cache is still valid
  const cacheValid = await isCacheValid();
  if (cacheValid) {
    const dbTweets = await getCachedTweetsFromDb();
    if (dbTweets.length > 0) {
      console.log("Returning tweets from database cache");
      return dbTweets.slice(0, count);
    }
  }
  
  // If we were rate limited recently, return available tweets without API call
  if (now - lastRateLimitTime < RATE_LIMIT_BACKOFF) {
    console.log("Rate limit backoff active, returning available tweets");
    return await getAvailableTweets(count);
  }

  // Fetch fresh tweets from API
  const freshTweets = await fetchTweetsFromApi();
  
  if (freshTweets.length > 0) {
    // Save to database
    await saveTweetsToDb(freshTweets);
    return freshTweets.slice(0, count);
  }

  // Fall back to cached or fallback tweets
  return await getAvailableTweets(count);
}

export async function searchTweets(query: string, count: number = 10): Promise<FormattedTweet[]> {
  if (!BEARER_TOKEN) {
    console.error("Twitter Bearer Token not configured");
    return [];
  }

  try {
    const response = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?` +
        new URLSearchParams({
          query: query,
          max_results: String(Math.min(count, 100)),
          "tweet.fields": "created_at,public_metrics,author_id",
          "user.fields": "name,username,profile_image_url",
          expansions: "author_id",
        }),
      {
        headers: {
          Authorization: `Bearer ${BEARER_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Twitter search API error:", response.status, errorText);
      return [];
    }

    const data = (await response.json()) as TwitterApiResponse;

    if (!data.data || data.data.length === 0) {
      return [];
    }

    const users = data.includes?.users || [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    return data.data.map((tweet) => {
      const author = userMap.get(tweet.author_id);
      return {
        id: tweet.id,
        text: tweet.text,
        createdAt: tweet.created_at,
        authorName: author?.name || "Unknown",
        authorUsername: author?.username || "unknown",
        authorImage: author?.profile_image_url,
        likes: tweet.public_metrics?.like_count || 0,
        retweets: tweet.public_metrics?.retweet_count || 0,
        replies: tweet.public_metrics?.reply_count || 0,
      };
    });
  } catch (error) {
    console.error("Twitter search error:", error);
    return [];
  }
}

// Initialize cache on startup if empty
(async () => {
  try {
    const tweets = await getCachedTweetsFromDb();
    if (tweets.length === 0) {
      console.log("No cached tweets found, fetching initial batch...");
      const freshTweets = await fetchTweetsFromApi();
      if (freshTweets.length > 0) {
        await saveTweetsToDb(freshTweets);
      } else {
        // Store fallback tweets so frontend has something to show
        await saveTweetsToDb(FALLBACK_TWEETS);
        console.log("Stored fallback tweets in database");
      }
    } else {
      console.log(`Found ${tweets.length} cached tweets in database`);
    }
  } catch (error) {
    console.error("Error initializing tweet cache:", error);
  }
})();
