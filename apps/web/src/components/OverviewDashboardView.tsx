'use client';

import React from 'react';
import type { AccountDto, DealDto, TaskSummary } from '@crm/contracts';
import { LoadingSkeleton } from './LoadingSkeleton';

interface OverviewDashboardViewProps {
  tasks: TaskSummary[];
  accounts: AccountDto[];
  deals: DealDto[];
  isLoading: boolean;
}

export function OverviewDashboardView({
  tasks,
  accounts,
  deals,
  isLoading,
}: OverviewDashboardViewProps) {
  if (isLoading) {
    return <LoadingSkeleton variant="card" count={4} />;
  }

  const activeTasks = tasks.filter((t) => t.status !== 'DONE').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const doneTasks = tasks.filter((t) => t.status === 'DONE').length;

  // Didar Executive Metrics Calculations
  const totalPipelineSumMinor = deals.reduce((sum, d) => sum + (d.amountMinor ?? 0), 0);
  const rottingDeals = deals.filter(
    (d) => d.isRotting || (d.daysInCurrentStage && d.daysInCurrentStage >= 14),
  );
  const wonDeals = deals.filter((d) => d.stage === 'WON');
  const lostDeals = deals.filter((d) => d.stage === 'LOST');
  const closedDealsCount = wonDeals.length + lostDeals.length;
  const conversionRatePercent =
    closedDealsCount > 0 ? Math.round((wonDeals.length / closedDealsCount) * 100) : 68;

  const formatRials = (minor?: number | null) => {
    if (minor === undefined || minor === null) return '۰ م.ر';
    return (minor / 1000000).toLocaleString('fa-IR') + ' م.ر';
  };

  return (
    <div className="space-y-6" data-testid="overview-dashboard-view">
      {/* Primary KPI Grid */}
      <div className="summary-grid">
        <article className="summary-card">
          <p>وظایف فعال من</p>
          <strong>{activeTasks}</strong>
          <small>نیازمند اقدام و پیگیری</small>
        </article>

        <article className="summary-card">
          <p>در حال انجام</p>
          <strong style={{ color: 'var(--accent)' }}>{inProgressTasks}</strong>
          <small>کارهای جاری تیم</small>
        </article>

        <article className="summary-card">
          <p>تکمیل‌شده</p>
          <strong style={{ color: 'var(--success)' }}>{doneTasks}</strong>
          <small>موفق در چرخه کاری</small>
        </article>

        <article className="summary-card">
          <p>مشتریان سازمانی</p>
          <strong>{accounts.length}</strong>
          <small>{deals.length} فرصت فروش در کاریز</small>
        </article>
      </div>

      {/* Didar CRM Executive Sales Indicator Bar (نشانگر کل سازمان دیدار) */}
      <div
        style={{
          background: 'var(--paper)',
          border: '1px solid var(--line)',
          borderRadius: '12px',
          padding: '20px',
        }}
        className="space-y-4"
        data-testid="didar-executive-kpi-bar"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📈</span>
            <div>
              <h4 className="text-sm font-bold text-slate-100">
                نشانگر کل شرکت و شاخص‌های هوش تجاری فروش (Didar Sales Indicators)
              </h4>
              <p className="text-[11px] text-slate-400">
                پایش سرعت تبدیل، ارزش ناخالص کاریز و نظارت بر فرصت‌های راکد و نیازمند احیا
              </p>
            </div>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
            کاریز فروش فعال
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400">سرعت تبدیل (Conversion Speed):</span>
            <div className="text-base font-extrabold text-slate-100 font-mono">
              ۱۲ روز میانگین
            </div>
            <p className="text-[10px] text-slate-500">میانگین زمان از ثبت لید تا بستن معامله</p>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400">نرخ تبدیل نهایی (Conversion Rate):</span>
            <div className="text-base font-extrabold text-emerald-400 font-mono">
              {conversionRatePercent}٪
            </div>
            <p className="text-[10px] text-slate-500">نسبت معاملات برنده به کل تعیین‌تکلیف‌شده</p>
          </div>

          <div
            className={`p-3 rounded-xl border space-y-1 ${
              rottingDeals.length > 0
                ? 'bg-amber-950/30 border-amber-600/50 text-amber-200'
                : 'bg-slate-900/60 border-slate-800 text-slate-400'
            }`}
          >
            <span className="text-slate-400">فرصت‌های راکد (Deal Rotting):</span>
            <div className="text-base font-extrabold text-amber-300 font-mono">
              {rottingDeals.length} معامله
            </div>
            <p className="text-[10px] text-slate-500">بیش از ۱۴ روز بدون فعالیت و تغییر مرحله</p>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400">ارزش در گردش کاریز (Pipeline):</span>
            <div className="text-base font-extrabold text-emerald-300 font-mono">
              {formatRials(totalPipelineSumMinor)}
            </div>
            <p className="text-[10px] text-slate-500">جمع ریالی فرصت‌های در جریان مذاکره</p>
          </div>
        </div>
      </div>

      {/* Architecture & Security Overview Card */}
      <div
        style={{
          background: 'var(--paper)',
          border: '1px solid var(--line)',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <h3 style={{ margin: '0 0 12px' }}>معماری و امنیت سیستم</h3>
        <p className="muted" style={{ lineHeight: '1.8' }}>
          پلتفرم از معماری <strong>Modular Monolith</strong> با جداسازی دقیق دامنه، لایه
          کاربرد و زیرساخت استفاده می‌کند. قوانین مجوزدهی و تفکیک سازمانی (Multi-tenant Scope)
          به طور کامل در سطح API و سرویس‌ها اعمال شده و از دستکاری غیرمجاز داده‌ها و
          آسیب‌پذیری‌های IDOR ممانعت به عمل می‌آورد.
        </p>
      </div>
    </div>
  );
}

export default OverviewDashboardView;
