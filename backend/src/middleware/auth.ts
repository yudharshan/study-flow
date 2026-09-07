import { NextFunction, Request, Response } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";

export interface AuthedRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function authenticate(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.userId = payload.sub;
  req.userRole = payload.role;
  next();
}

export function getJwtPayload(req: AuthedRequest): JwtPayload | null {
  const { userId, userRole } = req;
  if (!userId || !userRole) return null;
  return { sub: userId, role: userRole };
}