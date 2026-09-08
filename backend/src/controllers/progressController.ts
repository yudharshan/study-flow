import { NextFunction, Request, RequestHandler, Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import prisma from "../prisma";

const DAY_MS = 86_400_000;

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

function parseIso(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Normalize a Date to 00:00:00.000 UTC of the same UTC calendar day.
function startOfUtcDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// Monday 00:00:00.000 UTC of the week containing `date`.
function startOfUtcWeek(date: Date): Date {
  const d = startOfUtcDay(date);
  const day = d.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  return d;
}

function startOfUtcMonth(date: Date): Date {
  const d = startOfUtcDay(date);
  d.setUTCDate(1);
  return d;
}

function endOfUtcMonth(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  const next = new Date(d);
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const last = new Date(next.getTime() - DAY_MS);
  last.setUTCHours(23, 59, 59, 999);
  return last;
}

// Map a UTC instant to the user's local calendar day.
// tzOffsetMinutes is the browser's getTimezoneOffset() (UTC - local in minutes).
function localDayKey(ms: number, tzOffsetMinutes: number): string {
  return utcDayKey(new Date(ms - tzOffsetMinutes * 60_000));
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
    subject: session.subject ?? null,
    task: session.task ?? null,
  };
}

export const getProgress = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { weekStart, weekDates, monthStart, monthEnd, today, tzOffsetMinutes } =
      req.query;

    const tzOffset = Number(tzOffsetMinutes ?? 0);

    // Resolve the current week. The frontend sends the local week's Monday
    // 00:00 instant so daily buckets line up with the user's local days.
    let weekStartDate = parseIso(weekStart);
    if (!weekStartDate) weekStartDate = startOfUtcWeek(new Date());
    const weekStartMs = weekStartDate.getTime();
    const weekEndMs = weekStartMs + 7 * DAY_MS;

    let weekDateKeys: string[];
    if (typeof weekDates === "string") {
      const parts = weekDates.split(",").map((p) => p.trim());
      if (parts.length === 7) {
        weekDateKeys = parts;
      } else {
        weekDateKeys = Array.from({ length: 7 }, (_, i) =>
          utcDayKey(new Date(weekStartMs + i * DAY_MS))
        );
      }
    } else {
      weekDateKeys = Array.from({ length: 7 }, (_, i) =>
        utcDayKey(new Date(weekStartMs + i * DAY_MS))
      );
    }

    // Resolve the current month (local boundaries from the frontend).
    let monthStartDate = parseIso(monthStart);
    let monthEndDate = parseIso(monthEnd);
    if (!monthStartDate || !monthEndDate) {
      const now = new Date();
      monthStartDate = startOfUtcMonth(now);
      monthEndDate = endOfUtcMonth(now);
    }

    // "Today" for streak purposes: prefer the browser's local date,
    // fall back to the server's UTC date.
    const todayKey: string =
      typeof today === "string" && /^\d{4}-\d{2}-\d{2}$/.test(today)
        ? today
        : localDayKey(Date.now(), tzOffset);

    const baseWhere = { userId, completed: true };

    const [totalAgg, weekAgg, monthAgg, totalSessions, weekSessionsCount] =
      await Promise.all([
        prisma.studySession.aggregate({
          where: baseWhere,
          _sum: { durationMinutes: true },
        }),
        prisma.studySession.aggregate({
          where: { ...baseWhere, startedAt: { gte: new Date(weekStartMs), lt: new Date(weekEndMs) } },
          _sum: { durationMinutes: true },
        }),
        prisma.studySession.aggregate({
          where: { ...baseWhere, startedAt: { gte: monthStartDate, lte: monthEndDate } },
          _sum: { durationMinutes: true },
        }),
        prisma.studySession.count({ where: baseWhere }),
        prisma.studySession.count({
          where: { ...baseWhere, startedAt: { gte: new Date(weekStartMs), lt: new Date(weekEndMs) } },
        }),
      ]);

    // Weekly activity: distribute each in-range session into its 24h bucket.
    const weekSessions = await prisma.studySession.findMany({
      where: { ...baseWhere, startedAt: { gte: new Date(weekStartMs), lt: new Date(weekEndMs) } },
      select: { startedAt: true, durationMinutes: true },
    });
    const dayMinutes = new Array<number>(7).fill(0);
    for (const session of weekSessions) {
      const idx = Math.floor((session.startedAt.getTime() - weekStartMs) / DAY_MS);
      if (idx >= 0 && idx < 7) {
        dayMinutes[idx] += session.durationMinutes;
      }
    }
    const weeklyActivity = weekDateKeys.map((date, i) => ({
      date,
      minutes: dayMinutes[i] ?? 0,
    }));

    // Subject breakdown.
    const [subjectRows, subjects] = await Promise.all([
      prisma.studySession.groupBy({
        by: ["subjectId"],
        where: { ...baseWhere, subjectId: { not: null } },
        _sum: { durationMinutes: true },
        _count: { _all: true },
      }),
      prisma.subject.findMany({
        where: { userId },
        select: { id: true, name: true, color: true },
      }),
    ]);
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));
    const subjectBreakdown = subjectRows
      .map((row) => {
        const subject = row.subjectId ? subjectMap.get(row.subjectId) : undefined;
        if (!subject) return null;
        return {
          subjectId: subject.id,
          subjectName: subject.name,
          color: subject.color,
          totalMinutes: row._sum.durationMinutes ?? 0,
          sessionCount: row._count._all,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.totalMinutes - a.totalMinutes);

    // Recent sessions.
    const recent = await prisma.studySession.findMany({
      where: baseWhere,
      include: includeRelations,
      orderBy: { startedAt: "desc" },
      take: 10,
    });

    // Task analytics using existing Task status values.
    const now = new Date();
    const [taskTotal, taskCompleted, statusRows] = await Promise.all([
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: "COMPLETED" } }),
      prisma.task.groupBy({
        by: ["status"],
        where: { userId },
        _count: { _all: true },
      }),
    ]);
    const statusCounts: Record<string, number> = { TODO: 0, IN_PROGRESS: 0, COMPLETED: 0, OVERDUE: 0 };
    for (const row of statusRows) {
      statusCounts[row.status] = row._count._all;
    }
    // A task is overdue when it is not completed and its deadline has passed.
    // This covers both the OVERDUE status and TODO/IN_PROGRESS tasks whose
    // deadline is in the past.
    const taskOverdue = await prisma.task.count({
      where: { userId, status: { not: "COMPLETED" }, deadline: { lt: now } },
    });
    const taskIncomplete = taskTotal - taskCompleted;
    const taskCompletionRate =
      taskTotal > 0 ? Math.round((taskCompleted / taskTotal) * 100) : 0;

    // Current study streak based on completed StudySession records.
    //
    // Behavior: a day counts toward the streak if the user completed at least
    // one study session that maps to that local day. We count consecutive days
    // ending today. If the user has not studied yet today, we still count the
    // streak ending yesterday (the streak is "at risk" but not broken until
    // today ends with no session). Otherwise the streak is 0.
    const sessionTimes = await prisma.studySession.findMany({
      where: baseWhere,
      select: { startedAt: true },
      orderBy: { startedAt: "desc" },
    });
    const studyDays = new Set<string>();
    for (const session of sessionTimes) {
      studyDays.add(localDayKey(session.startedAt.getTime(), tzOffset));
    }

    let currentStudyStreak = 0;
    const todayUtc = new Date(`${todayKey}T00:00:00.000Z`);
    const anchorDayKey = studyDays.has(todayKey) ? todayKey : utcDayKey(new Date(todayUtc.getTime() - DAY_MS));
    if (studyDays.has(anchorDayKey)) {
      let cursor = new Date(`${anchorDayKey}T00:00:00.000Z`);
      while (studyDays.has(utcDayKey(cursor))) {
        currentStudyStreak += 1;
        cursor = new Date(cursor.getTime() - DAY_MS);
      }
    }

    res.json({
      overview: {
        totalStudyMinutes: totalAgg._sum.durationMinutes ?? 0,
        studyMinutesThisWeek: weekAgg._sum.durationMinutes ?? 0,
        studyMinutesThisMonth: monthAgg._sum.durationMinutes ?? 0,
        totalStudySessions: totalSessions,
        sessionsThisWeek: weekSessionsCount,
        completedTasks: taskCompleted,
        totalTasks: taskTotal,
        taskCompletionRate,
        currentStudyStreak,
      },
      weeklyActivity,
      subjectBreakdown,
      recentSessions: recent.map(serializeSession),
      taskAnalytics: {
        total: taskTotal,
        completed: taskCompleted,
        incomplete: taskIncomplete,
        overdue: taskOverdue,
        completionPercentage: taskCompletionRate,
        byStatus: statusCounts,
      },
    });
  }
);