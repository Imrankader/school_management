import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const currentRole = user?.role ? user.role.toUpperCase().replace(/^ROLE_/, '') : '';
  const normalizedAllowed = (allowedRoles || []).map(r => r.toUpperCase().replace(/^ROLE_/, ''));

  if (normalizedAllowed.length > 0 && !normalizedAllowed.includes(currentRole)) {
    // Redirect to their respective default home
    if (currentRole === 'ADMIN') return <Navigate to="/admin" replace />;
    if (currentRole === 'TEACHER') return <Navigate to="/teacher" replace />;
    if (currentRole === 'PARENT') return <Navigate to="/parent" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};
