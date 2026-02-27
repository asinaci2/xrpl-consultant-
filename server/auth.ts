import type { Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import type { Express } from "express";

const MATRIX_HOMESERVER = "https://synapse.textrp.io";
const ADMIN_MATRIX_ROOM = process.env.ADMIN_MATRIX_ROOM || "!imueijCPGUZihXVrif:synapse.textrp.io";

function isAdminUserId(userId: string): boolean {
  const adminUsers = (process.env.ADMIN_MATRIX_USERS || "").split(",").map(u => u.trim()).filter(Boolean);
  const found = adminUsers.includes(userId);
  if (found) console.log(`[auth] Direct user ID match: userId=${userId} isAdmin=true`);
  return found;
}

declare module "express-session" {
  interface SessionData {
    userId: string;
    accessToken: string;
    displayName: string;
    isAdmin: boolean;
    consultantSlug?: string;
  }
}

export function setupSession(app: Express) {
  const PgSession = connectPgSimple(session);
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    app.set("trust proxy", 1);
  }

  app.use(
    session({
      store: new PgSession({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: isProduction,
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
      },
    })
  );
}

export function getSSORedirectUrl(callbackUrl: string): string {
  return `${MATRIX_HOMESERVER}/_matrix/client/v3/login/sso/redirect/oidc-xumm?redirectUrl=${encodeURIComponent(callbackUrl)}`;
}

async function isRoomMember(userId: string, userAccessToken: string): Promise<boolean> {
  const botToken = process.env.ACCESS_TOKEN;

  if (botToken) {
    try {
      const res = await fetch(
        `${MATRIX_HOMESERVER}/_matrix/client/v3/rooms/${encodeURIComponent(ADMIN_MATRIX_ROOM)}/joined_members`,
        { headers: { Authorization: `Bearer ${botToken}` } }
      );
      if (res.ok) {
        const data = await res.json() as { joined: Record<string, unknown> };
        const found = userId in data.joined;
        console.log(`[auth] Bot room check: userId=${userId} inAdminRoom=${found} room=${ADMIN_MATRIX_ROOM}`);
        return found;
      }
      console.warn(`[auth] Bot room check failed (${res.status}), falling back to user token`);
    } catch (err) {
      console.warn("[auth] Bot room check error, falling back to user token:", err);
    }
  }

  try {
    const res = await fetch(`${MATRIX_HOMESERVER}/_matrix/client/v3/joined_rooms`, {
      headers: { Authorization: `Bearer ${userAccessToken}` },
    });
    if (!res.ok) return false;
    const data = await res.json() as { joined_rooms: string[] };
    const found = data.joined_rooms.includes(ADMIN_MATRIX_ROOM);
    console.log(`[auth] User token room check: userId=${userId} inAdminRoom=${found} room=${ADMIN_MATRIX_ROOM}`);
    return found;
  } catch {
    return false;
  }
}

export async function exchangeLoginToken(loginToken: string) {
  const response = await fetch(`${MATRIX_HOMESERVER}/_matrix/client/v3/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "m.login.token",
      token: loginToken,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as any).error || "Token exchange failed");
  }

  const data = await response.json() as {
    user_id: string;
    access_token: string;
    device_id: string;
  };

  let displayName = data.user_id;
  try {
    const profileRes = await fetch(
      `${MATRIX_HOMESERVER}/_matrix/client/v3/profile/${encodeURIComponent(data.user_id)}/displayname`,
      { headers: { Authorization: `Bearer ${data.access_token}` } }
    );
    if (profileRes.ok) {
      const profile = await profileRes.json() as { displayname?: string };
      if (profile.displayname) {
        displayName = profile.displayname;
      }
    }
  } catch {
  }

  const isAdmin = isAdminUserId(data.user_id) || await isRoomMember(data.user_id, data.access_token);

  console.log(`[auth] Login: userId=${data.user_id} displayName=${displayName} isAdmin=${isAdmin} adminRoom=${ADMIN_MATRIX_ROOM}`);

  return {
    userId: data.user_id,
    accessToken: data.access_token,
    displayName,
    isAdmin,
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  // Re-verify admin status live against the env-var list (cheap, synchronous)
  const liveAdmin = isAdminUserId(req.session.userId) || req.session.isAdmin;
  if (!liveAdmin) {
    res.status(403).json({ message: "Admin access required" });
    return;
  }
  next();
}

export function requireConsultant(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  // Admins always pass — they can manage any consultant via ?slug=
  if (req.session.isAdmin || isAdminUserId(req.session.userId)) {
    next();
    return;
  }
  if (!req.session.consultantSlug) {
    res.status(403).json({ message: "Consultant access required" });
    return;
  }
  next();
}

import type { IStorage } from "./storage";

export function makeRequireVerifiedConsultant(storage: IStorage) {
  return async function requireVerifiedConsultant(req: Request, res: Response, next: NextFunction) {
    if (!req.session.userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    // Admins bypass — they are verified through env var
    if (req.session.isAdmin || isAdminUserId(req.session.userId)) {
      next();
      return;
    }
    const slug = req.session.consultantSlug;
    if (!slug) {
      res.status(403).json({ message: "Consultant access required" });
      return;
    }
    // Re-verify the consultant still exists in the DB on every request
    try {
      const consultant = await storage.getConsultantBySlug(slug);
      if (!consultant || !consultant.isActive) {
        req.session.destroy(() => {});
        res.status(403).json({ message: "Your consultant access has been revoked. Please sign in again." });
        return;
      }
    } catch {
      res.status(403).json({ message: "Could not verify consultant access. Please try again." });
      return;
    }
    next();
  };
}
