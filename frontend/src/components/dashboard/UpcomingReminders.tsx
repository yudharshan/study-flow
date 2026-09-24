import { Link } from "react-router-dom";
import type { Reminder } from "../../lib/reminders";
import { addDays, formatTime, isSameLocalDay } from "../../lib/dates";
import SectionCard from "./SectionCard";

function formatReminderTime(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  if (isSameLocalDay(date, today)) {
    return `Today, ${formatTime(iso)}`;
  }
  if (isSameLocalDay(date, addDays(today, 1))) {
    return `Tomorrow, ${formatTime(iso)}`;
  }
  return `${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}, ${formatTime(iso)}`;
}

export default function UpcomingReminders({
  reminders,
}: {
  reminders: Reminder[];
}) {
  return (
    <SectionCard
      title="Upcoming Reminders"
      subtitle="What to keep in mind"
      action={
        <Link
          to="/reminders"
          className="text-sm text-primary-600 hover:underline font-medium"
        >
          Reminders
        </Link>
      }
    >
      {reminders.length === 0 ? (
        <p className="text-sm text-gray-500 py-6 text-center">
          No upcoming reminders.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {reminders.map((reminder) => (
            <li
              key={reminder.id}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {reminder.title}
                </p>
                {reminder.message && (
                  <p className="text-xs text-gray-500 truncate">
                    {reminder.message}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs text-gray-400">
                {formatReminderTime(reminder.reminderTime)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}