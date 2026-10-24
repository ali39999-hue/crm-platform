'use client';

import React from 'react';

export interface LoadingSkeletonProps {
  variant?: 'card' | 'table' | 'board' | 'list' | undefined;
  count?: number | undefined;
  className?: string | undefined;
}

export function LoadingSkeleton({
  variant = 'card',
  count = 3,
  className = '',
}: LoadingSkeletonProps) {
  if (variant === 'board') {
    return (
      <div className={`kanban-board ${className}`}>
        {Array.from({ length: 4 }).map((_, colIdx) => (
          <div key={colIdx} className="kanban-column" style={{ opacity: 0.7 }}>
            <div
              className="skeleton skeleton-text"
              style={{ width: '60%', height: '24px', marginBottom: '16px' }}
            />
            <div className="kanban-dropzone">
              {Array.from({ length: 2 }).map((_, cardIdx) => (
                <div key={cardIdx} className="kanban-card skeleton-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div className="skeleton skeleton-pill" style={{ width: '70px', height: '18px' }} />
                    <div className="skeleton skeleton-pill" style={{ width: '50px', height: '18px' }} />
                  </div>
                  <div className="skeleton skeleton-text" style={{ width: '90%', height: '16px', marginBottom: '8px' }} />
                  <div className="skeleton skeleton-text" style={{ width: '65%', height: '16px', marginBottom: '12px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                    <div className="skeleton skeleton-text" style={{ width: '80px', height: '14px' }} />
                    <div className="skeleton skeleton-text" style={{ width: '30px', height: '14px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`skeleton-table-wrapper ${className}`} style={{ background: 'var(--paper)', borderRadius: '12px', padding: '16px', border: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', gap: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--line)' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-text" style={{ flex: 1, height: '20px' }} />
          ))}
        </div>
        {Array.from({ length: count }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            style={{
              display: 'flex',
              gap: '16px',
              padding: '14px 0',
              borderBottom: rowIdx === count - 1 ? 'none' : '1px solid var(--line)',
            }}
          >
            {Array.from({ length: 4 }).map((_, colIdx) => (
              <div key={colIdx} className="skeleton skeleton-text" style={{ flex: 1, height: '16px' }} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`task-grid ${className}`}>
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="task-card skeleton-card" style={{ opacity: 0.8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <div className="skeleton skeleton-pill" style={{ width: '70px', height: '20px' }} />
                <div className="skeleton skeleton-pill" style={{ width: '80px', height: '20px' }} />
                <div className="skeleton skeleton-pill" style={{ width: '60px', height: '20px' }} />
              </div>
              <div className="skeleton skeleton-text" style={{ width: '75%', height: '18px', marginBottom: '8px' }} />
              <div className="skeleton skeleton-text" style={{ width: '40%', height: '14px' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="skeleton skeleton-button" style={{ width: '90px', height: '36px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`summary-grid ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="summary-card skeleton-card">
          <div className="skeleton skeleton-text" style={{ width: '50%', height: '16px', marginBottom: '12px' }} />
          <div className="skeleton skeleton-text" style={{ width: '35%', height: '32px', marginBottom: '8px' }} />
          <div className="skeleton skeleton-text" style={{ width: '65%', height: '14px' }} />
        </div>
      ))}
    </div>
  );
}
