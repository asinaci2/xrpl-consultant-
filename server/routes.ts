import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { insertChatSessionSchema, insertChatMessageSchema, insertStorySchema, insertCachedMediaSchema } from "@shared/schema";
import { z } from "zod";
import { WebSocketServer, WebSocket } from "ws";
import { createChatRoom, sendMatrixMessage, getNewReplies, uploadFileToMatrix, uploadMediaToMatrix } from "./matrix";
import { getUserTweets, searchTweets } from "./twitter";
import { resolveMediaUrl, refreshMediaEntry } from "./media";
import multer from "multer";

const clients = new Map<string, Set<WebSocket>>();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const sessionId = url.searchParams.get("sessionId");
    
    if (sessionId) {
      if (!clients.has(sessionId)) {
        clients.set(sessionId, new Set());
      }
      clients.get(sessionId)!.add(ws);

      ws.on("close", () => {
        clients.get(sessionId)?.delete(ws);
        if (clients.get(sessionId)?.size === 0) {
          clients.delete(sessionId);
        }
      });
    }
  });

  function broadcastToSession(sessionId: string, message: object) {
    const sessionClients = clients.get(sessionId);
    if (sessionClients) {
      const data = JSON.stringify(message);
      sessionClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    }
  }

  // Poll for Matrix replies and broadcast to connected clients
  async function pollMatrixReplies() {
    // Get all active sessions with connected clients
    for (const [sessionId, sessionClients] of Array.from(clients.entries())) {
      if (sessionClients.size === 0) continue;
      
      try {
        const session = await storage.getChatSession(sessionId);
        if (!session?.matrixRoomId) continue;
        
        const replies = await getNewReplies(session.matrixRoomId);
        
        for (const reply of replies) {
          // Save reply to database
          const message = await storage.createChatMessage({
            sessionId,
            content: reply.content,
            isFromVisitor: false
          });
          
          // Broadcast to connected clients
          broadcastToSession(sessionId, message);
          console.log(`New reply received for session ${sessionId}: ${reply.content.substring(0, 50)}...`);
        }
      } catch (error) {
        console.error(`Error polling Matrix for session ${sessionId}:`, error);
      }
    }
  }

  // Start polling every 3 seconds
  setInterval(pollMatrixReplies, 3000);

  app.post(api.inquiries.create.path, async (req, res) => {
    try {
      const input = api.inquiries.create.input.parse(req.body);
      const inquiry = await storage.createInquiry(input);
      res.status(201).json(inquiry);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.post(api.chat.createSession.path, async (req, res) => {
    try {
      const input = insertChatSessionSchema.parse(req.body);
      
      let matrixRoomId: string | undefined;
      try {
        const visitorName = input.visitorName || "Website Visitor";
        matrixRoomId = await createChatRoom(visitorName, input.visitorEmail || undefined);
        console.log(`Created Matrix room: ${matrixRoomId}`);
      } catch (matrixError) {
        console.error("Failed to create Matrix room:", matrixError);
      }
      
      const session = await storage.createChatSession({
        ...input,
        matrixRoomId,
      });
      
      res.status(201).json({ id: session.id, sessionId: session.sessionId });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        console.error("Session creation error:", err);
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.get("/api/chat/sessions/:sessionId/messages", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const messages = await storage.getChatMessages(sessionId);
      res.json(messages);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Clear all chat messages
  app.delete("/api/chat/clear", async (req, res) => {
    try {
      await storage.clearAllChatMessages();
      res.json({ message: "All chat messages cleared" });
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post("/api/chat/sessions/:sessionId/messages", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const messageSchema = insertChatMessageSchema.omit({ sessionId: true });
      const input = messageSchema.parse(req.body);

      const message = await storage.createChatMessage({
        sessionId,
        content: input.content,
        isFromVisitor: input.isFromVisitor ?? true
      });

      const session = await storage.getChatSession(sessionId);
      if (session?.matrixRoomId) {
        try {
          await sendMatrixMessage(session.matrixRoomId, input.content, input.isFromVisitor ?? true);
        } catch (matrixError: any) {
          console.error("Failed to send to Matrix:", matrixError);
          // If forbidden (user not in room), create a new room
          if (matrixError?.errcode === 'M_FORBIDDEN') {
            try {
              const newRoomId = await createChatRoom(session.visitorName || "Website Visitor", session.visitorEmail || undefined);
              await storage.updateChatSessionMatrixRoom(sessionId, newRoomId);
              await sendMatrixMessage(newRoomId, input.content, input.isFromVisitor ?? true);
              console.log(`Recreated Matrix room: ${newRoomId}`);
            } catch (retryError) {
              console.error("Failed to recreate Matrix room:", retryError);
            }
          }
        }
      } else if (session) {
        // No Matrix room yet, create one
        try {
          const newRoomId = await createChatRoom(session.visitorName || "Website Visitor", session.visitorEmail || undefined);
          await storage.updateChatSessionMatrixRoom(sessionId, newRoomId);
          await sendMatrixMessage(newRoomId, input.content, input.isFromVisitor ?? true);
          console.log(`Created Matrix room for existing session: ${newRoomId}`);
        } catch (matrixError) {
          console.error("Failed to create Matrix room:", matrixError);
        }
      }

      broadcastToSession(sessionId, message);

      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        console.error("Message creation error:", err);
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.post("/api/chat/sessions/:sessionId/upload", upload.single("file"), async (req, res) => {
    try {
      const sessionId = req.params.sessionId as string;
      const file = req.file;
      
      if (!file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
      }
      
      let session = await storage.getChatSession(sessionId);
      if (!session) {
        res.status(400).json({ message: "Chat session not found" });
        return;
      }
      
      // Create Matrix room if it doesn't exist
      if (!session.matrixRoomId) {
        try {
          const newRoomId = await createChatRoom(session.visitorName || "Website Visitor", session.visitorEmail || undefined);
          await storage.updateChatSessionMatrixRoom(sessionId, newRoomId);
          session = { ...session, matrixRoomId: newRoomId };
          console.log(`Created Matrix room for file upload: ${newRoomId}`);
        } catch (matrixError) {
          console.error("Failed to create Matrix room for upload:", matrixError);
          res.status(500).json({ message: "Failed to initialize chat room" });
          return;
        }
      }
      
      const { mxcUrl } = await uploadFileToMatrix(
        session.matrixRoomId!,
        file.buffer,
        file.originalname,
        file.mimetype
      );
      
      const isImage = file.mimetype.startsWith("image/");
      const displayContent = isImage 
        ? `[Image: ${file.originalname}]` 
        : `[File: ${file.originalname}]`;
      
      // Convert mxc:// URL to downloadable HTTPS URL
      const downloadUrl = mxcUrl.replace(
        "mxc://",
        "https://synapse.textrp.io/_matrix/media/v3/download/"
      );
      
      const message = await storage.createChatMessage({
        sessionId,
        content: displayContent,
        isFromVisitor: true,
        fileUrl: downloadUrl,
        fileName: file.originalname,
        mimeType: file.mimetype
      });
      
      broadcastToSession(sessionId, message);
      
      res.status(201).json({ 
        message, 
        mxcUrl,
        fileName: file.originalname,
        mimeType: file.mimetype
      });
    } catch (err) {
      console.error("File upload error:", err);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.get("/api/twitter/tweets", async (req, res) => {
    try {
      const count = parseInt(req.query.count as string) || 10;
      const tweets = await getUserTweets(count);
      res.json(tweets);
    } catch (err) {
      console.error("Twitter fetch error:", err);
      res.status(500).json({ message: "Failed to fetch tweets" });
    }
  });

  app.get("/api/twitter/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const count = parseInt(req.query.count as string) || 10;
      
      if (!query) {
        res.status(400).json({ message: "Search query required" });
        return;
      }
      
      const tweets = await searchTweets(query, count);
      res.json(tweets);
    } catch (err) {
      console.error("Twitter search error:", err);
      res.status(500).json({ message: "Failed to search tweets" });
    }
  });

  // Stories endpoints
  app.get("/api/stories", async (req, res) => {
    try {
      await storage.deleteExpiredStories();
      const stories = await storage.getActiveStories();
      res.json(stories);
    } catch (err) {
      console.error("Stories fetch error:", err);
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  app.post("/api/stories", upload.single("image"), async (req, res) => {
    try {
      const { content, authorName, authorImage, imageUrl: bodyImageUrl } = req.body;
      
      let imageUrl: string | undefined;
      if (req.file) {
        const mxcUrl = await uploadMediaToMatrix(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        imageUrl = mxcUrl.replace(
          "mxc://",
          "https://synapse.textrp.io/_matrix/media/v3/download/"
        );
      } else if (bodyImageUrl) {
        imageUrl = bodyImageUrl;
      }
      
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      const parsed = insertStorySchema.parse({
        content: content || null,
        imageUrl: imageUrl || null,
        authorName: authorName || "Edwin Gutierrez",
        authorImage: authorImage || null,
        expiresAt,
      });
      
      const story = await storage.createStory(parsed);
      res.status(201).json(story);
    } catch (err) {
      console.error("Story creation error:", err);
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid story data", errors: err.errors });
        return;
      }
      res.status(500).json({ message: "Failed to create story" });
    }
  });

  app.get("/api/media/:section", async (req, res) => {
    try {
      const { section } = req.params;
      const media = await storage.getMediaBySection(section);

      for (const entry of media) {
        if (entry.source !== "manual") {
          await refreshMediaEntry(entry);
        }
      }

      const freshMedia = await storage.getMediaBySection(section);
      res.json(freshMedia);
    } catch (err) {
      console.error("Media fetch error:", err);
      res.status(500).json({ message: "Failed to fetch media" });
    }
  });

  app.get("/api/media", async (req, res) => {
    try {
      const media = await storage.getAllMedia();
      res.json(media);
    } catch (err) {
      console.error("Media fetch error:", err);
      res.status(500).json({ message: "Failed to fetch media" });
    }
  });

  app.post("/api/media", async (req, res) => {
    try {
      const createMediaSchema = z.object({
        source: z.enum(["instagram", "tiktok", "gdrive", "manual"]),
        sourceUrl: z.string().url(),
        section: z.string().min(1),
        altText: z.string().nullable().optional(),
        displayOrder: z.number().int().optional(),
      });

      const input = createMediaSchema.parse(req.body);

      const resolved = await resolveMediaUrl(input.source, input.sourceUrl);
      if (!resolved) {
        res.status(400).json({ message: "Could not resolve image from the provided URL" });
        return;
      }

      const media = await storage.createMedia({
        source: input.source,
        sourceUrl: input.sourceUrl,
        imageUrl: resolved.imageUrl,
        title: resolved.title || null,
        section: input.section,
        altText: input.altText || null,
        isActive: true,
        displayOrder: input.displayOrder || 0,
      });

      res.status(201).json(media);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message, errors: err.errors });
        return;
      }
      console.error("Media creation error:", err);
      res.status(500).json({ message: "Failed to create media entry" });
    }
  });

  app.delete("/api/media/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid ID" });
        return;
      }
      await storage.deleteMedia(id);
      res.json({ message: "Media entry deleted" });
    } catch (err) {
      console.error("Media deletion error:", err);
      res.status(500).json({ message: "Failed to delete media entry" });
    }
  });

  app.patch("/api/media/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid ID" });
        return;
      }
      const updateSchema = z.object({
        isActive: z.boolean().optional(),
        altText: z.string().nullable().optional(),
        displayOrder: z.number().int().optional(),
        section: z.string().min(1).optional(),
      });
      const input = updateSchema.parse(req.body);
      const updated = await storage.updateMedia(id, input);
      if (!updated) {
        res.status(404).json({ message: "Media entry not found" });
        return;
      }
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      console.error("Media update error:", err);
      res.status(500).json({ message: "Failed to update media entry" });
    }
  });

  app.get("/api/inquiries", async (_req, res) => {
    try {
      const allInquiries = await storage.getAllInquiries();
      res.json(allInquiries);
    } catch (err) {
      console.error("Inquiries fetch error:", err);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  app.delete("/api/inquiries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid ID" });
        return;
      }
      await storage.deleteInquiry(id);
      res.json({ message: "Inquiry deleted" });
    } catch (err) {
      console.error("Inquiry deletion error:", err);
      res.status(500).json({ message: "Failed to delete inquiry" });
    }
  });

  app.get("/api/stories/all", async (_req, res) => {
    try {
      const allStories = await storage.getAllStories();
      res.json(allStories);
    } catch (err) {
      console.error("Stories fetch error:", err);
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  app.delete("/api/stories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid ID" });
        return;
      }
      await storage.deleteStory(id);
      res.json({ message: "Story deleted" });
    } catch (err) {
      console.error("Story deletion error:", err);
      res.status(500).json({ message: "Failed to delete story" });
    }
  });

  app.post("/api/twitter/refresh", async (_req, res) => {
    try {
      const tweets = await getUserTweets(10, true);
      res.json({ message: "Twitter cache refreshed", count: tweets.length });
    } catch (err) {
      console.error("Twitter refresh error:", err);
      res.status(500).json({ message: "Failed to refresh Twitter cache" });
    }
  });

  return httpServer;
}
