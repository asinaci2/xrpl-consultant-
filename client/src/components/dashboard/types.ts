export type ConsultantProfile = {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  bio: string;
  avatarUrl: string | null;
  specialties: string[];
  twitterUsername: string | null;
  email: string;
  phone: string;
  location: string;
  locationLine2: string;
  contactHeadline: string;
  profileRoomId: string | null;
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
  isActive: boolean | null;
  consultantSlug: string | null;
};

export type Story = {
  id: number;
  content: string;
  imageUrl: string | null;
  authorName: string;
  createdAt: string;
  expiresAt: string;
};

export type MediaEntry = {
  id: number;
  source: string;
  sourceUrl: string | null;
  imageUrl: string | null;
  section: string;
  altText: string | null;
  displayOrder: number;
  isActive: boolean | null;
};

export type Testimonial = {
  id: number;
  authorName: string;
  authorTitle: string;
  content: string;
  avatarUrl: string | null;
  displayOrder: number;
  isActive: boolean;
};

export type VisitorContact = {
  id: number;
  name: string;
  email: string;
  message: string;
  createdAt: string;
};

export type WalletData = {
  address: string;
  balance: string;
};

export type ChatHostConfig = {
  displayName: string;
  title: string;
  avatarUrl: string | null;
  statusMessage: string;
  isAvailable: boolean;
};
