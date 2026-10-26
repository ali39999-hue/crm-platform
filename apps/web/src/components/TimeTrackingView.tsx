'use client';

import React, { useState, useEffect, useRef } from 'react';
import type {
  CreateWorkLogRequest,
  WorkLogDto,
  WorkLogEntityType,
  WorkLogSummaryDto,
} from '@crm/contracts';
import { apiClient } from '../lib/api-client';

interface TimeTrackingViewProps {
  onNotify?: ((msg: string, type?: 'success' | 'error') => void) | undefined;
}

export function TimeTrackingView({ onNotify }: TimeTrackingViewProps) {
  const [logs, setLogs] = useState<WorkLogDto[]>([]);
  const [summary, setSummary] = useState<WorkLogSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState<WorkLogEntityType | 'ALL'>('ALL');

  // Live Timer State
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerTitle, setTimerTitle] = useState('');
  const [timerEntityType, setTimerEntityType] = useState<WorkLogEntityType>('TASK');
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Manual Log Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalEntityType, setModalEntityType] = useState<WorkLogEntityType>('TASK');
  const [modalTitle, setModalTitle] = useState('');
  const [modalHours, setModalHours] = useState('1');
  const [modalMinutes, setModalMinutes] = useState('0');
  const [modalDesc, setModalDesc] = useState('');
  const [modalDate, setModalDate] = useState(new Date().toISOString().slice(0, 10));
  const [modalBillable, setModalBillable] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Live timer interval
  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsRes, summaryRes] = await Promise.all([
        apiClient.getWorkLogs(entityFilter === 'ALL' ? undefined : { entityType: entityFilter }),
        apiClient.getWorkLogSummary(),
      ]);
      setLogs(logsRes);
      setSummary(summaryRes);
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در بارگذاری کارکردها', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [entityFilter]);

  const handleStartTimer = () => {
    if (!timerTitle.trim()) {
      onNotify?.('لطفاً عنوان کاری که شروع می‌کنید را وارد نمایید', 'error');
      return;
    }
    setTimerRunning(true);
    onNotify?.(`تایمر برای «${timerTitle}» آغاز شد`, 'success');
  };

  const handlePauseTimer = () => {
    setTimerRunning(false);
  };

  const handleStopAndLogTimer = async () => {
    if (timerSeconds < 60) {
      if (
        !window.confirm(
          'زمان ثبت‌شده کمتر از ۱ دقیقه است. آیا حداقل ۱ دقیقه کارکرد ثبت شود؟',
        )
      ) {
        setTimerRunning(false);
        setTimerSeconds(0);
        return;
      }
    }

    try {
      const minutesToLog = Math.max(Math.round(timerSeconds / 60), 1);
      const created = await apiClient.createWorkLog({
        entityType: timerEntityType,
        entityId: `act-${Date.now()}`,
        entityTitle: timerTitle.trim(),
        durationMinutes: minutesToLog,
        description: 'ثبت خودکار از طریق تایمر کارکرد',
        isBillable: true,
      });

      setLogs((prev) => [created, ...prev]);
      setTimerRunning(false);
      setTimerSeconds(0);
      setTimerTitle('');
      onNotify?.(`کارکرد ${minutesToLog} دقیقه‌ای با موفقیت ثبت گردید`, 'success');
      loadData();
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در ثبت زمان تایمر', 'error');
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) return;

    const totalMinutes = Number(modalHours) * 60 + Number(modalMinutes);
    if (totalMinutes <= 0) {
      onNotify?.('مدت زمان ثبت‌شده باید بیشتر از صفر باشد', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const req: CreateWorkLogRequest = {
        entityType: modalEntityType,
        entityId: `item-${Date.now()}`,
        entityTitle: modalTitle.trim(),
        durationMinutes: totalMinutes,
        description: modalDesc.trim() || 'ثبت کارکرد دستی',
        isBillable: modalBillable,
        loggedDate: modalDate,
      };

      const created = await apiClient.createWorkLog(req);
      setLogs((prev) => [created, ...prev]);
      setIsModalOpen(false);
      setModalTitle('');
      setModalDesc('');
      setModalHours('1');
      setModalMinutes('0');
      onNotify?.(`کارکرد «${created.entityTitle}» با موفقیت ثبت شد`, 'success');
      loadData();
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در ثبت کارکرد', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!window.confirm('آیا از حذف این رکورد کارکرد اطمینان دارید؟')) return;

    try {
      await apiClient.deleteWorkLog(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
      onNotify?.('رکورد کارکرد با موفقیت حذف شد', 'success');
      loadData();
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در حذف کارکرد', 'error');
    }
  };

  const formatTimerDigits = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDurationDisplay = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins} دقیقه`;
    if (mins === 0) return `${hrs} ساعت`;
    return `${hrs} ساعت و ${mins} دقیقه`;
  };

  return (
    <div
      className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-6 space-y-6"
      data-testid="time-tracking-view"
    >
      {/* Header */}
      <header className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>⏱️</span>
            <span>مدیریت زمان کاری و لاگ کارکردها (Time Tracking & Work Logs)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            ثبت زمان کار با تایمر هوشمند، محاسبه ساعات قابل فاکتور و تجمیع کارکرد هفتگی تیم
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          data-testid="manual-log-btn"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow"
        >
          <span>+</span>
          <span>ثبت کارکرد دستی</span>
        </button>
      </header>

      {/* Live Timer Floating Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex flex-1 items-center gap-3 min-w-[280px]">
          <span className="text-2xl animate-pulse">⏳</span>
          <div className="flex-1 flex gap-2">
            <select
              value={timerEntityType}
              onChange={(e) => setTimerEntityType(e.target.value as WorkLogEntityType)}
              className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
            >
              <option value="TASK">وظیفه (Task)</option>
              <option value="PROJECT">پروژه (Project)</option>
              <option value="TICKET">تیکت پشتیبانی (Ticket)</option>
            </select>
            <input
              type="text"
              value={timerTitle}
              onChange={(e) => setTimerTitle(e.target.value)}
              placeholder="عنوان کاری که در حال انجام آن هستید..."
              data-testid="timer-title-input"
              className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Digits & Controls */}
        <div className="flex items-center gap-4">
          <div
            className="font-mono text-xl font-extrabold text-emerald-400 bg-slate-950 px-4 py-1.5 rounded-lg border border-slate-800"
            data-testid="timer-display"
          >
            {formatTimerDigits(timerSeconds)}
          </div>

          <div className="flex gap-2">
            {!timerRunning ? (
              <button
                type="button"
                onClick={handleStartTimer}
                data-testid="start-timer-btn"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-colors flex items-center gap-1"
              >
                <span>▶</span>
                <span>شروع تایمر</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePauseTimer}
                data-testid="pause-timer-btn"
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold transition-colors flex items-center gap-1"
              >
                <span>⏸</span>
                <span>توقف موقت</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleStopAndLogTimer}
              disabled={timerSeconds === 0}
              data-testid="stop-timer-btn"
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded text-xs font-bold transition-colors flex items-center gap-1"
            >
              <span>⏹</span>
              <span>ثبت کارکرد</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">کل ساعات کارکرد ثبت‌شده</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">
            {summary?.totalHours ?? 0}{' '}
            <span className="text-xs text-slate-500 font-normal">ساعت</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{summary?.totalMinutes ?? 0} دقیقه</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">ساعات قابل فاکتور (Billable)</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {summary?.billableHours ?? 0}{' '}
            <span className="text-xs text-slate-500 font-normal">ساعت</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {summary?.totalHours
              ? Math.round((summary.billableHours / summary.totalHours) * 100)
              : 0}
            ٪ راندمان تجاری
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">تعداد رکوردهای ثبت‌شده</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">
            {summary?.entriesCount ?? 0} رکورد
          </div>
          <div className="text-[11px] text-slate-500 mt-1">کارکرد روزانه تیم</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">میانگین کارکرد روزانه</div>
          <div className="text-2xl font-bold text-purple-400 mt-1">
            {summary?.dailyBreakdown.length
              ? (summary.totalHours / summary.dailyBreakdown.length).toFixed(1)
              : 0}{' '}
            <span className="text-xs text-slate-500 font-normal">ساعت</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            در {summary?.dailyBreakdown.length ?? 0} روز کاری
          </div>
        </div>
      </div>

      {/* Filter Tabs by Entity */}
      <div className="flex gap-2 text-xs">
        {[
          { id: 'ALL', label: 'همه کارکردها' },
          { id: 'TASK', label: 'وظایف (Tasks)' },
          { id: 'PROJECT', label: 'پروژه‌ها (Projects)' },
          { id: 'TICKET', label: 'تیکت‌ها (Tickets)' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setEntityFilter(tab.id as any)}
            data-testid={`filter-tab-${tab.id}`}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              entityFilter === tab.id
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Work Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">در حال بارگذاری لاگ‌ها...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            رکوردی برای کارکرد ثبت نشده است.
          </div>
        ) : (
          <table className="w-full text-right text-xs divide-y divide-slate-800">
            <thead className="bg-slate-800/70 text-slate-400 font-semibold">
              <tr>
                <th className="px-4 py-3">تاریخ</th>
                <th className="px-4 py-3">کاربر</th>
                <th className="px-4 py-3">نوع کار</th>
                <th className="px-4 py-3">موضوع و عنوان رکورد</th>
                <th className="px-4 py-3">شرح کار انجام‌شده</th>
                <th className="px-4 py-3">مدت زمان</th>
                <th className="px-4 py-3">نوع فاکتور</th>
                <th className="px-4 py-3 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60" data-testid="worklogs-tbody">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  data-testid={`worklog-row-${log.id}`}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-slate-400">{log.loggedDate}</td>
                  <td className="px-4 py-3 font-medium text-slate-200">{log.userName}</td>
                  <td className="px-4 py-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-indigo-300 font-mono">
                      {log.entityType}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-200">{log.entityTitle}</td>
                  <td className="px-4 py-3 text-slate-400 line-clamp-1 max-w-xs">{log.description}</td>
                  <td className="px-4 py-3 font-bold text-emerald-400 font-mono">
                    {formatDurationDisplay(log.durationMinutes)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.isBillable
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {log.isBillable ? 'قابل فاکتور' : 'داخلی'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteLog(log.id)}
                      data-testid={`delete-log-btn-${log.id}`}
                      className="px-2 py-1 rounded bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[11px] transition-colors"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Manual Time Log Modal */}
      {isModalOpen && (
        <div
          className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          data-testid="create-worklog-modal"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base">ثبت کارکرد دستی (Manual Work Log)</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">نوع موجودیت</label>
                <select
                  value={modalEntityType}
                  onChange={(e) => setModalEntityType(e.target.value as WorkLogEntityType)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="TASK">وظیفه (Task)</option>
                  <option value="PROJECT">پروژه (Project)</option>
                  <option value="TICKET">تیکت پشتیبانی (Ticket)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">عنوان کار یا آیتم *</label>
                <input
                  type="text"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="مثال: رفع باگ امنیتی در لاگین"
                  data-testid="worklog-title-input"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">ساعت</label>
                  <input
                    type="number"
                    min={0}
                    max={24}
                    value={modalHours}
                    onChange={(e) => setModalHours(e.target.value)}
                    data-testid="worklog-hours-input"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">دقیقه</label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    step={5}
                    value={modalMinutes}
                    onChange={(e) => setModalMinutes(e.target.value)}
                    data-testid="worklog-minutes-input"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">تاریخ کارکرد</label>
                <input
                  type="date"
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">توضیحات تکمیلی</label>
                <textarea
                  rows={3}
                  value={modalDesc}
                  onChange={(e) => setModalDesc(e.target.value)}
                  placeholder="گزارش مختصری از اقدامات انجام‌شده..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isBillableCheck"
                  checked={modalBillable}
                  onChange={(e) => setModalBillable(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500"
                />
                <label htmlFor="isBillableCheck" className="text-xs text-slate-300 cursor-pointer">
                  کارکرد قابل صورت‌حساب به مشتری (Billable)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  data-testid="submit-worklog-btn"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow"
                >
                  {submitting ? 'در حال ثبت...' : 'ثبت کارکرد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TimeTrackingView;
