import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useTenantAuth } from "../../contexts/TenantAuthContext";

export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useTenantAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export function GuestRoute({ children }) {
  const { isAuthenticated } = useTenantAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
