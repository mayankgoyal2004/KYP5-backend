import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { queryClient } from "./lib/queryClient";
import { TenantAuthProvider } from "./contexts/TenantAuthContext";
import { ProtectedRoute, GuestRoute } from "./components/auth/ProtectedRoute";
import { MainLayout } from "./components/layout/MainLayout";

import TenantDashboard from "./pages/TenantDashboard";
import StudentRoster from "./pages/StudentRoster";
import StudentCounseling from "./pages/StudentCounseling";
import StaffManagement from "./pages/StaffManagement";
import SubscriptionBilling from "./pages/SubscriptionBilling";
import TenantLogin from "./pages/TenantLogin";
import { Toaster } from "./components/ui/sonner";

function AppRouter() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <TenantLogin />
          </GuestRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout title="Dashboard Overview">
              <TenantDashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/students"
        element={
          <ProtectedRoute>
            <MainLayout title="Student Directory">
              <StudentRoster />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/counseling"
        element={
          <ProtectedRoute>
            <MainLayout title="Student Counseling">
              <StudentCounseling />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <ProtectedRoute>
            <MainLayout title="Staff & Counselors">
              <StaffManagement />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedRoute>
            <MainLayout title="Subscription & Billing">
              <SubscriptionBilling />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TenantAuthProvider>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
          <Toaster />
        </TenantAuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
