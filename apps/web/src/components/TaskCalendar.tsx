'use client';

import React, { useState } from 'react';
import type { TaskStatus, TaskSummary } from '@crm/contracts';
import { PriorityBadge, TaskStatusBadge } from './StatusBadge';

export interface TaskCalendarProps {
  tasks: TaskSummary[];
  onTransition?: (taskId: string, targetStatus: TaskStatus) => void;
  onSelectTask?: (task: TaskSummary) => void;
}

export function TaskCalendar({ tasks, onTransition, onSelectTask }: TaskCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  // Generate days of the current week (e.g. شنبه تا جمعه)
  const weekDays = [
    { name: 'شنبه', dayNum: 1, dateStr: '۱۴۰۵/۰۸/۰۱' },
    { name: 'یکشنبه', dayNum: 2, dateStr: '۱۴۰۵/۰۸/۰۲' },
    { name: 'دوشنبه', dayNum: 3, dateStr: '۱۴۰۵/۰۸/۰۳' },
    { name: 'سه‌شنبه', dayNum: 4, dateStr: '۱۴۰۵/۰۸/۰۴' },
    { name: 'چهارشنبه', dayNum: 5, dateStr: '۱۴۰۵/۰۸/۰۵' },
    { name: 'پنج‌شنبه', dayNum: 6, dateStr: '۱۴۰۵/۰۸/۰۶' },
    { name: 'جمعه', dayNum: 7, dateStr: '۱۴۰۵/۰۸/۰۷' },
  ];

  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '14px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '16px' }}>تقویم وظایف و زمان‌بندی (Task Timeline & Calendar)</h3>
          <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
            مشاهده سررسید وظایف بر مبنای تقویم کاری هفتگی
          </p>
        </div>
      </div>

      {/* Week Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '10px', marginBottom: '24px' }}>
        {weekDays.map((wd) => {
          const isSelected = selectedDay === wd.dayNum;
          // match tasks that contain this date string or fallback evenly
          const dayTasks = tasks.filter((t) => t.dueAt?.includes(wd.dateStr));

          return (
            <div
              key={wd.dayNum}
              onClick={() => setSelectedDay(wd.dayNum)}
              style={{
                border: isSelected ? '2px solid var(--accent)' : '1px solid var(--line)',
                background: isSelected ? 'var(--soft)' : '#fafafa',
                borderRadius: '10px',
                padding: '12px 8px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>{wd.name}</div>
              <div style={{ fontWeight: '800', fontSize: '16px', color: isSelected ? 'var(--accent)' : 'var(--ink)' }}>
                {wd.dayNum}
              </div>
              <div style={{ marginTop: '6px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    background: dayTasks.length > 0 ? 'var(--accent)' : '#e2e8f0',
                    color: dayTasks.length > 0 ? '#fff' : '#64748b',
                    fontWeight: '700',
                  }}
                >
                  {dayTasks.length} کار
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Schedule Detail */}
      <div>
        <h4 style={{ margin: '0 0 14px', fontSize: '14px', color: 'var(--muted)' }}>
          وظایف سررسید روز {weekDays.find((w) => w.dayNum === selectedDay)?.name} ({weekDays.find((w) => w.dayNum === selectedDay)?.dateStr}):
        </h4>

        {tasks.filter((t) => t.dueAt?.includes(weekDays.find((w) => w.dayNum === selectedDay)?.dateStr || 'none')).length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', background: 'var(--canvas)', borderRadius: '10px', color: 'var(--muted)' }}>
            برای این روز وظیفه با سررسید ثبت نشده است.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {tasks
              .filter((t) => t.dueAt?.includes(weekDays.find((w) => w.dayNum === selectedDay)?.dateStr || ''))
              .map((task) => (
                <div
                  key={task.id}
                  onClick={() => onSelectTask?.(task)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 18px',
                    background: '#fff',
                    border: '1px solid var(--line)',
                    borderRadius: '10px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                      <span className="task-key">{task.key}</span>
                      <TaskStatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{task.title}</div>
                  </div>

                  {onTransition && task.status === 'TODO' && (
                    <button
                      type="button"
                      className="primary-button"
                      style={{ fontSize: '12px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTransition(task.id, 'IN_PROGRESS');
                      }}
                    >
                      ▶ شروع کار
                    </button>
                  )}
                  {onTransition && task.status === 'IN_PROGRESS' && (
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ fontSize: '12px', borderColor: 'var(--warning)', color: 'var(--warning)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTransition(task.id, 'IN_REVIEW');
                      }}
                    >
                      🔍 بازبینی
                    </button>
                  )}
                  {onTransition && task.status === 'IN_REVIEW' && (
                    <button
                      type="button"
                      className="primary-button"
                      style={{ fontSize: '12px', background: 'var(--success)', borderColor: 'var(--success)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTransition(task.id, 'DONE');
                      }}
                    >
                      ✓ اتمام
                    </button>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskCalendar;
