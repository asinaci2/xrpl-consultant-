import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { insertChatSessionSchema, insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";
import { WebSocketServer, WebSocket } from "ws";
import { createChatRoom, sendMatrixMessage, getNewReplies } from "./matrix";

const clients = new Map<string, Set<WebSocket>>();

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
    for (const [sessionId, sessionClients] of clients.entries()) {
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

  return httpServer;
}
