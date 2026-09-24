import OverviewCards from "../components/dashboard/OverviewCards";
import WeeklyStudyActivity from "../components/dashboard/WeeklyStudyActivity";
import TodayTasks from "../components/dashboard/TodayTasks";
import UpcomingDeadlines from "../components/dashboard/UpcomingDeadlines";
import UpcomingReminders from "../components/dashboard/UpcomingReminders";
import QuickActions from "../components/dashboard/QuickActions";
import { useDashboardData } from "../components/dashboard/useDashboardData";

function formatToday(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function Dashboard() {
  const { data, loading, loadError, reload } = useDashboardData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Your study overview at a glance.</p>
        </div>
        <p className="text-sm text-gray-500">{formatToday()}</p>
      </div>

      {loading ? (
        <p className="text-gray-500 py-8 text-center">Loading dashboard...</p>
      ) : loadError ? (
        <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-red-700">
          <p className="font-medium mb-3">{loadError}</p>
          <button
            onClick={reload}
            className="rounded-lg bg-red-100 text-red-700 text-sm font-medium px-4 py-2 hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : data ? (
        <>
          <OverviewCards stats={data.stats} />

          <WeeklyStudyActivity days={data.weeklyActivity} />

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            <div className="xl:col-span-3">
              <TodayTasks tasks={data.todayTasks} />
            </div>
            <div className="xl:col-span-2 space-y-6">
              <UpcomingDeadlines deadlines={data.upcomingDeadlines} />
              <UpcomingReminders reminders={data.upcomingReminders} />
              <QuickActions />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}