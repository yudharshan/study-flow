import { apiRequest } from "./api";
import {
  monthBounds,
  toLocalDateKey,
  weekBounds,
  weekDays,
} from "./dates";

export interface ProgressOverview {
  totalStudyMinutes: number;
  studyMinutesThisWeek: number;
  studyMinutesThisMonth: number;
  totalStudySessions: number;
  sessionsThisWeek: number;
  completedTasks: number;
  totalTasks: number;
  taskCompletionRate: number;
  currentStudyStreak: number;
}

export interface WeeklyActivityDay {
  date: string;
  minutes: number;
}

export interface SubjectBreakdownItem {
  subjectId: string;
  subjectName: string;
  color: string | null;
  totalMinutes: number;
  sessionCount: number;
}

export interface RecentStudySession {
  id: string;
  subjectId: string | null;
  taskId: string | null;
  type: string;
  duration: number;
  startedAt: string;
  endedAt: string | null;
  completed: boolean;
  subject?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  task?: {
    id: string;
    title: string;
    status: string;
  } | null;
}

export interface TaskAnalytics {
  total: number;
  completed: number;
  incomplete: number;
  overdue: number;
  completionPercentage: number;
  byStatus: {
    TODO: number;
    IN_PROGRESS: number;
    COMPLETED: number;
    OVERDUE: number;
  };
}

export interface ProgressData {
  overview: ProgressOverview;
  weeklyActivity: WeeklyActivityDay[];
  subjectBreakdown: SubjectBreakdownItem[];
  recentSessions: RecentStudySession[];
  taskAnalytics: TaskAnalytics;
}

export function fetchProgress(now: Date = new Date()): Promise<ProgressData> {
  const week = weekBounds(now);
  const month = monthBounds(now);
  const weekDates = weekDays(now).map(toLocalDateKey).join(",");
  const params = new URLSearchParams({
    weekStart: week.startDate,
    weekDates,
    monthStart: month.startDate,
    monthEnd: month.endDate,
    today: toLocalDateKey(now),
    tzOffsetMinutes: String(new Date().getTimezoneOffset()),
  });
  return apiRequest<ProgressData>(`/progress?${params.toString()}`, {
    method: "GET",
  });
}