import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchProgress,
  type ProgressData,
  type SubjectBreakdownItem,
} from "../lib/progress";
import { formatMinutes } from "../lib/dates";
import { backgroundColor, textOnColor } from "../lib/colors";
import Icon from "../components/Icon";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Progress() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const result = await fetchProgress();
      setData(result);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Unable to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
        <p className="text-gray-500 mt-1">
          Your study activity and task completion at a glance.
        </p>
      </div>

      {loading ? (
        <p className="text-gray-500 py-8 text-center">Loading analytics...</p>
      ) : loadError ? (
        <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-red-700">
          <p className="font-medium mb-3">{loadError}</p>
          <button
            onClick={load}
            className="rounded-lg bg-red-100 text-red-700 text-sm font-medium px-4 py-2 hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : data ? (
        <ProgressContent data={data} />
      ) : null}
    </div>
  );
}

function ProgressContent({ data }: { data: ProgressData }) {
  const overview = data.overview;
  const weekTotal = useMemo(
    () => data.weeklyActivity.reduce((sum, day) => sum + day.minutes, 0),
    [data.weeklyActivity]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        <OverviewCard label="Total Study Time" value={formatMinutes(overview.totalStudyMinutes)} />
        <OverviewCard label="This Week" value={formatMinutes(overview.studyMinutesThisWeek)} />
        <OverviewCard label="Study Sessions" value={String(overview.totalStudySessions)} />
        <OverviewCard label="Tasks Completed" value={String(overview.completedTasks)} />
        <OverviewCard label="Current Streak" value={`${overview.currentStudyStreak} day${overview.currentStudyStreak === 1 ? "" : "s"}`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Card
            title="Weekly Study Activity"
            subtitle="Monday to Sunday"
            action={
              <span className="text-sm font-medium text-gray-700 bg-gray-100 rounded-lg px-3 py-1.5">
                Total: {formatMinutes(weekTotal)}
              </span>
            }
          >
            {data.weeklyActivity.every((d) => d.minutes === 0) ? (
              <EmptyChart text="No study sessions recorded this week yet." />
            ) : (
              <WeeklyBarChart days={data.weeklyActivity} />
            )}
          </Card>
        </div>

        <Card title="Subject Breakdown" subtitle="By study time">
          {data.subjectBreakdown.length === 0 ? (
            <EmptyChart text="Complete a session to see subject breakdown." />
          ) : (
            <SubjectBars items={data.subjectBreakdown} />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card title="Task Completion" subtitle={`${data.taskAnalytics.total} total task${data.taskAnalytics.total === 1 ? "" : "s"}`}>
          <TaskProgress task={data.taskAnalytics} />
        </Card>

        <div className="xl:col-span-2">
          <Card title="Recent Study Sessions" subtitle="Latest completed sessions">
            {data.recentSessions.length === 0 ? (
              <EmptyChart text="No completed study sessions yet." />
            ) : (
              <div className="divide-y divide-gray-100 -mx-6 -my-4">
                {data.recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="px-6 py-3.5 flex flex-col gap-2 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full"
                          style={backgroundColor(session.subject?.color ?? null)}
                        >
                          <span className={textOnColor(session.subject?.color ?? null)}>
                            {session.subject?.name ?? "No subject"}
                          </span>
                        </span>
                        <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                          {session.type.toLowerCase()}
                        </span>
                        {session.task && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">
                            <Icon name="tasks" className="h-3 w-3" />
                            {session.task.title}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1.5">
                        <span className="font-medium text-gray-700">
                          {formatMinutes(session.duration)}
                        </span>
                        {" · "}
                        {formatSessionDate(session.startedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function OverviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900 tabular-nums">
        {value}
      </p>
    </div>
  );
}

function Card({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-gray-100">
        <div>
          <h2 className="font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="px-6 py-4">{children}</div>
    </section>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-3">
        <Icon name="chart" className="h-5 w-5" />
      </div>
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}

function WeeklyBarChart({
  days,
}: {
  days: { date: string; minutes: number }[];
}) {
  const max = Math.max(...days.map((d) => d.minutes), 1);
  return (
    <div>
      <div className="flex items-end gap-2 sm:gap-3 h-44">
        {days.map((day, i) => {
          const height = Math.max((day.minutes / max) * 100, day.minutes > 0 ? 12 : 0);
          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center justify-end h-full"
            >
              <span className="text-[10px] text-gray-500 mb-1">
                {day.minutes > 0 ? formatMinutes(day.minutes) : ""}
              </span>
              <div
                className={`w-full max-w-8 rounded-t-md ${
                  day.minutes > 0
                    ? "bg-primary-600"
                    : "bg-gray-100 border border-dashed border-gray-300"
                }`}
                style={{ height: `${height}%` }}
              />
              <span className="text-xs text-gray-500 mt-2">
                {DAY_LABELS[i] ?? ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SubjectBars({ items }: { items: SubjectBreakdownItem[] }) {
  const max = Math.max(...items.map((i) => i.totalMinutes), 1);
  return (
    <div className="space-y-4">
      {items.map((item) => {
        const width = Math.max((item.totalMinutes / max) * 100, item.totalMinutes > 0 ? 6 : 0);
        return (
          <div key={item.subjectId}>
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 truncate">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={backgroundColor(item.color)}
                />
                {item.subjectName}
              </span>
              <span className="text-xs text-gray-500 shrink-0">
                {formatMinutes(item.totalMinutes)} · {item.sessionCount} session{item.sessionCount === 1 ? "" : "s"}
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${width}%`,
                  backgroundColor: item.color ?? "#2563eb",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const STATUS_CHIPS: { key: keyof { TODO: number; IN_PROGRESS: number; COMPLETED: number; OVERDUE: number }; label: string; className: string }[] = [
  { key: "COMPLETED", label: "Completed", className: "bg-emerald-100 text-emerald-700" },
  { key: "IN_PROGRESS", label: "In Progress", className: "bg-blue-100 text-blue-700" },
  { key: "TODO", label: "To Do", className: "bg-gray-100 text-gray-600" },
  { key: "OVERDUE", label: "Overdue", className: "bg-red-100 text-red-700" },
];

function TaskProgress({
  task,
}: {
  task: {
    completionPercentage: number;
    byStatus: { TODO: number; IN_PROGRESS: number; COMPLETED: number; OVERDUE: number };
  };
}) {
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <p className="text-4xl font-bold text-gray-900 tabular-nums">
          {task.completionPercentage}%
        </p>
        <p className="text-sm text-gray-500 mb-1">completion rate</p>
      </div>
      <div className="mt-3 h-3 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary-600 transition-all"
          style={{ width: `${Math.min(100, Math.max(0, task.completionPercentage))}%` }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 mt-5">
        {STATUS_CHIPS.map((chip) => (
          <div
            key={chip.key}
            className="rounded-lg border border-gray-100 p-3 flex items-center justify-between gap-2"
          >
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${chip.className}`}>
              {chip.label}
            </span>
            <span className="text-lg font-semibold text-gray-900 tabular-nums">
              {task.byStatus[chip.key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatSessionDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}