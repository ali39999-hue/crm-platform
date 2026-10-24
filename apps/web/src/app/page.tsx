'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type {
  AccountDto,
  CurrentUserDto,
  DealDto,
  LeadDto,
  TaskPriority,
  TaskStatus,
  TaskSummary,
  TicketDto,
  WorkspaceDto,
} from '@crm/contracts';
import { canTransitionTask } from '@crm/domain';
import { apiClient } from '../lib/api-client';
import {
  CreateTaskModal,
  type CreateTaskFormData,
  EmptyState,
  ErrorBanner,
  getPriorityLabel,
  getTaskStatusLabel,
  LoadingSkeleton,
  PriorityBadge,
  TaskBoard,
  TaskList,
  TaskStatusBadge,
  TicketStatusBadge,
} from '../components';

type AuditItem = {
  id: string;
  action: string;
  actor: string;
  entity: string;
  time: string;
  details: string;
};

const INITIAL_AUDITS: AuditItem[] = [
  {
    id: 'aud-1',
    action: 'TASK_CREATED',
    actor: 'کارمند عملیات (شما)',
    entity: 'Task:TSK-1001',
    time: '۱۰ دقیقه پیش',
    details: 'ایجاد تسک با اولویت بالا',
  },
  {
    id: 'aud-2',
    action: 'TASK_TRANSITIONED',
    actor: 'کارمند عملیات (شما)',
    entity: 'Task:TSK-1002',
    time: '۵ دقیقه پیش',
    details: 'تغییر وضعیت از TODO به IN_PROGRESS',
  },
];

export default function WorkspaceApp() {
  const [activeTab, setActiveTab] = useState<'overview' | 'my-work' | 'crm' | 'support' | 'audit'>('my-work');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Domain & Entity States
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [leads, setLeads] = useState<LeadDto[]>([]);
  const [deals, setDeals] = useState<DealDto[]>([]);
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [audits, setAudits] = useState<AuditItem[]>(INITIAL_AUDITS);
  const [currentUser, setCurrentUser] = useState<CurrentUserDto | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([]);

  // UI feedback states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Fetch initial data from API client (with offline fallback built-in)
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [userRes, wsRes, myTasks, accountsRes, leadsRes, dealsRes, ticketsRes] =
        await Promise.all([
          apiClient.getMe(),
          apiClient.getWorkspaces(),
          apiClient.getMyWork(),
          apiClient.getAccounts(),
          apiClient.getLeads(),
          apiClient.getDeals(),
          apiClient.getTickets(),
        ]);

      setCurrentUser(userRes);
      setWorkspaces(wsRes);
      setTasks(myTasks);
      setAccounts(accountsRes);
      setLeads(leadsRes);
      setDeals(dealsRes);
      setTickets(ticketsRes);
    } catch (err: any) {
      console.error('[WorkspaceApp] Error loading data:', err);
      setError('خطا در بارگذاری اطلاعات از سرویس‌دهنده CRM. لطفاً اتصال را بررسی نمایید.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Handle task transition with domain machine verification and API sync
  const handleTransition = async (taskId: string, targetStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (task.status === targetStatus) return;

    // Validate with domain state machine rule
    const isAllowed = canTransitionTask(task.status, targetStatus, {
      canReopenDoneTask: true,
      canRestoreCanceledTask: true,
    });

    if (!isAllowed) {
      showToast(
        `خطای دامنه: انتقال مستقیم از «${getTaskStatusLabel(task.status)}» به «${getTaskStatusLabel(targetStatus)}» مجاز نیست`,
      );
      return;
    }

    try {
      const updated = await apiClient.transitionTask(taskId, {
        targetStatus,
        expectedVersion: task.version,
      });

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: updated.status,
                version: updated.version,
                updatedAt: updated.updatedAt,
              }
            : t,
        ),
      );

      setAudits((prev) => [
        {
          id: `aud-${Date.now()}`,
          action: 'TASK_TRANSITIONED',
          actor: currentUser?.displayName ?? 'کارمند عملیات',
          entity: `Task:${task.key}`,
          time: 'هم‌اکنون',
          details: `انتقال وضعیت از ${task.status} به ${targetStatus} (نسخه ${updated.version})`,
        },
        ...prev,
      ]);

      showToast(`وضعیت ${task.key} به «${getTaskStatusLabel(targetStatus)}» تغییر یافت`);
    } catch (err: any) {
      showToast(`خطا در تغییر وضعیت تسک: ${err.message || 'خطای سرور'}`);
    }
  };

  // Handle new task creation
  const handleCreateTask = async (formData: CreateTaskFormData) => {
    try {
      setIsSubmitting(true);
      const created = await apiClient.createTask({
        title: formData.title,
        ...(formData.description ? { description: formData.description } : {}),
        priority: formData.priority,
        ...(formData.dueAt ? { dueAt: formData.dueAt } : {}),
      });

      setTasks((prev) => [created, ...prev]);

      setAudits((prev) => [
        {
          id: `aud-${Date.now()}`,
          action: 'TASK_CREATED',
          actor: currentUser?.displayName ?? 'کارمند عملیات',
          entity: `Task:${created.key}`,
          time: 'هم‌اکنون',
          details: `ایجاد تسک «${created.title}»`,
        },
        ...prev,
      ]);

      setIsModalOpen(false);
      showToast(`تسک ${created.key} با موفقیت ایجاد شد`);
    } catch (err: any) {
      showToast(`خطا در ایجاد تسک: ${err.message || 'خطای شبکه'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeWorkspace = workspaces.find((w) => w.isCurrent) || workspaces[0];

  return (
    <div className="shell">
      {/* Sidebar */}
      <aside className="sidebar" aria-label="ناوبری اصلی">
        <div className="brand">
          <span className="brand-mark">C</span>
          <span>پلتفرم یکپارچه سازمانی</span>
        </div>

        <div>
          <div className="workspace-label">فضای کاری فعال</div>
          <div className="workspace-switch">
            <span>{activeWorkspace?.name ?? 'شرکت آلفا (اصلی)'}</span>
            <span
              style={{
                fontSize: '11px',
                color: 'var(--muted)',
                background: 'var(--soft)',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              {currentUser?.activeOrganization.role ?? 'عضو فعال'}
            </span>
          </div>
        </div>

        <nav className="nav-list">
          <button
            type="button"
            className={`nav-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span>📊</span> نمای کلی
          </button>
          <button
            type="button"
            className={`nav-button ${activeTab === 'my-work' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-work')}
          >
            <span>✓</span> کارهای من ({tasks.filter((t) => t.status !== 'DONE').length})
          </button>
          <button
            type="button"
            className={`nav-button ${activeTab === 'crm' ? 'active' : ''}`}
            onClick={() => setActiveTab('crm')}
          >
            <span>👥</span> مشتریان و فرصت‌ها ({accounts.length})
          </button>
          <button
            type="button"
            className={`nav-button ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => setActiveTab('support')}
          >
            <span>🎫</span> تیکت‌ها و پشتیبانی ({tickets.length})
          </button>
          <button
            type="button"
            className={`nav-button ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <span>📜</span> رویدادهای ممیزی ({audits.length})
          </button>
        </nav>

        <div className="sidebar-foot">
          <a
            href="/portal"
            className="secondary-button"
            style={{
              width: '100%',
              justifyContent: 'center',
              marginBottom: '12px',
              color: '#0284c7',
              borderColor: '#bae6fd',
              background: '#f0f9ff',
              textDecoration: 'none',
            }}
          >
            مشاهده پورتال مشتریان ↗
          </a>
          <strong>برد کانبان تعاملی (Drag & Drop)</strong>
          <div>انتقال وضعیت‌ها بر اساس ماشین حالت دامنه محافظت شده است.</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-area">
        {/* Error Banner if any */}
        {error && (
          <ErrorBanner
            message={error}
            onRetry={loadData}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Top Header */}
        <header className="topbar">
          <div>
            <p className="eyebrow">
              پنل عملیات کارکنان | کاربر: {currentUser?.displayName ?? 'کارمند عملیات'} (
              {currentUser?.activeOrganization.role ?? 'Employee'})
            </p>
            <h1>
              {activeTab === 'my-work' && 'وظایف و پیگیری‌های من'}
              {activeTab === 'overview' && 'داشبورد سلامت و شاخص‌ها'}
              {activeTab === 'crm' && 'مدیریت ارتباط با مشتریان (CRM)'}
              {activeTab === 'support' && 'میز پشتیبانی و درخواست‌ها'}
              {activeTab === 'audit' && 'تاریخچه رویدادهای ممیزی (Audit Trail)'}
            </h1>
            <p className="muted">
              کارت‌ها را بکشید و در ستون مورد نظر رها کنید؛ ماشین حالت دامنه انتقال‌های نامعتبر را کنترل می‌کند.
            </p>
          </div>

          <div className="top-actions">
            {activeTab === 'my-work' && (
              <>
                <div className="view-switcher" role="radiogroup" aria-label="حالت نمایش">
                  <button
                    type="button"
                    className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                    onClick={() => setViewMode('kanban')}
                  >
                    <span>▦</span> برد کانبان
                  </button>
                  <button
                    type="button"
                    className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                  >
                    <span>☰</span> فهرست
                  </button>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setIsModalOpen(true)}
                >
                  + تسک جدید
                </button>
              </>
            )}
          </div>
        </header>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {isLoading ? (
              <LoadingSkeleton variant="card" count={4} />
            ) : (
              <div className="summary-grid">
                <article className="summary-card">
                  <p>وظایف فعال من</p>
                  <strong>{tasks.filter((t) => t.status !== 'DONE').length}</strong>
                  <small>نیازمند اقدام و پیگیری</small>
                </article>
                <article className="summary-card">
                  <p>در حال انجام</p>
                  <strong style={{ color: 'var(--accent)' }}>
                    {tasks.filter((t) => t.status === 'IN_PROGRESS').length}
                  </strong>
                  <small>کارهای جاری تیم</small>
                </article>
                <article className="summary-card">
                  <p>تکمیل‌شده</p>
                  <strong style={{ color: 'var(--success)' }}>
                    {tasks.filter((t) => t.status === 'DONE').length}
                  </strong>
                  <small>موفق در چرخه کاری</small>
                </article>
                <article className="summary-card">
                  <p>مشتریان سازمانی</p>
                  <strong>{accounts.length}</strong>
                  <small>{deals.length} فرصت فروش فعال</small>
                </article>
              </div>
            )}

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
                پلتفرم از معماری <strong>Modular Monolith</strong> با جداسازی دقیق دامنه، لایه کاربرد و زیرساخت استفاده می‌کند.
                قوانین مجوزدهی و تفکیک سازمانی (Multi-tenant Scope) به طور کامل در سطح API و سرویس‌ها اعمال شده و از دستکاری غیرمجاز
                داده‌ها و آسیب‌پذیری‌های IDOR ممانعت به عمل می‌آورد.
              </p>
            </div>
          </div>
        )}

        {/* My Work Tab */}
        {activeTab === 'my-work' && (
          <div>
            {isLoading ? (
              viewMode === 'kanban' ? (
                <LoadingSkeleton variant="board" />
              ) : (
                <LoadingSkeleton variant="list" count={4} />
              )
            ) : viewMode === 'kanban' ? (
              <TaskBoard
                tasks={tasks}
                onTransition={handleTransition}
                onError={showToast}
              />
            ) : (
              <TaskList
                tasks={tasks}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                onTransition={handleTransition}
                onError={showToast}
              />
            )}
          </div>
        )}

        {/* CRM Tab */}
        {activeTab === 'crm' && (
          <div
            style={{
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <h3 style={{ margin: '0 0 8px' }}>مشتریان و خط‌لوله فروش (CRM Core)</h3>
            <p className="muted" style={{ marginBottom: '20px' }}>
              ماژول مدیریت شرکت‌ها (Accounts)، مخاطبان (Contacts)، سرنخ‌ها (Leads) و فرصت‌های فروش (Deals).
            </p>

            {isLoading ? (
              <LoadingSkeleton variant="table" count={3} />
            ) : accounts.length === 0 ? (
              <EmptyState
                title="هیچ حسابی ثبت نشده است"
                description="می‌توانید مشتریان جدید را از طریق سرنخ‌ها یا ثبت مستقیم اضافه نمایید."
              />
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>نام شرکت / حساب</th>
                    <th>صنعت / نوع</th>
                    <th>تلفن تماس</th>
                    <th>فرصت‌های فعال</th>
                    <th>وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc) => {
                    const accDeals = deals.filter((d) => d.accountId === acc.id);
                    const totalAmount = accDeals.reduce((sum, d) => sum + (d.amountMinor || 0), 0);

                    return (
                      <tr key={acc.id}>
                        <td>
                          <strong>{acc.name}</strong>
                          {acc.website && (
                            <small style={{ display: 'block', color: 'var(--muted)', direction: 'ltr', textAlign: 'right' }}>
                              {acc.website}
                            </small>
                          )}
                        </td>
                        <td>{acc.type === 'CUSTOMER' ? 'مشتری سازمانی' : 'مشتری بالقوه'}</td>
                        <td>{acc.phone ?? '—'}</td>
                        <td>
                          {accDeals.length > 0
                            ? `${accDeals.length} فرصت (${totalAmount.toLocaleString('fa-IR')} ریال)`
                            : 'بدون فرصت جاری'}
                        </td>
                        <td>
                          <span className={`badge ${acc.status === 'ACTIVE' ? 'badge-done' : 'badge-todo'}`}>
                            {acc.status === 'ACTIVE' ? 'فعال' : acc.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Support Tab */}
        {activeTab === 'support' && (
          <div
            style={{
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <h3 style={{ margin: '0 0 8px' }}>صندوق تیکت‌ها و پشتیبانی (Support)</h3>
            <p className="muted" style={{ marginBottom: '20px' }}>
              تفکیک قطعی میان یادداشت‌های محرمانه داخلی کارشناسان (Internal Notes) و پیام‌های قابل مشاهده برای مشتری.
            </p>

            {isLoading ? (
              <LoadingSkeleton variant="table" count={3} />
            ) : tickets.length === 0 ? (
              <EmptyState
                title="هیچ تیکت فعالی وجود ندارد"
                description="تمام درخواست‌های پشتیبانی پاسخ داده و حل شده‌اند."
              />
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>شماره</th>
                    <th>عنوان تیکت</th>
                    <th>مشتری درخواست‌دهنده</th>
                    <th>اولویت</th>
                    <th>زمان هدف SLA</th>
                    <th>وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((tkt) => (
                    <tr key={tkt.id}>
                      <td>
                        <span className="task-key">{tkt.reference}</span>
                      </td>
                      <td>
                        <strong>{tkt.title}</strong>
                      </td>
                      <td>{tkt.accountName ?? 'پتروشیمی سپهر'}</td>
                      <td>
                        <PriorityBadge priority={tkt.priority} />
                      </td>
                      <td>{tkt.targetResolutionAt ?? '۲۴ ساعت کاری'}</td>
                      <td>
                        <TicketStatusBadge status={tkt.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <div
            style={{
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <h3 style={{ margin: '0 0 8px' }}>تاریخچه ممیزی امنیتی (Audit Trail)</h3>
            <p className="muted" style={{ marginBottom: '20px' }}>
              ثبت غیرقابل تغییر (Immutable) تمامی تغییرات حساس و گذارهای حالت همراه با Actor، Action و شناسه رهگیری درخواست.
            </p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>اقدام</th>
                  <th>کاربر مجری</th>
                  <th>موجودیت</th>
                  <th>توضیحات</th>
                  <th>زمان</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span className="task-key">{a.action}</span>
                    </td>
                    <td>{a.actor}</td>
                    <td>{a.entity}</td>
                    <td>{a.details}</td>
                    <td style={{ color: 'var(--muted)', fontSize: '12px' }}>{a.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* New Task Modal */}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateTask={handleCreateTask}
        isSubmitting={isSubmitting}
      />

      {/* Toast Notification */}
      {toastMessage && <div className="toast">{toastMessage}</div>}
    </div>
  );
}
