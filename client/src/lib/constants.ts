// External URLs
export const TEXTRP_APP_URL = "https://app.textrp.io";
export const CUBES_TEXTURE_URL = "https://www.transparenttextures.com/patterns/cubes.png";

// Refetch intervals (ms)
export const REFETCH_INTERVALS = {
  STORIES: 60_000,
  TWEETS: 60_000,
  NAV_STORIES: 60_000,
  TWEET_ROTATION: 5_000,
} as const;

// Brand colors used in inline styles / canvas (where Tailwind is insufficient)
export const BRAND_COLORS = {
  BG_DEEP: "#0a0a0a",
  BG_MATRIX: "#0d1f0d",
  BG_MATRIX_ALT: "#0d2010",
  PURPLE_PRIMARY: "#9333EA",
  ORANGE_PRIMARY: "#EA580C",
  MATRIX_RAIN: "rgba(147,51,234,0.8)",  // purple, for MatrixTweets canvas
} as const;

// Repeated gradient strings
export const GRADIENTS = {
  CHAT_BG: `linear-gradient(180deg, ${BRAND_COLORS.BG_DEEP} 0%, ${BRAND_COLORS.BG_MATRIX} 100%)`,
  CHAT_HEADER: `linear-gradient(90deg, ${BRAND_COLORS.BG_MATRIX} 0%, ${BRAND_COLORS.BG_MATRIX_ALT} 100%)`,
  CTA: `linear-gradient(135deg, ${BRAND_COLORS.PURPLE_PRIMARY} 0%, ${BRAND_COLORS.ORANGE_PRIMARY} 100%)`,
} as const;
