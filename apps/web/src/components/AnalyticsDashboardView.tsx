'use client';

import React, { useState, useEffect } from 'react';
import type {
  AnalyticsTimeframe,
  CustomReportQueryDto,
  CustomReportResultDto,
  DashboardKpiReport,
} from '@crm/contracts';
import { apiClient } from '../lib/api-client';

interface AnalyticsDashboardViewProps {
  reports: DashboardKpiReport | null;
  onRefresh?: () => void;
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export function AnalyticsDashboardView({
  reports,
  onRefresh,
  onNotify,
}: AnalyticsDashboardViewProps) {
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('MONTH');
  const [customMetric, setCustomMetric] = useState<'DEALS' | 'LEADS' | 'TASKS' | 'TICKETS'>('DEALS');
  const [customGroupBy, setCustomGroupBy] = useState<'STATUS' | 'STAGE' | 'PRIORITY'>('STAGE');
  const [customReport, setCustomReport] = useState<CustomReportResultDto | null>(null);
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Fetch custom report when controls change
  useEffect(() => {
    let active = true;
    setLoadingCustom(true);

    apiClient
      .getCustomReport({
        metric: customMetric,
        groupBy: customGroupBy,
        timeframe,
      })
      .then((res) => {
        if (active) setCustomReport(res);
      })
      .catch((err) => {
        if (active) onNotify?.(err?.message || 'خطا در بارگذاری گزارش سفارشی', 'error');
      })
      .finally(() => {
        if (active) setLoadingCustom(false);
      });

    return () => {
      active = false;
    };
  }, [customMetric, customGroupBy, timeframe]);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const res = await apiClient.exportReport({
        metric: customMetric,
        groupBy: customGroupBy,
        timeframe,
      });

      // Trigger client-side download
      const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', res.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onNotify?.(`فایل «${res.filename}» با موفقیت دانلود و در لاگ ممیزی ثبت شد`, 'success');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در خروجی گزارش', 'error');
    } finally {
      setExporting(false);
    }
  };

  const funnel = reports?.crmFunnel;
  const sla = reports?.supportSla;
  const workload = reports?.workload ?? [];

  return (
    <div
      className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-6 space-y-6"
      data-testid="analytics-dashboard-view"
    >
      {/* Header with Title and Timeframe Selector */}
      <header className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>📈</span>
            <span>داشبورد هوش تجاری و شاخص‌های کلیدی عملکرد (BI & Analytics)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            پایش لحظه‌ای خطوط فروش، تعهدات سطح خدمات (SLA)، تعادل بار کاری تیم و گزارش‌ساز پویا
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe selector */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs font-medium">
            {[
              { id: 'WEEK', label: 'هفته جاری' },
              { id: 'MONTH', label: 'ماه جاری' },
              { id: 'QUARTER', label: 'فصل جاری' },
              { id: 'YEAR', label: 'سالانه' },
            ].map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => setTimeframe(tf.id as AnalyticsTimeframe)}
                className={`px-3 py-1 rounded transition-colors ${
                  timeframe === tf.id
                    ? 'bg-indigo-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onRefresh}
            data-testid="refresh-analytics-btn"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <span>🔄</span>
            <span>تازه‌سازی داده‌ها</span>
          </button>
        </div>
      </header>

      {/* Primary KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Funnel Conversion */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>نرخ تبدیل سرنخ (Funnel)</span>
            <span className="text-indigo-400 font-bold">هدف: ۳۰٪</span>
          </div>
          <div className="text-2xl font-extrabold text-indigo-400">
            {funnel?.conversionRatePercent ?? 0}٪
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(funnel?.conversionRatePercent ?? 0, 100)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 flex justify-between">
            <span>تبدیل‌شده: {funnel?.convertedLeads ?? 0}</span>
            <span>کل سرنخ‌ها: {funnel?.totalLeads ?? 0}</span>
          </div>
        </div>

        {/* Card 2: Pipeline Value */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>ارزش کل پایپ‌لاین فروش</span>
            <span className="text-emerald-400 font-bold">معاملات فعال</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">
            {((funnel?.totalDealsValue ?? 0) / 1000000).toLocaleString('fa-IR')}{' '}
            <span className="text-xs text-slate-400 font-normal">میلیون ریال</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{
                width: `${
                  funnel?.totalDealsValue
                    ? Math.min((funnel.weightedPipelineValue / funnel.totalDealsValue) * 100, 100)
                    : 0
                }%`,
              }}
            />
          </div>
          <div className="text-[11px] text-slate-500 flex justify-between">
            <span>
              وزنی:{' '}
              {((funnel?.weightedPipelineValue ?? 0) / 1000000).toLocaleString('fa-IR')} م.ر
            </span>
            <span>احتمال تحقق</span>
          </div>
        </div>

        {/* Card 3: Support SLA */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>نرخ نقض تعهدات (SLA Breach)</span>
            <span className="text-amber-400 font-bold">
              {sla?.slaBreachRatePercent === 0 ? 'عالی' : 'نیاز به توجه'}
            </span>
          </div>
          <div
            className={`text-2xl font-extrabold ${
              (sla?.slaBreachRatePercent ?? 0) > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {sla?.slaBreachRatePercent ?? 0}٪
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full ${
                (sla?.slaBreachRatePercent ?? 0) > 0 ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(sla?.slaBreachRatePercent ?? 0, 100)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 flex justify-between">
            <span>تیکت‌های در دست اقدام: {sla?.openTickets ?? 0}</span>
            <span>میانگین حل: {sla?.averageResolutionHours ?? 4.5} ساعت</span>
          </div>
        </div>

        {/* Card 4: Team Output */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>تکمیل وظایف تیم</span>
            <span className="text-blue-400 font-bold">عملیات</span>
          </div>
          <div className="text-2xl font-extrabold text-blue-400">
            {workload.reduce((sum, w) => sum + w.completedTasksCount, 0)}{' '}
            <span className="text-xs text-slate-400 font-normal">تسک انجام‌شده</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '80%' }} />
          </div>
          <div className="text-[11px] text-slate-500 flex justify-between">
            <span>وظایف در جریان: {workload.reduce((sum, w) => sum + w.activeTasksCount, 0)}</span>
            <span>سررسیدگذشته: {workload.reduce((sum, w) => sum + w.overdueTasksCount, 0)}</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Funnel Stages Progress & Workload Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual Sales Funnel Stages */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span>📊</span>
              <span>مراحل فرصت‌های تجاری و خطوط فروش (Pipeline Stages)</span>
            </span>
            <span className="text-xs text-slate-400 font-normal">
              مجموع: {funnel?.stagesBreakdown.reduce((sum, s) => sum + s.count, 0) ?? 0} فرصت
            </span>
          </h3>

          <div className="space-y-3 pt-2">
            {funnel?.stagesBreakdown.map((stg) => {
              const totalDeals =
                funnel.stagesBreakdown.reduce((sum, s) => sum + s.count, 0) || 1;
              const pct = Math.round((stg.count / totalDeals) * 100);

              return (
                <div key={stg.stage} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-200">{stg.stage}</span>
                    <span className="text-slate-400">
                      {stg.count} معامله •{' '}
                      <strong>{(stg.amount / 1000000).toLocaleString('fa-IR')}</strong> م.ر ({pct}
                      ٪)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Workload Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
            <span>👥</span>
            <span>تعادل بار کاری اعضای تیم (Team Workload Distribution)</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs divide-y divide-slate-800">
              <thead className="text-slate-400 font-semibold bg-slate-800/50">
                <tr>
                  <th className="px-3 py-2">کاربر مسئول</th>
                  <th className="px-3 py-2">وظایف فعال</th>
                  <th className="px-3 py-2 text-rose-400">معوقه (Overdue)</th>
                  <th className="px-3 py-2 text-emerald-400">تکمیل‌شده</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {workload.map((w) => (
                  <tr key={w.userId} className="hover:bg-slate-800/30">
                    <td className="px-3 py-2 font-medium text-slate-200">{w.userName}</td>
                    <td className="px-3 py-2">{w.activeTasksCount}</td>
                    <td className="px-3 py-2 text-rose-400 font-bold">{w.overdueTasksCount}</td>
                    <td className="px-3 py-2 text-emerald-400">{w.completedTasksCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Section: Custom Report Builder & Visual Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <span>🔍</span>
              <span>گزارش‌ساز پویا و تحلیل چندبُعدی (Report Builder Widget)</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              ترکیب شاخص‌ها، دسته‌بندی داده‌ها و دریافت فایل استاندارد اکسل/CSV
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Metric Select */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>شاخص:</span>
              <select
                value={customMetric}
                onChange={(e) =>
                  setCustomMetric(e.target.value as 'DEALS' | 'LEADS' | 'TASKS' | 'TICKETS')
                }
                data-testid="report-metric-select"
                className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
              >
                <option value="DEALS">معاملات و فروش (Deals)</option>
                <option value="LEADS">سرنخ‌ها (Leads)</option>
                <option value="TASKS">وظایف و پیگیری‌ها (Tasks)</option>
                <option value="TICKETS">تیکت‌های پشتیبانی (Tickets)</option>
              </select>
            </div>

            {/* GroupBy Select */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>دسته‌بندی:</span>
              <select
                value={customGroupBy}
                onChange={(e) =>
                  setCustomGroupBy(e.target.value as 'STATUS' | 'STAGE' | 'PRIORITY')
                }
                data-testid="report-groupby-select"
                className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
              >
                <option value="STAGE">مرحله پیشرفت (Stage)</option>
                <option value="STATUS">وضعیت (Status)</option>
                <option value="PRIORITY">اولویت (Priority)</option>
              </select>
            </div>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={exporting}
              data-testid="export-report-btn"
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-medium transition-colors flex items-center gap-1.5 shadow"
            >
              <span>📥</span>
              <span>{exporting ? 'در حال صدور...' : 'خروجی اکسل / CSV'}</span>
            </button>
          </div>
        </div>

        {/* Custom Report Results */}
        {loadingCustom ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            در حال پردازش داده‌های گزارش...
          </div>
        ) : !customReport || customReport.groups.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            داده‌ای برای ترکیب شاخص انتخابی یافت نشد.
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            <div className="flex justify-between items-center text-xs text-slate-400 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
              <span>
                تعداد کل رکوردها: <strong>{customReport.totalCount}</strong>
              </span>
              {customReport.totalValue !== undefined && (
                <span>
                  ارزش تجمیعی:{' '}
                  <strong>{(customReport.totalValue / 1000000).toLocaleString('fa-IR')}</strong>{' '}
                  میلیون ریال
                </span>
              )}
              <span>بازه زمانی: {customReport.timeframe}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="custom-report-groups">
              {customReport.groups.map((grp) => (
                <div
                  key={grp.key}
                  className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg space-y-1.5"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-200">{grp.label}</span>
                    <span className="text-slate-300 font-mono">
                      {grp.count} مورد ({grp.percentage}٪)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full"
                      style={{ width: `${Math.max(grp.percentage, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalyticsDashboardView;
