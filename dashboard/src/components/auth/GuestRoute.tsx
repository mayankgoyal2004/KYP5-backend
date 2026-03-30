import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

/**
 * Redirects to dashboard if already logged in.
 * Used for login page — logged-in users shouldn't see it.
 */
export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
}
