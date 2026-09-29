import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, UserCheck, HeartHandshake, LogOut, Menu } from 'lucide-react';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'ADMIN':
        return (
          <span className="badge badge-primary">
            <ShieldCheck size={13} /> Administrator
          </span>
        );
      case 'TEACHER':
        return (
          <span className="badge badge-success">
            <UserCheck size={13} /> Teacher
          </span>
        );
      case 'PARENT':
        return (
          <span className="badge badge-warning">
            <HeartHandshake size={13} /> Parent
          </span>
        );
      default:
        return <span className="badge badge-secondary">{user?.role}</span>;
    }
  };

  return (
    <header className="top-navbar">
      <div className="navbar-brand-section">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="mobile-menu-btn"
            aria-label="Toggle Navigation"
          >
            <Menu size={18} />
          </button>
        )}
        <div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            School Management System
          </span>
        </div>
      </div>

      <div className="navbar-user-section">
        {getRoleBadge()}
        <div className="user-badge">
          <div className="user-avatar">{(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}</div>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {user?.name || user?.email || 'User'}
          </span>
        </div>
        <button
          onClick={logout}
          className="btn btn-secondary btn-sm"
          title="Sign Out"
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
