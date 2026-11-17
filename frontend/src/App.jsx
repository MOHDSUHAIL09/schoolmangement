import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SchoolProvider } from './context/SchoolContext.jsx';
import { MainLayout } from './layouts/MainLayout.jsx';

// Pages
import { LandingPage } from './pages/LandingPage.jsx';
import { Login } from './pages/Login.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Students } from './pages/Students.jsx';
import { Parents } from './pages/Parents.jsx';
import { Teachers } from './pages/Teachers.jsx';
import { Attendance } from './pages/Attendance.jsx';
import { Fees } from './pages/Fees.jsx';
import { Homework } from './pages/Homework.jsx';
import { Exams } from './pages/Exams.jsx';
import { AIExamGenerator } from './pages/AIExamGenerator.jsx';
import { Transport } from './pages/Transport.jsx';
import { Payroll } from './pages/Payroll.jsx';
import { Chat } from './pages/Chat.jsx';
import { Notices } from './pages/Notices.jsx';
import { Communications } from './pages/Communications.jsx';
import { Reports } from './pages/Reports.jsx';
import { Settings } from './pages/Settings.jsx';
import { Profile } from './pages/Profile.jsx';
import { Loader } from './components/Loader.jsx';

// Protected Route Guard with RBAC checks
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader fullScreen message="Authenticating session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Root route handler:
// Not logged in → Public Landing Page
// Logged in → Protected Dashboard
const RootRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <Loader fullScreen message="Loading SchoolSphere..." />;
  }
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <LandingPage />;
};

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SchoolProvider>
          <Routes>
            {/* Public Marketing & Landing Routes */}
            <Route path="/" element={<RootRoute />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/about" element={<LandingPage />} />
            <Route path="/features" element={<LandingPage />} />
            <Route path="/modules" element={<LandingPage />} />
            <Route path="/why-us" element={<LandingPage />} />
            <Route path="/contact" element={<LandingPage />} />

            {/* Public Login Route (Auto-redirects to /dashboard if already authenticated) */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes under Main Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/students" element={<Students />} />
              <Route
                path="/parents"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'principal']}>
                    <Parents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teachers"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'principal']}>
                    <Teachers />
                  </ProtectedRoute>
                }
              />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/fees" element={<Fees />} />
              <Route path="/homework" element={<Homework />} />
              <Route path="/exams" element={<Exams />} />
              <Route
                path="/ai-exam-generator"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'principal', 'teacher']}>
                    <AIExamGenerator />
                  </ProtectedRoute>
                }
              />
              <Route path="/transport" element={<Transport />} />
              <Route
                path="/payroll"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'principal']}>
                    <Payroll />
                  </ProtectedRoute>
                }
              />
              <Route path="/chat" element={<Chat />} />
              <Route path="/notices" element={<Notices />} />
              <Route
                path="/communications"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'principal', 'teacher']}>
                    <Communications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'principal']}>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'principal']}>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Fallback to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SchoolProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
