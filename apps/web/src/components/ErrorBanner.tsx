'use client';

import React from 'react';

export interface ErrorBannerProps {
  title?: string | undefined;
  message: string;
  details?: string | undefined;
  onRetry?: (() => void) | undefined;
  onDismiss?: (() => void) | undefined;
  className?: string | undefined;
}

export function ErrorBanner({
  title = 'خطا در برقراری ارتباط با سرور',
  message,
  details,
  onRetry,
  onDismiss,
  className = '',
}: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className={`error-banner ${className}`.trim()}
      style={{
        background: 'var(--danger-soft)',
        border: '1px solid #fecaca',
        borderRadius: '10px',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flex: 1 }}>
        <span
          style={{
            fontSize: '18px',
            color: 'var(--danger)',
            fontWeight: 'bold',
            lineHeight: 1.2,
          }}
        >
          ⚠
        </span>
        <div style={{ flex: 1 }}>
          <strong style={{ display: 'block', color: 'var(--danger)', marginBottom: '4px', fontSize: '14px' }}>
            {title}
          </strong>
          <p style={{ margin: 0, color: '#7f1d1d', fontSize: '13px', lineHeight: 1.6 }}>
            {message}
          </p>
          {details && (
            <small style={{ display: 'block', marginTop: '6px', color: '#991b1b', fontFamily: 'monospace', fontSize: '11px' }}>
              {details}
            </small>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="secondary-button"
            style={{
              borderColor: '#fca5a5',
              background: 'white',
              color: 'var(--danger)',
              fontSize: '12px',
              padding: '6px 12px',
            }}
          >
            تلاش مجدد
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="بستن پیام خطا"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#991b1b',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '4px',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
