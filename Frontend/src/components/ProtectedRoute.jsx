import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingScreen from "./LoadingScreen.jsx";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
