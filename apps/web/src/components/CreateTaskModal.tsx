'use client';

import React, { useState } from 'react';
import type { TaskPriority } from '@crm/contracts';

export interface CreateTaskFormData {
  title: string;
  description?: string | undefined;
  priority: TaskPriority;
  dueAt?: string | undefined;
}

export interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (data: CreateTaskFormData) => void | Promise<void>;
  isSubmitting?: boolean | undefined;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  onCreateTask,
  isSubmitting = false,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueAt, setDueAt] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    await onCreateTask({
      title: title.trim(),
      description: description.trim() ? description.trim() : undefined,
      priority,
      dueAt: dueAt.trim() ? dueAt.trim() : undefined,
    });

    // Reset fields
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setDueAt('');
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 id="modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
            ایجاد تسک جدید
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن پنجره"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '18px',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="task-title">
              عنوان تسک <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="task-title"
              type="text"
              required
              className="form-control"
              placeholder="مثال: بازبینی پروپوزال مشتری"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-desc">شرح تکمیلی و الزامات</label>
            <textarea
              id="task-desc"
              rows={3}
              className="form-control"
              placeholder="جزئیات و الزامات کار..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label htmlFor="task-priority">اولویت</label>
              <select
                id="task-priority"
                className="form-control"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                disabled={isSubmitting}
              >
                <option value="LOW">پایین</option>
                <option value="MEDIUM">متوسط</option>
                <option value="HIGH">بالا</option>
                <option value="URGENT">خیلی فوری</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="task-due">مهلت سررسید (اختیاری)</label>
              <input
                id="task-due"
                type="text"
                className="form-control"
                placeholder="مثال: ۱۴۰۵/۰۸/۱۰"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              انصراف
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting ? 'در حال ثبت...' : 'ثبت و ایجاد تسک'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default CreateTaskModal;
