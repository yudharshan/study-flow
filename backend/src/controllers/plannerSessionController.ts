import { NextFunction, Request, RequestHandler, Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import prisma from "../prisma";

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

async function subjectBelongsToUser(
  subjectId: string,
  userId: string
): Promise<boolean> {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { userId: true },
  });
  return subject?.userId === userId;
}

async function taskBelongsToUser(
  taskId: string,
  userId: string
): Promise<boolean> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { userId: true },
  });
  return task?.userId === userId;
}

const includeRelations = {
  subject: { select: { id: true, name: true, color: true } },
  task: { select: { id: true, title: true, status: true } },
};

export const listPlannerSessions = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { startDate, endDate } = req.query;

    const where: { userId: string; startTime?: { gte?: Date; lte?: Date } } = {
      userId,
    };

    const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        if (typeof startDate !== "string" || isNaN(new Date(startDate).getTime())) {
          res.status(400).json({ error: "Invalid startDate" });
          return;
        }
        where.startTime.gte = new Date(startDate);
      }
      if (endDate) {
        if (typeof endDate !== "string" || isNaN(new Date(endDate).getTime())) {
          res.status(400).json({ error: "Invalid endDate" });
          return;
        }
        const end = new Date(endDate);
        if (DATE_ONLY_REGEX.test(endDate)) {
          end.setUTCHours(23, 59, 59, 999);
        }
        where.startTime.lte = end;
      }
    }

    const sessions = await prisma.plannerSession.findMany({
      where,
      include: includeRelations,
      orderBy: { startTime: "asc" },
    });

    res.json({ sessions });
  }
);

export const createPlannerSession = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { title, subjectId, taskId, startTime, endTime, notes } = req.body ?? {};

    if (typeof title !== "string" || title.trim().length < 1) {
      res.status(400).json({ error: "Title is required" });
      return;
    }
    if (typeof subjectId !== "string" || !subjectId.trim()) {
      res.status(400).json({ error: "Subject is required" });
      return;
    }
    if (!(await subjectBelongsToUser(subjectId, userId))) {
      res.status(400).json({ error: "Selected subject does not exist" });
      return;
    }
    if (taskId !== undefined && taskId !== null && taskId !== "") {
      if (typeof taskId !== "string" || !(await taskBelongsToUser(taskId, userId))) {
        res.status(400).json({ error: "Selected task does not exist" });
        return;
      }
    }

    if (!startTime || typeof startTime !== "string") {
      res.status(400).json({ error: "Start time is required" });
      return;
    }
    if (!endTime || typeof endTime !== "string") {
      res.status(400).json({ error: "End time is required" });
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime())) {
      res.status(400).json({ error: "Start time must be a valid date/time" });
      return;
    }
    if (isNaN(end.getTime())) {
      res.status(400).json({ error: "End time must be a valid date/time" });
      return;
    }
    if (end <= start) {
      res.status(400).json({ error: "End time must be after start time" });
      return;
    }

    if (notes !== undefined && notes !== null && typeof notes !== "string") {
      res.status(400).json({ error: "Notes must be a string" });
      return;
    }

    const session = await prisma.plannerSession.create({
      data: {
        userId,
        subjectId,
        taskId: taskId || null,
        title: title.trim(),
        startTime: start,
        endTime: end,
        notes: notes?.trim() || null,
      },
      include: includeRelations,
    });

    res.status(201).json({ session });
  }
);

export const updatePlannerSession = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { id } = req.params;
    const { title, subjectId, taskId, startTime, endTime, notes } = req.body ?? {};

    const existing = await prisma.plannerSession.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      res.status(404).json({ error: "Planner session not found" });
      return;
    }

    if (title !== undefined && (typeof title !== "string" || title.trim().length < 1)) {
      res.status(400).json({ error: "Title must be a non-empty string" });
      return;
    }
    if (
      subjectId !== undefined &&
      subjectId !== null &&
      (typeof subjectId !== "string" || !(await subjectBelongsToUser(subjectId, userId)))
    ) {
      res.status(400).json({ error: "Selected subject does not exist" });
      return;
    }
    if (taskId !== undefined && taskId !== null && taskId !== "") {
      if (typeof taskId !== "string" || !(await taskBelongsToUser(taskId, userId))) {
        res.status(400).json({ error: "Selected task does not exist" });
        return;
      }
    }
    if (notes !== undefined && notes !== null && typeof notes !== "string") {
      res.status(400).json({ error: "Notes must be a string" });
      return;
    }

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title.trim();
    if (subjectId !== undefined) data.subjectId = subjectId;
    if (taskId !== undefined) data.taskId = taskId || null;
    if (notes !== undefined) data.notes = notes?.trim() || null;

    let startVal = existing.startTime;
    let endVal = existing.endTime;

    if (startTime !== undefined) {
      const s = new Date(startTime);
      if (isNaN(s.getTime())) {
        res.status(400).json({ error: "Start time must be a valid date/time" });
        return;
      }
      data.startTime = s;
      startVal = s;
    }
    if (endTime !== undefined) {
      const e = new Date(endTime);
      if (isNaN(e.getTime())) {
        res.status(400).json({ error: "End time must be a valid date/time" });
        return;
      }
      data.endTime = e;
      endVal = e;
    }

    if (endVal <= startVal) {
      res.status(400).json({ error: "End time must be after start time" });
      return;
    }

    const session = await prisma.plannerSession.update({
      where: { id },
      data,
      include: includeRelations,
    });

    res.json({ session });
  }
);

export const deletePlannerSession = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { id } = req.params;

    const existing = await prisma.plannerSession.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      res.status(404).json({ error: "Planner session not found" });
      return;
    }

    await prisma.plannerSession.delete({ where: { id } });
    res.status(204).send();
  }
);
