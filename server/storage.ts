import { 
  inquiries, 
  chatSessions, 
  chatMessages,
  stories,
  type InsertInquiry, 
  type Inquiry,
  type InsertChatSession,
  type ChatSession,
  type InsertChatMessage,
  type ChatMessage,
  type InsertStory,
  type Story
} from "@shared/schema";
import { db } from "./db";
import { eq, gt, lt } from "drizzle-orm";

export interface IStorage {
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  createChatSession(session: InsertChatSession & { matrixRoomId?: string }): Promise<ChatSession>;
  getChatSession(sessionId: string): Promise<ChatSession | undefined>;
  updateChatSessionMatrixRoom(sessionId: string, matrixRoomId: string): Promise<void>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  createStory(story: InsertStory): Promise<Story>;
  getActiveStories(): Promise<Story[]>;
  deleteExpiredStories(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createInquiry(insertInquiry: InsertInquiry): Promise<Inquiry> {
    const [inquiry] = await db
      .insert(inquiries)
      .values(insertInquiry)
      .returning();
    return inquiry;
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

  async deleteExpiredStories(): Promise<void> {
    const now = new Date();
    await db.delete(stories).where(lt(stories.expiresAt, now));
  }
}

export const storage = new DatabaseStorage();
