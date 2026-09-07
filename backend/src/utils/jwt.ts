import jwt, { SignOptions } from "jsonwebtoken";

const JWT_EXPIRES_IN = "7d";

export interface JwtPayload {
  sub: string;
  role: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret(), {
    expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret());
    if (typeof decoded === "string") return null;
    return decoded as JwtPayload;
  } catch {
    return null;
  }
}