import { Link } from "react-router-dom";
import Icon, { type IconName } from "../Icon";
import SectionCard from "./SectionCard";

interface QuickAction {
  to: string;
  icon: IconName;
  label: string;
  description: string;
}

const actions: QuickAction[] = [
  { to: "/tasks", icon: "plus", label: "Add Task", description: "Create a new task" },
  { to: "/timer", icon: "play", label: "Start Study Session", description: "Focus with the timer" },
  { to: "/planner", icon: "calendar", label: "Open Planner", description: "Plan your schedule" },
  { to: "/progress", icon: "chart", label: "View Progress", description: "Track your goals" },
];

export default function QuickActions() {
  return (
    <SectionCard title="Quick Actions" subtitle="Jump right in">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className="group flex items-start gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-primary-300 hover:bg-primary-50"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
              <Icon name={action.icon} className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-medium text-gray-900">
                {action.label}
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">
                {action.description}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}