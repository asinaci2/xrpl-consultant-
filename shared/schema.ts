import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const consultants = pgTable("consultants", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull().default(""),
  bio: text("bio").notNull().default(""),
  avatarUrl: text("avatar_url"),
  specialties: text("specialties").array().notNull().default([]),
  twitterUsername: text("twitter_username"),
  matrixUserId: text("matrix_user_id"),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  location: text("location").notNull().default(""),
  locationLine2: text("location_line2").notNull().default(""),
  contactHeadline: text("contact_headline").notNull().default("Ready to Connect?"),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertConsultantSchema = createInsertSchema(consultants).omit({
  id: true,
  createdAt: true,
});

export type InsertConsultant = z.infer<typeof insertConsultantSchema>;
export type Consultant = typeof consultants.$inferSelect;

export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  consultantSlug: text("consultant_slug"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInquirySchema = createInsertSchema(inquiries).pick({
  name: true,
  email: true,
  message: true,
  consultantSlug: true,
});

export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Inquiry = typeof inquiries.$inferSelect;

export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  matrixRoomId: text("matrix_room_id"),
  visitorName: text("visitor_name"),
  visitorEmail: text("visitor_email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  content: text("content").notNull(),
  isFromVisitor: boolean("is_from_visitor").default(true),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  mimeType: text("mime_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).pick({
  sessionId: true,
  visitorName: true,
  visitorEmail: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  sessionId: true,
  content: true,
  isFromVisitor: true,
  fileUrl: true,
  fileName: true,
  mimeType: true,
});

export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export const cachedTweets = pgTable("cached_tweets", {
  id: serial("id").primaryKey(),
  tweetId: text("tweet_id").notNull().unique(),
  text: text("text").notNull(),
  createdAt: text("created_at").notNull(),
  authorName: text("author_name").notNull(),
  authorUsername: text("author_username").notNull(),
  authorImage: text("author_image"),
  likes: integer("likes").notNull().default(0),
  retweets: integer("retweets").notNull().default(0),
  replies: integer("replies").notNull().default(0),
  fetchedAt: timestamp("fetched_at").defaultNow(),
});

export const insertCachedTweetSchema = createInsertSchema(cachedTweets).omit({
  id: true,
  fetchedAt: true,
});

export type InsertCachedTweet = z.infer<typeof insertCachedTweetSchema>;
export type CachedTweet = typeof cachedTweets.$inferSelect;

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  content: text("content"),
  imageUrl: text("image_url"),
  authorName: text("author_name").notNull().default("Edwin Gutierrez"),
  authorImage: text("author_image"),
  consultantSlug: text("consultant_slug"),
  sourceType: text("source_type"),
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  createdAt: true,
});

export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;

export const cachedMedia = pgTable("cached_media", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(),
  sourceUrl: text("source_url").notNull(),
  imageUrl: text("image_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  title: text("title"),
  section: text("section").notNull(),
  altText: text("alt_text"),
  consultantSlug: text("consultant_slug"),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  fetchedAt: timestamp("fetched_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCachedMediaSchema = createInsertSchema(cachedMedia).omit({
  id: true,
  fetchedAt: true,
  createdAt: true,
});

export type InsertCachedMedia = z.infer<typeof insertCachedMediaSchema>;
export type CachedMedia = typeof cachedMedia.$inferSelect;

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  description: text("description").notNull(),
  impact: text("impact").notNull(),
  link: text("link"),
  icon: text("icon").notNull().default("Briefcase"),
  color: text("color").notNull().default("bg-green-500"),
  tags: text("tags").array().notNull(),
  consultantSlug: text("consultant_slug"),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export const contactInfo = pgTable("contact_info", {
  id: serial("id").primaryKey(),
  consultantSlug: text("consultant_slug"),
  headline: text("headline").notNull().default("Ready to Innovate?"),
  subheading: text("subheading").notNull().default("Schedule a consultation to discuss your blockchain strategy and how XRPL can transform your business."),
  email: text("email").notNull().default("contact@edwingutierrez.com"),
  phone: text("phone").notNull().default("+1 (555) 123-4567"),
  location: text("location").notNull().default("San Francisco, CA"),
  locationLine2: text("location_line2").notNull().default("Available Worldwide Remote"),
});

export const insertContactInfoSchema = createInsertSchema(contactInfo).omit({ id: true });

export type InsertContactInfo = z.infer<typeof insertContactInfoSchema>;
export type ContactInfo = typeof contactInfo.$inferSelect;

export const chatHostConfig = pgTable("chat_host_config", {
  id: serial("id").primaryKey(),
  consultantSlug: text("consultant_slug").notNull().default("asinaci"),
  displayName: text("display_name").notNull().default(""),
  title: text("title").notNull().default(""),
  avatarUrl: text("avatar_url"),
  statusMessage: text("status_message").notNull().default(""),
  isAvailable: boolean("is_available").notNull().default(true),
});

export const insertChatHostConfigSchema = createInsertSchema(chatHostConfig).omit({ id: true });

export type InsertChatHostConfig = z.infer<typeof insertChatHostConfigSchema>;
export type ChatHostConfig = typeof chatHostConfig.$inferSelect;
