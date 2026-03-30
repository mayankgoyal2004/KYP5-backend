import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  module?: string;
  action?: string;
  roles?: string[];
}

export function ProtectedRoute({
  children,
  module,
  action,
  roles,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, can } = useAuth();

  // Show loading spinner during init
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated → go to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Force password change
  if (user.forcePasswordChange) {
    return <Navigate to="/change-password" replace />;
  }

  // Role check
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-destructive">403</h1>
          <p className="text-muted-foreground">
            You don't have access to this page.
          </p>
        </div>
      </div>
    );
  }

  // Permission check
  if (module && action && !can(module, action)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-destructive">403</h1>
          <p className="text-muted-foreground">
            You don't have <strong>{action}</strong> permission on{" "}
            <strong>{module}</strong>.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
