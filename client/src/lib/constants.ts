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

// ── Ecosystem Intelligence ─────────────────────────────────────────────────────

// 19 specialties organised into 4 complementary category groups
export const SPECIALTY_CATEGORIES: Record<string, string[]> = {
  Technical: [
    "XRPL", "TextRP", "Web3", "Blockchain",
    "DeFi", "Smart Contracts", "Tokenomics", "Wallet Integration",
  ],
  Innovative: [
    "NFT Strategy", "DAO Governance", "Crypto Education",
  ],
  Community: [
    "Community Growth", "Event Hosting", "Ambassador",
  ],
  Growth: [
    "Marketing", "Social Media", "Content Creation",
    "Trading", "Technical Analysis",
  ],
};

// Category display order used across all UI components
export const CATEGORY_ORDER = ["Technical", "Innovative", "Community", "Growth"] as const;

// Category accent colours (Tailwind class fragments)
export const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Technical: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" },
  Innovative: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400" },
  Community:  { bg: "bg-teal-500/10",   border: "border-teal-500/30",   text: "text-teal-400"   },
  Growth:     { bg: "bg-pink-500/10",   border: "border-pink-500/30",   text: "text-pink-400"   },
};

// Cross-category complement map — which specialties pair well with which others
export const SPECIALTY_COMPLEMENTS: Record<string, string[]> = {
  XRPL:               ["Tokenomics", "NFT Strategy", "Wallet Integration", "DeFi", "Community Growth", "Marketing"],
  TextRP:             ["Community Growth", "Event Hosting", "Ambassador", "Marketing", "Social Media"],
  Web3:               ["Crypto Education", "Community Growth", "Marketing", "DAO Governance", "Content Creation"],
  Blockchain:         ["Smart Contracts", "Tokenomics", "NFT Strategy", "DeFi", "Crypto Education"],
  DeFi:               ["Tokenomics", "Trading", "Technical Analysis", "XRPL", "Smart Contracts"],
  "Smart Contracts":  ["DeFi", "NFT Strategy", "DAO Governance", "Tokenomics", "Blockchain"],
  Tokenomics:         ["Community Growth", "Marketing", "DAO Governance", "DeFi", "Event Hosting"],
  "Wallet Integration": ["XRPL", "DeFi", "Trading", "Crypto Education", "Technical Analysis"],
  "NFT Strategy":     ["Community Growth", "Marketing", "Content Creation", "Social Media", "XRPL"],
  "DAO Governance":   ["Community Growth", "Tokenomics", "Smart Contracts", "Event Hosting", "Web3"],
  "Crypto Education": ["Community Growth", "Event Hosting", "Content Creation", "Web3", "Ambassador"],
  "Community Growth": ["Tokenomics", "Event Hosting", "Marketing", "Social Media", "Ambassador"],
  "Event Hosting":    ["Community Growth", "Marketing", "Ambassador", "Crypto Education", "DAO Governance"],
  Ambassador:         ["Community Growth", "Event Hosting", "Social Media", "TextRP", "Marketing"],
  Marketing:          ["Community Growth", "Social Media", "Content Creation", "NFT Strategy", "Tokenomics"],
  "Social Media":     ["Marketing", "Content Creation", "Community Growth", "Ambassador", "NFT Strategy"],
  "Content Creation": ["Marketing", "Social Media", "Crypto Education", "NFT Strategy", "Web3"],
  Trading:            ["Technical Analysis", "DeFi", "Tokenomics", "Wallet Integration"],
  "Technical Analysis": ["Trading", "DeFi", "Tokenomics", "XRPL"],
};

// Returns the category group name for a given specialty, or null if not found
export function getCategoryForSpecialty(specialty: string): string | null {
  for (const [category, specialties] of Object.entries(SPECIALTY_CATEGORIES)) {
    if (specialties.includes(specialty)) return category;
  }
  return null;
}

// Returns all complement specialties for a given set of input specialties,
// deduplicating and removing any already present in the input set
export function getComplementsForSpecialties(specialties: string[]): string[] {
  const inputSet = new Set(specialties);
  const complements = new Set<string>();
  for (const s of specialties) {
    for (const c of SPECIALTY_COMPLEMENTS[s] ?? []) {
      if (!inputSet.has(c)) complements.add(c);
    }
  }
  return Array.from(complements);
}

// Filters a list of consultants to those who have at least one of the given specialties
export function getConsultantsForSpecialties<T extends { specialties: string[] }>(
  specialties: string[],
  allConsultants: T[],
): T[] {
  const targetSet = new Set(specialties);
  return allConsultants.filter(c =>
    c.specialties.some(s => targetSet.has(s))
  );
}

// Returns a sorted list of consultants by how many of the target specialties they cover
export function rankConsultantsByComplementCoverage<T extends { specialties: string[] }>(
  complementSpecialties: string[],
  allConsultants: T[],
): Array<T & { matchCount: number; matchedSpecialties: string[] }> {
  const targetSet = new Set(complementSpecialties);
  return allConsultants
    .map(c => {
      const matched = c.specialties.filter(s => targetSet.has(s));
      return { ...c, matchCount: matched.length, matchedSpecialties: matched };
    })
    .filter(c => c.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount);
}
