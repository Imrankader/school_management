import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  DollarSign,
  LogOut,
  Award,
  FileText,
  Bell,
  BookMarked,
  X
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin, isTeacher, isParent } = useAuth();

  const handleLinkClick = () => {
    if (onClose && window.innerWidth <= 768) {
      onClose();
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand-icon">
          <GraduationCap size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sidebar-brand-text">EduCore</div>
          <div className="sidebar-brand-sub">School Management System</div>
        </div>
        {isOpen && (
          <button
            onClick={onClose}
            className="mobile-close-btn"
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'none',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {isAdmin && (
          <>
            <div className="sidebar-section-title">Administration</div>
            <NavLink
              to="/admin"
              end
              onClick={handleLinkClick}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink
              to="/admin/students"
              onClick={handleLinkClick}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Users size={18} />
              <span>Students</span>
            </NavLink>
            <NavLink
              to="/admin/marks"
              onClick={handleLinkClick}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Award size={18} />
              <span>Marks</span>
            </NavLink>
            <NavLink
              to="/admin/fees"
              onClick={handleLinkClick}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <DollarSign size={18} />
              <span>Billing</span>
            </NavLink>
            <NavLink
              to="/admin/leave"
              onClick={handleLinkClick}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <FileText size={18} />
              <span>Leave Records</span>
            </NavLink>
            <NavLink
              to="/admin/leave-reasons"
              onClick={handleLinkClick}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <BookMarked size={18} />
              <span>Leave Reasons</span>
            </NavLink>
            <NavLink
              to="/admin/notifications"
              onClick={handleLinkClick}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Bell size={18} />
              <span>Notifications</span>
            </NavLink>
          </>
        )}

        {isTeacher && (
          <>
            <div className="sidebar-section-title">Teacher Portal</div>
            <NavLink
              to="/teacher"
              end
              onClick={handleLinkClick}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Attendance & Homework</span>
            </NavLink>
            <NavLink
              to="/teacher/marks"
              onClick={handleLinkClick}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Award size={18} />
              <span>Marks</span>
            </NavLink>
          </>
        )}

        {isParent && (
          <>
            <div className="sidebar-section-title">Parent Portal</div>
            <NavLink
              to="/parent"
              end
              onClick={handleLinkClick}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Student Overview</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: '#312e81',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: '700',
              color: '#a5b4fc',
              flexShrink: 0,
            }}
          >
            {(user?.name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#f8fafc',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.name || user?.username}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{user?.role}</div>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '0.35rem',
            display: 'flex',
            alignItems: 'center',
            borderRadius: 'var(--radius-xs)',
            transition: 'var(--transition)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};