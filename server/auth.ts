import type { Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import type { Express } from "express";

const MATRIX_HOMESERVER = "https://synapse.textrp.io";
const ADMIN_USERS = (process.env.ADMIN_MATRIX_USERS || "").split(",").map(u => u.trim()).filter(Boolean);

declare module "express-session" {
  interface SessionData {
    userId: string;
    accessToken: string;
    displayName: string;
    isAdmin: boolean;
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

  const isAdmin = ADMIN_USERS.includes(data.user_id);

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
  if (!req.session.isAdmin) {
    res.status(403).json({ message: "Admin access required" });
    return;
  }
  next();
}
