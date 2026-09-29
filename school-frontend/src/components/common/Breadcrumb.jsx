import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumb = ({ items = [] }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        fontSize: '0.8125rem',
        color: 'var(--text-muted, #64748b)',
        marginBottom: '0.75rem',
      }}
    >
      <Link
        to="/admin"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          color: 'var(--text-muted, #64748b)',
          textDecoration: 'none',
          transition: 'color 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary, #4f46e5)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted, #64748b)')}
      >
        <Home size={13} />
        <span>Dashboard</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight size={12} style={{ color: 'var(--border-color, #cbd5e1)' }} />
            {isLast || !item.to ? (
              <span
                style={{
                  color: isLast ? 'var(--text-primary, #0f172a)' : 'var(--text-muted, #64748b)',
                  fontWeight: isLast ? 600 : 400,
                }}
              >
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to}
                style={{
                  color: 'var(--text-muted, #64748b)',
                  textDecoration: 'none',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary, #4f46e5)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted, #64748b)')}
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
