import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Subjects from "./pages/Subjects";
import Tasks from "./pages/Tasks";
import Planner from "./pages/Planner";
import Timer from "./pages/Timer";
import Progress from "./pages/Progress";
import Reminders from "./pages/Reminders";
import PhoneUsage from "./pages/PhoneUsage";
import Sleep from "./pages/Sleep";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
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
    </Routes>
  );
}
