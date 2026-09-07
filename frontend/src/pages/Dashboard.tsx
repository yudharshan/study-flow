import OverviewCards from "../components/dashboard/OverviewCards";
import WeeklyStudyActivity from "../components/dashboard/WeeklyStudyActivity";
import TodayTasks from "../components/dashboard/TodayTasks";
import UpcomingDeadlines from "../components/dashboard/UpcomingDeadlines";
import QuickActions from "../components/dashboard/QuickActions";

function formatToday(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Your study overview at a glance.</p>
        </div>
        <p className="text-sm text-gray-500">{formatToday()}</p>
      </div>

      <OverviewCards />

      <WeeklyStudyActivity />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3">
          <TodayTasks />
        </div>
        <div className="xl:col-span-2 space-y-6">
          <UpcomingDeadlines />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}