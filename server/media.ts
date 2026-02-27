import { db } from "./db";
import { cachedMedia } from "@shared/schema";
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

export async function resolveInstagramImage(postUrl: string): Promise<{ imageUrl: string; title?: string } | null> {
  const source = "instagram";
  const now = Date.now();

  if (lastRateLimitTime[source] && now - lastRateLimitTime[source] < RATE_LIMIT_BACKOFF) {
    console.log("Instagram oEmbed rate limit backoff active");
    return null;
  }

  try {
    const response = await fetch(
      `https://api.instagram.com/oembed?url=${encodeURIComponent(postUrl)}&omitscript=true`
    );

    if (!response.ok) {
      if (response.status === 429) {
        lastRateLimitTime[source] = now;
        console.log("Instagram oEmbed rate limit hit, backing off");
      }
      console.error(`Instagram oEmbed error: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as OEmbedResponse;
    if (data.thumbnail_url) {
      return { imageUrl: data.thumbnail_url, title: data.title || data.author_name };
    }

    const imgMatch = data.html?.match(/src="([^"]+)"/);
    if (imgMatch) {
      return { imageUrl: imgMatch[1], title: data.title || data.author_name };
    }

    return null;
  } catch (error) {
    console.error("Instagram oEmbed error:", error);
    return null;
  }
}

export async function resolveTikTokImage(videoUrl: string): Promise<{ imageUrl: string; title?: string } | null> {
  const source = "tiktok";
  const now = Date.now();

  if (lastRateLimitTime[source] && now - lastRateLimitTime[source] < RATE_LIMIT_BACKOFF) {
    console.log("TikTok oEmbed rate limit backoff active");
    return null;
  }

  try {
    const response = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`
    );

    if (!response.ok) {
      if (response.status === 429) {
        lastRateLimitTime[source] = now;
        console.log("TikTok oEmbed rate limit hit, backing off");
      }
      console.error(`TikTok oEmbed error: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as OEmbedResponse;
    if (data.thumbnail_url) {
      return { imageUrl: data.thumbnail_url, title: data.title || data.author_name };
    }

    return null;
  } catch (error) {
    console.error("TikTok oEmbed error:", error);
    return null;
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

export async function resolveMediaUrl(
  source: string,
  sourceUrl: string
): Promise<{ imageUrl: string; title?: string } | null> {
  switch (source) {
    case "instagram":
      return await resolveInstagramImage(sourceUrl);
    case "tiktok":
      return await resolveTikTokImage(sourceUrl);
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
  if (resolved) {
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
})();
