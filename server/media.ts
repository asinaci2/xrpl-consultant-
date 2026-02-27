import { db } from "./db";
import { cachedMedia, projects } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import type { InsertCachedMedia, CachedMedia } from "@shared/schema";

interface OEmbedResponse {
  thumbnail_url?: string;
  url?: string;
  title?: string;
  author_name?: string;
  html?: string;
}

const CACHE_DURATION = 6 * 60 * 60 * 1000;
const RATE_LIMIT_BACKOFF = 15 * 60 * 1000;

let lastRateLimitTime: Record<string, number> = {};

function extractGDriveFileId(url: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function extractOGMeta(url: string): Promise<{ imageUrl?: string; title?: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Twitterbot/1.0)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return {};
    const html = await response.text();
    const imageUrl =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1];
    const title =
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)?.[1];
    return { imageUrl, title };
  } catch {
    return {};
  }
}

export async function resolveInstagramImage(postUrl: string): Promise<{ imageUrl?: string; title?: string } | null> {
  const source = "instagram";
  const now = Date.now();
  if (lastRateLimitTime[source] && now - lastRateLimitTime[source] < RATE_LIMIT_BACKOFF) {
    console.log("Instagram rate limit backoff active");
    return {};
  }
  try {
    // Instagram's public oEmbed requires auth since 2020 — try it anyway as a first pass
    const oembedRes = await fetch(
      `https://api.instagram.com/oembed?url=${encodeURIComponent(postUrl)}&omitscript=true`,
      { signal: AbortSignal.timeout(5000) }
    ).catch(() => null);
    if (oembedRes?.ok) {
      const data = (await oembedRes.json()) as OEmbedResponse;
      if (data.thumbnail_url) return { imageUrl: data.thumbnail_url, title: data.author_name };
    }
    if (oembedRes?.status === 429) lastRateLimitTime[source] = now;
    // Fall back to Open Graph extraction
    const og = await extractOGMeta(postUrl);
    return og;
  } catch (error) {
    console.error("Instagram resolve error:", error);
    return {};
  }
}

export async function resolveTikTokImage(videoUrl: string): Promise<{ imageUrl?: string; title?: string } | null> {
  const source = "tiktok";
  const now = Date.now();
  if (lastRateLimitTime[source] && now - lastRateLimitTime[source] < RATE_LIMIT_BACKOFF) {
    console.log("TikTok oEmbed rate limit backoff active");
    return {};
  }
  try {
    const response = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (response.ok) {
      const data = (await response.json()) as OEmbedResponse;
      if (data.thumbnail_url) return { imageUrl: data.thumbnail_url, title: data.title || data.author_name };
    }
    if (response.status === 429) lastRateLimitTime[source] = now;
    // Fall back to OG extraction
    const og = await extractOGMeta(videoUrl);
    return og;
  } catch (error) {
    console.error("TikTok oEmbed error:", error);
    return {};
  }
}

export function resolveGDriveImage(shareUrl: string): { imageUrl: string; title?: string } | null {
  const fileId = extractGDriveFileId(shareUrl);
  if (!fileId) {
    console.error("Could not extract Google Drive file ID from URL:", shareUrl);
    return null;
  }

  const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
  return { imageUrl: directUrl, title: `Google Drive image ${fileId}` };
}

export async function resolveTwitterEmbed(tweetUrl: string): Promise<{ imageUrl?: string; title?: string } | null> {
  try {
    const response = await fetch(
      `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!response.ok) {
      console.error(`Twitter oEmbed error: ${response.status}`);
      // Fall back to OG extraction
      return await extractOGMeta(tweetUrl);
    }
    const data = (await response.json()) as OEmbedResponse;
    // oEmbed works — extract what we can
    const title = data.author_name;
    if (data.thumbnail_url) return { imageUrl: data.thumbnail_url, title };
    const imgMatch = data.html?.match(/src="([^"]+\.(jpg|jpeg|png|webp|gif)[^"]*)"/i);
    if (imgMatch) return { imageUrl: imgMatch[1], title };
    // Text tweet — return with title only, no image
    return { title };
  } catch (error) {
    console.error("Twitter oEmbed error:", error);
    return {};
  }
}

export async function resolveSnapchatImage(spotlightUrl: string): Promise<{ imageUrl?: string; title?: string } | null> {
  const og = await extractOGMeta(spotlightUrl);
  return og;
}

export function detectPlatform(url: string): string | null {
  if (/instagram\.com/.test(url)) return "instagram";
  if (/tiktok\.com/.test(url)) return "tiktok";
  if (/twitter\.com|x\.com/.test(url)) return "twitter";
  if (/snapchat\.com/.test(url)) return "snapchat";
  return null;
}

export async function resolveMediaUrl(
  source: string,
  sourceUrl: string
): Promise<{ imageUrl?: string; title?: string } | null> {
  switch (source) {
    case "instagram":
      return await resolveInstagramImage(sourceUrl);
    case "tiktok":
      return await resolveTikTokImage(sourceUrl);
    case "twitter":
      return await resolveTwitterEmbed(sourceUrl);
    case "snapchat":
      return await resolveSnapchatImage(sourceUrl);
    case "gdrive":
      return resolveGDriveImage(sourceUrl);
    case "manual":
      return { imageUrl: sourceUrl, title: undefined };
    default:
      console.error(`Unknown media source: ${source}`);
      return null;
  }
}

export async function isCacheValidForEntry(id: number): Promise<boolean> {
  try {
    const [entry] = await db
      .select({ fetchedAt: cachedMedia.fetchedAt })
      .from(cachedMedia)
      .where(eq(cachedMedia.id, id))
      .limit(1);

    if (!entry?.fetchedAt) return false;
    return Date.now() - entry.fetchedAt.getTime() < CACHE_DURATION;
  } catch (error) {
    console.error("Error checking media cache validity:", error);
    return false;
  }
}

export async function refreshMediaEntry(entry: CachedMedia): Promise<void> {
  if (entry.source === "manual") return;

  const cacheValid = await isCacheValidForEntry(entry.id);
  if (cacheValid) return;

  const resolved = await resolveMediaUrl(entry.source, entry.sourceUrl);
  if (resolved && resolved.imageUrl) {
    await db
      .update(cachedMedia)
      .set({
        imageUrl: resolved.imageUrl,
        title: resolved.title || entry.title,
        fetchedAt: new Date(),
      })
      .where(eq(cachedMedia.id, entry.id));
    console.log(`Refreshed cached media #${entry.id} from ${entry.source}`);
  }
}

export async function refreshAllMedia(): Promise<void> {
  try {
    const allMedia = await db.select().from(cachedMedia).where(eq(cachedMedia.isActive, true));
    for (const entry of allMedia) {
      if (entry.source !== "manual") {
        await refreshMediaEntry(entry);
      }
    }
  } catch (error) {
    console.error("Error refreshing media cache:", error);
  }
}

const SEED_IMAGES = [
  {
    source: "manual" as const,
    sourceUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop",
    imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop",
    section: "hero",
    altText: "Blockchain Technology Visualization",
    isActive: true,
    displayOrder: 0,
  },
  {
    source: "manual" as const,
    sourceUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2664&auto=format&fit=crop",
    imageUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2664&auto=format&fit=crop",
    section: "about",
    altText: "Edwin Gutierrez Consulting",
    isActive: true,
    displayOrder: 0,
  },
];

(async () => {
  try {
    const existing = await db.select().from(cachedMedia);
    if (existing.length === 0) {
      console.log("No cached media found, seeding initial images...");
      for (const seed of SEED_IMAGES) {
        await db.insert(cachedMedia).values(seed);
      }
      console.log(`Seeded ${SEED_IMAGES.length} initial media entries`);
    } else {
      console.log(`Found ${existing.length} cached media entries in database`);
    }
  } catch (error) {
    console.error("Error seeding media cache:", error);
  }

  try {
    const existingProjects = await db.select().from(projects);
    if (existingProjects.length === 0) {
      console.log("No projects found, seeding initial projects...");
      const seedProjects = [
        {
          title: "TextRP Ambassador",
          subtitle: "XRPL-Native Messaging Platform",
          description: "Drove visibility for app.textrp.io through X Spaces hosting, beta launches, and community Q&A sessions. Promoted $TXT token utility for rewards and gating, wallet integration, and cross-platform bridging.",
          impact: "Built a tight-knit XRPL network with consistent daily engagement and scam-resistant growth messaging.",
          tags: ["Privacy-Focused", "$TXT Utility", "Community Growth"],
          link: "https://app.textrp.io",
          icon: "MessageSquare",
          color: "bg-blue-500",
          displayOrder: 0,
          isActive: true,
        },
        {
          title: "Budzy Movement",
          subtitle: "Community Morale & Engagement Brand",
          description: "A motivational community ethos centered on 'get yo budzy on' - a positive mindset for staying locked in, grinding, and manifesting success. Fosters morale and long-term holder energy across XRPL projects.",
          impact: "Used in Spaces hosting and daily updates to rally the fam - helps combat burnout in bearish or slow-build phases.",
          tags: ["Morale Building", "Content Strategy", "Holder Energy"],
          icon: "Heart",
          color: "bg-pink-500",
          displayOrder: 1,
          isActive: true,
        },
        {
          title: "Crypto Fam Radio",
          subtitle: "X Spaces Hosting & Community Voice",
          description: "Frequent co-hosting and participation in X Spaces featuring XRPL discussions, project spotlights, and welcoming newcomers. Positions as a reliable community voice bridging builders and audiences.",
          impact: "Regular engagement establishing trust as a connector between XRPL projects and their communities.",
          tags: ["X Spaces", "AMA Facilitation", "Networking"],
          link: "https://x.com/cryptofamradio",
          icon: "Radio",
          color: "bg-purple-500",
          displayOrder: 2,
          isActive: true,
        },
        {
          title: "XRP Warlords Strategy",
          subtitle: "XRPL NFT/GameFi Community Growth",
          description: "Supporting XRPL gaming innovators through visibility boosts, contest-style engagement, and builder shoutouts. Advise on token-gating chats, community morale, and scam-resistant onboarding for gaming communities.",
          impact: "Aligned with #Budzy's 'locked in' grind mentality for real utility launches in the NFT/GameFi space.",
          tags: ["GameFi", "NFT Strategy", "PVP Utility"],
          link: "https://xrp.cafe",
          icon: "Gamepad2",
          color: "bg-orange-500",
          displayOrder: 3,
          isActive: true,
        },
      ];
      for (const seed of seedProjects) {
        await db.insert(projects).values(seed);
      }
      console.log(`Seeded ${seedProjects.length} initial projects`);
    } else {
      console.log(`Found ${existingProjects.length} projects in database`);
    }
  } catch (error) {
    console.error("Error seeding projects:", error);
  }
})();
