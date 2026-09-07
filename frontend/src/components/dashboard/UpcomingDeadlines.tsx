import { Link } from "react-router-dom";
import {
  upcomingDeadlines,
  type DashboardDeadline,
} from "../../data/mockDashboard";
import SectionCard from "./SectionCard";

function DeadlineChip({ daysLeft }: { daysLeft: number }) {
  const label =
    daysLeft === 0
      ? "Due today"
      : daysLeft === 1
        ? "Due tomorrow"
        : `${daysLeft} days left`;
  const className =
    daysLeft === 0
      ? "bg-red-100 text-red-700"
      : daysLeft <= 3
        ? "bg-amber-100 text-amber-700"
        : "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex whitespace-nowrap items-center text-xs font-medium px-2 py-0.5 rounded-full ${className}`}
    >
      {label}
    </span>
  );
}

export default function UpcomingDeadlines() {
  return (
    <SectionCard
      title="Upcoming Deadlines"
      subtitle="What's coming next"
      action={
        <Link
          to="/planner"
          className="text-sm text-primary-600 hover:underline font-medium"
        >
          Planner
        </Link>
      }
    >
      <ul className="divide-y divide-gray-100">
        {upcomingDeadlines.map((deadline) => (
          <DeadlineRow key={deadline.id} deadline={deadline} />
        ))}
      </ul>
    </SectionCard>
  );
}

function DeadlineRow({ deadline }: { deadline: DashboardDeadline }) {
  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">
          {deadline.title}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {deadline.subject} &middot; {deadline.date}
        </p>
      </div>
      <DeadlineChip daysLeft={deadline.daysLeft} />
    </li>
  );
}