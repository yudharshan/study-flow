import { NextFunction, Request, RequestHandler, Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import prisma from "../prisma";
import { signToken } from "../utils/jwt";
import { hashPassword, verifyPassword } from "../utils/password";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

type UserWithoutPassword = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

type AsyncHandler = RequestHandler;

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): AsyncHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}

function safeUser(user: UserWithoutPassword) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const register = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { name, email, password } = req.body ?? {};

    if (typeof name !== "string" || name.trim().length < 2) {
      res.status(400).json({ error: "Name must be at least 2 characters" });
      return;
    }
    if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      res.status(400).json({ error: "A valid email is required" });
      return;
    }
    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
      res
        .status(400)
        .json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
      return;
    }

    const normalizedEmail = normalizeEmail(email);

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      },
    });

    const token = signToken({ sub: user.id, role: user.role });

    res.status(201).json({ token, user: safeUser(user) });
  }
);

export const login = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body ?? {};

    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = signToken({ sub: user.id, role: user.role });

    res.status(200).json({ token, user: safeUser(user) });
  }
);

export const me = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const authed = req as AuthedRequest;
    const user = await prisma.user.findUnique({
      where: { id: authed.userId },
    });

    if (!user) {
      res.status(401).json({ error: "User no longer exists" });
      return;
    }

    res.json({ user: safeUser(user) });
  }
);