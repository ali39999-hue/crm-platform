'use client';

import React, { useState } from 'react';
import type { SavedViewDto, TaskStatus, TaskSummary } from '@crm/contracts';
import { canTransitionTask, type TransitionActorCapabilities } from '@crm/domain';
import { TaskCard } from './TaskCard';
import { getTaskStatusLabel } from './StatusBadge';
import { LoadingSkeleton } from './LoadingSkeleton';
import { SavedViewsSelector } from './SavedViewsSelector';

export interface KanbanColumnConfig {
  status: TaskStatus;
  label: string;
  badgeClass: string;
}

export const DEFAULT_KANBAN_COLUMNS: KanbanColumnConfig[] = [
  { status: 'TODO', label: 'در انتظار شروع', badgeClass: 'badge-todo' },
  { status: 'IN_PROGRESS', label: 'در حال انجام', badgeClass: 'badge-in_progress' },
  { status: 'IN_REVIEW', label: 'در انتظار بازبینی', badgeClass: 'badge-in_review' },
  { status: 'DONE', label: 'تکمیل‌شده', badgeClass: 'badge-done' },
];

export interface TaskBoardProps {
  tasks: TaskSummary[];
  onTransition: (taskId: string, targetStatus: TaskStatus) => void | Promise<void>;
  onError?: ((errorMessage: string) => void) | undefined;
  columns?: KanbanColumnConfig[] | undefined;
  isLoading?: boolean | undefined;
  onTaskClick?: ((task: TaskSummary) => void) | undefined;
  capabilities?: TransitionActorCapabilities | undefined;
  className?: string | undefined;
  activeSavedView?: SavedViewDto | undefined;
  onSelectSavedView?: ((view: SavedViewDto) => void) | undefined;
}

export function TaskBoard({
  tasks,
  onTransition,
  onError,
  columns = DEFAULT_KANBAN_COLUMNS,
  isLoading = false,
  onTaskClick,
  capabilities = { canReopenDoneTask: true, canRestoreCanceledTask: true },
  className = '',
  activeSavedView,
  onSelectSavedView,
}: TaskBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [internalSavedView, setInternalSavedView] = useState<SavedViewDto | null>(
    activeSavedView || null,
  );

  const activeView = activeSavedView !== undefined ? activeSavedView : internalSavedView;

  if (isLoading) {
    return <LoadingSkeleton variant="board" className={className} />;
  }

  const filteredTasks = tasks.filter((task) => {
    if (!activeView?.filters) return true;
    if (activeView.filters.priority && task.priority !== activeView.filters.priority) {
      return false;
    }
    if (activeView.filters.assigneeId && task.assigneeId !== activeView.filters.assigneeId) {
      return false;
    }
    if (
      activeView.filters.status &&
      activeView.filters.status !== 'ALL' &&
      task.status !== activeView.filters.status
    ) {
      return false;
    }
    return true;
  });

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colStatus: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colStatus) {
      setDragOverCol(colStatus);
    }
  };

  const handleDragLeave = (e: React.DragEvent, colStatus: TaskStatus) => {
    if (dragOverCol === colStatus) {
      setDragOverCol(null);
    }
  };

  const attemptTransition = (taskId: string, targetStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (task.status === targetStatus) return;

    // Validate with domain state machine rule
    const isAllowed = canTransitionTask(task.status, targetStatus, capabilities);

    if (!isAllowed) {
      const errorMsg = `خطای دامنه: انتقال مستقیم از «${getTaskStatusLabel(task.status)}» به «${getTaskStatusLabel(targetStatus)}» مجاز نیست`;
      if (onError) {
        onError(errorMsg);
      }
      return;
    }

    void onTransition(taskId, targetStatus);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      attemptTransition(taskId, targetStatus);
    }
    setDraggedTaskId(null);
  };

  return (
    <div className={`kanban-board-wrapper ${className}`.trim()}>
      <div style={{ marginBottom: '16px' }}>
        <SavedViewsSelector
          entityType="TASK"
          activeViewId={activeView?.id}
          currentFilters={activeView?.filters || {}}
          onSelectView={(view) => {
            setInternalSavedView(view);
            onSelectSavedView?.(view);
          }}
        />
      </div>

      <div className="kanban-board">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.status);
          const isOver = dragOverCol === col.status;

          return (
            <section
              key={col.status}
              className="kanban-column"
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={(e) => handleDragLeave(e, col.status)}
              onDrop={(e) => handleDrop(e, col.status)}
              aria-label={`ستون ${col.label}`}
              data-testid={`kanban-column-${col.status}`}
            >
              <header className="kanban-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge ${col.badgeClass}`}>{col.label}</span>
                </div>
                <span className="kanban-count">{colTasks.length}</span>
              </header>

              <div
                className={`kanban-dropzone ${isOver ? 'drag-over' : ''}`}
                data-testid={`kanban-dropzone-${col.status}`}
              >
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    variant="kanban"
                    isDragging={draggedTaskId === task.id}
                    onDragStart={handleDragStart}
                    onTransition={(tId, s) => attemptTransition(tId, s)}
                    onClick={onTaskClick}
                  />
                ))}

                {colTasks.length === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '36px 12px',
                      color: 'var(--muted)',
                      fontSize: '12px',
                    }}
                  >
                    کارت را اینجا رها کنید
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
export default TaskBoard;
