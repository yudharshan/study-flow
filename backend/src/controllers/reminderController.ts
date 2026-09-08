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

const includeTask = {
  task: { select: { id: true, title: true, status: true } },
};

export const listReminders = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { upcoming, completed, pending } = req.query;

    const where: {
      userId: string;
      isCompleted?: boolean;
      reminderTime?: { gte?: Date };
    } = { userId };

    if (completed !== undefined) {
      where.isCompleted = true;
    } else if (pending !== undefined) {
      where.isCompleted = false;
    }
    if (upcoming !== undefined) {
      where.isCompleted = false;
      where.reminderTime = { gte: new Date() };
    }

    // Nearest upcoming reminder first; completed reminders sink to the end
    // by sorting on completion then time.
    const reminders = await prisma.reminder.findMany({
      where,
      include: includeTask,
      orderBy: [{ isCompleted: "asc" }, { reminderTime: "asc" }],
    });

    res.json({ reminders });
  }
);

export const createReminder = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { title, message, reminderTime, taskId, isCompleted } =
      req.body ?? {};

    if (typeof title !== "string" || title.trim().length < 1) {
      res.status(400).json({ error: "Title is required" });
      return;
    }
    if (message !== undefined && message !== null && typeof message !== "string") {
      res.status(400).json({ error: "Message must be a string" });
      return;
    }
    if (typeof reminderTime !== "string" || isNaN(new Date(reminderTime).getTime())) {
      res.status(400).json({ error: "Reminder time must be a valid date/time" });
      return;
    }
    if (taskId !== undefined && taskId !== null && taskId !== "") {
      if (typeof taskId !== "string" || !(await taskBelongsToUser(taskId, userId))) {
        res.status(400).json({ error: "Selected task does not exist" });
        return;
      }
    }
    if (isCompleted !== undefined && isCompleted !== null && typeof isCompleted !== "boolean") {
      res.status(400).json({ error: "isCompleted must be a boolean" });
      return;
    }

    const reminder = await prisma.reminder.create({
      data: {
        userId,
        taskId: taskId || null,
        title: title.trim(),
        message: message?.trim() || null,
        reminderTime: new Date(reminderTime),
        isCompleted: isCompleted ?? false,
      },
      include: includeTask,
    });

    res.status(201).json({ reminder });
  }
);

export const updateReminder = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { id } = req.params;
    const { title, message, reminderTime, taskId, isCompleted } =
      req.body ?? {};

    const existing = await prisma.reminder.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      res.status(404).json({ error: "Reminder not found" });
      return;
    }

    if (title !== undefined && (typeof title !== "string" || title.trim().length < 1)) {
      res.status(400).json({ error: "Title must be a non-empty string" });
      return;
    }
    if (message !== undefined && message !== null && typeof message !== "string") {
      res.status(400).json({ error: "Message must be a string" });
      return;
    }
    if (reminderTime !== undefined && reminderTime !== null) {
      if (typeof reminderTime !== "string" || isNaN(new Date(reminderTime).getTime())) {
        res.status(400).json({ error: "Reminder time must be a valid date/time" });
        return;
      }
    }
    if (taskId !== undefined && taskId !== null && taskId !== "") {
      if (typeof taskId !== "string" || !(await taskBelongsToUser(taskId, userId))) {
        res.status(400).json({ error: "Selected task does not exist" });
        return;
      }
    }
    if (isCompleted !== undefined && isCompleted !== null && typeof isCompleted !== "boolean") {
      res.status(400).json({ error: "isCompleted must be a boolean" });
      return;
    }

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title.trim();
    if (message !== undefined) data.message = message?.trim() || null;
    if (reminderTime !== undefined) data.reminderTime = new Date(reminderTime);
    if (taskId !== undefined) data.taskId = taskId || null;
    if (isCompleted !== undefined) data.isCompleted = isCompleted;

    const reminder = await prisma.reminder.update({
      where: { id },
      data,
      include: includeTask,
    });

    res.json({ reminder });
  }
);

export const deleteReminder = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { id } = req.params;

    const existing = await prisma.reminder.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      res.status(404).json({ error: "Reminder not found" });
      return;
    }

    await prisma.reminder.delete({ where: { id } });
    res.status(204).send();
  }
);