import { NextFunction, Request, RequestHandler, Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import prisma from "../prisma";

const SESSION_TYPES = ["POMODORO", "CUSTOM", "FOCUS"] as const;
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

type SessionType = (typeof SESSION_TYPES)[number];

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

function serializeSession(session: {
  id: string;
  subjectId: string | null;
  taskId: string | null;
  startedAt: Date;
  endedAt: Date | null;
  durationMinutes: number;
  sessionType: string;
  completed: boolean;
  createdAt: Date;
  subject?: { id: string; name: string; color: string | null } | null;
  task?: { id: string; title: string; status: string } | null;
}) {
  return {
    id: session.id,
    subjectId: session.subjectId,
    taskId: session.taskId,
    type: session.sessionType,
    duration: session.durationMinutes,
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt?.toISOString() ?? null,
    completed: session.completed,
    createdAt: session.createdAt,
    subject: session.subject ?? null,
    task: session.task ?? null,
  };
}

export const listStudySessions = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { subjectId, taskId, startDate, endDate } = req.query;

    const where: {
      userId: string;
      subjectId?: string;
      taskId?: string;
      startedAt?: { gte?: Date; lte?: Date };
    } = { userId };

    if (subjectId) {
      if (typeof subjectId !== "string") {
        res.status(400).json({ error: "Invalid subjectId filter" });
        return;
      }
      where.subjectId = subjectId;
    }
    if (taskId) {
      if (typeof taskId !== "string") {
        res.status(400).json({ error: "Invalid taskId filter" });
        return;
      }
      where.taskId = taskId;
    }

    if (startDate || endDate) {
      where.startedAt = {};
      if (startDate) {
        if (typeof startDate !== "string" || isNaN(new Date(startDate).getTime())) {
          res.status(400).json({ error: "Invalid startDate" });
          return;
        }
        where.startedAt.gte = new Date(startDate);
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
        where.startedAt.lte = end;
      }
    }

    const sessions = await prisma.studySession.findMany({
      where,
      include: includeRelations,
      orderBy: { startedAt: "desc" },
    });

    res.json({ sessions: sessions.map(serializeSession) });
  }
);

export const createStudySession = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { subjectId, taskId, type, duration, startedAt, endedAt } =
      req.body ?? {};

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

    if (type === undefined || type === null) {
      res.status(400).json({ error: "Session type is required" });
      return;
    }
    if (!SESSION_TYPES.includes(type as SessionType)) {
      res.status(400).json({ error: "Invalid session type" });
      return;
    }

    if (
      typeof duration !== "number" ||
      !isFinite(duration) ||
      duration <= 0
    ) {
      res.status(400).json({ error: "Duration must be a positive number" });
      return;
    }
    const durationMinutes = Math.round(duration);

    if (!startedAt || typeof startedAt !== "string") {
      res.status(400).json({ error: "Started at time is required" });
      return;
    }
    const start = new Date(startedAt);
    if (isNaN(start.getTime())) {
      res.status(400).json({ error: "Started at must be a valid date/time" });
      return;
    }

    if (endedAt === undefined || endedAt === null || typeof endedAt !== "string") {
      res.status(400).json({ error: "Ended at time is required" });
      return;
    }
    const end = new Date(endedAt);
    if (isNaN(end.getTime())) {
      res.status(400).json({ error: "Ended at must be a valid date/time" });
      return;
    }
    if (end <= start) {
      res.status(400).json({ error: "Ended at must be after started at" });
      return;
    }

    const session = await prisma.studySession.create({
      data: {
        userId,
        subjectId,
        taskId: taskId || null,
        sessionType: type as SessionType,
        durationMinutes,
        startedAt: start,
        endedAt: end,
        completed: true,
      },
      include: includeRelations,
    });

    res.status(201).json({ session: serializeSession(session) });
  }
);

export const deleteStudySession = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { id } = req.params;

    const existing = await prisma.studySession.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      res.status(404).json({ error: "Study session not found" });
      return;
    }

    await prisma.studySession.delete({ where: { id } });
    res.status(204).send();
  }
);