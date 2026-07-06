import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <p>Lädt…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
