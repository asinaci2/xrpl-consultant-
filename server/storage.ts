import { 
  inquiries, 
  chatSessions, 
  chatMessages,
  stories,
  cachedMedia,
  projects,
  contactInfo,
  consultants,
  chatHostConfig,
  testimonials,
  visitorContacts,
  ecosystemProjects,
  type InsertInquiry, 
  type Inquiry,
  type InsertChatSession,
  type ChatSession,
  type InsertChatMessage,
  type ChatMessage,
  type InsertStory,
  type Story,
  type InsertCachedMedia,
  type CachedMedia,
  type InsertProject,
  type Project,
  type InsertContactInfo,
  type ContactInfo,
  type InsertConsultant,
  type Consultant,
  type InsertChatHostConfig,
  type ChatHostConfig,
  type InsertTestimonial,
  type Testimonial,
  type VisitorContact,
  type InsertEcosystemProject,
  type EcosystemProject,
} from "@shared/schema";
import { db } from "./db";
import { eq, gt, lt, and, asc, desc, isNull, isNotNull, or } from "drizzle-orm";

export interface IStorage {
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  getAllInquiries(): Promise<Inquiry[]>;
  deleteInquiry(id: number): Promise<void>;
  createChatSession(session: InsertChatSession & { matrixRoomId?: string }): Promise<ChatSession>;
  getChatSession(sessionId: string): Promise<ChatSession | undefined>;
  updateChatSessionMatrixRoom(sessionId: string, matrixRoomId: string): Promise<void>;
  getVisitorChatRoomIds(): Promise<string[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  clearAllChatMessages(): Promise<void>;
  createStory(story: InsertStory): Promise<Story>;
  getActiveStories(): Promise<Story[]>;
  getActiveStoriesBySlug(slug: string): Promise<Story[]>;
  getAllStories(): Promise<Story[]>;
  deleteStory(id: number): Promise<void>;
  deleteExpiredStories(): Promise<void>;
  getMediaBySection(section: string): Promise<CachedMedia[]>;
  getMediaBySectionAndSlug(section: string, slug: string): Promise<CachedMedia[]>;
  getAllMedia(): Promise<CachedMedia[]>;
  createMedia(data: InsertCachedMedia): Promise<CachedMedia>;
  updateMedia(id: number, data: Partial<InsertCachedMedia>): Promise<CachedMedia | undefined>;
  deleteMedia(id: number): Promise<void>;
  getActiveProjects(): Promise<Project[]>;
  getActiveProjectsBySlug(slug: string): Promise<Project[]>;
  getAllProjects(): Promise<Project[]>;
  createProject(data: InsertProject): Promise<Project>;
  updateProject(id: number, data: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<void>;
  getContactInfo(): Promise<ContactInfo | undefined>;
  getContactInfoBySlug(slug: string): Promise<ContactInfo | undefined>;
  updateContactInfo(data: Partial<InsertContactInfo>): Promise<ContactInfo>;
  getConsultants(): Promise<Consultant[]>;
  getConsultantBySlug(slug: string): Promise<Consultant | undefined>;
  createConsultant(data: InsertConsultant): Promise<Consultant>;
  updateConsultant(slug: string, data: Partial<InsertConsultant>): Promise<Consultant | undefined>;
  getChatHostConfig(): Promise<ChatHostConfig | undefined>;
  upsertChatHostConfig(data: Partial<InsertChatHostConfig>): Promise<ChatHostConfig>;
  getConsultantByMatrixUserId(matrixUserId: string): Promise<Consultant | undefined>;
  getAllProjectsBySlug(slug: string): Promise<Project[]>;
  getAllStoriesBySlug(slug: string): Promise<Story[]>;
  getAllMediaBySlug(slug: string): Promise<CachedMedia[]>;
  updateContactInfoBySlug(slug: string, data: Partial<InsertContactInfo>): Promise<ContactInfo>;
  getChatHostConfigBySlug(slug: string): Promise<ChatHostConfig | undefined>;
  upsertChatHostConfigBySlug(slug: string, data: Partial<InsertChatHostConfig>): Promise<ChatHostConfig>;
  getTestimonialsBySlug(slug: string): Promise<Testimonial[]>;
  getAllTestimonialsBySlug(slug: string): Promise<Testimonial[]>;
  getPendingTestimonialsBySlug(slug: string): Promise<Testimonial[]>;
  createTestimonial(data: InsertTestimonial): Promise<Testimonial>;
  updateTestimonial(id: number, data: Partial<InsertTestimonial>): Promise<Testimonial | undefined>;
  deleteTestimonial(id: number): Promise<void>;
  approveTestimonial(id: number): Promise<Testimonial | undefined>;
  getTestimonialByVisitor(slug: string, userId: string): Promise<Testimonial | undefined>;
  getTestimonialsByVisitor(userId: string): Promise<Testimonial[]>;
  getVisitorContacts(userId: string): Promise<(VisitorContact & { consultantName: string; consultantTagline: string; consultantAvatarUrl: string | null })[]>;
  addVisitorContact(userId: string, consultantSlug: string, note?: string): Promise<VisitorContact>;
  removeVisitorContact(userId: string, consultantSlug: string): Promise<void>;
  isVisitorContact(userId: string, consultantSlug: string): Promise<boolean>;
  getEcosystemProjects(): Promise<EcosystemProject[]>;
  getAllEcosystemProjects(): Promise<EcosystemProject[]>;
  createEcosystemProject(data: InsertEcosystemProject): Promise<EcosystemProject>;
  updateEcosystemProject(id: number, data: Partial<InsertEcosystemProject>): Promise<EcosystemProject | undefined>;
  deleteEcosystemProject(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createInquiry(insertInquiry: InsertInquiry): Promise<Inquiry> {
    const [inquiry] = await db
      .insert(inquiries)
      .values(insertInquiry)
      .returning();
    return inquiry;
  }

  async getAllInquiries(): Promise<Inquiry[]> {
    return await db
      .select()
      .from(inquiries)
      .orderBy(desc(inquiries.createdAt));
  }

  async deleteInquiry(id: number): Promise<void> {
    await db.delete(inquiries).where(eq(inquiries.id, id));
  }

  async createChatSession(session: InsertChatSession & { matrixRoomId?: string }): Promise<ChatSession> {
    const [created] = await db
      .insert(chatSessions)
      .values(session)
      .returning();
    return created;
  }

  async getChatSession(sessionId: string): Promise<ChatSession | undefined> {
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.sessionId, sessionId));
    return session;
  }

  async updateChatSessionMatrixRoom(sessionId: string, matrixRoomId: string): Promise<void> {
    await db
      .update(chatSessions)
      .set({ matrixRoomId })
      .where(eq(chatSessions.sessionId, sessionId));
  }

  async getVisitorChatRoomIds(): Promise<string[]> {
    const rows = await db
      .select({ matrixRoomId: chatSessions.matrixRoomId })
      .from(chatSessions)
      .where(isNotNull(chatSessions.matrixRoomId));
    return rows.map(r => r.matrixRoomId).filter(Boolean) as string[];
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [created] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return created;
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt);
  }

  async clearAllChatMessages(): Promise<void> {
    await db.delete(chatMessages);
  }

  async createStory(story: InsertStory): Promise<Story> {
    const [created] = await db
      .insert(stories)
      .values(story)
      .returning();
    return created;
  }

  async getActiveStories(): Promise<Story[]> {
    const now = new Date();
    return await db
      .select()
      .from(stories)
      .where(gt(stories.expiresAt, now))
      .orderBy(stories.createdAt);
  }

  async getActiveStoriesBySlug(slug: string): Promise<Story[]> {
    const now = new Date();
    return await db
      .select()
      .from(stories)
      .where(and(gt(stories.expiresAt, now), eq(stories.consultantSlug, slug)))
      .orderBy(stories.createdAt);
  }

  async getAllStories(): Promise<Story[]> {
    return await db
      .select()
      .from(stories)
      .orderBy(desc(stories.createdAt));
  }

  async deleteStory(id: number): Promise<void> {
    await db.delete(stories).where(eq(stories.id, id));
  }

  async deleteExpiredStories(): Promise<void> {
    const now = new Date();
    await db.delete(stories).where(lt(stories.expiresAt, now));
  }

  async getMediaBySection(section: string): Promise<CachedMedia[]> {
    return await db
      .select()
      .from(cachedMedia)
      .where(and(eq(cachedMedia.section, section), eq(cachedMedia.isActive, true)))
      .orderBy(asc(cachedMedia.displayOrder));
  }

  async getMediaBySectionAndSlug(section: string, slug: string): Promise<CachedMedia[]> {
    return await db
      .select()
      .from(cachedMedia)
      .where(and(
        eq(cachedMedia.section, section),
        eq(cachedMedia.isActive, true),
        eq(cachedMedia.consultantSlug, slug)
      ))
      .orderBy(asc(cachedMedia.displayOrder));
  }

  async getAllMedia(): Promise<CachedMedia[]> {
    return await db
      .select()
      .from(cachedMedia)
      .orderBy(asc(cachedMedia.section), asc(cachedMedia.displayOrder));
  }

  async createMedia(data: InsertCachedMedia): Promise<CachedMedia> {
    const [created] = await db
      .insert(cachedMedia)
      .values(data)
      .returning();
    return created;
  }

  async updateMedia(id: number, data: Partial<InsertCachedMedia>): Promise<CachedMedia | undefined> {
    const [updated] = await db
      .update(cachedMedia)
      .set(data)
      .where(eq(cachedMedia.id, id))
      .returning();
    return updated;
  }

  async deleteMedia(id: number): Promise<void> {
    await db.delete(cachedMedia).where(eq(cachedMedia.id, id));
  }

  async getActiveProjects(): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.isActive, true))
      .orderBy(asc(projects.displayOrder));
  }

  async getActiveProjectsBySlug(slug: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(and(eq(projects.isActive, true), eq(projects.consultantSlug, slug)))
      .orderBy(asc(projects.displayOrder));
  }

  async getAllProjects(): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .orderBy(asc(projects.displayOrder));
  }

  async createProject(data: InsertProject): Promise<Project> {
    const [created] = await db
      .insert(projects)
      .values(data)
      .returning();
    return created;
  }

  async updateProject(id: number, data: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db
      .update(projects)
      .set(data)
      .where(eq(projects.id, id))
      .returning();
    return updated;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async getContactInfo(): Promise<ContactInfo | undefined> {
    const [row] = await db.select().from(contactInfo).where(eq(contactInfo.id, 1));
    return row;
  }

  async getContactInfoBySlug(slug: string): Promise<ContactInfo | undefined> {
    const [row] = await db.select().from(contactInfo).where(eq(contactInfo.consultantSlug, slug));
    return row;
  }

  async updateContactInfo(data: Partial<InsertContactInfo>): Promise<ContactInfo> {
    const existing = await this.getContactInfo();
    if (existing) {
      const [updated] = await db.update(contactInfo).set(data).where(eq(contactInfo.id, 1)).returning();
      return updated;
    } else {
      const defaults = {
        headline: "Ready to Innovate?",
        subheading: "Schedule a consultation to discuss your blockchain strategy and how XRPL can transform your business.",
        email: "contact@edwingutierrez.com",
        phone: "+1 (555) 123-4567",
        location: "San Francisco, CA",
        locationLine2: "Available Worldwide Remote",
      };
      const [created] = await db.insert(contactInfo).values({ id: 1, ...defaults, ...data }).returning();
      return created;
    }
  }

  async getConsultants(): Promise<Consultant[]> {
    return await db
      .select()
      .from(consultants)
      .where(eq(consultants.isActive, true))
      .orderBy(asc(consultants.displayOrder));
  }

  async getConsultantBySlug(slug: string): Promise<Consultant | undefined> {
    const [row] = await db.select().from(consultants).where(eq(consultants.slug, slug));
    return row;
  }

  async createConsultant(data: InsertConsultant): Promise<Consultant> {
    const [created] = await db.insert(consultants).values(data).returning();
    return created;
  }

  async updateConsultant(slug: string, data: Partial<InsertConsultant>): Promise<Consultant | undefined> {
    const [updated] = await db
      .update(consultants)
      .set(data)
      .where(eq(consultants.slug, slug))
      .returning();
    return updated;
  }

  async getChatHostConfig(): Promise<ChatHostConfig | undefined> {
    const [row] = await db.select().from(chatHostConfig).limit(1);
    return row;
  }

  async upsertChatHostConfig(data: Partial<InsertChatHostConfig>): Promise<ChatHostConfig> {
    const existing = await this.getChatHostConfig();
    if (existing) {
      const [updated] = await db
        .update(chatHostConfig)
        .set(data)
        .where(eq(chatHostConfig.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(chatHostConfig)
        .values({ consultantSlug: "asinaci", displayName: "", title: "", statusMessage: "", isAvailable: true, ...data })
        .returning();
      return created;
    }
  }

  async getConsultantByMatrixUserId(matrixUserId: string): Promise<Consultant | undefined> {
    const [row] = await db.select().from(consultants).where(eq(consultants.matrixUserId, matrixUserId));
    return row;
  }

  async getAllProjectsBySlug(slug: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.consultantSlug, slug))
      .orderBy(asc(projects.displayOrder));
  }

  async getAllStoriesBySlug(slug: string): Promise<Story[]> {
    return await db
      .select()
      .from(stories)
      .where(eq(stories.consultantSlug, slug))
      .orderBy(desc(stories.createdAt));
  }

  async getAllMediaBySlug(slug: string): Promise<CachedMedia[]> {
    return await db
      .select()
      .from(cachedMedia)
      .where(eq(cachedMedia.consultantSlug, slug))
      .orderBy(asc(cachedMedia.displayOrder));
  }

  async updateContactInfoBySlug(slug: string, data: Partial<InsertContactInfo>): Promise<ContactInfo> {
    const existing = await this.getContactInfoBySlug(slug);
    if (existing) {
      const [updated] = await db
        .update(contactInfo)
        .set(data)
        .where(eq(contactInfo.consultantSlug, slug))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(contactInfo)
        .values({ consultantSlug: slug, headline: "Ready to Connect?", subheading: "", email: "", phone: "", location: "", locationLine2: "", ...data })
        .returning();
      return created;
    }
  }

  async getChatHostConfigBySlug(slug: string): Promise<ChatHostConfig | undefined> {
    const [row] = await db.select().from(chatHostConfig).where(eq(chatHostConfig.consultantSlug, slug));
    return row;
  }

  async upsertChatHostConfigBySlug(slug: string, data: Partial<InsertChatHostConfig>): Promise<ChatHostConfig> {
    const existing = await this.getChatHostConfigBySlug(slug);
    if (existing) {
      const [updated] = await db
        .update(chatHostConfig)
        .set(data)
        .where(eq(chatHostConfig.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(chatHostConfig)
        .values({ consultantSlug: slug, displayName: "", title: "", statusMessage: "", isAvailable: true, ...data })
        .returning();
      return created;
    }
  }

  async getTestimonialsBySlug(slug: string): Promise<Testimonial[]> {
    return await db
      .select()
      .from(testimonials)
      .where(and(eq(testimonials.consultantSlug, slug), eq(testimonials.status, "approved")))
      .orderBy(asc(testimonials.sortOrder));
  }

  async getAllTestimonialsBySlug(slug: string): Promise<Testimonial[]> {
    return await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.consultantSlug, slug))
      .orderBy(asc(testimonials.status), asc(testimonials.sortOrder));
  }

  async getPendingTestimonialsBySlug(slug: string): Promise<Testimonial[]> {
    return await db
      .select()
      .from(testimonials)
      .where(and(eq(testimonials.consultantSlug, slug), eq(testimonials.status, "pending")))
      .orderBy(asc(testimonials.sortOrder));
  }

  async createTestimonial(data: InsertTestimonial): Promise<Testimonial> {
    const [created] = await db.insert(testimonials).values(data).returning();
    return created;
  }

  async updateTestimonial(id: number, data: Partial<InsertTestimonial>): Promise<Testimonial | undefined> {
    const [updated] = await db
      .update(testimonials)
      .set(data)
      .where(eq(testimonials.id, id))
      .returning();
    return updated;
  }

  async deleteTestimonial(id: number): Promise<void> {
    await db.delete(testimonials).where(eq(testimonials.id, id));
  }

  async approveTestimonial(id: number): Promise<Testimonial | undefined> {
    const [updated] = await db
      .update(testimonials)
      .set({ status: "approved" })
      .where(eq(testimonials.id, id))
      .returning();
    return updated;
  }

  async getTestimonialByVisitor(slug: string, userId: string): Promise<Testimonial | undefined> {
    const [row] = await db
      .select()
      .from(testimonials)
      .where(and(eq(testimonials.consultantSlug, slug), eq(testimonials.submittedByUserId, userId)));
    return row;
  }

  async getTestimonialsByVisitor(userId: string): Promise<Testimonial[]> {
    return await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.submittedByUserId, userId))
      .orderBy(desc(testimonials.id));
  }

  async getVisitorContacts(userId: string): Promise<(VisitorContact & { consultantName: string; consultantTagline: string; consultantAvatarUrl: string | null })[]> {
    const rows = await db
      .select({
        id: visitorContacts.id,
        userId: visitorContacts.userId,
        consultantSlug: visitorContacts.consultantSlug,
        note: visitorContacts.note,
        createdAt: visitorContacts.createdAt,
        consultantName: consultants.name,
        consultantTagline: consultants.tagline,
        consultantAvatarUrl: consultants.avatarUrl,
      })
      .from(visitorContacts)
      .leftJoin(consultants, eq(visitorContacts.consultantSlug, consultants.slug))
      .where(eq(visitorContacts.userId, userId))
      .orderBy(desc(visitorContacts.createdAt));
    return rows.map(r => ({
      ...r,
      consultantName: r.consultantName ?? r.consultantSlug,
      consultantTagline: r.consultantTagline ?? "",
      consultantAvatarUrl: r.consultantAvatarUrl ?? null,
    }));
  }

  async addVisitorContact(userId: string, consultantSlug: string, note?: string): Promise<VisitorContact> {
    const [row] = await db
      .insert(visitorContacts)
      .values({ userId, consultantSlug, note: note ?? "" })
      .returning();
    return row;
  }

  async removeVisitorContact(userId: string, consultantSlug: string): Promise<void> {
    await db
      .delete(visitorContacts)
      .where(and(eq(visitorContacts.userId, userId), eq(visitorContacts.consultantSlug, consultantSlug)));
  }

  async isVisitorContact(userId: string, consultantSlug: string): Promise<boolean> {
    const [row] = await db
      .select({ id: visitorContacts.id })
      .from(visitorContacts)
      .where(and(eq(visitorContacts.userId, userId), eq(visitorContacts.consultantSlug, consultantSlug)));
    return !!row;
  }

  async getEcosystemProjects(): Promise<EcosystemProject[]> {
    return await db
      .select()
      .from(ecosystemProjects)
      .where(eq(ecosystemProjects.isActive, true))
      .orderBy(asc(ecosystemProjects.category), asc(ecosystemProjects.displayOrder));
  }

  async getAllEcosystemProjects(): Promise<EcosystemProject[]> {
    return await db
      .select()
      .from(ecosystemProjects)
      .orderBy(asc(ecosystemProjects.category), asc(ecosystemProjects.displayOrder));
  }

  async createEcosystemProject(data: InsertEcosystemProject): Promise<EcosystemProject> {
    const [created] = await db.insert(ecosystemProjects).values(data).returning();
    return created;
  }

  async updateEcosystemProject(id: number, data: Partial<InsertEcosystemProject>): Promise<EcosystemProject | undefined> {
    const [updated] = await db
      .update(ecosystemProjects)
      .set(data)
      .where(eq(ecosystemProjects.id, id))
      .returning();
    return updated;
  }

  async deleteEcosystemProject(id: number): Promise<void> {
    await db.delete(ecosystemProjects).where(eq(ecosystemProjects.id, id));
  }
}

export const storage = new DatabaseStorage();
