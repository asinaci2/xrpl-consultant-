import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { insertChatSessionSchema, insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";
import { WebSocketServer, WebSocket } from "ws";

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
      const session = await storage.createChatSession(input);
      res.status(201).json({ id: session.id, sessionId: session.sessionId });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
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

      broadcastToSession(sessionId, message);

      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  return httpServer;
}
