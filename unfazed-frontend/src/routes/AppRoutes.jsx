import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Auth Pages
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

// Client Pages & Branded Link
import BookingPage from "../pages/client/BookingPage";
import ClientPortal from "../pages/client/ClientPortal";

// Therapist Dashboard Pages
import Dashboard from "../pages/therapist/Dashboard";
import Schedule from "../pages/therapist/Schedule";
import Clients from "../pages/therapist/Clients";
import Notes from "../pages/therapist/Notes";
import Analytics from "../pages/therapist/Analytics";

// Protected Route Guard Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Branded Profile Link Route (e.g. /dr-sharma) */}
      <Route path="/:slug" element={<BookingPage />} />

      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Client Portal Route */}
      <Route path="/client/portal" element={<ClientPortal />} />

      {/* Protected Therapist Practice Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/schedule"
        element={
          <ProtectedRoute>
            <Schedule />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/clients"
        element={
          <ProtectedRoute>
            <Clients />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/notes"
        element={
          <ProtectedRoute>
            <Notes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />

      {/* Default Fallback Redirect to dr-sharma profile */}
      <Route path="/" element={<Navigate to="/dr-sharma" replace />} />
      <Route path="*" element={<Navigate to="/dr-sharma" replace />} />
    </Routes>
  );
};

export default AppRoutes;
