import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { GuestRoute } from "./components/auth/GuestRoute";

import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard/Dashboard";

import Login from "@/pages/Login";
import ChangePassword from "@/pages/ChangePassword";
import UserManagement from "../src/pages/admin/User";
import Permissions from "../src/pages/admin/Permissions";
import UserPermissions from "./pages/admin/UserPermissions";
import StudentsPage from "./pages/students/Students";

import SettingsPage from "./pages/settings/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import BlogCategoriesPage from "./pages/blogs/blog-category";
import BlogsPage from "./pages/blogs/blog";
import BlogFormPage from "./pages/blogs/blog-form";
import BlogDetailPage from "./pages/blogs/blog-details";
import CoursesPage from "./pages/courses/Courses";
import CourseCategoriesPage from "./pages/course-category/CourseCategories";
import TestsPage from "./pages/test/Tests";
import TestFormPage from "./pages/test/TestForm";
import TestDetailPage from "./pages/test/TestDetail";
import QuestionsPage from "./pages/questions/Questions";
import QuestionFormPage from "./pages/questions/QuestionForm";
import ResultsPage from "./pages/admin/Results";
import ResultDetailPage from "./pages/admin/ResultDetail";
import TestimonialsPage from "./pages/testimonials/Testimonials";
import PartnersPage from "./pages/partners/PartnersPage";
import CountersPage from "./pages/counters/Counters";
import TeamsPage from "./pages/teams/TeamsPage";
import TeamFormPage from "./pages/teams/TeamFormPage";
import ContactsPage from "./pages/contacts/Contacts";
import GalleryPage from "./pages/gallery/GalleryPage";
import RecycleBinPage from "./pages/recycle-bin/RecycleBin";
import NewsletterPage from "./pages/newsletter/NewsletterPage";
import EventsPage from "./pages/events/EventsPage";

function AppRouter() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* User and Role Management */}
      <Route
        path="/users"
        element={
          <ProtectedRoute module="users" action="read">
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/permissions"
        element={
          <ProtectedRoute module="users" action="read">
            <Permissions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/:id/permissions"
        element={
          <ProtectedRoute module="users" action="update">
            <UserPermissions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/students"
        element={
          <ProtectedRoute module="students" action="read">
            <StudentsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/blog-categories"
        element={
          <ProtectedRoute module="blog_categories" action="read">
            <BlogCategoriesPage />
          </ProtectedRoute>
        }
      />

      {/* Blogs */}
      <Route
        path="/blogs"
        element={
          <ProtectedRoute module="blogs" action="read">
            <BlogsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/blogs/new"
        element={
          <ProtectedRoute module="blogs" action="create">
            <BlogFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/blogs/:id"
        element={
          <ProtectedRoute module="blogs" action="read">
            <BlogDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/blogs/:id/edit"
        element={
          <ProtectedRoute module="blogs" action="update">
            <BlogFormPage />
          </ProtectedRoute>
        }
      />

      {/* Testimonials */}
      <Route
        path="/testimonials"
        element={
          <ProtectedRoute module="testimonials" action="read">
            <TestimonialsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/partners"
        element={
          <ProtectedRoute module="partners" action="read">
            <PartnersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/counters"
        element={
          <ProtectedRoute module="counters" action="read">
            <CountersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/team"
        element={
          <ProtectedRoute module="teams" action="read">
            <TeamsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/team/new"
        element={
          <ProtectedRoute module="teams" action="create">
            <TeamFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/team/:id/edit"
        element={
          <ProtectedRoute module="teams" action="update">
            <TeamFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contacts"
        element={
          <ProtectedRoute module="contacts" action="read">
            <ContactsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/newsletter"
        element={
          <ProtectedRoute module="newsletter" action="read">
            <NewsletterPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gallery"
        element={
          <ProtectedRoute module="gallery" action="read">
            <GalleryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events"
        element={
          <ProtectedRoute module="events" action="read">
            <EventsPage />
          </ProtectedRoute>
        }
      />
      {/* Courses */}
      <Route
        path="/courses"
        element={
          <ProtectedRoute module="courses" action="read">
            <CoursesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/course-categories"
        element={
          <ProtectedRoute module="courses" action="read">
            <CourseCategoriesPage />
          </ProtectedRoute>
        }
      />
      {/* Tests */}
      <Route
        path="/tests"
        element={
          <ProtectedRoute module="tests" action="read">
            <TestsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tests/new"
        element={
          <ProtectedRoute module="tests" action="create">
            <TestFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tests/:id/edit"
        element={
          <ProtectedRoute module="tests" action="update">
            <TestFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tests/:id"
        element={
          <ProtectedRoute module="tests" action="read">
            <TestDetailPage />
          </ProtectedRoute>
        }
      />
      {/* Questions */}
      <Route
        path="/questions"
        element={
          <ProtectedRoute module="questions" action="read">
            <QuestionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/questions/new"
        element={
          <ProtectedRoute module="questions" action="create">
            <QuestionFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/questions/:id/edit"
        element={
          <ProtectedRoute module="questions" action="update">
            <QuestionFormPage />
          </ProtectedRoute>
        }
      />
      {/* Test Results */}
      <Route
        path="/results"
        element={
          <ProtectedRoute module="tests" action="read">
            <ResultsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/results/:id"
        element={
          <ProtectedRoute module="tests" action="read">
            <ResultDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Recycle Bin */}
      <Route
        path="/recycle-bin"
        element={
          <ProtectedRoute module="recycle_bin" action="read">
            <RecycleBinPage />
          </ProtectedRoute>
        }
      />

      {/* App Settings and Profile */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute module="settings" action="read">
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route path="/change-password" element={<ChangePassword />} />

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <SettingsProvider>
              <LanguageProvider>
                <TooltipProvider>
                  <Toaster />
                  <AppRouter />
                </TooltipProvider>
              </LanguageProvider>
            </SettingsProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
