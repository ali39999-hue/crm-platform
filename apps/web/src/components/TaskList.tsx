'use client';

import React, { useState } from 'react';
import type { SavedViewDto, TaskStatus, TaskSummary } from '@crm/contracts';
import { canTransitionTask, type TransitionActorCapabilities } from '@crm/domain';
import { TaskCard } from './TaskCard';
import { EmptyState } from './EmptyState';
import { LoadingSkeleton } from './LoadingSkeleton';
import { getTaskStatusLabel } from './StatusBadge';
import { SavedViewsSelector } from './SavedViewsSelector';

export interface TaskListProps {
  tasks: TaskSummary[];
  onTransition: (taskId: string, targetStatus: TaskStatus) => void | Promise<void>;
  onError?: ((errorMessage: string) => void) | undefined;
  statusFilter?: string | undefined;
  onStatusFilterChange?: ((status: string) => void) | undefined;
  isLoading?: boolean | undefined;
  onTaskClick?: ((task: TaskSummary) => void) | undefined;
  capabilities?: TransitionActorCapabilities | undefined;
  className?: string | undefined;
  activeSavedView?: SavedViewDto | undefined;
  onSelectSavedView?: ((view: SavedViewDto) => void) | undefined;
}

const FILTER_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'ALL', label: 'همه وظایف' },
  { key: 'TODO', label: 'در انتظار شروع' },
  { key: 'IN_PROGRESS', label: 'در حال انجام' },
  { key: 'IN_REVIEW', label: 'در انتظار بازبینی' },
  { key: 'DONE', label: 'تکمیل‌شده' },
  { key: 'BLOCKED', label: 'مسدود' },
];

export function TaskList({
  tasks,
  onTransition,
  onError,
  statusFilter: controlledFilter,
  onStatusFilterChange,
  isLoading = false,
  onTaskClick,
  capabilities = { canReopenDoneTask: true, canRestoreCanceledTask: true },
  className = '',
  activeSavedView,
  onSelectSavedView,
}: TaskListProps) {
  const [internalFilter, setInternalFilter] = useState('ALL');
  const [internalSavedView, setInternalSavedView] = useState<SavedViewDto | null>(activeSavedView || null);
  const [searchQuery, setSearchQuery] = useState('');

  const activeView = activeSavedView !== undefined ? activeSavedView : internalSavedView;
  const currentFilter = controlledFilter !== undefined ? controlledFilter : internalFilter;
  const setFilter = (val: string) => {
    if (onStatusFilterChange) {
      onStatusFilterChange(val);
    } else {
      setInternalFilter(val);
    }
  };

  const handleSelectView = (view: SavedViewDto) => {
    setInternalSavedView(view);
    if (view.filters?.status) {
      setFilter(view.filters.status);
    }
    if (onSelectSavedView) {
      onSelectSavedView(view);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton variant="list" className={className} />;
  }

  const handleTransition = (taskId: string, targetStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (task.status === targetStatus) return;

    const isAllowed = canTransitionTask(task.status, targetStatus, capabilities);
    if (!isAllowed) {
      const errorMsg = `خطای دامنه: انتقال از «${getTaskStatusLabel(task.status)}» به «${getTaskStatusLabel(targetStatus)}» مجاز نیست`;
      if (onError) {
        onError(errorMsg);
      }
      return;
    }

    void onTransition(taskId, targetStatus);
  };

  const filteredTasks = tasks.filter((task) => {
    if (activeView?.filters) {
      if (
        activeView.filters.status &&
        activeView.filters.status !== 'ALL' &&
        task.status !== activeView.filters.status
      ) {
        return false;
      }
      if (
        activeView.filters.priority &&
        task.priority !== activeView.filters.priority
      ) {
        return false;
      }
      if (
        activeView.filters.assigneeId &&
        task.assigneeId !== activeView.filters.assigneeId
      ) {
        return false;
      }
    } else if (currentFilter !== 'ALL' && task.status !== currentFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesKey = task.key.toLowerCase().includes(q);
      const matchesTitle = task.title.toLowerCase().includes(q);
      return matchesKey || matchesTitle;
    }
    return true;
  });

  return (
    <div className={`task-list-wrapper ${className}`.trim()}>
      {/* Saved Views Selector */}
      <div style={{ marginBottom: '14px' }}>
        <SavedViewsSelector
          entityType="TASK"
          activeViewId={activeView?.id}
          currentFilters={{
            ...(currentFilter !== 'ALL' ? { status: currentFilter } : {}),
            ...(activeView?.filters?.priority ? { priority: activeView.filters.priority } : {}),
          }}
          onSelectView={handleSelectView}
        />
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '18px',
        }}
      >
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', marginLeft: '8px' }}>
            فیلتر وضعیت:
          </span>
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`filter-chip ${currentFilter === opt.key ? 'active' : ''}`}
              onClick={() => setFilter(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ minWidth: '220px' }}>
          <input
            type="search"
            className="form-control"
            style={{ padding: '6px 12px', fontSize: '13px' }}
            placeholder="جستجو در کلید یا عنوان..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="task-grid">
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            variant="list"
            onTransition={handleTransition}
            onClick={onTaskClick}
          />
        ))}

        {filteredTasks.length === 0 && (
          <EmptyState
            title="هیچ وظیفه‌ای در این فیلتر یافت نشد"
            description="می‌توانید فیلتر یا عبارت جستجو را تغییر دهید یا یک تسک جدید ثبت نمایید."
          />
        )}
      </div>
    </div>
  );
}
export default TaskList;
