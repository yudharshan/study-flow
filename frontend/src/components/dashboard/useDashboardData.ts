import { useCallback, useEffect, useState } from "react";
import { fetchProgress, type ProgressData } from "../../lib/progress";
import { fetchTasks, type Task } from "../../lib/tasks";
import { getReminders, type Reminder } from "../../lib/reminders";
import { addDays, formatMinutes, toLocalDateKey } from "../../lib/dates";
import {
  type DeadlineItem,
  type OverviewStat,
  type WeeklyActivityDay,
} from "./types";

export interface DashboardData {
  stats: OverviewStat[];
  weeklyActivity: WeeklyActivityDay[];
  todayTasks: Task[];
  upcomingDeadlines: DeadlineItem[];
  upcomingReminders: Reminder[];
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function daysFromNow(date: Date): number {
  const today = new Date();
  const startToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const startOfDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  return Math.round(
    (startOfDay.getTime() - startToday.getTime()) / 86400000
  );
}

function buildIncompleteDeadlines(
  tasks: Task[],
  horizonDays: number
): DeadlineItem[] {
  const now = new Date();
  const horizon = addDays(
    new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    horizonDays
  );

  return tasks
    .filter((task) => {
      if (!task.dueDate) return false;
      if (task.status === "COMPLETED" || task.status === "OVERDUE") return false;
      const due = new Date(task.dueDate);
      const startDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      return startDue >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) && startDue <= horizon;
    })
    .map((task) => {
      const due = new Date(task.dueDate as string);
      return {
        id: task.id,
        title: task.title,
        subject: task.subject?.name ?? "General",
        date: due.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        daysLeft: daysFromNow(due),
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft || a.date.localeCompare(b.date));
}

function buildData(
  progress: ProgressData,
  tasks: Task[],
  reminders: Reminder[]
): DashboardData {
  const now = new Date();
  const todayKey = toLocalDateKey(now);
  const todayMinutes =
    progress.weeklyActivity.find((day) => day.date === todayKey)?.minutes ?? 0;

  const upcomingDeadlines = buildIncompleteDeadlines(tasks, 7);
  const upcomingReminders = [
    ...reminders.map((reminder) => ({ reminder, at: new Date(reminder.reminderTime).getTime() })),
  ]
    .sort((a, b) => a.at - b.at)
    .slice(0, 3)
    .map(({ reminder }) => reminder);

  const stats: OverviewStat[] = [
    {
      id: "study-time",
      label: "Today's Study Time",
      value: formatMinutes(todayMinutes),
      sub: `${formatMinutes(progress.overview.studyMinutesThisWeek)} this week`,
    },
    {
      id: "tasks-completed",
      label: "Tasks Completed",
      value: String(progress.overview.completedTasks),
      sub: `of ${progress.overview.totalTasks} total tasks`,
    },
    {
      id: "upcoming-deadlines",
      label: "Upcoming Deadlines",
      value: String(upcomingDeadlines.length),
      sub: "within the next 7 days",
    },
    {
      id: "current-streak",
      label: "Current Streak",
      value: `${progress.overview.currentStudyStreak} day${progress.overview.currentStudyStreak === 1 ? "" : "s"}`,
      sub: "keep it going!",
    },
  ];

  const weeklyActivity: WeeklyActivityDay[] = progress.weeklyActivity.map(
    (day, i) => ({
      day: DAY_LABELS[i] ?? "",
      minutes: day.minutes,
    })
  );

  const todayTasks = tasks.filter((task) => {
    if (!task.dueDate) return false;
    return toLocalDateKey(new Date(task.dueDate)) === todayKey;
  });

  return {
    stats,
    weeklyActivity,
    todayTasks,
    upcomingDeadlines,
    upcomingReminders,
  };
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const [progress, tasksResult, remindersResult] = await Promise.all([
        fetchProgress(),
        fetchTasks(),
        getReminders({ upcoming: true }),
      ]);
      setData(
        buildData(progress, tasksResult.tasks, remindersResult.reminders)
      );
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Unable to load dashboard"
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, loadError, reload: load };
}