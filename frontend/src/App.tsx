import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import SubscriptionGate from "./components/SubscriptionGate";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Subjects from "./pages/Subjects";
import Tasks from "./pages/Tasks";
import Planner from "./pages/Planner";
import Timer from "./pages/Timer";
import Progress from "./pages/Progress";
import Reminders from "./pages/Reminders";
import DemoPayment from "./pages/DemoPayment";
import PhoneUsage from "./pages/PhoneUsage";
import Sleep from "./pages/Sleep";
import Admin from "./pages/Admin";
import { initAnalytics, trackPageView } from "./lib/analytics";

export default function App() {
  const location = useLocation();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/demo-payment" element={<DemoPayment />} />
        <Route element={<SubscriptionGate />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/timer" element={<Timer />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/phone-usage" element={<PhoneUsage />} />
          <Route path="/sleep" element={<Sleep />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Route>
    </Routes>
  );
}