export type CachedMedia = {
  id: number;
  source: string;
  sourceUrl: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  title: string | null;
  section: string;
  altText: string | null;
  isActive: boolean;
  displayOrder: number;
  fetchedAt: string;
  createdAt: string;
  consultantSlug: string | null;
};

export type Story = {
  id: number;
  content: string | null;
  imageUrl: string | null;
  authorName: string;
  authorImage: string | null;
  createdAt: string;
  expiresAt: string;
};

export type Inquiry = {
  id: number;
  name: string;
  email: string;
  message: string;
  createdAt: string;
};

export type CachedTweet = {
  id: number;
  tweetId: string;
  text: string;
  createdAt: string;
  authorName: string;
  authorUsername: string;
  authorImage: string | null;
  likes: number;
  retweets: number;
  replies: number;
  fetchedAt: string;
};

export type ProjectEntry = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  impact: string;
  link: string | null;
  icon: string;
  color: string;
  tags: string[];
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  consultantSlug: string | null;
};

export type ConsultantEntry = {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  isActive: boolean;
  matrixUserId: string | null;
  profileRoomId: string | null;
  avatarUrl: string | null;
};

export type ChatProfile = {
  id: number;
  matrixUserId: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  isOnline: boolean;
  lastSeen: string;
};

export type Testimonial = {
  id: number;
  authorName: string;
  authorTitle: string | null;
  content: string;
  rating: number;
  isActive: boolean;
  displayOrder: number;
};
