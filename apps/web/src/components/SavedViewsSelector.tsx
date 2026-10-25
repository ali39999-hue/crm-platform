'use client';

import React, { useEffect, useState } from 'react';
import type { SavedViewDto, SavedViewEntityType } from '@crm/contracts';
import { apiClient } from '../lib/api-client';

export interface SavedViewsSelectorProps {
  entityType?: SavedViewEntityType | undefined;
  currentFilters?: Record<string, any> | undefined;
  activeViewId?: string | undefined;
  onSelectView?: ((view: SavedViewDto) => void) | undefined;
  className?: string | undefined;
}

export function SavedViewsSelector({
  entityType = 'TASK',
  currentFilters = {},
  activeViewId,
  onSelectView,
  className = '',
}: SavedViewsSelectorProps) {
  const [views, setViews] = useState<SavedViewDto[]>([]);
  const [selectedId, setSelectedId] = useState<string>(activeViewId || 'view-all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newViewName, setNewViewName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const loadViews = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await apiClient.getSavedViews(entityType);
      setViews(list);
      if (activeViewId) {
        setSelectedId(activeViewId);
      } else if (list.length > 0) {
        const defaultView = list.find((v) => v.isDefault) || list[0];
        if (defaultView) {
          setSelectedId(defaultView.id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'خطا در دریافت نماهای ذخیره‌شده');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadViews();
  }, [entityType]);

  useEffect(() => {
    if (activeViewId && activeViewId !== selectedId) {
      setSelectedId(activeViewId);
    }
  }, [activeViewId]);

  const handleSelect = (view: SavedViewDto) => {
    setSelectedId(view.id);
    if (onSelectView) {
      onSelectView(view);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newViewName.trim();
    if (!trimmed) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const created = await apiClient.createSavedView({
        name: trimmed,
        entityType,
        filters: currentFilters,
        isDefault: false,
      });

      setViews((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setNewViewName('');
      setIsCreating(false);
      setFeedbackMessage(`نمای «${created.name}» با موفقیت ذخیره شد`);
      setTimeout(() => setFeedbackMessage(null), 3000);

      if (onSelectView) {
        onSelectView(created);
      }
    } catch (err: any) {
      setError(err.message || 'خطا در ذخیره نما');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, view: SavedViewDto) => {
    e.stopPropagation();
    try {
      setError(null);
      await apiClient.deleteSavedView(view.id);
      setViews((prev) => prev.filter((v) => v.id !== view.id));

      if (selectedId === view.id) {
        const remaining = views.filter((v) => v.id !== view.id);
        const fallback = remaining.find((v) => v.isDefault) || remaining[0];
        if (fallback) {
          setSelectedId(fallback.id);
          if (onSelectView) {
            onSelectView(fallback);
          }
        }
      }

      setFeedbackMessage(`نمای «${view.name}» حذف شد`);
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'خطا در حذف نما');
    }
  };

  if (isLoading) {
    return (
      <div className={`saved-views-bar ${className}`.trim()} aria-label="در حال بارگذاری نماها">
        <span className="saved-views-label">نماهای ذخیره‌شده:</span>
        <div className="skeleton" style={{ width: '120px', height: '28px', borderRadius: '20px' }} />
        <div className="skeleton" style={{ width: '90px', height: '28px', borderRadius: '20px' }} />
      </div>
    );
  }

  return (
    <div className={`saved-views-bar ${className}`.trim()}>
      <div className="saved-views-header">
        <span className="saved-views-label">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '6px' }}
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          نماهای ذخیره‌شده:
        </span>

        <div className="saved-views-chips" role="tablist" aria-label="انتخاب نمای داده‌ها">
          {views.map((view) => {
            const isSelected = selectedId === view.id;
            const canDelete = !view.isDefault && !view.id.startsWith('view-all');

            return (
              <button
                key={view.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`saved-view-chip ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelect(view)}
                title={view.name}
              >
                <span>{view.name}</span>
                {canDelete && (
                  <span
                    className="delete-view-btn"
                    onClick={(e) => handleDelete(e, view)}
                    title="حذف این نما"
                    aria-label={`حذف نمای ${view.name}`}
                  >
                    ×
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {!isCreating && (
          <button
            type="button"
            className="save-current-view-btn"
            onClick={() => setIsCreating(true)}
            title="ذخیره فیلترهای کنونی به عنوان یک نمای جدید"
          >
            + ذخیره نمای جاری
          </button>
        )}
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="save-view-form">
          <input
            type="text"
            className="form-control"
            style={{ padding: '5px 10px', fontSize: '12px', minWidth: '180px' }}
            placeholder="نام نمای جدید..."
            value={newViewName}
            onChange={(e) => setNewViewName(e.target.value)}
            autoFocus
            disabled={isSubmitting}
          />
          <button
            type="submit"
            className="primary-button"
            style={{ padding: '5px 12px', fontSize: '12px' }}
            disabled={isSubmitting || !newViewName.trim()}
          >
            {isSubmitting ? 'در حال ذخیره...' : 'ذخیره'}
          </button>
          <button
            type="button"
            className="secondary-button"
            style={{ padding: '5px 10px', fontSize: '12px' }}
            onClick={() => {
              setIsCreating(false);
              setNewViewName('');
            }}
            disabled={isSubmitting}
          >
            انصراف
          </button>
        </form>
      )}

      {error && (
        <div className="saved-views-error" style={{ color: 'var(--danger)', fontSize: '12px' }}>
          {error}
        </div>
      )}

      {feedbackMessage && (
        <div className="saved-views-feedback" style={{ color: 'var(--success)', fontSize: '12px' }}>
          ✓ {feedbackMessage}
        </div>
      )}
    </div>
  );
}

export default SavedViewsSelector;
