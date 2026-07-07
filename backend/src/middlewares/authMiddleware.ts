import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend the Express Request type so TypeScript knows about req.auth
// everywhere in the codebase without needing a cast.
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

// Convenience helper used in route handlers to read the auth object
// without having to null-check req.auth directly.
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

// Supabase JWT middleware.
// Verifies the Bearer token in the Authorization header using the
// Supabase JWT secret. On success, populates req.auth so downstream
// route handlers can check identity and permissions.
//
// The middleware never returns 401 on its own — it just leaves req.auth
// undefined if the token is missing or invalid. Routes that require
// authentication check req.auth themselves and send the 401.
export function supabaseAuthMiddleware() {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;

  return (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    // No Authorization header — treat as unauthenticated, keep going
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.slice(7).trim(); // strip "Bearer "
    if (!token) return next();

    // In production, missing the JWT secret is a misconfiguration.
    // Log loudly and skip auth — routes that need it will still reject the request.
    if (!jwtSecret) {
      if (process.env.NODE_ENV === "production") {
        req.log?.error("SUPABASE_JWT_SECRET not set in production — authentication disabled");
        return next();
      }

      // In development, accept a hard-coded "mock-token" for quick local testing.
      // This code path is never reachable in production (guarded above).
      if (token === "mock-token") {
        req.auth = {
          userId: "mock-user-123",
          email: process.env.ADMIN_EMAIL || "admin@example.com",
          sessionClaims: {
            fullName: "Guest Coder",
            firstName: "Guest",
            lastName: "Coder",
          },
        };
      }
      return next();
    }

    try {
      // Verify signature, expiry (exp), and algorithm.
      // clockTolerance: 30s handles minor clock skew between client and server.
      const decoded = jwt.verify(token, jwtSecret, {
        algorithms: ["HS256"],
        clockTolerance: 30,
      }) as jwt.JwtPayload;

      // sub is the Supabase user UUID — required in all valid tokens
      if (!decoded?.sub) {
        return next(); // malformed payload, treat as unauthenticated
      }

      // Reject tokens that are not yet valid (nbf = "not before" claim)
      const now = Math.floor(Date.now() / 1000);
      if (decoded.nbf && now < decoded.nbf) {
        req.log?.warn("Rejected token: not yet valid (nbf in the future)");
        return next();
      }

      req.auth = {
        userId: decoded.sub,
        email: decoded.email || "",
        sessionClaims: {
          fullName:
            decoded.user_metadata?.full_name ||
            decoded.user_metadata?.name ||
            decoded.email?.split("@")[0] ||
            "Anonymous",
          firstName:
            decoded.user_metadata?.first_name ||
            decoded.user_metadata?.name?.split(" ")[0] ||
            "Anonymous",
          lastName: decoded.user_metadata?.last_name || "",
        },
      };
    } catch (err) {
      // Token is expired, tampered, or uses the wrong algorithm.
      // Log it at warn level (not error — this is a normal occurrence when tokens expire).
      req.log?.warn({ err }, "Authorization token rejected");
    }

    next();
  };
}
