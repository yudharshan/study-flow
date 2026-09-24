import { Link } from "react-router-dom";
import {
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "../../lib/tasks";
import { backgroundColor } from "../../lib/colors";
import { formatTime, isSameLocalDay } from "../../lib/dates";
import SectionCard from "./SectionCard";

const priorityStyles: Record<TaskPriority, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-amber-100 text-amber-700",
  URGENT: "bg-red-100 text-red-700",
};

const statusLabels: Record<TaskStatus, { label: string; className: string }> = {
  TODO: { label: "To do", className: "text-gray-500" },
  IN_PROGRESS: { label: "In progress", className: "text-blue-600" },
  COMPLETED: { label: "Completed", className: "text-emerald-600" },
  OVERDUE: { label: "Overdue", className: "text-red-600" },
};

function formatPriority(priority: TaskPriority): string {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

function formatDeadline(dueDate: string | null): string {
  if (!dueDate) return "No deadline";
  const date = new Date(dueDate);
  if (isSameLocalDay(date, new Date())) {
    return `Today, ${formatTime(dueDate)}`;
  }
  return `${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}, ${formatTime(dueDate)}`;
}

export default function TodayTasks({ tasks }: { tasks: Task[] }) {
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
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500 py-6 text-center">
          No tasks due today.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function TaskRow({ task }: { task: Task }) {
  const status = statusLabels[task.status];
  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span
        className="h-2.5 w-2.5 rounded-full shrink-0"
        style={backgroundColor(task.subject?.color ?? null)}
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
        <p className="text-xs text-gray-500 truncate">
          {task.subject?.name ?? "No subject"}
        </p>
      </div>
      <span
        className={`hidden sm:inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${priorityStyles[task.priority]}`}
      >
        {formatPriority(task.priority)}
      </span>
      <div className="shrink-0 text-right">
        <span className={`text-xs font-medium ${status.className}`}>
          {status.label}
        </span>
        <p className="text-xs text-gray-400">{formatDeadline(task.dueDate)}</p>
      </div>
    </li>
  );
}