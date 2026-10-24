'use client';

import React from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string | undefined;
  icon?: React.ReactNode | undefined;
  action?:
    | {
        label: string;
        onClick: () => void;
      }
    | undefined;
  className?: string | undefined;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`.trim()}>
      <div className="empty-state-icon" aria-hidden="true">
        {icon || (
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ margin: '0 auto', color: 'var(--muted)' }}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="9" x2="15" y2="9" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="11" y2="17" />
          </svg>
        )}
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
        {title}
      </h3>
      {description && (
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', maxWidth: '420px', lineHeight: 1.6 }}>
          {description}
        </p>
      )}
      {action && (
        <div style={{ marginTop: '16px' }}>
          <button
            type="button"
            className="primary-button"
            onClick={action.onClick}
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
}
