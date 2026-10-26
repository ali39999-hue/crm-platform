'use client';

import React, { useState, useEffect } from 'react';
import type { ActivityCalendarDayDto, ActivityCalendarMonthDto, ActivityDto } from '@crm/contracts';
import { apiClient } from '../lib/api-client';

interface JalaliActivityCalendarViewProps {
  onNotify?: ((msg: string, type?: 'success' | 'error') => void) | undefined;
}

const PERSIAN_WEEKDAYS = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
];

export function JalaliActivityCalendarView({ onNotify }: JalaliActivityCalendarViewProps) {
  const [calendarData, setCalendarData] = useState<ActivityCalendarMonthDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<ActivityCalendarDayDto | null>(null);

  // Month navigation (defaults to current month: October 2026 / Aban 1405)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(10);

  const loadCalendar = async (y: number, m: number) => {
    try {
      setLoading(true);
      const res = await apiClient.getJalaliCalendarMonth(y, m);
      setCalendarData(res);
      // Auto-select today or first day
      const today = res.days.find((d) => d.isToday) || res.days[0] || null;
      setSelectedDay(today);
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در بارگذاری تقویم شمسی', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth() + 1);
  };

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'CALL':
        return '📞';
      case 'MEETING':
        return '👥';
      case 'EMAIL':
        return '✉️';
      case 'NOTE':
        return '📝';
      case 'REMINDER':
      default:
        return '🔔';
    }
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'CALL':
        return 'تماس تلفنی';
      case 'MEETING':
        return 'جلسه حضوری/آنلاین';
      case 'EMAIL':
        return 'پست الکترونیکی';
      case 'NOTE':
        return 'یادداشت پرونده';
      case 'REMINDER':
      default:
        return 'یادآوری کار';
    }
  };

  const handleTogglePin = async (activityId: string) => {
    try {
      const updated = await apiClient.togglePinActivity(activityId);
      onNotify?.(
        updated.isPinned ? 'فعالیت در پرونده پین شد 📌' : 'فعالیت از حالت پین خارج شد',
        'success',
      );
      // Refresh current month
      loadCalendar(currentYear, currentMonth);
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در تغییر وضعیت پین فعالیت', 'error');
    }
  };

  if (loading && !calendarData) {
    return (
      <div className="py-12 text-center text-slate-400 text-xs">
        در حال بارگذاری تقویم شمسی فعالیت‌ها...
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="jalali-activity-calendar-view">
      {/* Calendar Header Navigation */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-slate-900/80 p-4 border border-slate-800 rounded-2xl shadow">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📅</span>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>تقویم شمسی فعالیت‌ها و پیگیری‌ها (Didar Jalali Calendar)</span>
              {calendarData && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                  {calendarData.jalaliMonthName} {calendarData.jalaliYear}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              برنامه‌ریزی جلسات، تماس‌ها و پیگیری‌های دوره‌ای مشتریان با انطباق تقویم رسمی ایران
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            data-testid="prev-month-btn"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-colors"
          >
            ◀ ماه قبل
          </button>
          <button
            onClick={handleJumpToday}
            data-testid="today-month-btn"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs transition-colors"
          >
            امروز
          </button>
          <button
            onClick={handleNextMonth}
            data-testid="next-month-btn"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-colors"
          >
            ماه بعد ▶
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Main Calendar Grid (8 cols on large screens) */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow">
          {/* Weekdays Bar */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 border-b border-slate-800 pb-2">
            {PERSIAN_WEEKDAYS.map((w, idx) => (
              <div
                key={w}
                className={idx === 6 ? 'text-rose-400 font-black' : 'text-slate-300'}
              >
                {w}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarData?.days.map((day) => {
              const isSelected = selectedDay?.date === day.date;

              return (
                <div
                  key={day.date}
                  onClick={() => setSelectedDay(day)}
                  data-testid={`calendar-day-${day.date}`}
                  className={`min-h-[85px] p-2 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-xs ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-950/20 shadow-md ring-1 ring-emerald-500'
                      : day.isToday
                        ? 'border-emerald-600/70 bg-slate-800/80'
                        : day.isWeekend
                          ? 'border-slate-800 bg-rose-950/10 hover:border-slate-700'
                          : 'border-slate-800/80 bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`font-mono text-sm font-bold ${
                        day.isWeekend ? 'text-rose-400' : 'text-slate-200'
                      }`}
                    >
                      {day.jalaliDay}
                    </span>
                    {day.isToday && (
                      <span className="text-[9px] px-1 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-bold">
                        امروز
                      </span>
                    )}
                  </div>

                  {/* Activity Pills */}
                  {day.activitiesCount > 0 && (
                    <div className="space-y-0.5 mt-1">
                      <div className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300 flex items-center justify-between">
                        <span>{day.activitiesCount} فعالیت</span>
                        <span className="text-emerald-400">●</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Drawer (4 cols on large screens) */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow">
          <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
            <div>
              <h4 className="font-bold text-xs text-slate-100">
                برنامه و فعالیت‌های روز:{' '}
                {selectedDay ? `${selectedDay.jalaliDay} ${selectedDay.jalaliMonthName}` : 'انتخاب نشده'}
              </h4>
              <p className="text-[10px] text-slate-400 font-mono">
                {selectedDay ? selectedDay.date : ''}
              </p>
            </div>
            {selectedDay?.isWeekend && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                تعطیل رسمی (جمعه)
              </span>
            )}
          </div>

          {/* Activities list for selected day */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {!selectedDay || selectedDay.activities.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl p-4">
                برای این روز فعالیتی ثبت نشده است.
              </div>
            ) : (
              selectedDay.activities.map((act) => (
                <div
                  key={act.id}
                  data-testid={`day-activity-${act.id}`}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                    act.isPinned
                      ? 'bg-amber-950/20 border-amber-600/60 shadow-amber-950/20'
                      : 'bg-slate-800/60 border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                      <span>{getActivityTypeIcon(act.type)}</span>
                      <span>{act.title}</span>
                    </div>

                    <button
                      onClick={() => handleTogglePin(act.id)}
                      title={act.isPinned ? 'برداشتن پین' : 'پین کردن در بالای پرونده'}
                      className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
                        act.isPinned
                          ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      📌
                    </button>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>نوع: {getActivityTypeLabel(act.type)}</span>
                    <span className="font-mono text-slate-300">
                      {new Date(act.startsAt).toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {act.associatedEntityTitle && (
                    <div className="text-[10px] text-slate-400">
                      مرتبط با: <strong className="text-slate-300">{act.associatedEntityTitle}</strong>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default JalaliActivityCalendarView;
