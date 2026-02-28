import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { insertChatSessionSchema, insertChatMessageSchema, insertStorySchema, insertCachedMediaSchema } from "@shared/schema";
import { z } from "zod";
import { WebSocketServer, WebSocket } from "ws";
import { createChatRoom, sendMatrixMessage, getNewReplies, uploadFileToMatrix, uploadMediaToMatrix } from "./matrix";
import { getUserTweets, searchTweets } from "./twitter";
import { resolveMediaUrl, refreshMediaEntry, detectPlatform } from "./media";
import { getSSORedirectUrl, exchangeLoginToken, requireAdmin, requireConsultant, requireAuth, makeRequireVerifiedConsultant } from "./auth";
const requireVerifiedConsultant = makeRequireVerifiedConsultant(storage);
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

  app.get("/api/auth/sso-redirect", (req, res) => {
    const host = req.get("host") || "localhost:5000";
    const protocol = req.protocol;
    const callbackUrl = `${protocol}://${host}/api/auth/callback`;
    const ssoUrl = getSSORedirectUrl(callbackUrl);
    res.json({ url: ssoUrl });
  });

  app.get("/api/auth/callback", async (req, res) => {
    try {
      const loginToken = req.query.loginToken as string;
      if (!loginToken) {
        res.redirect("/login?error=missing_token");
        return;
      }

      const result = await exchangeLoginToken(loginToken);

      const consultant = await storage.getConsultantByMatrixUserId(result.userId);
      const consultantSlug = consultant?.slug;

      let finalConsultantSlug = consultantSlug;

      if (!result.isAdmin && !finalConsultantSlug) {
        const { isConsultantRoomMember } = await import("./sync");
        let isMember = isConsultantRoomMember(result.userId);

        if (!isMember) {
          const CONSULTANT_ROOM = process.env.CONSULTANT_MATRIX_ROOM;
          if (CONSULTANT_ROOM) {
            const { getRoomMembers } = await import("./matrix");
            const members = await getRoomMembers(CONSULTANT_ROOM);
            isMember = !!members?.includes(result.userId);
            if (isMember) {
              console.log(`[auth] Live room check: ${result.userId} is a consultant room member`);
            }
          }
        }

        if (isMember) {
          const { getDisplayName } = await import("./matrix");
          const displayName = await getDisplayName(result.userId) || result.displayName;
          const localpart = result.userId.split(":")[0].replace("@", "");
          const baseSlug = localpart.toLowerCase().replace(/[^a-z0-9-]/g, "-");
          const slugExists = await storage.getConsultantBySlug(baseSlug);
          const newSlug = slugExists ? `${baseSlug}-${Date.now()}` : baseSlug;

          try {
            await storage.createConsultant({
              slug: newSlug,
              name: displayName,
              matrixUserId: result.userId,
              isActive: true,
            });
            finalConsultantSlug = newSlug;
            console.log(`[auth] Auto-created consultant at login: ${displayName} (${result.userId}) → slug: ${newSlug}`);
          } catch (err) {
            console.error(`[auth] Failed to auto-create consultant for ${result.userId}:`, err);
          }
        }
      }

      req.session.userId = result.userId;
      req.session.accessToken = result.accessToken;
      req.session.displayName = result.displayName;
      req.session.isAdmin = result.isAdmin;
      req.session.consultantSlug = finalConsultantSlug ?? undefined;

      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          res.redirect("/login?error=session_failed");
          return;
        }

        if (result.isAdmin || finalConsultantSlug) {
          res.redirect("/welcome");
        } else {
          res.redirect("/?visitor=1");
        }
      });
    } catch (err: any) {
      console.error("SSO callback error:", err);
      res.redirect("/login?error=auth_failed");
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        res.status(500).json({ message: "Failed to logout" });
        return;
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.session.userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    res.json({
      userId: req.session.userId,
      displayName: req.session.displayName,
      isAdmin: req.session.isAdmin,
      consultantSlug: req.session.consultantSlug ?? null,
    });
  });

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

      let recipientMatrixUserId: string | undefined;
      if (input.consultantSlug) {
        const consultant = await storage.getConsultantBySlug(input.consultantSlug);
        if (consultant?.matrixUserId) {
          recipientMatrixUserId = consultant.matrixUserId;
          console.log(`[chat] Routing session to consultant ${input.consultantSlug} → ${recipientMatrixUserId}`);
        }
      }

      let matrixRoomId: string | undefined;
      try {
        const visitorName = input.visitorName || "Website Visitor";
        matrixRoomId = await createChatRoom(visitorName, input.visitorEmail || undefined, recipientMatrixUserId);
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

  app.get("/api/chat/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getChatSession(sessionId);
      if (!session) {
        res.status(404).json({ message: "Session not found" });
        return;
      }
      res.json(session);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
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

  app.delete("/api/chat/clear", requireAdmin, async (req, res) => {
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

  // Social URL resolver — accessible to any authenticated user (admin or consultant)
  app.post("/api/resolve-story-url", async (req, res) => {
    if (!req.session?.userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string") {
        res.status(400).json({ error: "url is required" });
        return;
      }
      const platform = detectPlatform(url);
      if (!platform) {
        res.status(422).json({ error: "Could not detect platform. Supported: Instagram, TikTok, Twitter/X, Snapchat" });
        return;
      }
      const resolved = await resolveMediaUrl(platform, url);
      if (resolved === null) {
        res.status(422).json({ error: "Could not resolve URL — make sure the post is public" });
        return;
      }
      // Return what we got — imageUrl may be undefined (text-only post, will be a caption-only story)
      res.json({
        platform,
        imageUrl: resolved.imageUrl || null,
        title: resolved.title || null,
        sourceUrl: url,
        hasImage: !!resolved.imageUrl,
      });
    } catch (err) {
      console.error("resolve-story-url error:", err);
      res.status(500).json({ error: "Failed to resolve URL" });
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

  app.post("/api/stories", requireAdmin, upload.single("image"), async (req, res) => {
    try {
      const { content, authorName, authorImage, imageUrl: bodyImageUrl, sourceType, sourceUrl } = req.body;
      
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
        sourceType: sourceType || null,
        sourceUrl: sourceUrl || null,
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

  app.post("/api/media", requireAdmin, async (req, res) => {
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

  app.delete("/api/media/:id", requireAdmin, async (req, res) => {
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

  app.patch("/api/media/:id", requireAdmin, async (req, res) => {
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

  app.get("/api/inquiries", requireAdmin, async (_req, res) => {
    try {
      const allInquiries = await storage.getAllInquiries();
      res.json(allInquiries);
    } catch (err) {
      console.error("Inquiries fetch error:", err);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  app.delete("/api/inquiries/:id", requireAdmin, async (req, res) => {
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

  app.get("/api/stories/all", requireAdmin, async (_req, res) => {
    try {
      const allStories = await storage.getAllStories();
      res.json(allStories);
    } catch (err) {
      console.error("Stories fetch error:", err);
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  app.delete("/api/stories/:id", requireAdmin, async (req, res) => {
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

  app.post("/api/twitter/refresh", requireAdmin, async (_req, res) => {
    try {
      const tweets = await getUserTweets(10, true);
      res.json({ message: "Twitter cache refreshed", count: tweets.length });
    } catch (err) {
      console.error("Twitter refresh error:", err);
      res.status(500).json({ message: "Failed to refresh Twitter cache" });
    }
  });

  app.get("/api/projects", async (_req, res) => {
    try {
      const activeProjects = await storage.getActiveProjects();
      res.json(activeProjects);
    } catch (err) {
      console.error("Projects fetch error:", err);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/all", requireAdmin, async (_req, res) => {
    try {
      const allProjects = await storage.getAllProjects();
      res.json(allProjects);
    } catch (err) {
      console.error("Projects fetch error:", err);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", requireAdmin, async (req, res) => {
    try {
      const createSchema = z.object({
        title: z.string().min(1),
        subtitle: z.string().min(1),
        description: z.string().min(1),
        impact: z.string().min(1),
        link: z.string().url().nullable().optional(),
        icon: z.string().min(1).optional(),
        color: z.string().min(1).optional(),
        tags: z.array(z.string()),
        displayOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
      });
      const input = createSchema.parse(req.body);
      const project = await storage.createProject({
        title: input.title,
        subtitle: input.subtitle,
        description: input.description,
        impact: input.impact,
        link: input.link || null,
        icon: input.icon || "Briefcase",
        color: input.color || "bg-green-500",
        tags: input.tags,
        displayOrder: input.displayOrder || 0,
        isActive: input.isActive ?? true,
      });
      res.status(201).json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message, errors: err.errors });
        return;
      }
      console.error("Project creation error:", err);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid ID" });
        return;
      }
      const updateSchema = z.object({
        title: z.string().min(1).optional(),
        subtitle: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        impact: z.string().min(1).optional(),
        link: z.string().url().nullable().optional(),
        icon: z.string().min(1).optional(),
        color: z.string().min(1).optional(),
        tags: z.array(z.string()).optional(),
        displayOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
      });
      const input = updateSchema.parse(req.body);
      const updated = await storage.updateProject(id, input);
      if (!updated) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      console.error("Project update error:", err);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid ID" });
        return;
      }
      await storage.deleteProject(id);
      res.json({ message: "Project deleted" });
    } catch (err) {
      console.error("Project deletion error:", err);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  const CONTACT_DEFAULTS = {
    headline: "Ready to Innovate?",
    subheading: "Schedule a consultation to discuss your blockchain strategy and how XRPL can transform your business.",
    email: "contact@edwingutierrez.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    locationLine2: "Available Worldwide Remote",
  };

  app.get("/api/contact-info", async (_req, res) => {
    try {
      const info = await storage.getContactInfo();
      res.json(info ?? { id: 1, ...CONTACT_DEFAULTS });
    } catch (err) {
      console.error("Contact info fetch error:", err);
      res.status(500).json({ message: "Failed to fetch contact info" });
    }
  });

  app.patch("/api/contact-info", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateContactInfo(req.body);
      res.json(updated);
    } catch (err) {
      console.error("Contact info update error:", err);
      res.status(500).json({ message: "Failed to update contact info" });
    }
  });

  // Chat host config routes
  app.get("/api/chat/host-config", async (_req, res) => {
    try {
      const config = await storage.getChatHostConfig();
      res.json(config ?? {
        id: 1,
        consultantSlug: "asinaci",
        displayName: "Edwin",
        title: "XRPL Consultant",
        avatarUrl: null,
        statusMessage: "Usually replies within a few hours",
        isAvailable: true,
      });
    } catch (err) {
      console.error("Chat host config fetch error:", err);
      res.status(500).json({ message: "Failed to fetch chat host config" });
    }
  });

  app.get("/api/chat/host-config/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const config = await storage.getChatHostConfigBySlug(slug);
      if (config) { res.json(config); return; }
      const consultant = await storage.getConsultantBySlug(slug);
      if (consultant) {
        res.json({
          consultantSlug: slug,
          displayName: consultant.name,
          title: consultant.tagline || "Consultant",
          avatarUrl: consultant.avatarUrl ?? null,
          statusMessage: "Usually replies within a few hours",
          isAvailable: true,
        });
        return;
      }
      const fallback = await storage.getChatHostConfig();
      res.json(fallback ?? { consultantSlug: slug, displayName: "", title: "", avatarUrl: null, statusMessage: "", isAvailable: true });
    } catch (err) {
      console.error("Chat host config by slug fetch error:", err);
      res.status(500).json({ message: "Failed to fetch chat host config" });
    }
  });

  app.patch("/api/chat/host-config", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.upsertChatHostConfig(req.body);
      res.json(updated);
    } catch (err) {
      console.error("Chat host config update error:", err);
      res.status(500).json({ message: "Failed to update chat host config" });
    }
  });

  // Consultant directory routes
  app.get("/api/consultants", async (_req, res) => {
    try {
      const all = await storage.getConsultants();
      res.json(all);
    } catch (err) {
      console.error("Consultants fetch error:", err);
      res.status(500).json({ message: "Failed to fetch consultants" });
    }
  });

  app.get("/api/consultants/:slug", async (req, res) => {
    try {
      const consultant = await storage.getConsultantBySlug(req.params.slug);
      if (!consultant) {
        res.status(404).json({ message: "Consultant not found" });
        return;
      }
      res.json(consultant);
    } catch (err) {
      console.error("Consultant fetch error:", err);
      res.status(500).json({ message: "Failed to fetch consultant" });
    }
  });

  app.post("/api/consultants", requireAdmin, async (req, res) => {
    try {
      const created = await storage.createConsultant(req.body);
      res.status(201).json(created);
    } catch (err) {
      console.error("Consultant create error:", err);
      res.status(500).json({ message: "Failed to create consultant" });
    }
  });

  app.patch("/api/consultants/:slug", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateConsultant(req.params.slug, req.body);
      if (!updated) {
        res.status(404).json({ message: "Consultant not found" });
        return;
      }
      res.json(updated);
    } catch (err) {
      console.error("Consultant update error:", err);
      res.status(500).json({ message: "Failed to update consultant" });
    }
  });

  // Scoped data routes per consultant slug
  app.get("/api/c/:slug/projects", async (req, res) => {
    try {
      const data = await storage.getActiveProjectsBySlug(req.params.slug);
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/c/:slug/stories", async (req, res) => {
    try {
      const data = await storage.getActiveStoriesBySlug(req.params.slug);
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  app.get("/api/c/:slug/media/:section", async (req, res) => {
    try {
      const data = await storage.getMediaBySectionAndSlug(req.params.section, req.params.slug);
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch media" });
    }
  });

  app.get("/api/c/:slug/contact-info", async (req, res) => {
    try {
      const info = await storage.getContactInfoBySlug(req.params.slug);
      res.json(info ?? { ...CONTACT_DEFAULTS, consultantSlug: req.params.slug });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch contact info" });
    }
  });

  // ─── Consultant Dashboard Routes (/api/dashboard/...) ───────────────────────
  function getDashboardSlug(req: any): string | undefined {
    return req.session.isAdmin
      ? ((req.query.slug as string) ?? req.session.consultantSlug)
      : req.session.consultantSlug;
  }

  // Profile
  app.get("/api/dashboard/profile", requireVerifiedConsultant, async (req, res) => {
    try {
      const slug = getDashboardSlug(req);
      if (!slug) { res.status(400).json({ message: "No consultant slug" }); return; }
      const consultant = await storage.getConsultantBySlug(slug);
      if (!consultant) { res.status(404).json({ message: "Consultant not found" }); return; }
      res.json(consultant);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.patch("/api/dashboard/profile", requireVerifiedConsultant, async (req, res) => {
    try {
      const slug = getDashboardSlug(req);
      if (!slug) { res.status(400).json({ message: "No consultant slug" }); return; }
      const updated = await storage.updateConsultant(slug, req.body);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Projects
  app.get("/api/dashboard/projects", requireVerifiedConsultant, async (req, res) => {
    try {
      const slug = getDashboardSlug(req);
      if (!slug) { res.status(400).json({ message: "No consultant slug" }); return; }
      const data = await storage.getAllProjectsBySlug(slug);
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/dashboard/projects", requireVerifiedConsultant, async (req, res) => {
    try {
      const slug = getDashboardSlug(req);
      if (!slug) { res.status(400).json({ message: "No consultant slug" }); return; }
      const created = await storage.createProject({ ...req.body, consultantSlug: slug });
      res.status(201).json(created);
    } catch (err) {
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.patch("/api/dashboard/projects/:id", requireVerifiedConsultant, async (req, res) => {
    try {
      const slug = getDashboardSlug(req);
      const id = parseInt(req.params.id);
      const all = await storage.getAllProjectsBySlug(slug!);
      if (!all.find(p => p.id === id)) { res.status(403).json({ message: "Forbidden" }); return; }
      const updated = await storage.updateProject(id, req.body);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/dashboard/projects/:id", requireVerifiedConsultant, async (req, res) => {
    try {
      const slug = getDashboardSlug(req);
      const id = parseInt(req.params.id);
      const all = await storage.getAllProjectsBySlug(slug!);
      if (!all.find(p => p.id === id)) { res.status(403).json({ message: "Forbidden" }); return; }
      await storage.deleteProject(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Stories
  app.get("/api/dashboard/stories", requireVerifiedConsultant, async (req, res) => {
    try {
      const slug = getDashboardSlug(req);
      if (!slug) { res.status(400).json({ message: "No consultant slug" }); return; }
      const data = await storage.getAllStoriesBySlug(slug);
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  app.post("/api/dashboard/stories", requireVerifiedConsultant, upload.single("image"), async (req, res) => {
    try {
      const slug = getDashboardSlug(req);
      if (!slug) { res.status(400).json({ message: "No consultant slug" }); return; }
      const { content, authorName, imageUrl: bodyImageUrl, sourceType, sourceUrl } = req.body;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const created = await storage.createStory({
        content: content || null,
        imageUrl: bodyImageUrl || null,
        authorName: authorName || "Edwin Gutierrez",
        sourceType: sourceType || null,
        sourceUrl: sourceUrl || null,
        consultantSlug: slug,
        expiresAt,
      });
      res.status(201).json(created);
    } catch (err) {
      console.error("Dashboard story creation error:", err);
      res.status(500).json({ message: "Failed to create story" });
    }
  });

  app.delete("/api/dashboard/stories/:id", requireVerifiedConsultant, async (req, res) => {
    try {
      const slug = getDashboardSlug(req);
      const id = parseInt(req.params.id);
      const all = await storage.getAllStoriesBySlug(slug!);
      if (!all.find(s => s.id === id)) { res.status(403).json({ message: "Forbidden" }); return; }
      await storage.deleteStory(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete story" });
    }
  });

  // Contact info
  app.get("/api/dashboard/contact-info", requireVerifiedConsultant, async (req, res) => {
    try {
      const slug = getDashboardSlug(req);
      if (!slug) { res.status(400).json({ message: "No consultant slug" }); return; }
      const info = await storage.getContactInfoBySlug(slug);
      res.json(info ?? { ...CONTACT_DEFAULTS, consultantSlug: slug });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch contact info" });
    }
  });

  app.patch("/api/dashboard/contact-info", requireVerifiedConsultant, async (req, res) => {
    try {
      const slug = getDashboardSlug(req);
      if (!slug) { res.status(400).json({ message: "No consultant slug" }); return; }
      const updated = await storage.updateContactInfoBySlug(slug, req.body);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update contact info" });
    }
  });

  // Media
  app.get("/api/dashboard/media", requireVerifiedConsultant, async (req, res) => {
    try {
      const slug = getDashboardSlug(req);
      if (!slug) { res.status(400).json({ message: "No consultant slug" }); return; }
      const data = await storage.getAllMediaBySlug(slug);
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch media" });
    }
  });

  app.post("/api/dashboard/media", requireVerifiedConsultant, async (req, res) => {
    try {
      const slug = getDashboardSlug(req);
      if (!slug) { res.status(400).json({ message: "No consultant slug" }); return; }
      const created = await storage.createMedia({ ...req.body, consultantSlug: slug });
      res.status(201).json(created);
    } catch (err) {
      res.status(500).json({ message: "Failed to create media" });
    }
  });

  app.patch("/api/dashboard/media/:id", requireVerifiedConsultant, async (req, res) => {
    try {
      const slug = getDashboardSlug(req);
      const id = parseInt(req.params.id);
      const all = await storage.getAllMediaBySlug(slug!);
      if (!all.find(m => m.id === id)) { res.status(403).json({ message: "Forbidden" }); return; }
      const updated = await storage.updateMedia(id, req.body);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update media" });
    }
  });

  app.delete("/api/dashboard/media/:id", requireVerifiedConsultant, async (req, res) => {
    try {
      const slug = getDashboardSlug(req);
      const id = parseInt(req.params.id);
      const all = await storage.getAllMediaBySlug(slug!);
      if (!all.find(m => m.id === id)) { res.status(403).json({ message: "Forbidden" }); return; }
      await storage.deleteMedia(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete media" });
    }
  });

  // Chat profile
  app.get("/api/dashboard/chat-profile", requireVerifiedConsultant, async (req, res) => {
    try {
      const slug = getDashboardSlug(req);
      if (!slug) { res.status(400).json({ message: "No consultant slug" }); return; }
      const config = await storage.getChatHostConfigBySlug(slug);
      if (config) { res.json(config); return; }
      const consultant = await storage.getConsultantBySlug(slug);
      res.json({
        consultantSlug: slug,
        displayName: consultant?.name ?? "",
        title: consultant?.tagline ?? "",
        avatarUrl: consultant?.avatarUrl ?? null,
        statusMessage: "Usually replies within a few hours",
        isAvailable: true,
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch chat profile" });
    }
  });

  app.patch("/api/dashboard/chat-profile", requireVerifiedConsultant, async (req, res) => {
    try {
      const slug = getDashboardSlug(req);
      if (!slug) { res.status(400).json({ message: "No consultant slug" }); return; }
      const updated = await storage.upsertChatHostConfigBySlug(slug, req.body);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update chat profile" });
    }
  });

  app.patch("/api/dashboard/profile-room", requireVerifiedConsultant, async (req, res) => {
    try {
      const slug = getDashboardSlug(req);
      if (!slug) { res.status(400).json({ message: "No consultant slug" }); return; }
      const { profileRoomId } = req.body;
      await storage.updateConsultant(slug, { profileRoomId: profileRoomId || null });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to update profile room" });
    }
  });

  // Testimonials — public read (approved only)
  app.get("/api/c/:slug/testimonials", async (req, res) => {
    try {
      const data = await storage.getTestimonialsBySlug(req.params.slug);
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  // Testimonials — visitor submission (any logged-in user)
  app.post("/api/c/:slug/testimonials", requireAuth, async (req, res) => {
    try {
      const { slug } = req.params;
      const userId = req.session.userId!;
      const displayName = req.session.displayName || userId;
      const existing = await storage.getTestimonialByVisitor(slug, userId);
      if (existing) {
        res.status(409).json({ message: "You have already submitted a testimonial for this consultant." });
        return;
      }
      const { authorName, authorTitle, content } = req.body;
      if (!content?.trim()) { res.status(400).json({ message: "Content is required" }); return; }
      const created = await storage.createTestimonial({
        consultantSlug: slug,
        authorName: authorName?.trim() || displayName,
        authorTitle: authorTitle?.trim() ?? "",
        content: content.trim(),
        sortOrder: 0,
        status: "pending",
        submittedByUserId: userId,
        submittedByDisplayName: displayName,
      });
      res.status(201).json(created);
    } catch (err) {
      res.status(500).json({ message: "Failed to submit testimonial" });
    }
  });

  // Testimonials — check if current user already submitted
  app.get("/api/c/:slug/testimonials/my-submission", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getTestimonialByVisitor(req.params.slug, req.session.userId!);
      res.json({ submitted: !!existing, status: existing?.status ?? null });
    } catch (err) {
      res.status(500).json({ message: "Failed to check submission" });
    }
  });

  // Testimonials — dashboard CRUD (all statuses for consultant)
  app.get("/api/dashboard/testimonials", requireVerifiedConsultant, async (req, res) => {
    try {
      const slug = getDashboardSlug(req);
      if (!slug) { res.status(400).json({ message: "No consultant slug" }); return; }
      const data = await storage.getAllTestimonialsBySlug(slug);
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  app.post("/api/dashboard/testimonials", requireVerifiedConsultant, async (req, res) => {
    try {
      const slug = getDashboardSlug(req);
      if (!slug) { res.status(400).json({ message: "No consultant slug" }); return; }
      const { authorName, authorTitle, content, sortOrder } = req.body;
      const created = await storage.createTestimonial({ consultantSlug: slug, authorName, authorTitle: authorTitle ?? "", content, sortOrder: sortOrder ?? 0, status: "approved" });
      res.status(201).json(created);
    } catch (err) {
      res.status(500).json({ message: "Failed to create testimonial" });
    }
  });

  app.patch("/api/dashboard/testimonials/:id/approve", requireVerifiedConsultant, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.approveTestimonial(id);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to approve testimonial" });
    }
  });

  app.patch("/api/dashboard/testimonials/:id", requireVerifiedConsultant, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { authorName, authorTitle, content, sortOrder } = req.body;
      const updated = await storage.updateTestimonial(id, { authorName, authorTitle, content, sortOrder });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update testimonial" });
    }
  });

  app.delete("/api/dashboard/testimonials/:id", requireVerifiedConsultant, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTestimonial(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete testimonial" });
    }
  });

  app.get("/api/admin/sync-status", requireAdmin, async (_req, res) => {
    const { getSyncStatus } = await import("./sync");
    res.json(getSyncStatus());
  });

  app.get("/api/admin/pending-invites", requireAdmin, async (_req, res) => {
    try {
      const CONSULTANT_ROOM = process.env.CONSULTANT_MATRIX_ROOM;
      if (!CONSULTANT_ROOM) {
        res.json({ pending: [] });
        return;
      }
      const { getRoomInvitedMembers } = await import("./matrix");
      const invited = await getRoomInvitedMembers(CONSULTANT_ROOM);
      const allConsultants = await storage.getConsultants();
      const activeMatrixIds = new Set(
        allConsultants.filter(c => c.isActive).map(c => c.matrixUserId).filter(Boolean)
      );
      const pending = invited.filter(id => !activeMatrixIds.has(id));
      res.json({ pending });
    } catch (err) {
      console.error("pending-invites error:", err);
      res.status(500).json({ message: "Failed to fetch pending invites" });
    }
  });

  app.post("/api/admin/add-consultant", requireAdmin, async (req, res) => {
    try {
      const { matrixUserId } = req.body;
      if (!matrixUserId || typeof matrixUserId !== "string") {
        res.status(400).json({ message: "matrixUserId is required" });
        return;
      }

      const existing = await storage.getConsultantByMatrixUserId(matrixUserId);
      if (existing) {
        if (!existing.isActive) {
          const reactivated = await storage.updateConsultant(existing.slug, { isActive: true });
          console.log(`[admin] Re-activated consultant: ${existing.slug} (${matrixUserId})`);
          res.json({ consultant: reactivated, created: false, reactivated: true });
          return;
        }
        res.json({ consultant: existing, created: false, reactivated: false });
        return;
      }

      const { getDisplayName } = await import("./matrix");
      const displayName = await getDisplayName(matrixUserId) || matrixUserId.split(":")[0].replace("@", "");
      const localpart = matrixUserId.split(":")[0].replace("@", "");
      const baseSlug = localpart.toLowerCase().replace(/[^a-z0-9-]/g, "-");
      const slugExists = await storage.getConsultantBySlug(baseSlug);
      const finalSlug = slugExists ? `${baseSlug}-${Date.now()}` : baseSlug;

      const consultant = await storage.createConsultant({
        slug: finalSlug,
        name: displayName,
        matrixUserId,
        isActive: true,
      });
      console.log(`[admin] Manually added consultant: ${displayName} (${matrixUserId}) → slug: ${finalSlug}`);
      res.status(201).json({ consultant, created: true, reactivated: false });
    } catch (err) {
      console.error("Admin add consultant error:", err);
      res.status(500).json({ message: "Failed to add consultant" });
    }
  });

  return httpServer;
}
