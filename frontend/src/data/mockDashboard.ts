// Mock data for the dashboard. These values are placeholders until the
// corresponding backend feature APIs are implemented. Future work should
// replace these exports with real API responses of the same shapes.

export interface OverviewStat {
  id: string;
  label: string;
  value: string;
  sub: string;
}

export interface WeeklyActivityDay {
  day: string;
  minutes: number;
}

export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";

export interface DashboardTask {
  id: string;
  title: string;
  subject: string;
  subjectColor: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string;
}

export interface DashboardDeadline {
  id: string;
  title: string;
  subject: string;
  date: string;
  daysLeft: number;
}

const today = new Date();

function addDays(base: Date, days: number): Date {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date;
}

function formatShort(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export const overviewStats: OverviewStat[] = [
  { id: "study-time", label: "Today's Study Time", value: "2h 15m", sub: "+30m vs yesterday" },
  { id: "tasks-completed", label: "Tasks Completed", value: "4", sub: "of 6 tasked today" },
  { id: "upcoming-deadlines", label: "Upcoming Deadlines", value: "3", sub: "within the next 7 days" },
  { id: "current-streak", label: "Current Streak", value: "5 days", sub: "keep it going!" },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MOCK_MINUTES = [0, 95, 60, 120, 75, 150, 45];

export const weeklyActivity: WeeklyActivityDay[] = Array.from(
  { length: 7 },
  (_, i) => {
    const date = addDays(today, i - 6);
    return {
      day: DAY_NAMES[date.getDay()] ?? "",
      minutes: MOCK_MINUTES[date.getDay()] ?? 0,
    };
  }
);

export const todayTasks: DashboardTask[] = [
  {
    id: "t1",
    title: "Finish calculus problem set",
    subject: "Mathematics",
    subjectColor: "bg-blue-500",
    priority: "High",
    status: "IN_PROGRESS",
    deadline: "Today, 6:00 PM",
  },
  {
    id: "t2",
    title: "Read chapter 4: Cell Biology",
    subject: "Biology",
    subjectColor: "bg-emerald-500",
    priority: "Medium",
    status: "TODO",
    deadline: "Today, 9:00 PM",
  },
  {
    id: "t3",
    title: "Write essay introduction",
    subject: "English",
    subjectColor: "bg-amber-500",
    priority: "Medium",
    status: "TODO",
    deadline: "Tomorrow, 12:00 PM",
  },
  {
    id: "t4",
    title: "Review physics formula sheet",
    subject: "Physics",
    subjectColor: "bg-violet-500",
    priority: "Low",
    status: "COMPLETED",
    deadline: "Completed",
  },
];

export const upcomingDeadlines: DashboardDeadline[] = [
  {
    id: "d1",
    title: "Data Structures Midterm",
    subject: "Computer Science",
    date: formatShort(addDays(today, 2)),
    daysLeft: 2,
  },
  {
    id: "d2",
    title: "Lab Report: Chemical Kinetics",
    subject: "Chemistry",
    date: formatShort(addDays(today, 4)),
    daysLeft: 4,
  },
  {
    id: "d3",
    title: "Group Project Proposal",
    subject: "Business",
    date: formatShort(addDays(today, 6)),
    daysLeft: 6,
  },
];