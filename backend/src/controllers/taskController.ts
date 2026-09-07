import { NextFunction, Request, RequestHandler, Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import prisma from "../prisma";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const STATUSES = ["TODO", "IN_PROGRESS", "COMPLETED", "OVERDUE"] as const;

type Priority = (typeof PRIORITIES)[number];
type Status = (typeof STATUSES)[number];

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

const subjectSelection = { id: true, name: true, color: true } as const;

function serializeTask(task: {
  id: string;
  title: string;
  description: string | null;
  subjectId: string | null;
  deadline: Date | null;
  priority: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  subject?: { id: string; name: string; color: string | null } | null;
}) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    subjectId: task.subjectId,
    dueDate: task.deadline?.toISOString() ?? null,
    priority: task.priority,
    status: task.status,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    subject: task.subject ?? null,
  };
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

export const listTasks = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { subjectId, status, priority } = req.query;

    const where: {
      userId: string;
      subjectId?: string;
      status?: Status;
      priority?: Priority;
    } = { userId };

    if (subjectId) {
      if (typeof subjectId !== "string") {
        res.status(400).json({ error: "Invalid subjectId filter" });
        return;
      }
      where.subjectId = subjectId;
    }
    if (status) {
      if (typeof status !== "string" || !STATUSES.includes(status as Status)) {
        res.status(400).json({ error: "Invalid status filter" });
        return;
      }
      where.status = status as Status;
    }
    if (priority) {
      if (
        typeof priority !== "string" ||
        !PRIORITIES.includes(priority as Priority)
      ) {
        res.status(400).json({ error: "Invalid priority filter" });
        return;
      }
      where.priority = priority as Priority;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: { subject: { select: subjectSelection } },
      orderBy: [{ status: "asc" }, { deadline: "asc" }, { createdAt: "desc" }],
    });

    res.json({ tasks: tasks.map(serializeTask) });
  }
);

export const createTask = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { title, description, subjectId, dueDate, priority, status } =
      req.body ?? {};

    if (typeof title !== "string" || title.trim().length < 1) {
      res.status(400).json({ error: "Task title is required" });
      return;
    }
    if (description !== undefined && description !== null && typeof description !== "string") {
      res.status(400).json({ error: "Description must be a string" });
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

    let deadline: Date | null = null;
    if (dueDate !== undefined && dueDate !== null) {
      const parsed = new Date(dueDate);
      if (isNaN(parsed.getTime())) {
        res.status(400).json({ error: "Due date must be a valid date" });
        return;
      }
      deadline = parsed;
    }

    let priorityValue: Priority = "MEDIUM";
    if (priority !== undefined && priority !== null) {
      if (!PRIORITIES.includes(priority as Priority)) {
        res.status(400).json({ error: "Invalid priority" });
        return;
      }
      priorityValue = priority as Priority;
    }

    let statusValue: Status = "TODO";
    if (status !== undefined && status !== null) {
      if (!STATUSES.includes(status as Status)) {
        res.status(400).json({ error: "Invalid status" });
        return;
      }
      statusValue = status as Status;
    }

    const task = await prisma.task.create({
      data: {
        userId,
        subjectId,
        title: title.trim(),
        description: description?.trim() || null,
        deadline,
        priority: priorityValue,
        status: statusValue,
      },
      include: { subject: { select: subjectSelection } },
    });

    res.status(201).json({ task: serializeTask(task) });
  }
);

export const updateTask = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { id } = req.params;
    const { title, description, subjectId, dueDate, priority, status } =
      req.body ?? {};

    const task = await prisma.task.findFirst({ where: { id, userId } });
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    if (title !== undefined && (typeof title !== "string" || title.trim().length < 1)) {
      res.status(400).json({ error: "Task title must be a non-empty string" });
      return;
    }
    if (description !== undefined && description !== null && typeof description !== "string") {
      res.status(400).json({ error: "Description must be a string" });
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

    let deadline: Date | null | undefined;
    if (dueDate !== undefined) {
      if (dueDate === null) {
        deadline = null;
      } else {
        const parsed = new Date(dueDate);
        if (isNaN(parsed.getTime())) {
          res.status(400).json({ error: "Due date must be a valid date" });
          return;
        }
        deadline = parsed;
      }
    }

    let priorityValue: Priority | undefined;
    if (priority !== undefined && priority !== null) {
      if (!PRIORITIES.includes(priority as Priority)) {
        res.status(400).json({ error: "Invalid priority" });
        return;
      }
      priorityValue = priority as Priority;
    }

    let statusValue: Status | undefined;
    if (status !== undefined && status !== null) {
      if (!STATUSES.includes(status as Status)) {
        res.status(400).json({ error: "Invalid status" });
        return;
      }
      statusValue = status as Status;
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(description !== undefined
          ? { description: description === null ? null : description.trim() }
          : {}),
        ...(subjectId !== undefined && subjectId !== null
          ? { subjectId }
          : {}),
        ...(deadline !== undefined ? { deadline } : {}),
        ...(priorityValue !== undefined ? { priority: priorityValue } : {}),
        ...(statusValue !== undefined ? { status: statusValue } : {}),
      },
      include: { subject: { select: subjectSelection } },
    });

    res.json({ task: serializeTask(updated) });
  }
);

export const deleteTask = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { id } = req.params;

    const task = await prisma.task.findFirst({ where: { id, userId } });
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    await prisma.task.delete({ where: { id } });
    res.status(204).send();
  }
);