'use client';

import React, { useState, useEffect } from 'react';
import type {
  ActivityDto,
  ActivityType,
  CalendarConflictDto,
  CreateActivityRequest,
} from '@crm/contracts';
import { apiClient } from '../lib/api-client';

interface ActivityComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (activity: ActivityDto) => void;
  defaultType?: ActivityType;
  defaultEntity?: {
    type: string;
    id: string;
    title: string;
  };
}

export function ActivityComposerModal({
  isOpen,
  onClose,
  onSuccess,
  defaultType = 'MEETING',
  defaultEntity,
}: ActivityComposerModalProps) {
  const [type, setType] = useState<ActivityType>(defaultType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Default to 1 hour from now
  const now = new Date();
  const defaultStart = new Date(now.getTime() + 3600000).toISOString().slice(0, 16);
  const defaultEnd = new Date(now.getTime() + 7200000).toISOString().slice(0, 16);

  const [startsAt, setStartsAt] = useState(defaultStart);
  const [endsAt, setEndsAt] = useState(defaultEnd);
  const [isAllDay, setIsAllDay] = useState(false);

  const [entityType, setEntityType] = useState(defaultEntity?.type || '');
  const [entityTitle, setEntityTitle] = useState(defaultEntity?.title || '');
  const [visibility, setVisibility] = useState<'INTERNAL' | 'CUSTOMER_SHARED'>('INTERNAL');
  const [reminderMinutes, setReminderMinutes] = useState<number>(30);

  const [conflictInfo, setConflictInfo] = useState<CalendarConflictDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check conflicts when time changes
  useEffect(() => {
    if (!startsAt || !endsAt) return;

    let active = true;
    const startIso = new Date(startsAt).toISOString();
    const endIso = new Date(endsAt).toISOString();

    apiClient
      .checkCalendarConflicts(startIso, endIso)
      .then((res) => {
        if (active) {
          setConflictInfo(res);
        }
      })
      .catch(() => {
        // Ignored in check
      });

    return () => {
      active = false;
    };
  }, [startsAt, endsAt]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('عنوان فعالیت الزامی است.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const req: CreateActivityRequest = {
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        isAllDay,
        associatedEntityType: entityType || undefined,
        associatedEntityTitle: entityTitle.trim() || undefined,
        visibility,
        reminderMinutesBefore: reminderMinutes,
      };

      const result = await apiClient.createScheduledActivity(req);
      onSuccess(result.activity);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'خطا در زمان‌بندی فعالیت');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activityTypeOptions: Array<{ type: ActivityType; label: string; icon: string }> = [
    { type: 'MEETING', label: 'جلسه کاری', icon: '🤝' },
    { type: 'CALL', label: 'تماس تلفنی', icon: '📞' },
    { type: 'EMAIL', label: 'ایمیل پیگیری', icon: '✉️' },
    { type: 'REMINDER', label: 'یادآوری / تسک', icon: '⏰' },
    { type: 'NOTE', label: 'یادداشت', icon: '📝' },
  ];

  return (
    <div
      className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      data-testid="activity-composer-modal"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span>📅</span>
            <span>زمان‌بندی فعالیت و جلسه جدید (Activity Composer)</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="my-3 p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-lg">
            {error}
          </div>
        )}

        {conflictInfo?.hasConflict && (
          <div
            data-testid="conflict-warning-banner"
            className="my-3 p-3 bg-amber-950/80 border border-amber-800 text-amber-200 text-xs rounded-lg flex items-start gap-2"
          >
            <span className="text-base">⚠️</span>
            <div>
              <div className="font-bold">تداخل زمانی با رویداد دیگر!</div>
              <div className="text-[11px] mt-0.5">
                شما در این بازه زمانی رویداد دیگری دارید:{' '}
                <strong>{conflictInfo.conflictingActivities[0]?.title}</strong>. آیا تمایل به ادامه
                دارید؟
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Activity Type Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">نوع فعالیت</label>
            <div className="grid grid-cols-5 gap-2">
              {activityTypeOptions.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setType(opt.type)}
                  className={`p-2 rounded-lg border text-center flex flex-col items-center gap-1 transition-colors ${
                    type === opt.type
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 font-bold'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  <span className="text-[11px]">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">عنوان فعالیت *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: جلسه پرزنت و دمو سیستم برای مشتری"
              data-testid="activity-title-input"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Date & Time Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">زمان شروع *</label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                data-testid="activity-start-input"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">زمان پایان *</label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                data-testid="activity-end-input"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Association */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                اتصال به موجودیت CRM
              </label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">بدون ارتباط (فعالیت مستقل)</option>
                <option value="ACCOUNT">شرکت / حساب مشتری (Account)</option>
                <option value="DEAL">معامله / فرصت تجاری (Deal)</option>
                <option value="LEAD">سرنخ فروش (Lead)</option>
                <option value="TASK">وظیفه و کار (Task)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                نام یا عنوان رکورد مرتبط
              </label>
              <input
                type="text"
                value={entityTitle}
                onChange={(e) => setEntityTitle(e.target.value)}
                placeholder="مثال: پتروشیمی سپهر"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Reminder & Visibility */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">یادآوری قبل از موعد</label>
              <select
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={0}>بدون یادآوری</option>
                <option value={15}>۱۵ دقیقه قبل</option>
                <option value={30}>۳۰ دقیقه قبل</option>
                <option value={60}>۱ ساعت قبل</option>
                <option value={1440}>۱ روز قبل</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">سطح دیداری (Visibility)</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as 'INTERNAL' | 'CUSTOMER_SHARED')}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="INTERNAL">داخلی (صرفاً کارکنان)</option>
                <option value="CUSTOMER_SHARED">مشترک (قابل مشاهده در پورتال مشتری)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">توضیحات و دستور جلسه</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="نکات هماهنگی، لینک تماس آنلاین یا پیش‌نویس جلسه..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="activity-submit-btn"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow flex items-center gap-1.5"
            >
              {isSubmitting ? 'در حال ثبت...' : 'ثبت و زمان‌بندی فعالیت'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
