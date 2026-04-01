import React from "react";
import { useAuth } from "@/hooks/useAuth";

interface PermissionGateProps {
  module: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showIfDenied?: boolean; // if true, it will render children but disabled if possible
}

/**
 * PermissionGate
 *
 * Wraps components to show/hide them based on user permissions.
 *
 * Usage:
 * <PermissionGate module="grievances" action="create">
 *   <Button>Add Grievance</Button>
 * </PermissionGate>
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  module,
  action,
  children,
  fallback = null,
  showIfDenied = false,
}) => {
  const { can, user } = useAuth();

  // System Admin bypass
  const hasPermission = user?.role?.name === "SYSTEM_ADMIN" || can(module, action);

  if (hasPermission) {
    return <>{children}</>;
  }

  if (showIfDenied) {
    // Attempt to clone children and add disabled prop if it's a button-like element
    return (
      <div className="opacity-50 cursor-not-allowed grayscale pointer-events-none">
        {children}
      </div>
    );
  }

  return <>{fallback}</>;
};

export default PermissionGate;
