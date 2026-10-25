'use client';

import React, { useState, useEffect } from 'react';
import type {
  ActivityDto,
  ActivityStatus,
  ActivityType,
  TaskStatus,
  TaskSummary,
} from '@crm/contracts';
import { PriorityBadge, TaskStatusBadge } from './StatusBadge';
import { ActivityComposerModal } from './ActivityComposerModal';
import { apiClient } from '../lib/api-client';

export interface TaskCalendarProps {
  tasks: TaskSummary[];
  activities?: ActivityDto[];
  onTransition?: (taskId: string, targetStatus: TaskStatus) => void;
  onSelectTask?: (task: TaskSummary) => void;
  onNotify?: (msg: string) => void;
}

export function TaskCalendar({
  tasks,
  activities: initialActivities,
  onTransition,
  onSelectTask,
  onNotify,
}: TaskCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'TASKS' | 'ACTIVITIES'>('ALL');
  const [activities, setActivities] = useState<ActivityDto[]>(initialActivities || []);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  // Load activities if not passed in
  useEffect(() => {
    if (initialActivities) {
      setActivities(initialActivities);
      return;
    }

    apiClient
      .getCalendarActivities()
      .then((res) => setActivities(res))
      .catch(() => {
        // Fallback handled in client
      });
  }, [initialActivities]);

  // Generate days of the current week (شنبه تا جمعه)
  const weekDays = [
    { name: 'شنبه', dayNum: 1, dateStr: '۱۴۰۵/۰۸/۰۱' },
    { name: 'یکشنبه', dayNum: 2, dateStr: '۱۴۰۵/۰۸/۰۲' },
    { name: 'دوشنبه', dayNum: 3, dateStr: '۱۴۰۵/۰۸/۰۳' },
    { name: 'سه‌شنبه', dayNum: 4, dateStr: '۱۴۰۵/۰۸/۰۴' },
    { name: 'چهارشنبه', dayNum: 5, dateStr: '۱۴۰۵/۰۸/۰۵' },
    { name: 'پنج‌شنبه', dayNum: 6, dateStr: '۱۴۰۵/۰۸/۰۶' },
    { name: 'جمعه', dayNum: 7, dateStr: '۱۴۰۵/۰۸/۰۷' },
  ];

  const handleActivityStatusChange = async (actId: string, status: ActivityStatus) => {
    try {
      const updated = await apiClient.updateScheduledActivity(actId, { status });
      setActivities((prev) => prev.map((a) => (a.id === actId ? updated : a)));
      onNotify?.(`وضعیت فعالیت به «${status === 'COMPLETED' ? 'انجام شد' : 'لغو شده'}» تغییر یافت.`);
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در به‌روزرسانی فعالیت');
    }
  };

  const handleActivityCreated = (newAct: ActivityDto) => {
    setActivities((prev) => [newAct, ...prev]);
    onNotify?.(`فعالیت «${newAct.title}» با موفقیت زمان‌بندی شد.`);
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'MEETING':
        return '🤝';
      case 'CALL':
        return '📞';
      case 'EMAIL':
        return '✉️';
      case 'REMINDER':
        return '⏰';
      case 'NOTE':
        return '📝';
      default:
        return '📅';
    }
  };

  const currentDayInfo = weekDays.find((w) => w.dayNum === selectedDay);
  const dayTasks = tasks.filter((t) => t.dueAt?.includes(currentDayInfo?.dateStr || ''));
  const dayActivities = activities; // For demonstration, show scheduled activities

  return (
    <div
      style={{
        background: 'var(--paper)',
        border: '1px solid var(--line)',
        borderRadius: '14px',
        padding: '20px',
      }}
      data-testid="calendar-agenda-view"
    >
      {/* Header with Title, Mode Switcher, and Schedule Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800 }}>
            تقویم یکپارچه وظایف و جلسات کاری (Calendar & Activity Scheduler)
          </h3>
          <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
            مدیریت سررسید وظایف، قرارهای ملاقات، جلسات و تماس‌های تلفنی
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Filter Pills */}
          <div
            style={{
              display: 'flex',
              background: 'var(--soft)',
              padding: '2px',
              borderRadius: '8px',
              border: '1px solid var(--line)',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                background: activeFilter === 'ALL' ? 'var(--paper)' : 'transparent',
                fontWeight: activeFilter === 'ALL' ? 'bold' : 'normal',
                cursor: 'pointer',
              }}
            >
              همه ({tasks.length + activities.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('TASKS')}
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                background: activeFilter === 'TASKS' ? 'var(--paper)' : 'transparent',
                fontWeight: activeFilter === 'TASKS' ? 'bold' : 'normal',
                cursor: 'pointer',
              }}
            >
              وظایف ({tasks.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('ACTIVITIES')}
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                background: activeFilter === 'ACTIVITIES' ? 'var(--paper)' : 'transparent',
                fontWeight: activeFilter === 'ACTIVITIES' ? 'bold' : 'normal',
                cursor: 'pointer',
              }}
            >
              جلسات و تماس‌ها ({activities.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsComposerOpen(true)}
            data-testid="schedule-activity-btn"
            className="primary-button"
            style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>+</span>
            <span>زمان‌بندی فعالیت جدید</span>
          </button>
        </div>
      </div>

      {/* Week Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: '10px',
          marginBottom: '24px',
        }}
      >
        {weekDays.map((wd) => {
          const isSelected = selectedDay === wd.dayNum;
          const count = tasks.filter((t) => t.dueAt?.includes(wd.dateStr)).length;

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
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                {wd.name}
              </div>
              <div
                style={{
                  fontWeight: '800',
                  fontSize: '16px',
                  color: isSelected ? 'var(--accent)' : 'var(--ink)',
                }}
              >
                {wd.dayNum}
              </div>
              <div style={{ marginTop: '6px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    background: count > 0 ? 'var(--accent)' : '#e2e8f0',
                    color: count > 0 ? '#fff' : '#64748b',
                    fontWeight: '700',
                  }}
                >
                  {count} برنامه
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Schedule Agenda Content */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {/* Scheduled Activities Section */}
        {(activeFilter === 'ALL' || activeFilter === 'ACTIVITIES') && (
          <div>
            <h4
              style={{
                margin: '0 0 12px',
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--ink)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>🤝</span>
              <span>جلسات، تماس‌ها و رویدادهای زمان‌بندی‌شده ({dayActivities.length})</span>
            </h4>

            {dayActivities.length === 0 ? (
              <div
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  background: 'var(--canvas)',
                  borderRadius: '10px',
                  color: 'var(--muted)',
                  fontSize: '13px',
                }}
              >
                هیچ جلسه یا فعالیتی برای این بازه ثبت نشده است.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }} data-testid="activities-list">
                {dayActivities.map((act) => (
                  <div
                    key={act.id}
                    data-testid={`activity-card-${act.id}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 18px',
                      background: '#fff',
                      border: '1px solid var(--line)',
                      borderRadius: '10px',
                      borderRight: '4px solid #6366f1',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'center',
                          marginBottom: '6px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>{getActivityIcon(act.type)}</span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: '#e0e7ff',
                            color: '#4338ca',
                          }}
                        >
                          {act.type}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'var(--muted)',
                          }}
                        >
                          {new Date(act.startsAt).toLocaleTimeString('fa-IR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {act.associatedEntityTitle && (
                          <span
                            style={{
                              fontSize: '11px',
                              background: 'var(--soft)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              color: 'var(--ink)',
                            }}
                          >
                            🔗 {act.associatedEntityTitle}
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: act.status === 'COMPLETED' ? '#dcfce7' : '#fef3c7',
                            color: act.status === 'COMPLETED' ? '#15803d' : '#b45309',
                            fontWeight: 'bold',
                          }}
                        >
                          {act.status === 'COMPLETED' ? 'تکمیل‌شده' : 'برنامه‌ریزی‌شده'}
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '14px' }}>{act.title}</div>
                      {act.description && (
                        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                          {act.description}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {act.status !== 'COMPLETED' && (
                        <button
                          type="button"
                          onClick={() => handleActivityStatusChange(act.id, 'COMPLETED')}
                          className="secondary-button"
                          style={{ fontSize: '11px', color: '#16a34a', borderColor: '#86efac' }}
                        >
                          ✓ انجام شد
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tasks Section */}
        {(activeFilter === 'ALL' || activeFilter === 'TASKS') && (
          <div>
            <h4
              style={{
                margin: '0 0 12px',
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--ink)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>✓</span>
              <span>وظایف سررسید روز {currentDayInfo?.name} ({currentDayInfo?.dateStr})</span>
            </h4>

            {dayTasks.length === 0 ? (
              <div
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  background: 'var(--canvas)',
                  borderRadius: '10px',
                  color: 'var(--muted)',
                  fontSize: '13px',
                }}
              >
                برای این روز وظیفه با سررسید ثبت نشده است.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {dayTasks.map((task) => (
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
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'center',
                          marginBottom: '6px',
                        }}
                      >
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
                        style={{
                          fontSize: '12px',
                          borderColor: 'var(--warning)',
                          color: 'var(--warning)',
                        }}
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
                        style={{
                          fontSize: '12px',
                          background: 'var(--success)',
                          borderColor: 'var(--success)',
                        }}
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
        )}
      </div>

      {/* Activity Composer Modal */}
      <ActivityComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onSuccess={handleActivityCreated}
      />
    </div>
  );
}

export default TaskCalendar;
