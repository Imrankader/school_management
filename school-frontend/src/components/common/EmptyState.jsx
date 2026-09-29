import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no items to display at this time.',
  actionLabel,
  onAction,
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`empty-state-card ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        backgroundColor: 'var(--bg-surface, #ffffff)',
        borderRadius: 'var(--radius-md, 8px)',
        border: '1px dashed var(--border-subtle, #e2e8f0)',
        margin: '1rem 0',
        ...style,
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-subtle, #f8fafc)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-light, #94a3b8)',
          marginBottom: '1rem',
          border: '1px solid var(--border-subtle, #e2e8f0)',
        }}
      >
        <Icon size={24} />
      </div>
      <h3
        style={{
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--text-primary, #0f172a)',
          marginBottom: '0.35rem',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--text-muted, #64748b)',
          maxWidth: '420px',
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="btn btn-primary btn-sm"
          style={{ marginTop: '1.25rem' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
