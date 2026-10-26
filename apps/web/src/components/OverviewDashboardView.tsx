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

  return (
    <div className="space-y-6" data-testid="overview-dashboard-view">
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
          <small>{deals.length} فرصت فروش فعال</small>
        </article>
      </div>

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
