import { z } from 'zod';
import { insertInquirySchema, insertChatSessionSchema, insertChatMessageSchema } from './schema';

export const api = {
  inquiries: {
    create: {
      method: 'POST' as const,
      path: '/api/inquiries',
      input: insertInquirySchema,
      responses: {
        201: insertInquirySchema,
        400: z.object({ message: z.string() })
      }
    }
  },
  chat: {
    createSession: {
      method: 'POST' as const,
      path: '/api/chat/sessions',
      input: insertChatSessionSchema,
      responses: {
        201: z.object({ id: z.number(), sessionId: z.string() }),
        400: z.object({ message: z.string() })
      }
    },
    getMessages: {
      method: 'GET' as const,
      path: '/api/chat/sessions/:sessionId/messages',
      responses: {
        200: z.array(z.object({
          id: z.number(),
          sessionId: z.string(),
          content: z.string(),
          isFromVisitor: z.boolean().nullable(),
          createdAt: z.string().nullable()
        }))
      }
    },
    sendMessage: {
      method: 'POST' as const,
      path: '/api/chat/sessions/:sessionId/messages',
      input: z.object({ content: z.string(), isFromVisitor: z.boolean().optional() }),
      responses: {
        201: z.object({
          id: z.number(),
          sessionId: z.string(),
          content: z.string(),
          isFromVisitor: z.boolean().nullable(),
          createdAt: z.string().nullable()
        }),
        400: z.object({ message: z.string() })
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
