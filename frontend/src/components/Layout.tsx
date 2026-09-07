import { Outlet, NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/subjects", label: "Subjects" },
  { to: "/tasks", label: "Tasks" },
  { to: "/planner", label: "Planner" },
  { to: "/timer", label: "Timer" },
  { to: "/progress", label: "Progress" },
  { to: "/reminders", label: "Reminders" },
  { to: "/phone-usage", label: "Phone Usage" },
  { to: "/sleep", label: "Sleep" },
  { to: "/admin", label: "Admin" },
];

export default function Layout() {
  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold tracking-tight">Study Flow</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-4 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-primary-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <NavLink
            to="/login"
            className="block px-4 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            Sign Out
          </NavLink>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 border-b border-gray-200 bg-white flex items-center px-8">
          <span className="text-sm text-gray-500">Study Flow</span>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
