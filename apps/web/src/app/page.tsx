'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type {
  AccountDto,
  AutomationRuleDto,
  ContactDto,
  CurrentUserDto,
  DashboardKpiReport,
  DealDto,
  LeadDto,
  NotificationDto,
  SavedViewDto,
  SearchResultItem,
  TaskDetails,
  TaskPriority,
  TaskStatus,
  TaskSummary,
  TicketDto,
  WorkspaceDto,
} from '@crm/contracts';
import { canTransitionTask } from '@crm/domain';
import { apiClient } from '../lib/api-client';
import {
  CommandPalette,
  CreateTaskModal,
  type CreateTaskFormData,
  Customer360Drawer,
  DocumentsView,
  EmptyState,
  ErrorBanner,
  getPriorityLabel,
  getTaskStatusLabel,
  LoadingSkeleton,
  PriorityBadge,
  TaskBoard,
  TaskList,
  TaskCalendar,
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
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'my-work'
    | 'crm'
    | 'support'
    | 'docs'
    | 'notifications'
    | 'reports'
    | 'automation'
    | 'audit'
  >('my-work');
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'calendar'>('kanban');

  // Domain & Entity States
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [contacts, setContacts] = useState<ContactDto[]>([]);
  const [leads, setLeads] = useState<LeadDto[]>([]);
  const [deals, setDeals] = useState<DealDto[]>([]);
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [reports, setReports] = useState<DashboardKpiReport | null>(null);
  const [rules, setRules] = useState<AutomationRuleDto[]>([]);
  const [audits, setAudits] = useState<AuditItem[]>(INITIAL_AUDITS);
  const [currentUser, setCurrentUser] = useState<CurrentUserDto | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([]);

  // Customer 360 Drawer state
  const [selectedAccount, setSelectedAccount] = useState<AccountDto | null>(null);
  const [isCustomerDrawerOpen, setIsCustomerDrawerOpen] = useState(false);

  // UI feedback states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeSavedView, setActiveSavedView] = useState<SavedViewDto | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Global Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isK =
        e.key === 'k' || e.key === 'K' || e.key.toLowerCase() === 'k' || e.code === 'KeyK';
      if ((e.ctrlKey || e.metaKey) && isK) {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectSearchResult = (item: SearchResultItem) => {
    setIsPaletteOpen(false);
    if (item.entityType === 'TASK') {
      setActiveTab('my-work');
      const foundTask = tasks.find((t) => t.id === item.id);
      if (foundTask) {
        showToast(`وظیفه «${foundTask.key} - ${foundTask.title}» انتخاب شد`);
      } else {
        showToast(`وظیفه «${item.title}» انتخاب شد`);
      }
    } else if (item.entityType === 'ACCOUNT') {
      setActiveTab('crm');
      const acc = accounts.find((a) => a.id === item.id);
      if (acc) {
        handleOpenCustomerDrawer(acc);
      } else {
        showToast(`حساب مشتری «${item.title}» انتخاب شد`);
      }
    } else if (item.entityType === 'CONTACT') {
      setActiveTab('crm');
      const contact = contacts.find((c) => c.id === item.id);
      if (contact?.accountId) {
        const acc = accounts.find((a) => a.id === contact.accountId);
        if (acc) {
          handleOpenCustomerDrawer(acc);
          return;
        }
      }
      showToast(`مخاطب «${item.title}» انتخاب شد`);
    } else if (item.entityType === 'LEAD') {
      setActiveTab('crm');
      showToast(`سرنخ فروش «${item.title}» انتخاب شد`);
    } else if (item.entityType === 'TICKET') {
      setActiveTab('support');
      showToast(
        `تیکت پشتیبانی «${item.subtitle ? `${item.subtitle} - ` : ''}${item.title}» انتخاب شد`,
      );
    }
  };

  const handleOpenCustomerDrawer = (acc: AccountDto) => {
    setSelectedAccount(acc);
    setIsCustomerDrawerOpen(true);
  };

  const handleContactCreated = (newContact: ContactDto) => {
    setContacts((prev) => [newContact, ...prev]);
  };

  const handleDealCreated = (newDeal: DealDto) => {
    setDeals((prev) => [newDeal, ...prev]);
  };

  const handleTaskCreatedFromDrawer = (newTask: TaskDetails) => {
    setTasks((prev) => [newTask, ...prev]);
    setAudits((prev) => [
      {
        id: `aud-${Date.now()}`,
        action: 'TASK_CREATED',
        actor: currentUser?.displayName ?? 'کارمند عملیات',
        entity: `Task:${newTask.key}`,
        time: 'هم‌اکنون',
        details: `ایجاد تسک «${newTask.title}» از پنجره ۳۶۰ مشتری`,
      },
      ...prev,
    ]);
  };

  const handleLeadConvertedFromDrawer = (leadId: string, accountId: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: 'CONVERTED', accountId } : l)),
    );
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
      showToast('اعلان به عنوان خوانده‌شده ثبت شد');
    } catch {
      showToast('خطا در به‌روزرسانی اعلان');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
      showToast('همه اعلان‌ها به عنوان خوانده‌شده علامت‌گذاری شدند');
    } catch {
      showToast('خطا در علامت‌گذاری اعلان‌ها');
    }
  };

  const handleToggleRule = async (id: string, currentEnabled: boolean) => {
    try {
      const updated = await apiClient.toggleAutomationRule(id, !currentEnabled);
      setRules((prev) => prev.map((r) => (r.id === id ? updated : r)));
      showToast(`قانون اتوماسیون ${!currentEnabled ? 'فعال' : 'غیرفعال'} شد`);
    } catch {
      showToast('خطا در تغییر وضعیت قانون اتوماسیون');
    }
  };

  // Fetch initial data from API client (with offline fallback built-in)
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        userRes,
        wsRes,
        myTasks,
        accountsRes,
        contactsRes,
        leadsRes,
        dealsRes,
        ticketsRes,
        notifsRes,
        reportsRes,
        rulesRes,
      ] = await Promise.all([
        apiClient.getMe(),
        apiClient.getWorkspaces(),
        apiClient.getMyWork(),
        apiClient.getAccounts(),
        apiClient.getContacts(),
        apiClient.getLeads(),
        apiClient.getDeals(),
        apiClient.getTickets(),
        apiClient.getNotifications(),
        apiClient.getDashboardKpi(),
        apiClient.getAutomationRules(),
      ]);

      setCurrentUser(userRes);
      setWorkspaces(wsRes);
      setTasks(myTasks);
      setAccounts(accountsRes);
      setContacts(contactsRes);
      setLeads(leadsRes);
      setDeals(dealsRes);
      setTickets(ticketsRes);
      setNotifications(notifsRes);
      setReports(reportsRes);
      setRules(rulesRes);
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
            data-testid="nav-overview"
          >
            <span>📊</span> نمای کلی
          </button>
          <button
            type="button"
            className={`nav-button ${activeTab === 'my-work' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-work')}
            data-testid="nav-my-work"
          >
            <span>✓</span> کارهای من ({tasks.filter((t) => t.status !== 'DONE').length})
          </button>
          <button
            type="button"
            className={`nav-button ${activeTab === 'crm' ? 'active' : ''}`}
            onClick={() => setActiveTab('crm')}
            data-testid="nav-crm"
          >
            <span>👥</span> مشتریان و فرصت‌ها ({accounts.length})
          </button>
          <button
            type="button"
            className={`nav-button ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => setActiveTab('support')}
            data-testid="nav-support"
          >
            <span>🎫</span> تیکت‌ها و پشتیبانی ({tickets.length})
          </button>
          <button
            type="button"
            className={`nav-button ${activeTab === 'docs' ? 'active' : ''}`}
            onClick={() => setActiveTab('docs')}
            data-testid="nav-docs"
          >
            <span>📚</span> پایگاه دانش و اسناد
          </button>
          <button
            type="button"
            className={`nav-button ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
            data-testid="nav-notifications"
          >
            <span>🔔</span> اعلان‌ها{' '}
            {notifications.filter((n) => !n.readAt).length > 0 &&
              `(${notifications.filter((n) => !n.readAt).length})`}
          </button>
          <button
            type="button"
            className={`nav-button ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
            data-testid="nav-reports"
          >
            <span>📈</span> گزارش‌ها و KPI
          </button>
          <button
            type="button"
            className={`nav-button ${activeTab === 'automation' ? 'active' : ''}`}
            onClick={() => setActiveTab('automation')}
            data-testid="nav-automation"
          >
            <span>⚙️</span> اتوماسیون‌ها ({rules.length})
          </button>
          <button
            type="button"
            className={`nav-button ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
            data-testid="nav-audit"
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
          <ErrorBanner message={error} onRetry={loadData} onDismiss={() => setError(null)} />
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
              {activeTab === 'notifications' && 'مرکز اعلان‌ها و رخدادها'}
              {activeTab === 'reports' && 'گزارش‌های عملکردی و شاخص‌های کلیدی (KPI)'}
              {activeTab === 'automation' && 'موتور قوانین اتوماسیون (Automation Rules)'}
              {activeTab === 'audit' && 'تاریخچه رویدادهای ممیزی (Audit Trail)'}
            </h1>
            <p className="muted">
              کارت‌ها را بکشید و در ستون مورد نظر رها کنید؛ ماشین حالت دامنه انتقال‌های نامعتبر را
              کنترل می‌کند.
            </p>
          </div>

          <div className="top-actions">
            <button
              type="button"
              className="topbar-search-trigger"
              data-testid="search-trigger-btn"
              onClick={() => setIsPaletteOpen(true)}
              title="جستجوی سراسری و پالت دستورات (Ctrl+K)"
              aria-label="جستجوی سراسری (Ctrl+K)"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>جستجو در سیستم...</span>
              </span>
              <kbd className="kbd-shortcut">Ctrl+K</kbd>
            </button>
            {activeTab === 'my-work' && (
              <>
                <div className="view-switcher" role="radiogroup" aria-label="حالت نمایش">
                  <button
                    type="button"
                    className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                    onClick={() => setViewMode('kanban')}
                    data-testid="view-btn-kanban"
                  >
                    <span>▦</span> برد کانبان
                  </button>
                  <button
                    type="button"
                    className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                    data-testid="view-btn-list"
                  >
                    <span>☰</span> فهرست
                  </button>
                  <button
                    type="button"
                    className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                    onClick={() => setViewMode('calendar')}
                    data-testid="view-btn-calendar"
                  >
                    <span>📅</span> تقویم
                  </button>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setIsModalOpen(true)}
                  data-testid="create-task-btn"
                >
                  + تسک جدید
                </button>
              </>
            )}
            {activeTab === 'notifications' && notifications.some((n) => !n.readAt) && (
              <button type="button" className="secondary-button" onClick={handleMarkAllAsRead}>
                ✓ خواندن همه اعلان‌ها
              </button>
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
                پلتفرم از معماری <strong>Modular Monolith</strong> با جداسازی دقیق دامنه، لایه
                کاربرد و زیرساخت استفاده می‌کند. قوانین مجوزدهی و تفکیک سازمانی (Multi-tenant Scope)
                به طور کامل در سطح API و سرویس‌ها اعمال شده و از دستکاری غیرمجاز داده‌ها و
                آسیب‌پذیری‌های IDOR ممانعت به عمل می‌آورد.
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
                activeSavedView={activeSavedView}
                onSelectSavedView={setActiveSavedView}
              />
            ) : viewMode === 'calendar' ? (
              <TaskCalendar
                tasks={tasks}
                onTransition={handleTransition}
                onSelectTask={(task) => showToast(`انتخاب تسک: ${task.key} - ${task.title}`)}
              />
            ) : (
              <TaskList
                tasks={tasks}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                onTransition={handleTransition}
                onError={showToast}
                activeSavedView={activeSavedView}
                onSelectSavedView={setActiveSavedView}
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
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <h3 style={{ margin: 0 }}>مشتریان و خط‌لوله فروش (CRM Core)</h3>
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--muted)',
                  background: 'var(--soft)',
                  padding: '4px 10px',
                  borderRadius: '8px',
                }}
              >
                💡 برای مشاهده نمای جامع ۳۶۰°، اطلاعات تماس، فرصت‌ها و تایم‌لاین، روی هر سطر کلیک
                کنید
              </span>
            </div>
            <p className="muted" style={{ marginBottom: '20px' }}>
              ماژول مدیریت شرکت‌ها (Accounts)، مخاطبان (Contacts)، سرنخ‌ها (Leads) و فرصت‌های فروش
              (Deals).
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
                    <th style={{ textAlign: 'center' }}>نمای ۳۶۰°</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc) => {
                    const accDeals = deals.filter((d) => d.accountId === acc.id);
                    const totalAmount = accDeals.reduce((sum, d) => sum + (d.amountMinor || 0), 0);

                    return (
                      <tr
                        key={acc.id}
                        className="table-row-clickable"
                        onClick={() => handleOpenCustomerDrawer(acc)}
                        title="برای مشاهده پرونده کامل ۳۶۰ درجه کلیک کنید"
                      >
                        <td>
                          <strong>{acc.name}</strong>
                          {acc.website && (
                            <small
                              style={{
                                display: 'block',
                                color: 'var(--muted)',
                                direction: 'ltr',
                                textAlign: 'right',
                              }}
                            >
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
                          <span
                            className={`badge ${acc.status === 'ACTIVE' ? 'badge-done' : 'badge-todo'}`}
                          >
                            {acc.status === 'ACTIVE' ? 'فعال' : acc.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="secondary-button"
                            style={{ fontSize: '11px', padding: '4px 10px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCustomerDrawer(acc);
                            }}
                          >
                            نمای ۳۶۰°
                          </button>
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
              تفکیک قطعی میان یادداشت‌های محرمانه داخلی کارشناسان (Internal Notes) و پیام‌های قابل
              مشاهده برای مشتری.
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

        {/* Documents Tab */}
        {activeTab === 'docs' && (
          <div style={{ height: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--line)' }}>
            <DocumentsView onNotify={(msg) => showToast(msg)} />
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div
            style={{
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 4px' }}>
                  اعلان‌ها و رخدادهای درون‌برنامه‌ای (In-App Notifications)
                </h3>
                <p className="muted" style={{ margin: 0 }}>
                  اعلان‌های خودکار حاصل از رویدادهای Outbox و تغییرات در وظایف و تیکت‌ها
                </p>
              </div>
            </div>

            {notifications.length === 0 ? (
              <EmptyState
                title="هیچ اعلانی ندارید"
                description="همه اعلان‌ها مشاهده و بررسی شده‌اند."
              />
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '14px 18px',
                      borderRadius: '10px',
                      border: '1px solid var(--line)',
                      background: n.readAt ? 'var(--canvas)' : 'var(--paper)',
                      borderRight: n.readAt ? '3px solid #cbd5e1' : '3px solid var(--accent)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: n.readAt ? 'normal' : '700',
                          fontSize: '14px',
                          marginBottom: '4px',
                        }}
                      >
                        {n.title}
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '13px' }}>{n.message}</div>
                      <small
                        style={{
                          color: '#94a3b8',
                          fontSize: '11px',
                          marginTop: '4px',
                          display: 'block',
                        }}
                      >
                        {new Date(n.createdAt).toLocaleTimeString('fa-IR')}
                      </small>
                    </div>
                    {!n.readAt && (
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ fontSize: '11px', padding: '6px 10px' }}
                        onClick={() => handleMarkAsRead(n.id)}
                      >
                        ✓ علامت به عنوان خوانده‌شده
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reports & KPI Tab */}
        {activeTab === 'reports' && (
          <div style={{ display: 'grid', gap: '24px' }}>
            {/* KPI Cards */}
            <div className="summary-grid">
              <article className="summary-card">
                <p>نرخ تبدیل سرنخ (Funnel)</p>
                <strong style={{ color: 'var(--accent)' }}>
                  {reports?.crmFunnel.conversionRatePercent ?? 0}٪
                </strong>
                <small>
                  {reports?.crmFunnel.convertedLeads ?? 0} از {reports?.crmFunnel.totalLeads ?? 0}{' '}
                  سرنخ
                </small>
              </article>
              <article className="summary-card">
                <p>ارزش کل پایپ‌لاین</p>
                <strong>
                  {((reports?.crmFunnel.totalDealsValue ?? 0) / 1000000).toLocaleString('fa-IR')}{' '}
                  م.ر
                </strong>
                <small>
                  وزنی:{' '}
                  {((reports?.crmFunnel.weightedPipelineValue ?? 0) / 1000000).toLocaleString(
                    'fa-IR',
                  )}{' '}
                  م.ر
                </small>
              </article>
              <article className="summary-card">
                <p>تیکت‌های در دست اقدام</p>
                <strong style={{ color: 'var(--warning)' }}>
                  {reports?.supportSla.openTickets ?? 0}
                </strong>
                <small>از مجموع {reports?.supportSla.totalTickets ?? 0} تیکت</small>
              </article>
              <article className="summary-card">
                <p>نرخ نقض SLA</p>
                <strong
                  style={{
                    color: reports?.supportSla.slaBreachRatePercent
                      ? 'var(--danger)'
                      : 'var(--success)',
                  }}
                >
                  {reports?.supportSla.slaBreachRatePercent ?? 0}٪
                </strong>
                <small>میانگین حل: {reports?.supportSla.averageResolutionHours ?? 0} ساعت</small>
              </article>
            </div>

            {/* Workload Table */}
            <div
              style={{
                background: 'var(--paper)',
                border: '1px solid var(--line)',
                borderRadius: '12px',
                padding: '24px',
              }}
            >
              <h3 style={{ margin: '0 0 12px' }}>گزارش بار کاری تیم (Workload Report)</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>کاربر / مسئول</th>
                    <th>وظایف فعال</th>
                    <th>وظایف سررسیدگذشته (Overdue)</th>
                    <th>وظایف تکمیل‌شده</th>
                  </tr>
                </thead>
                <tbody>
                  {reports?.workload.map((w) => (
                    <tr key={w.userId}>
                      <td>
                        <strong>{w.userName}</strong>
                      </td>
                      <td>{w.activeTasksCount}</td>
                      <td style={{ color: w.overdueTasksCount > 0 ? 'var(--danger)' : 'inherit' }}>
                        {w.overdueTasksCount}
                      </td>
                      <td style={{ color: 'var(--success)' }}>{w.completedTasksCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Automation Rules Tab */}
        {activeTab === 'automation' && (
          <div
            style={{
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <h3 style={{ margin: '0 0 8px' }}>
              موتور قوانین اتوماسیون (Automation Rules Engine - AUTO-001)
            </h3>
            <p className="muted" style={{ marginBottom: '20px' }}>
              تعریف تریگر، شرط، اقدام و کلید قطع اضطراری (Kill Switch) جهت جلوگیری از چرخه‌های
              بی‌پایان.
            </p>

            <table className="data-table">
              <thead>
                <tr>
                  <th>نام قانون</th>
                  <th>رویداد محرک (Trigger)</th>
                  <th>شرط (Condition)</th>
                  <th>اقدام (Action)</th>
                  <th>دفعات اجرا</th>
                  <th>کلید اضطراری (Kill Switch)</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.name}</strong>
                    </td>
                    <td>
                      <span className="task-key">{r.trigger}</span>
                    </td>
                    <td>
                      {r.conditionField
                        ? `${r.conditionField} == ${r.conditionValue}`
                        : 'بدون شرط (همیشه)'}
                    </td>
                    <td>
                      <span className="badge badge-in_progress">{r.actionType}</span>
                    </td>
                    <td>{r.executionCount} مرتبه</td>
                    <td>
                      <button
                        type="button"
                        className={r.enabled ? 'primary-button' : 'secondary-button'}
                        style={{
                          fontSize: '11px',
                          padding: '4px 10px',
                          background: r.enabled ? 'var(--success)' : '#e2e8f0',
                          borderColor: r.enabled ? 'var(--success)' : '#cbd5e1',
                          color: r.enabled ? '#fff' : '#64748b',
                        }}
                        onClick={() => handleToggleRule(r.id, r.enabled)}
                      >
                        {r.enabled ? 'فعال (روشن)' : 'غیرفعال (خاموش)'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              ثبت غیرقابل تغییر (Immutable) تمامی تغییرات حساس و گذارهای حالت همراه با Actor، Action
              و شناسه رهگیری درخواست.
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

      {/* Customer 360 Drawer */}
      <Customer360Drawer
        isOpen={isCustomerDrawerOpen}
        onClose={() => setIsCustomerDrawerOpen(false)}
        account={selectedAccount}
        contacts={contacts}
        deals={deals}
        tickets={tickets}
        leads={leads}
        onContactCreated={handleContactCreated}
        onDealCreated={handleDealCreated}
        onTaskCreated={handleTaskCreatedFromDrawer}
        onLeadConverted={handleLeadConvertedFromDrawer}
        onToast={showToast}
      />

      {/* Command Palette / Global Search */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onOpen={() => setIsPaletteOpen(true)}
        onNavigateTab={(tab) => {
          setActiveTab(tab as any);
          setIsPaletteOpen(false);
        }}
        onOpenCreateTask={() => {
          setIsPaletteOpen(false);
          setIsModalOpen(true);
        }}
        onOpenCreateLead={() => {
          setIsPaletteOpen(false);
          setActiveTab('crm');
          showToast('بخش مشتریان باز شد؛ می‌توانید سرنخ یا حساب جدید ثبت نمایید');
        }}
        onSelectResult={handleSelectSearchResult}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast" data-testid="toast-notification">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
