import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SubscriptionGate() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.role === "ADMIN") {
    return <Outlet />;
  }

  const active =
    user.subscription === "ACTIVE" &&
    user.subscriptionExpiresAt !== null &&
    new Date(user.subscriptionExpiresAt) > new Date();

  if (!active) {
    return <Navigate to="/demo-payment" replace state={{ from: location }} />;
  }

  return <Outlet />;
}