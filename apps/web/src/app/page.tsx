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
  AdminSettingsView,
  AnalyticsDashboardView,
  AuditTrailView,
  CommandPalette,
  CreateTaskModal,
  type CreateTaskFormData,
  Customer360Drawer,
  DealsPipelineKanban,
  DocumentsView,
  DuplicateReviewView,
  EmptyState,
  ErrorBanner,
  getPriorityLabel,
  getTaskStatusLabel,
  LoadingSkeleton,
  MentionsInboxView,
  OverviewDashboardView,
  PriorityBadge,
  ProjectsView,
  SupportMacrosView,
  TaskBoard,
  TaskList,
  TaskCalendar,
  TaskStatusBadge,
  TicketStatusBadge,
  TimeTrackingView,
  WorkflowAutomationView,
  VoipCallerIdPopup,
  CardsPipelineView,
  WebFormBuilderView,
  JalaliActivityCalendarView,
  ExhibitionLeadIntakeModal,
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
    | 'projects'
    | 'time'
    | 'crm'
    | 'calendar'
    | 'support'
    | 'docs'
    | 'notifications'
    | 'reports'
    | 'automation'
    | 'audit'
    | 'settings'
  >('my-work');
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [crmSubTab, setCrmSubTab] = useState<
    'accounts' | 'pipeline' | 'duplicates' | 'cards' | 'forms'
  >('accounts');
  const [supportSubTab, setSupportSubTab] = useState<'tickets' | 'macros'>('tickets');
  const [notifSubTab, setNotifSubTab] = useState<'notifications' | 'mentions'>('notifications');

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
  const [audits, setAudits] = useState<AuditItem[]>([]);
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
  const [isExhibitionModalOpen, setIsExhibitionModalOpen] = useState(false);
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
        auditsRes,
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
        apiClient.getAuditEvents(),
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

      const mappedAudits: AuditItem[] = (auditsRes || []).map((a) => ({
        id: a.id,
        action: a.action,
        actor: a.actorId ? `کاربر (${a.actorId.slice(0, 8)})` : 'سیستم خودکار',
        entity: `${a.entityType}:${a.entityId}`,
        time: new Date(a.createdAt).toLocaleTimeString('fa-IR'),
        details: a.metadata ? JSON.stringify(a.metadata) : 'بدون متادیتا',
      }));
      setAudits(mappedAudits);
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
            className={`nav-button ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
            data-testid="nav-projects"
          >
            <span>📁</span> پروژه‌ها و اهداف
          </button>
          <button
            type="button"
            className={`nav-button ${activeTab === 'time' ? 'active' : ''}`}
            onClick={() => setActiveTab('time')}
            data-testid="nav-time"
          >
            <span>⏱️</span> زمان و کارکرد (Time)
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
            className={`nav-button ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
            data-testid="nav-calendar"
          >
            <span>📅</span> تقویم شمسی فعالیت‌ها
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
          <button
            type="button"
            className={`nav-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
            data-testid="nav-settings"
          >
            <span>⚙️</span> تنظیمات و مدیریت سازمان
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
          <OverviewDashboardView
            tasks={tasks}
            accounts={accounts}
            deals={deals}
            isLoading={isLoading}
          />
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

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div style={{ height: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--line)' }}>
            <ProjectsView onNotify={(msg) => showToast(msg)} />
          </div>
        )}

        {/* Time Tracking Tab */}
        {activeTab === 'time' && (
          <div style={{ height: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--line)' }}>
            <TimeTrackingView onNotify={(msg) => showToast(msg)} />
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
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>مشتریان و خط‌لوله فروش (CRM Core)</h3>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
                  مدیریت ۳۶۰ درجه شرکت‌ها، معاملات در پایپ‌لاین و رفع هوشمند رکوردهای تکراری
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setIsExhibitionModalOpen(true)}
                  data-testid="open-exhibition-intake-btn"
                  className="secondary-button"
                  style={{
                    fontSize: '12px',
                    padding: '6px 12px',
                    borderColor: '#f59e0b',
                    color: '#f59e0b',
                    background: 'rgba(245, 158, 11, 0.08)',
                    fontWeight: 700,
                  }}
                >
                  🎪 ثبت سرنخ نمایشگاه (لیدا)
                </button>

                {/* CRM Sub-tabs Switcher */}
                <div
                  style={{
                    display: 'flex',
                    background: 'var(--soft)',
                    padding: '3px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                  }}
                >
                <button
                  type="button"
                  onClick={() => setCrmSubTab('accounts')}
                  data-testid="crm-tab-accounts"
                  style={{
                    fontSize: '12px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: crmSubTab === 'accounts' ? 'var(--paper)' : 'transparent',
                    fontWeight: crmSubTab === 'accounts' ? 'bold' : 'normal',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                  }}
                >
                  🏢 شرکت‌ها و حساب‌ها ({accounts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCrmSubTab('pipeline')}
                  data-testid="crm-tab-pipeline"
                  style={{
                    fontSize: '12px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: crmSubTab === 'pipeline' ? 'var(--paper)' : 'transparent',
                    fontWeight: crmSubTab === 'pipeline' ? 'bold' : 'normal',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                  }}
                >
                  📊 برد کانبان معاملات ({deals.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCrmSubTab('duplicates')}
                  data-testid="crm-tab-duplicates"
                  style={{
                    fontSize: '12px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: crmSubTab === 'duplicates' ? 'var(--paper)' : 'transparent',
                    fontWeight: crmSubTab === 'duplicates' ? 'bold' : 'normal',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                  }}
                >
                  🔍 رکوردهای تکراری
                </button>
                <button
                  type="button"
                  onClick={() => setCrmSubTab('cards')}
                  data-testid="crm-tab-cards"
                  style={{
                    fontSize: '12px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: crmSubTab === 'cards' ? 'var(--paper)' : 'transparent',
                    fontWeight: crmSubTab === 'cards' ? 'bold' : 'normal',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                  }}
                >
                  🗂️ کاریز کارت‌ها
                </button>
                <button
                  type="button"
                  onClick={() => setCrmSubTab('forms')}
                  data-testid="crm-tab-forms"
                  style={{
                    fontSize: '12px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: crmSubTab === 'forms' ? 'var(--paper)' : 'transparent',
                    fontWeight: crmSubTab === 'forms' ? 'bold' : 'normal',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                  }}
                >
                  📝 فرم‌ساز آنلاین
                </button>
              </div>
            </div>
          </div>

            {/* Sub-tab 1: Accounts List */}
            {crmSubTab === 'accounts' && (
              <>
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
              </>
            )}

            {/* Sub-tab 2: Deals Pipeline Kanban */}
            {crmSubTab === 'pipeline' && (
              <DealsPipelineKanban
                initialDeals={deals}
                onNotify={(msg) => showToast(msg)}
                onSelectDeal={(d) => showToast(`فرصت «${d.name}» انتخاب شد`)}
              />
            )}

            {/* Sub-tab 3: Duplicate Records Review */}
            {crmSubTab === 'duplicates' && (
              <DuplicateReviewView onNotify={(msg) => showToast(msg)} />
            )}

            {/* Sub-tab 4: After-Sales Cards Pipeline */}
            {crmSubTab === 'cards' && (
              <CardsPipelineView onNotify={(msg) => showToast(msg)} />
            )}

            {/* Sub-tab 5: Online Web Form Builder */}
            {crmSubTab === 'forms' && (
              <WebFormBuilderView onNotify={(msg) => showToast(msg)} />
            )}
          </div>
        )}

        {/* Jalali Activity Calendar Tab (Didar Pattern) */}
        {activeTab === 'calendar' && (
          <JalaliActivityCalendarView onNotify={(msg) => showToast(msg)} />
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
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>صندوق تیکت‌ها و پشتیبانی (Support & Helpdesk)</h3>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
                  رسیدگی به تیکت‌های مشتریان، تعهدات SLA، یادداشت‌های محرمانه و الگوهای پاسخ سریع
                </p>
              </div>

              {/* Support Sub-tabs Switcher */}
              <div
                style={{
                  display: 'flex',
                  background: 'var(--soft)',
                  padding: '3px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setSupportSubTab('tickets')}
                  data-testid="support-tab-tickets"
                  style={{
                    fontSize: '12px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: supportSubTab === 'tickets' ? 'var(--paper)' : 'transparent',
                    fontWeight: supportSubTab === 'tickets' ? 'bold' : 'normal',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                  }}
                >
                  🎫 صندوق تیکت‌ها ({tickets.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSupportSubTab('macros')}
                  data-testid="support-tab-macros"
                  style={{
                    fontSize: '12px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: supportSubTab === 'macros' ? 'var(--paper)' : 'transparent',
                    fontWeight: supportSubTab === 'macros' ? 'bold' : 'normal',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                  }}
                >
                  💬 قالب‌های پاسخ آماده (Macros)
                </button>
              </div>
            </div>

            {/* Sub-tab 1: Tickets Table */}
            {supportSubTab === 'tickets' && (
              <>
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
              </>
            )}

            {/* Sub-tab 2: Support Macros Catalog */}
            {supportSubTab === 'macros' && (
              <SupportMacrosView onNotify={(msg) => showToast(msg)} />
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
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 4px' }}>
                  اعلان‌ها و رخدادهای درون‌برنامه‌ای (In-App Notifications)
                </h3>
                <p className="muted" style={{ margin: 0 }}>
                  اعلان‌های خودکار حاصل از رویدادهای Outbox و ارجاعات مستقیم همکاران
                </p>
              </div>

              {/* Sub-tabs switcher */}
              <div
                style={{
                  display: 'flex',
                  background: 'var(--soft)',
                  padding: '3px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setNotifSubTab('notifications')}
                  data-testid="notif-tab-system"
                  style={{
                    fontSize: '12px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: notifSubTab === 'notifications' ? 'var(--paper)' : 'transparent',
                    fontWeight: notifSubTab === 'notifications' ? 'bold' : 'normal',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                  }}
                >
                  🔔 اعلان‌های سیستمی ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNotifSubTab('mentions')}
                  data-testid="notif-tab-mentions"
                  style={{
                    fontSize: '12px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: notifSubTab === 'mentions' ? 'var(--paper)' : 'transparent',
                    fontWeight: notifSubTab === 'mentions' ? 'bold' : 'normal',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                  }}
                >
                  📢 صندوق منشن‌ها و ارجاعات
                </button>
              </div>
            </div>

            {/* Sub-tab 1: System Notifications */}
            {notifSubTab === 'notifications' && (
              <>
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
              </>
            )}

            {/* Sub-tab 2: Team Mentions */}
            {notifSubTab === 'mentions' && (
              <MentionsInboxView onNotify={(msg) => showToast(msg)} />
            )}
          </div>
        )}

        {/* Reports & Analytics Tab */}
        {activeTab === 'reports' && (
          <div style={{ height: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--line)' }}>
            <AnalyticsDashboardView
              reports={reports}
              onRefresh={loadData}
              onNotify={(msg) => showToast(msg)}
            />
          </div>
        )}

        {/* Automation Rules Tab */}
        {activeTab === 'automation' && (
          <div style={{ height: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--line)' }}>
            <WorkflowAutomationView onNotify={(msg) => showToast(msg)} />
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <AuditTrailView audits={audits} isLoading={isLoading} />
        )}

        {/* Organization Settings Tab */}
        {activeTab === 'settings' && (
          <div style={{ height: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--line)' }}>
            <AdminSettingsView onNotify={(msg) => showToast(msg)} />
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

      {/* Didar Leeda Exhibition Lead Intake Modal */}
      <ExhibitionLeadIntakeModal
        isOpen={isExhibitionModalOpen}
        onClose={() => setIsExhibitionModalOpen(false)}
        onNotify={(msg) => showToast(msg)}
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

      {/* VoIP PBX Caller-ID Popup (Didar Pattern) */}
      <VoipCallerIdPopup
        onOpenCustomerTimeline={(accountId) => {
          const acc = accounts.find((a) => a.id === accountId);
          if (acc) {
            handleOpenCustomerDrawer(acc);
          }
        }}
        onOpenDeal={(dealId) => {
          setActiveTab('crm');
          setCrmSubTab('pipeline');
        }}
        onNotify={showToast}
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
