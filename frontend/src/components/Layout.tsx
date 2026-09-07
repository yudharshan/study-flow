import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon, { type IconName } from "./Icon";

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
}

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/subjects", label: "Subjects", icon: "subjects" },
  { to: "/tasks", label: "Tasks", icon: "tasks" },
  { to: "/planner", label: "Planner", icon: "planner" },
  { to: "/timer", label: "Study Timer", icon: "timer" },
  { to: "/progress", label: "Progress", icon: "progress" },
  { to: "/reminders", label: "Reminders", icon: "reminders" },
  { to: "/phone-usage", label: "Phone Usage", icon: "phone" },
  { to: "/sleep", label: "Sleep", icon: "sleep" },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    onNavigate?.();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold tracking-tight">Study Flow</h1>
        {user && (
          <p className="mt-1 text-xs text-gray-400 truncate">{user.email}</p>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-primary-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <Icon name={item.icon} className="h-5 w-5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <Icon name="logout" className="h-5 w-5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );
}

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem = navItems.find((item) =>
    location.pathname.startsWith(item.to)
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="hidden lg:flex w-64 bg-gray-900 text-white flex-col shrink-0">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 bg-gray-900 text-white flex flex-col h-full">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
              aria-label="Close menu"
            >
              <Icon name="close" className="h-6 w-6" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
              aria-label="Open menu"
            >
              <Icon name="menu" className="h-6 w-6" />
            </button>
            <span className="text-sm font-semibold text-gray-700">
              {activeItem?.label ?? "Study Flow"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-sm font-medium text-gray-900">
                {getGreeting()},
                {user?.name ? ` ${user.name}` : ""}
              </p>
              {user?.email && (
                <p className="text-xs text-gray-500">{user.email}</p>
              )}
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-white text-sm font-semibold shrink-0">
              {user?.name ? getInitials(user.name) : "?"}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}