// auth.ts
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload as JwtStd } from "jsonwebtoken";

export interface AppJwtPayload extends JwtStd {
  userId: string;
  role: "USER" | "ADMIN";
}

// Extend Express Request to always have user once authenticated
export interface AuthRequest extends Request {
  user?: AppJwtPayload;
}

function getTokenFromRequest(req: Request): string | null {
  // 1) Cookie (requires cookie-parser)
  const cookieToken = (req as any).cookies?.token as string | undefined;
  if (cookieToken) return cookieToken;

  // 2) Authorization header: "Bearer <token>"
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    return auth.slice("Bearer ".length).trim();
  }
  return null;
}

export const isAuthenticated = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: token missing" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      // Fail fast with clear message in server logs; send generic to client
      console.error("JWT_SECRET is not configured");
      return res.status(500).json({ message: "Server config error" });
    }

    // Use the sync form to get proper typing and try/catch
    const decoded = jwt.verify(token, secret) as string | jwt.JwtPayload;

    // Validate shape
    if (!decoded || typeof decoded !== "object") {
      return res.status(401).json({ message: "Unauthorized: bad token" });
    }

    // Narrow to our payload
    const { userId, role } = decoded as AppJwtPayload;
    if (!userId || (role !== "USER" && role !== "ADMIN")) {
      return res.status(401).json({ message: "Unauthorized: invalid payload" });
    }

    req.user = decoded as AppJwtPayload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const authorizeRoles = (...roles: Array<"USER" | "ADMIN">) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "You are not allowed to access this resource" });
    }
    next();
  };
};
