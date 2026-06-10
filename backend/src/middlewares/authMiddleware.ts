import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend express Request interface to contain our custom auth property
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        email?: string;
        sessionClaims: {
          fullName: string;
          firstName: string;
          lastName: string;
        };
      };
    }
  }
}

export interface Auth {
  userId: string | null;
  email?: string;
  sessionClaims?: {
    fullName?: string;
    firstName?: string;
    lastName?: string;
  };
}

export function getAuth(req: Request): Auth {
  if (req.auth) {
    return {
      userId: req.auth.userId,
      email: req.auth.email,
      sessionClaims: req.auth.sessionClaims,
    };
  }
  return { userId: null };
}

export function supabaseAuthMiddleware() {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;

  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided, proceed as unauthenticated
      return next();
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return next();
    }

    if (!jwtSecret) {
      if (process.env.NODE_ENV === "production") {
        res.status(500).json({ error: "Internal Server Error: Secure authentication is not configured." });
        return;
      }
      // Local preview only — only accept the mock token from the frontend
      if (token !== "mock-token") {
        return next();
      }
      req.auth = {
        userId: "mock-user-123",
        email: process.env.ADMIN_EMAIL || "admin@example.com",
        sessionClaims: {
          fullName: "Guest Coder",
          firstName: "Guest",
          lastName: "Coder",
        },
      };
      return next();
    }

    try {
      const decoded = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] }) as jwt.JwtPayload;
      
      if (decoded && decoded.sub) {
        req.auth = {
          userId: decoded.sub,
          email: decoded.email || "",
          sessionClaims: {
            fullName: decoded.user_metadata?.full_name || decoded.user_metadata?.name || decoded.email?.split("@")[0] || "Anonymous User",
            firstName: decoded.user_metadata?.first_name || decoded.user_metadata?.name?.split(" ")[0] || "Anonymous",
            lastName: decoded.user_metadata?.last_name || "",
          },
        };
      }
    } catch (err) {
      // Token expired or invalid, request is marked as unauthenticated
      req.log?.warn({ err }, "Invalid authorization token");
    }

    next();
  };
}
