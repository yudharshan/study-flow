import { NextFunction, Request, RequestHandler, Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import prisma from "../prisma";

const COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

type AsyncHandler = RequestHandler;

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): AsyncHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}

function getUserId(req: Request): string {
  const userId = (req as AuthedRequest).userId;
  if (!userId) {
    throw new Error("Authentication required");
  }
  return userId;
}

export const listSubjects = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const subjects = await prisma.subject.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { tasks: true } } },
    });
    res.json({ subjects });
  }
);

export const createSubject = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { name, description, color } = req.body ?? {};

    if (typeof name !== "string" || name.trim().length < 1) {
      res.status(400).json({ error: "Subject name is required" });
      return;
    }
    if (description !== undefined && description !== null && typeof description !== "string") {
      res.status(400).json({ error: "Description must be a string" });
      return;
    }
    if (color !== undefined && color !== null && !COLOR_REGEX.test(color)) {
      res.status(400).json({ error: "Color must be a valid hex color" });
      return;
    }

    const subject = await prisma.subject.create({
      data: {
        userId,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || null,
      },
      include: { _count: { select: { tasks: true } } },
    });

    res.status(201).json({ subject });
  }
);

export const updateSubject = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { id } = req.params;
    const { name, description, color } = req.body ?? {};

    const existing = await prisma.subject.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }

    if (
      name !== undefined &&
      (typeof name !== "string" || name.trim().length < 1)
    ) {
      res.status(400).json({ error: "Subject name must be a non-empty string" });
      return;
    }
    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      res.status(400).json({ error: "Description must be a string" });
      return;
    }
    if (color !== undefined && color !== null && !COLOR_REGEX.test(color)) {
      res.status(400).json({ error: "Color must be a valid hex color" });
      return;
    }

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined
          ? { description: description === null ? null : description.trim() }
          : {}),
        ...(color !== undefined ? { color: color || null } : {}),
      },
      include: { _count: { select: { tasks: true } } },
    });

    res.json({ subject });
  }
);

export const deleteSubject = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { id } = req.params;

    const existing = await prisma.subject.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }

    await prisma.subject.delete({ where: { id } });
    res.status(204).send();
  }
);