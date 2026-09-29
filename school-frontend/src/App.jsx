import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Auth Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { StudentsPage } from './pages/admin/StudentsPage';
import { ParentsPage } from './pages/admin/ParentsPage';
import { MarksPage } from './pages/admin/MarksPage';
import { AttendancePage } from './pages/admin/AttendancePage';
import { FeesPage } from './pages/admin/FeesPage';
import { HomeworkPage } from './pages/admin/HomeworkPage';
import { HolidayPage } from './pages/admin/HolidayPage';
import { LeaveRequestsPage } from './pages/admin/LeaveRequestsPage';
import { LeaveReasonsPage } from './pages/admin/LeaveReasonsPage';
import { ImportExportPage } from './pages/admin/ImportExportPage';
import { NotificationsPage } from './pages/admin/NotificationsPage';

// Teacher & Parent Pages
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { ParentDashboard } from './pages/parent/ParentDashboard';

import { ErrorBoundary } from './components/common/ErrorBoundary';

// Index Landing Resolver
const HomeRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: '#fff', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Loading EduCore Portal...</span>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const role = user?.role?.toUpperCase();
  if (role === 'ADMIN' || role === 'ROLE_ADMIN') return <Navigate to="/admin" replace />;
  if (role === 'TEACHER' || role === 'ROLE_TEACHER') return <Navigate to="/teacher" replace />;
  if (role === 'PARENT' || role === 'ROLE_PARENT') return <Navigate to="/parent" replace />;
  return <Navigate to="/login" replace />;
};

export const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<HomeRedirect />} />

              {/* Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                 <Route path="students" element={<StudentsPage />} />
                <Route path="parents" element={<ParentsPage />} />
                <Route path="marks" element={<MarksPage />} />
                <Route path="academics" element={<Navigate to="/admin/marks" replace />} />
                <Route path="attendance" element={<AttendancePage />} />
                <Route path="fees" element={<FeesPage />} />
                <Route path="billing" element={<FeesPage />} />
                <Route path="homework" element={<HomeworkPage />} />
                <Route path="holidays" element={<HolidayPage />} />
                <Route path="leave" element={<LeaveRequestsPage />} />
                <Route path="leave-reasons" element={<LeaveReasonsPage />} />
                <Route path="import-export" element={<ImportExportPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
              </Route>

              {/* Teacher Protected Routes */}
              <Route
                path="/teacher"
                element={
                  <ProtectedRoute allowedRoles={['TEACHER']}>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<TeacherDashboard />} />
                <Route path="marks" element={<MarksPage />} />
              </Route>

              {/* Parent Protected Routes */}
              <Route
                path="/parent"
                element={
                  <ProtectedRoute allowedRoles={['PARENT']}>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ParentDashboard />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
