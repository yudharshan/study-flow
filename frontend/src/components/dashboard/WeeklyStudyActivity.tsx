import { useMemo } from "react";
import { weeklyActivity } from "../../data/mockDashboard";
import SectionCard from "./SectionCard";

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export default function WeeklyStudyActivity() {
  const totalMinutes = useMemo(
    () => weeklyActivity.reduce((sum, day) => sum + day.minutes, 0),
    []
  );
  const maxMinutes =
    weeklyActivity.reduce((max, day) => Math.max(max, day.minutes), 0) || 1;

  return (
    <SectionCard
      title="Weekly Study Activity"
      subtitle="Last 7 days"
      action={
        <span className="text-sm font-medium text-gray-700 bg-gray-100 rounded-lg px-3 py-1.5">
          Total: {formatDuration(totalMinutes)}
        </span>
      }
    >
      <div className="flex items-end gap-2 sm:gap-3 h-44">
        {weeklyActivity.map((day) => {
          const height = Math.max(
            (day.minutes / maxMinutes) * 100,
            day.minutes > 0 ? 12 : 0
          );
          return (
            <div
              key={day.day}
              className="flex-1 flex flex-col items-center justify-end h-full"
            >
              <span className="text-[10px] text-gray-500 mb-1">
                {day.minutes > 0 ? `${day.minutes}m` : ""}
              </span>
              <div
                className={`w-full max-w-8 rounded-t-md ${
                  day.minutes > 0
                    ? "bg-primary-600"
                    : "bg-gray-100 border border-dashed border-gray-300"
                }`}
                style={{ height: `${height}%` }}
              />
              <span className="text-xs text-gray-500 mt-2">{day.day}</span>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}