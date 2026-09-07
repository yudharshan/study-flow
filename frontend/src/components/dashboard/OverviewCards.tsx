import { overviewStats } from "../../data/mockDashboard";

export default function OverviewCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {overviewStats.map((stat) => (
        <div
          key={stat.id}
          className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm"
        >
          <p className="text-sm text-gray-500">{stat.label}</p>
          <p className="text-2xl font-bold mt-2 text-gray-900">{stat.value}</p>
          <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
        </div>
      ))}
    </div>
  );
}