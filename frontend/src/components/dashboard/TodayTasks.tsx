import { Link } from "react-router-dom";
import {
  todayTasks,
  type TaskPriority,
  type TaskStatus,
  type DashboardTask,
} from "../../data/mockDashboard";
import SectionCard from "./SectionCard";

const priorityStyles: Record<TaskPriority, string> = {
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-blue-100 text-blue-700",
  High: "bg-amber-100 text-amber-700",
  Urgent: "bg-red-100 text-red-700",
};

const statusLabels: Record<TaskStatus, { label: string; className: string }> = {
  TODO: { label: "To do", className: "text-gray-500" },
  IN_PROGRESS: { label: "In progress", className: "text-blue-600" },
  COMPLETED: { label: "Completed", className: "text-emerald-600" },
};

export default function TodayTasks() {
  return (
    <SectionCard
      title="Today's Tasks"
      subtitle="Your plan for today"
      action={
        <Link
          to="/tasks"
          className="text-sm text-primary-600 hover:underline font-medium"
        >
          View all
        </Link>
      }
    >
      <ul className="divide-y divide-gray-100">
        {todayTasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </ul>
    </SectionCard>
  );
}

function TaskRow({ task }: { task: DashboardTask }) {
  const status = statusLabels[task.status];
  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span
        className={`h-2.5 w-2.5 rounded-full shrink-0 ${task.subjectColor}`}
      />
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium truncate ${
            task.status === "COMPLETED"
              ? "line-through text-gray-400"
              : "text-gray-900"
          }`}
        >
          {task.title}
        </p>
        <p className="text-xs text-gray-500 truncate">{task.subject}</p>
      </div>
      <span
        className={`hidden sm:inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${priorityStyles[task.priority]}`}
      >
        {task.priority}
      </span>
      <div className="shrink-0 text-right">
        <span className={`text-xs font-medium ${status.className}`}>
          {status.label}
        </span>
        <p className="text-xs text-gray-400">{task.deadline}</p>
      </div>
    </li>
  );
}