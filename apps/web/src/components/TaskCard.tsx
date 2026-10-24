'use client';

import React from 'react';
import type { TaskStatus, TaskSummary } from '@crm/contracts';
import { PriorityBadge, TaskStatusBadge } from './StatusBadge';

export interface TaskCardProps {
  task: TaskSummary;
  variant?: 'kanban' | 'list' | undefined;
  isDragging?: boolean | undefined;
  onDragStart?: ((e: React.DragEvent, taskId: string) => void) | undefined;
  onTransition?: ((taskId: string, targetStatus: TaskStatus) => void) | undefined;
  onClick?: ((task: TaskSummary) => void) | undefined;
  className?: string | undefined;
}

export function TaskCard({
  task,
  variant = 'kanban',
  isDragging = false,
  onDragStart,
  onTransition,
  onClick,
  className = '',
}: TaskCardProps) {
  if (variant === 'list') {
    return (
      <article
        className={`task-card ${className}`.trim()}
        onClick={() => onClick?.(task)}
      >
        <div style={{ flex: 1 }}>
          <div className="task-meta">
            <span className="task-key">{task.key}</span>
            <TaskStatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} prefix="اولویت" />
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
              نسخه هم‌زمانی: v{task.version}
            </span>
          </div>
          <div className="task-title">{task.title}</div>
          <p className="task-desc">مهلت انجام: {task.dueAt ?? 'تعیین نشده'}</p>
        </div>

        {onTransition && (
          <div className="task-actions" onClick={(e) => e.stopPropagation()}>
            {task.status === 'TODO' && (
              <button
                type="button"
                className="primary-button"
                onClick={() => onTransition(task.id, 'IN_PROGRESS')}
              >
                ▶ شروع کار
              </button>
            )}

            {task.status === 'IN_PROGRESS' && (
              <button
                type="button"
                className="secondary-button"
                style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }}
                onClick={() => onTransition(task.id, 'IN_REVIEW')}
              >
                🔍 ارسال برای بازبینی
              </button>
            )}

            {task.status === 'IN_REVIEW' && (
              <button
                type="button"
                className="primary-button"
                style={{ background: 'var(--success)', borderColor: 'var(--success)' }}
                onClick={() => onTransition(task.id, 'DONE')}
              >
                ✓ تأیید و اتمام
              </button>
            )}

            {task.status === 'DONE' && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => onTransition(task.id, 'TODO')}
              >
                ↺ بازگشایی مجدد
              </button>
            )}

            {task.status === 'BLOCKED' && (
              <button
                type="button"
                className="primary-button"
                onClick={() => onTransition(task.id, 'IN_PROGRESS')}
              >
                رفع انسداد
              </button>
            )}
          </div>
        )}
      </article>
    );
  }

  // Kanban variant
  return (
    <article
      draggable={Boolean(onDragStart)}
      onDragStart={onDragStart ? (e) => onDragStart(e, task.id) : undefined}
      className={`kanban-card ${isDragging ? 'dragging' : ''} ${className}`.trim()}
      onClick={() => onClick?.(task)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="task-key">{task.key}</span>
        <PriorityBadge priority={task.priority} />
      </div>

      <p className="kanban-card-title">{task.title}</p>

      <div className="kanban-card-footer">
        <span>سررسید: {task.dueAt ?? '—'}</span>
        <span>v{task.version}</span>
      </div>

      {onTransition && (
        <div className="kanban-card-actions">
          {task.status === 'TODO' && (
            <button
              type="button"
              className="quick-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onTransition(task.id, 'IN_PROGRESS');
              }}
            >
              ▶ شروع
            </button>
          )}
          {task.status === 'IN_PROGRESS' && (
            <button
              type="button"
              className="quick-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onTransition(task.id, 'IN_REVIEW');
              }}
            >
              🔍 بازبینی
            </button>
          )}
          {task.status === 'IN_REVIEW' && (
            <button
              type="button"
              className="quick-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onTransition(task.id, 'DONE');
              }}
            >
              ✓ اتمام
            </button>
          )}
          {task.status === 'DONE' && (
            <button
              type="button"
              className="quick-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onTransition(task.id, 'TODO');
              }}
            >
              ↺ بازگشایی
            </button>
          )}
          {task.status === 'BLOCKED' && (
            <button
              type="button"
              className="quick-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onTransition(task.id, 'IN_PROGRESS');
              }}
            >
              رفع مسدودی
            </button>
          )}
        </div>
      )}
    </article>
  );
}
export default TaskCard;
