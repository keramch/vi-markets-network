import { Request, Response, NextFunction } from "express";
import { db, auth } from "../firebase";

// ── Request identity ──────────────────────────────────────────────────────────
// The Admin SDK bypasses Firestore/Storage security rules, so every backend
// route must check who is calling itself. These helpers do that.
//
// attachUser runs on every request: if a valid Firebase ID token is sent as
// "Authorization: Bearer <token>", req.user is set. It never rejects a request
// on its own — use requireAuth / requireAdmin on routes that need a caller.

export interface RequestUser {
  uid: string;
  email?: string;
  emailVerified: boolean;
  signInProvider?: string;
  name?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

export async function attachUser(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const decoded = await auth.verifyIdToken(authHeader.split("Bearer ")[1]);
      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        emailVerified: decoded.email_verified === true,
        signInProvider: decoded.firebase?.sign_in_provider,
        name: decoded.name,
      };
    } catch {
      // Invalid or expired token → treat as signed out
    }
  }
  next();
}

// Checks the isAdmin flag on the caller's users doc (one Firestore read)
export async function isAdminUser(uid: string): Promise<boolean> {
  try {
    const doc = await db.collection("users").doc(uid).get();
    return doc.exists && doc.data()?.isAdmin === true;
  } catch {
    return false;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Please log in and try again." });
  }
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !(await isAdminUser(req.user.uid))) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}
