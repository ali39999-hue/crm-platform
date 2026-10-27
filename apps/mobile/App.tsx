import React, { useState, useMemo, useEffect } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type {
  TaskPriority,
  TaskStatus,
  TaskSummary,
  TicketDto,
  TicketPriority,
  TicketStatus,
  ProjectSummaryDto,
  DocumentSummaryDto,
  DealDto,
} from '@crm/contracts';
import { canTransitionTask } from '@crm/domain';
import {
  ACTOR_CAPABILITIES,
  INITIAL_TASKS,
  INITIAL_TICKETS,
  INITIAL_PROJECTS,
  INITIAL_DOCUMENTS,
  INITIAL_DEALS,
  getTaskStatusCfg,
  getTicketStatusCfg,
} from './src/lib/constants';
import {
  DEFAULT_AUTH_TOKEN,
  getDefaultApiUrl,
  apiClient,
} from './src/lib/api-client';
import { offlineQueue, type QueuedMutation } from './src/lib/offline-queue';
import { TaskCard } from './src/components/TaskCard';
import { TicketCard } from './src/components/TicketCard';
import { DealCard } from './src/components/DealCard';
import { ProjectCard } from './src/components/ProjectCard';
import { DocumentCard } from './src/components/DocumentCard';
import { CreateTaskModal, type CreateTaskFormData } from './src/components/CreateTaskModal';
import { CreateTicketModal, type CreateTicketFormData } from './src/components/CreateTicketModal';
import { OfflineBanner } from './src/components/OfflineBanner';

type ActiveTab = 'tasks' | 'tickets' | 'deals' | 'projects' | 'docs' | 'settings';
type TaskFilter = 'ALL' | 'IN_PROGRESS' | 'TODO' | 'BLOCKED' | 'DONE';
type TicketFilter = 'ALL' | 'OPEN' | 'PENDING' | 'RESOLVED';
type DealFilter = 'ALL' | 'ACTIVE' | 'ROTTING' | 'WON' | 'LOST';

type ToastState = {
  message: string;
  type: 'success' | 'info' | 'error';
};

export default function App() {
  // Navigation Tabs: "کارهای من", "تیکت‌ها", "پروژه‌ها", "اسناد", "تنظیمات"
  const [activeTab, setActiveTab] = useState<ActiveTab>('tasks');
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('ALL');
  const [ticketFilter, setTicketFilter] = useState<TicketFilter>('ALL');
  const [taskSearch, setTaskSearch] = useState('');
  const [ticketSearch, setTicketSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [docSearch, setDocSearch] = useState('');

  // Data State
  const [tasks, setTasks] = useState<TaskSummary[]>(INITIAL_TASKS);
  const [tickets, setTickets] = useState<TicketDto[]>(INITIAL_TICKETS);
  const [projects, setProjects] = useState<ProjectSummaryDto[]>(INITIAL_PROJECTS);
  const [documents, setDocuments] = useState<DocumentSummaryDto[]>(INITIAL_DOCUMENTS);
  const [deals, setDeals] = useState<DealDto[]>(INITIAL_DEALS);
  const [dealFilter, setDealFilter] = useState<DealFilter>('ALL');
  const [dealSearch, setDealSearch] = useState('');

  // Offline State & Durable Mutation Queue
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueItems, setQueueItems] = useState<QueuedMutation[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Settings: API URL and Token Configuration
  const [apiUrl, setApiUrl] = useState(apiClient.getBaseUrl());
  const [authToken, setAuthTokenState] = useState(apiClient.getAuthToken());

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Subscribe to offline queue changes
  useEffect(() => {
    const unsubscribe = offlineQueue.subscribe((items) => {
      setQueueItems(items);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const pendingCount = useMemo(() => {
    return queueItems.filter((m) => m.status === 'PENDING' || m.status === 'FAILED')
      .length;
  }, [queueItems]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  };

  // ==========================================
  // TASK TRANSITION & DOMAIN RULE ENFORCEMENT
  // ==========================================

  const handleTaskTransition = async (task: TaskSummary, targetStatus: TaskStatus) => {
    // 1. Client Domain Invariant Check via @crm/domain
    const isAllowed = canTransitionTask(task.status, targetStatus, ACTOR_CAPABILITIES);

    if (!isAllowed) {
      Alert.alert(
        'خطای قانون دامنه (Domain Invariant)',
        `بر اساس قوانین تجاری سیستم، انتقال وظیفه از «${getTaskStatusCfg(task.status).label}» به «${getTaskStatusCfg(targetStatus).label}» مجاز نمی‌باشد. گردش کار نیازمند رعایت سلسله‌مراتب وضعیت‌ها است.`,
        [{ text: 'متوجه شدم', style: 'cancel' }],
      );
      return;
    }

    // 2. Optimistic Local State Update
    const updatedTasks = tasks.map((t) => {
      if (t.id === task.id) {
        return {
          ...t,
          status: targetStatus,
          version: t.version + 1,
          updatedAt: 'لحظاتی پیش',
        };
      }
      return t;
    });
    setTasks(updatedTasks);

    const targetLabel = getTaskStatusCfg(targetStatus).label;

    if (isOffline) {
      // Enqueue to durable mutation queue
      offlineQueue.enqueue({
        type: 'TRANSITION_TASK',
        payload: {
          id: task.id,
          targetStatus,
          expectedVersion: task.version,
          reason: `انتقال وضعیت از طریق اپلیکیشن موبایل به ${targetStatus}`,
        },
      });
      showToast(`ذخیره در صف پایدار: وضعیت به «${targetLabel}» تغییر یافت.`, 'info');
    } else {
      try {
        await apiClient.transitionTask(task.id, {
          targetStatus,
          expectedVersion: task.version,
        });
        showToast(`تسک ${task.key} با سرور هماهنگ و به وضعیت «${targetLabel}» ارتقا یافت.`, 'success');
      } catch (err) {
        // Fallback to queue if network request failed
        offlineQueue.enqueue({
          type: 'TRANSITION_TASK',
          payload: {
            id: task.id,
            targetStatus,
            expectedVersion: task.version,
            reason: `انتقال با بازگشت خطا در شبکه: ${err instanceof Error ? err.message : String(err)}`,
          },
        });
        showToast(`خطا در ارتباط با سرور؛ انتقال تسک ${task.key} در صف آفلاین ذخیره شد.`, 'info');
      }
    }
  };

  const handleTestInvalidTransition = (task: TaskSummary) => {
    let invalidTarget: TaskStatus = 'DONE';
    if (task.status === 'DONE' || task.status === 'IN_REVIEW') {
      invalidTarget = 'IN_PROGRESS';
    }
    if (task.status === 'TODO') invalidTarget = 'DONE';
    if (task.status === 'BACKLOG') invalidTarget = 'DONE';

    const isAllowed = canTransitionTask(task.status, invalidTarget, ACTOR_CAPABILITIES);
    if (!isAllowed) {
      Alert.alert(
        'قانون اعتبارسنجی دامنه (@crm/domain)',
        `انتقال مستقیم از وضعیت «${getTaskStatusCfg(task.status).label}» به «${getTaskStatusCfg(invalidTarget).label}» غیرمجاز است.\nقوانین دامنه به درستی مانع این انتقال نامعتبر شدند.`,
        [{ text: 'تأیید', style: 'default' }],
      );
    } else {
      Alert.alert('اطلاع', 'این انتقال در وضعیت فعلی طبق قوانین مجاز است.');
    }
  };

  const handleCreateTask = async (data: CreateTaskFormData) => {
    const nextIndex = tasks.length + 1001;
    const newKey = `TSK-${nextIndex}`;
    const newId = `task-${Date.now()}`;

    const newTask: TaskSummary = {
      id: newId,
      key: newKey,
      title: data.title,
      status: 'TODO',
      priority: data.priority,
      visibility: 'INTERNAL',
      assigneeId: '22222222-2222-2222-2222-222222222222',
      assigneeName: 'کاربر همراه (شما)',
      projectId: 'proj-default',
      projectName: data.projectName || 'پروژه جاری سازمان',
      dueAt: '۱۴۰۵/۰۸/۱۵',
      version: 1,
      createdAt: 'امروز',
      updatedAt: 'امروز',
    };

    setTasks([newTask, ...tasks]);

    if (isOffline) {
      offlineQueue.enqueue({
        type: 'CREATE_TASK',
        payload: {
          title: data.title,
          priority: data.priority,
          visibility: 'INTERNAL',
          projectName: data.projectName,
        },
      });
      showToast(`تسک ${newKey} در صف آفلاین قرار گرفت.`, 'info');
    } else {
      try {
        const created = await apiClient.createTask({
          title: data.title,
          priority: data.priority,
          visibility: 'INTERNAL',
        });
        showToast(`تسک جدید ${created.key} در سرور ایجاد شد.`, 'success');
      } catch (err) {
        offlineQueue.enqueue({
          type: 'CREATE_TASK',
          payload: {
            title: data.title,
            priority: data.priority,
            visibility: 'INTERNAL',
          },
        });
        showToast(`تسک ${newKey} در صف آفلاین محلی ذخیره شد.`, 'info');
      }
    }
  };

  // ==========================================
  // TICKET ACTIONS
  // ==========================================

  const handleCreateTicket = async (data: CreateTicketFormData) => {
    const nextNumber = tickets.length + 1044;
    const newRef = `TKT-${nextNumber}`;
    const newId = `tkt-${Date.now()}`;

    const newTicket: TicketDto = {
      id: newId,
      reference: newRef,
      title: data.title,
      status: 'OPEN',
      priority: data.priority,
      accountId: 'account-1',
      accountName: data.accountName || 'شرکت طرف قرارداد',
      assigneeName: 'تخصیص خودکار به پشتیبانی',
      targetResolutionAt: '۲۴ ساعت کاری آینده',
      messagesCount: 1,
      createdAt: 'امروز، هم‌اکنون',
      updatedAt: 'امروز، هم‌اکنون',
    };

    setTickets([newTicket, ...tickets]);

    if (isOffline) {
      offlineQueue.enqueue({
        type: 'CREATE_TICKET',
        payload: {
          title: data.title,
          description: data.description,
          priority: data.priority,
          accountName: data.accountName,
        },
      });
      showToast(`تیکت ${newRef} در صف آفلاین قرار گرفت.`, 'info');
    } else {
      try {
        const created = await apiClient.createTicket({
          title: data.title,
          description: data.description,
          priority: data.priority,
        });
        showToast(`تیکت ${created.reference} با موفقیت در سرور ثبت شد.`, 'success');
      } catch {
        offlineQueue.enqueue({
          type: 'CREATE_TICKET',
          payload: {
            title: data.title,
            description: data.description,
            priority: data.priority,
          },
        });
        showToast(`تیکت ${newRef} در صف همگام‌سازی ذخیره شد.`, 'info');
      }
    }
  };

  const handleToggleTicketStatus = (ticket: TicketDto) => {
    const nextStatus: TicketStatus = ticket.status === 'RESOLVED' ? 'OPEN' : 'RESOLVED';
    const nextLabel = getTicketStatusCfg(nextStatus).label;

    const updated = tickets.map((t) => {
      if (t.id === ticket.id) {
        return {
          ...t,
          status: nextStatus,
          updatedAt: 'لحظاتی پیش',
        };
      }
      return t;
    });

    setTickets(updated);

    if (isOffline) {
      offlineQueue.enqueue({
        type: 'ADD_MESSAGE',
        payload: {
          ticketId: ticket.id,
          body: `تغییر وضعیت تیکت به «${nextLabel}»`,
          visibility: 'INTERNAL',
        },
      });
      showToast(`تیکت ${ticket.reference} به وضعیت «${nextLabel}» تغییر یافت (آفلاین).`, 'info');
    } else {
      showToast(`وضعیت تیکت ${ticket.reference} به «${nextLabel}» تغییر یافت.`, 'success');
    }
  };

  // ==========================================
  // CRM DEALS ACTIONS (Didar Pattern)
  // ==========================================

  const STAGE_ORDER = ['QUALIFICATION', 'NEED_ANALYSIS', 'PROPOSAL', 'NEGOTIATION', 'WON'];

  const handleAdvanceDeal = async (deal: DealDto) => {
    const curIdx = STAGE_ORDER.indexOf(deal.stage);
    if (curIdx >= 0 && curIdx < STAGE_ORDER.length - 1) {
      const nextStage = STAGE_ORDER[curIdx + 1]!;
      try {
        const updated = await apiClient.updateDeal(deal.id, { stage: nextStage });
        setDeals((prev) => prev.map((d) => (d.id === deal.id ? updated : d)));
        showToast(`فرصت «${deal.name}» به مرحله بعد منتقل شد.`, 'success');
      } catch {
        setDeals((prev) =>
          prev.map((d) => (d.id === deal.id ? { ...d, stage: nextStage } : d)),
        );
        showToast(`معامله در حالت محلی به ${nextStage} منتقل شد.`, 'info');
      }
    } else {
      showToast('معامله در آخرین مرحله کاریز قرار دارد.', 'info');
    }
  };

  const handleMarkDealLost = async (deal: DealDto) => {
    try {
      const updated = await apiClient.markDealLost(deal.id, {
        lossReason: 'PRICE_TOO_HIGH',
        lossDescription: 'ثبت باخت از طریق اپ موبایل',
      });
      setDeals((prev) => prev.map((d) => (d.id === deal.id ? updated : d)));
      showToast(`فرصت «${deal.name}» با موفقیت به عنوان ناموفق ثبت شد.`, 'info');
    } catch {
      setDeals((prev) =>
        prev.map((d) => (d.id === deal.id ? { ...d, stage: 'LOST', isRotting: false } : d)),
      );
      showToast(`معامله به عنوان ناموفق علامت‌گذاری شد.`, 'info');
    }
  };

  // ==========================================
  // SYNC & NETWORK CONTROLS
  // ==========================================

  const handleToggleNetwork = () => {
    if (!isOffline) {
      setIsOffline(true);
      showToast('حالت آفلاین فعال شد. تغییرات در صف پایدار ذخیره می‌شوند.', 'info');
    } else {
      setIsOffline(false);
      showToast('حالت آنلاین فعال شد. در حال بررسی صف همگام‌سازی...', 'info');
      if (pendingCount > 0) {
        handleManualSync();
      }
    }
  };

  const handleManualSync = async () => {
    if (isOffline) {
      Alert.alert(
        'خطای اتصال به شبکه',
        'دستگاه در حالت آفلاین قرار دارد. جهت ارسال تغییرات به سرور، ابتدا ارتباط آنلاین را فعال کنید.',
        [
          { text: 'فعال‌سازی وضعیت آنلاین', onPress: handleToggleNetwork },
          { text: 'انصراف', style: 'cancel' },
        ],
      );
      return;
    }

    if (pendingCount === 0) {
      showToast('تمامی داده‌ها با سرور مرکزی هماهنگ هستند.', 'info');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await offlineQueue.syncQueue(apiClient);
      if (result.failed === 0) {
        showToast(`همگام‌سازی کامل شد: ${result.synced} عملیات با سرور هماهنگ شد.`, 'success');
      } else {
        showToast(
          `همگام‌سازی پایان یافت: ${result.synced} موفق، ${result.failed} ناموفق.`,
          'error',
        );
      }
    } catch (err) {
      showToast(`خطا در پردازش همگام‌سازی: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApplyApiSettings = () => {
    apiClient.setBaseUrl(apiUrl);
    apiClient.setAuthToken(authToken);
    showToast('تنظیمات آدرس و توکن احراز هویت با موفقیت اعمال شدند.', 'success');
  };

  const handleResetApiSettings = () => {
    const defaultUrl = getDefaultApiUrl();
    setApiUrl(defaultUrl);
    setAuthTokenState(DEFAULT_AUTH_TOKEN);
    apiClient.setBaseUrl(defaultUrl);
    apiClient.setAuthToken(DEFAULT_AUTH_TOKEN);
    showToast('تنظیمات به مقادیر پیش‌فرض بازگردانی شدند.', 'info');
  };

  const handleClearQueue = () => {
    Alert.alert(
      'پاک‌سازی صف آفلاین',
      'آیا از پاک‌سازی تمام عملیات‌های معلق در صف اطمینان دارید؟',
      [
        {
          text: 'بله، پاک‌سازی شود',
          style: 'destructive',
          onPress: () => {
            offlineQueue.clear();
            showToast('صف عملیات آفلاین کاملاً پاک شد.', 'info');
          },
        },
        { text: 'انصراف', style: 'cancel' },
      ],
    );
  };

  // ==========================================
  // FILTERED DATA
  // ==========================================

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (taskFilter === 'IN_PROGRESS' && task.status !== 'IN_PROGRESS') return false;
      if (taskFilter === 'TODO' && task.status !== 'TODO') return false;
      if (taskFilter === 'BLOCKED' && task.status !== 'BLOCKED') return false;
      if (taskFilter === 'DONE' && task.status !== 'DONE') return false;

      if (taskSearch.trim()) {
        const q = taskSearch.trim().toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchKey = task.key.toLowerCase().includes(q);
        const matchAssignee = task.assigneeName?.toLowerCase().includes(q) ?? false;
        if (!matchTitle && !matchKey && !matchAssignee) return false;
      }

      return true;
    });
  }, [tasks, taskFilter, taskSearch]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (ticketFilter === 'OPEN' && ticket.status !== 'OPEN' && ticket.status !== 'NEW')
        return false;
      if (
        ticketFilter === 'PENDING' &&
        ticket.status !== 'PENDING_CUSTOMER' &&
        ticket.status !== 'PENDING_INTERNAL'
      )
        return false;
      if (ticketFilter === 'RESOLVED' && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED')
        return false;

      if (ticketSearch.trim()) {
        const q = ticketSearch.trim().toLowerCase();
        const matchTitle = ticket.title.toLowerCase().includes(q);
        const matchRef = ticket.reference.toLowerCase().includes(q);
        const matchAccount = ticket.accountName?.toLowerCase().includes(q) ?? false;
        if (!matchTitle && !matchRef && !matchAccount) return false;
      }

      return true;
    });
  }, [tickets, ticketFilter, ticketSearch]);

  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      if (dealFilter === 'ACTIVE' && (d.stage === 'WON' || d.stage === 'LOST')) return false;
      if (
        dealFilter === 'ROTTING' &&
        !d.isRotting &&
        (!d.daysInCurrentStage || d.daysInCurrentStage < 14)
      )
        return false;
      if (dealFilter === 'WON' && d.stage !== 'WON') return false;
      if (dealFilter === 'LOST' && d.stage !== 'LOST') return false;

      if (dealSearch.trim()) {
        const q = dealSearch.trim().toLowerCase();
        if (!d.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [deals, dealFilter, dealSearch]);

  const activeTasksCount = tasks.filter((t) => t.status !== 'DONE' && t.status !== 'CANCELED').length;
  const activeTicketsCount = tickets.filter(
    (t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED',
  ).length;
  const rottingDealsCount = deals.filter(
    (d) => d.isRotting || (d.daysInCurrentStage !== undefined && d.daysInCurrentStage >= 14),
  ).length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f8fa" />

      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <OfflineBanner
          isOffline={isOffline}
          pendingCount={pendingCount}
          isSyncing={isSyncing}
          onToggleNetwork={handleToggleNetwork}
          onSync={handleManualSync}
        />

        {/* Navigation Tabs: "کارهای من", "تیکت‌ها", "پروژه‌ها", "اسناد", "تنظیمات" */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContainer}
        >
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'tasks' && styles.tabButtonActive]}
            onPress={() => setActiveTab('tasks')}
            activeOpacity={0.8}
          >
            <View style={styles.tabContentRow}>
              <View
                style={[
                  styles.tabBadge,
                  activeTab === 'tasks' ? styles.tabBadgeActive : styles.tabBadgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    activeTab === 'tasks' ? styles.tabBadgeTextActive : styles.tabBadgeTextInactive,
                  ]}
                >
                  {activeTasksCount}
                </Text>
              </View>
              <Text
                style={[styles.tabText, activeTab === 'tasks' && styles.tabTextActive]}
              >
                کارهای من
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'tickets' && styles.tabButtonActive]}
            onPress={() => setActiveTab('tickets')}
            activeOpacity={0.8}
          >
            <View style={styles.tabContentRow}>
              <View
                style={[
                  styles.tabBadge,
                  activeTab === 'tickets' ? styles.tabBadgeActive : styles.tabBadgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    activeTab === 'tickets'
                      ? styles.tabBadgeTextActive
                      : styles.tabBadgeTextInactive,
                  ]}
                >
                  {activeTicketsCount}
                </Text>
              </View>
              <Text
                style={[styles.tabText, activeTab === 'tickets' && styles.tabTextActive]}
              >
                تیکت‌ها
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'deals' && styles.tabButtonActive]}
            onPress={() => setActiveTab('deals')}
            activeOpacity={0.8}
          >
            <View style={styles.tabContentRow}>
              <View
                style={[
                  styles.tabBadge,
                  activeTab === 'deals' ? styles.tabBadgeActive : styles.tabBadgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    activeTab === 'deals'
                      ? styles.tabBadgeTextActive
                      : styles.tabBadgeTextInactive,
                  ]}
                >
                  {deals.length}
                </Text>
              </View>
              <Text
                style={[styles.tabText, activeTab === 'deals' && styles.tabTextActive]}
              >
                معاملات
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'projects' && styles.tabButtonActive]}
            onPress={() => setActiveTab('projects')}
            activeOpacity={0.8}
          >
            <View style={styles.tabContentRow}>
              <Text
                style={[styles.tabText, activeTab === 'projects' && styles.tabTextActive]}
              >
                پروژه‌ها
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'docs' && styles.tabButtonActive]}
            onPress={() => setActiveTab('docs')}
            activeOpacity={0.8}
          >
            <View style={styles.tabContentRow}>
              <Text
                style={[styles.tabText, activeTab === 'docs' && styles.tabTextActive]}
              >
                اسناد
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'settings' && styles.tabButtonActive]}
            onPress={() => setActiveTab('settings')}
            activeOpacity={0.8}
          >
            <View style={styles.tabContentRow}>
              {pendingCount > 0 && (
                <View style={[styles.tabBadge, styles.tabBadgeOrange]}>
                  <Text style={[styles.tabBadgeText, styles.tabBadgeTextOrange]}>
                    {pendingCount}
                  </Text>
                </View>
              )}
              <Text
                style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}
              >
                تنظیمات و آفلاین
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Floating Notification Toast */}
      {toast && (
        <View
          style={[
            styles.toastContainer,
            toast.type === 'error'
              ? styles.toastError
              : toast.type === 'info'
                ? styles.toastInfo
                : styles.toastSuccess,
          ]}
        >
          <Text style={styles.toastText}>{toast.message}</Text>
          <TouchableOpacity onPress={() => setToast(null)} style={{ padding: 4 }}>
            <Text style={styles.toastDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ================= MAIN SCROLL VIEW ================= */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'tasks' && (
          /* ================= TAB 1: کارهای من ================= */
          <View style={styles.sectionContainer}>
            {/* Action Bar: Create Task + Section Header */}
            <View style={styles.actionBarRow}>
              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={() => setIsTaskModalOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryActionButtonText}>+ تسک جدید</Text>
              </TouchableOpacity>
              <Text style={styles.sectionHeading}>وظایف و پروژه‌های محوله</Text>
            </View>

            {/* Search Input */}
            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                placeholder="جست‌وجوی عنوان، کد تسک یا مسئول..."
                placeholderTextColor="#94A3B8"
                value={taskSearch}
                onChangeText={setTaskSearch}
                textAlign="right"
              />
              {taskSearch.length > 0 && (
                <TouchableOpacity onPress={() => setTaskSearch('')}>
                  <Text style={styles.clearSearchBtn}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipRow}
            >
              {(
                [
                  { key: 'ALL', label: 'همه وظایف' },
                  { key: 'IN_PROGRESS', label: 'در حال انجام' },
                  { key: 'TODO', label: 'در انتظار' },
                  { key: 'BLOCKED', label: 'مسدود شده' },
                  { key: 'DONE', label: 'تکمیل‌شده' },
                ] as const
              ).map((chip) => {
                const isSelected = taskFilter === chip.key;
                return (
                  <TouchableOpacity
                    key={chip.key}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => setTaskFilter(chip.key)}
                  >
                    <Text
                      style={[styles.chipText, isSelected && styles.chipTextActive]}
                    >
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Filter Count Summary */}
            <View style={styles.countSummaryRow}>
              <Text style={styles.countSummaryText}>
                {filteredTasks.length} وظیفه در این نما
              </Text>
            </View>

            {/* Task Cards List */}
            {filteredTasks.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardTitle}>هیچ کاری یافت نشد</Text>
                <Text style={styles.emptyCardDesc}>
                  با تغییر فیلتر یا جست‌وجوی عبارتی دیگر موارد مورد نظر را بیابید.
                </Text>
              </View>
            ) : (
              filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onTransition={handleTaskTransition}
                  onTestInvalidTransition={handleTestInvalidTransition}
                />
              ))
            )}
          </View>
        )}

        {activeTab === 'tickets' && (
          /* ================= TAB 2: تیکت‌ها ================= */
          <View style={styles.sectionContainer}>
            {/* Action Bar: Create Ticket + Section Header */}
            <View style={styles.actionBarRow}>
              <TouchableOpacity
                style={[styles.primaryActionButton, { backgroundColor: '#0284C7' }]}
                onPress={() => setIsTicketModalOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryActionButtonText}>+ تیکت جدید</Text>
              </TouchableOpacity>
              <Text style={styles.sectionHeading}>تیکت‌های پشتیبانی مشتریان</Text>
            </View>

            {/* Search Input */}
            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                placeholder="جست‌وجوی تیکت، شرکت مشتری یا شماره..."
                placeholderTextColor="#94A3B8"
                value={ticketSearch}
                onChangeText={setTicketSearch}
                textAlign="right"
              />
              {ticketSearch.length > 0 && (
                <TouchableOpacity onPress={() => setTicketSearch('')}>
                  <Text style={styles.clearSearchBtn}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipRow}
            >
              {(
                [
                  { key: 'ALL', label: 'همه تیکت‌ها' },
                  { key: 'OPEN', label: 'تیکت‌های باز' },
                  { key: 'PENDING', label: 'در انتظار پاسخ' },
                  { key: 'RESOLVED', label: 'حل‌شده / بسته' },
                ] as const
              ).map((chip) => {
                const isSelected = ticketFilter === chip.key;
                return (
                  <TouchableOpacity
                    key={chip.key}
                    style={[
                      styles.chip,
                      isSelected && { backgroundColor: '#0284C7', borderColor: '#0284C7' },
                    ]}
                    onPress={() => setTicketFilter(chip.key)}
                  >
                    <Text
                      style={[styles.chipText, isSelected && styles.chipTextActive]}
                    >
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Filter Count Summary */}
            <View style={styles.countSummaryRow}>
              <Text style={styles.countSummaryText}>
                {filteredTickets.length} تیکت فعال در سامانه
              </Text>
            </View>

            {/* Ticket Cards List */}
            {filteredTickets.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardTitle}>هیچ تیکتی یافت نشد</Text>
                <Text style={styles.emptyCardDesc}>
                  هیچ تیکتی با معیارهای فعلی در سامانه ثبت نشده است.
                </Text>
              </View>
            ) : (
              filteredTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onToggleStatus={handleToggleTicketStatus}
                />
              ))
            )}
          </View>
        )}

        {activeTab === 'deals' && (
          /* ================= TAB: فرصت‌ها و معاملات فروش (Didar Pipeline) ================= */
          <View style={styles.sectionContainer}>
            <View style={styles.actionBarRow}>
              <Text style={styles.sectionHeading}>
                کاریز و فرصت‌های فروش ({deals.length})
              </Text>
            </View>

            {/* Search Input */}
            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                placeholder="جست‌وجوی فرصت معامله..."
                placeholderTextColor="#94A3B8"
                value={dealSearch}
                onChangeText={setDealSearch}
                textAlign="right"
              />
              {dealSearch.length > 0 && (
                <TouchableOpacity onPress={() => setDealSearch('')}>
                  <Text style={styles.clearSearchBtn}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipRow}
            >
              {(
                [
                  { key: 'ALL', label: 'همه معاملات' },
                  { key: 'ROTTING', label: `⚠️ راکد (${rottingDealsCount})` },
                  { key: 'ACTIVE', label: 'در جریان کاریز' },
                  { key: 'WON', label: 'موفق و بسته‌شده' },
                  { key: 'LOST', label: 'از دست‌رفته' },
                ] as const
              ).map((chip) => {
                const isSelected = dealFilter === chip.key;
                return (
                  <TouchableOpacity
                    key={chip.key}
                    style={[
                      styles.chip,
                      isSelected && { backgroundColor: '#1570EF', borderColor: '#1570EF' },
                    ]}
                    onPress={() => setDealFilter(chip.key)}
                  >
                    <Text
                      style={[styles.chipText, isSelected && styles.chipTextActive]}
                    >
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Count Summary */}
            <View style={styles.countSummaryRow}>
              <Text style={styles.countSummaryText}>
                {filteredDeals.length} معامله نمایش داده شده
              </Text>
            </View>

            {/* Deal Cards List */}
            {filteredDeals.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardTitle}>معامله‌ای یافت نشد</Text>
                <Text style={styles.emptyCardDesc}>
                  هیچ فرصت فروشی با این فیلتر یا جست‌وجو در کاریز وجود ندارد.
                </Text>
              </View>
            ) : (
              filteredDeals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onAdvanceStage={handleAdvanceDeal}
                  onMarkLost={handleMarkDealLost}
                />
              ))
            )}
          </View>
        )}

        {activeTab === 'projects' && (
          /* ================= TAB: پروژه‌ها ================= */
          <View style={styles.sectionContainer}>
            <View style={styles.actionBarRow}>
              <Text style={styles.sectionHeading}>پروژه‌های سازمانی ({projects.length})</Text>
            </View>

            {/* Search Input */}
            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                placeholder="جست‌وجوی پروژه یا کلید..."
                placeholderTextColor="#94A3B8"
                value={projectSearch}
                onChangeText={setProjectSearch}
                textAlign="right"
              />
              {projectSearch.length > 0 && (
                <TouchableOpacity onPress={() => setProjectSearch('')}>
                  <Text style={styles.clearSearchBtn}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Project Cards */}
            {projects
              .filter(
                (p) =>
                  !projectSearch ||
                  p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
                  p.key.toLowerCase().includes(projectSearch.toLowerCase()),
              )
              .map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
          </View>
        )}

        {activeTab === 'docs' && (
          /* ================= TAB: پایگاه دانش و اسناد ================= */
          <View style={styles.sectionContainer}>
            <View style={styles.actionBarRow}>
              <Text style={styles.sectionHeading}>پایگاه دانش و اسناد ({documents.length})</Text>
            </View>

            {/* Search Input */}
            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                placeholder="جست‌وجوی عنوان یا برچسب سند..."
                placeholderTextColor="#94A3B8"
                value={docSearch}
                onChangeText={setDocSearch}
                textAlign="right"
              />
              {docSearch.length > 0 && (
                <TouchableOpacity onPress={() => setDocSearch('')}>
                  <Text style={styles.clearSearchBtn}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Document Cards */}
            {documents
              .filter(
                (d) =>
                  !docSearch ||
                  d.title.toLowerCase().includes(docSearch.toLowerCase()) ||
                  d.tags.some((t) => t.toLowerCase().includes(docSearch.toLowerCase())),
              )
              .map((doc) => (
                <DocumentCard key={doc.id} document={doc} />
              ))}
          </View>
        )}

        {activeTab === 'settings' && (
          /* ================= TAB 3: وضعیت آفلاین / تنظیمات ================= */
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>وضعیت آفلاین و پیکربندی API</Text>

            {/* Card 1: Network & Offline Status */}
            <View style={styles.settingsCard}>
              <Text style={styles.settingsCardTitle}>وضعیت اتصال شبکه</Text>
              <Text style={styles.settingsCardDesc}>
                در صورت قطع اتصال یا فعال‌سازی حالت آفلاین، تمامی عملیات‌ها در صف پایدار
                محلی ثبت و پس از برقراری مجدد ارتباط به‌طور خودکار ارسال می‌شوند.
              </Text>

              <View style={styles.settingToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    !isOffline ? styles.toggleBtnActiveOnline : styles.toggleBtnInactive,
                  ]}
                  onPress={() => isOffline && handleToggleNetwork()}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      !isOffline && styles.toggleBtnTextActiveOnline,
                    ]}
                  >
                    ● آنلاین
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    isOffline ? styles.toggleBtnActiveOffline : styles.toggleBtnInactive,
                  ]}
                  onPress={() => !isOffline && handleToggleNetwork()}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      isOffline && styles.toggleBtnTextActiveOffline,
                    ]}
                  >
                    ⚡ آفلاین (محلی)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Card 2: Server API Configuration */}
            <View style={styles.settingsCard}>
              <Text style={styles.settingsCardTitle}>پیکربندی API Client</Text>
              <Text style={styles.settingsCardDesc}>
                آدرس سرور مرکزی و توکن احراز هویت پیش‌فرض جهت ارتباط ایمن با Backend.
              </Text>

              <View style={styles.formItem}>
                <Text style={styles.formItemLabel}>آدرس سرور API (Base URL):</Text>
                <TextInput
                  style={styles.formInput}
                  value={apiUrl}
                  onChangeText={setApiUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textAlign="left"
                  placeholder="http://localhost:4000/api/v1"
                />
              </View>

              <View style={styles.formItem}>
                <Text style={styles.formItemLabel}>توکن احراز هویت (Bearer Token):</Text>
                <TextInput
                  style={styles.formInput}
                  value={authToken}
                  onChangeText={setAuthTokenState}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textAlign="left"
                  placeholder="22222222-2222-2222-2222-222222222222"
                />
              </View>

              <View style={styles.settingsActionsRow}>
                <TouchableOpacity
                  style={styles.applyBtn}
                  onPress={handleApplyApiSettings}
                  activeOpacity={0.8}
                >
                  <Text style={styles.applyBtnText}>اعمال تنظیمات</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.resetBtn}
                  onPress={handleResetApiSettings}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resetBtnText}>بازنشانی به پیش‌فرض</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Card 3: Durable Offline Queue Manager */}
            <View style={styles.settingsCard}>
              <View style={styles.queueHeaderRow}>
                <View style={styles.queueBadgeCluster}>
                  <View style={[styles.queueCountBadge, pendingCount > 0 ? styles.queueCountBadgeActive : styles.queueCountBadgeEmpty]}>
                    <Text style={[styles.queueCountText, pendingCount > 0 ? styles.queueCountTextActive : styles.queueCountTextEmpty]}>
                      {pendingCount} مورد در صف
                    </Text>
                  </View>
                </View>
                <Text style={styles.settingsCardTitle}>صف جهش‌های پایدار (Offline Queue)</Text>
              </View>

              <Text style={styles.settingsCardDesc}>
                عملیات‌های ثبت‌شده در حالت آفلاین یا در صورت قطعی شبکه با ترتیب زمانی در حافظه ماندگار نگهداری می‌شوند.
              </Text>

              <View style={styles.queueActionsRow}>
                <TouchableOpacity
                  style={[styles.syncQueueBtn, (isSyncing || pendingCount === 0) && styles.btnDisabled]}
                  onPress={handleManualSync}
                  disabled={isSyncing || pendingCount === 0}
                  activeOpacity={0.8}
                >
                  <Text style={styles.syncQueueBtnText}>
                    {isSyncing ? 'در حال ارسال به سرور...' : 'همگام‌سازی دستی صف'}
                  </Text>
                </TouchableOpacity>

                {queueItems.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearQueueBtn}
                    onPress={handleClearQueue}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.clearQueueBtnText}>پاک‌سازی صف</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Items in Queue */}
              {queueItems.length === 0 ? (
                <View style={styles.queueEmptyBox}>
                  <Text style={styles.queueEmptyText}>✓ صف عملیات آفلاین خالی است.</Text>
                </View>
              ) : (
                <View style={styles.queueListContainer}>
                  {queueItems.map((item, idx) => (
                    <View key={item.id} style={styles.queueItemRow}>
                      <View style={styles.queueItemHeader}>
                        <TouchableOpacity
                          onPress={() => offlineQueue.remove(item.id)}
                          style={styles.queueItemDeleteBtn}
                        >
                          <Text style={styles.queueItemDeleteText}>حذف</Text>
                        </TouchableOpacity>

                        <View style={styles.queueItemBadges}>
                          <View
                            style={[
                              styles.queueStatusPill,
                              item.status === 'FAILED'
                                ? styles.queueStatusFailed
                                : item.status === 'SYNCING'
                                  ? styles.queueStatusSyncing
                                  : styles.queueStatusPending,
                            ]}
                          >
                            <Text
                              style={[
                                styles.queueStatusText,
                                item.status === 'FAILED'
                                  ? styles.queueStatusTextFailed
                                  : item.status === 'SYNCING'
                                    ? styles.queueStatusTextSyncing
                                    : styles.queueStatusTextPending,
                              ]}
                            >
                              {item.status === 'FAILED'
                                ? 'ناموفق'
                                : item.status === 'SYNCING'
                                  ? 'در حال ارسال'
                                  : 'در انتظار'}
                            </Text>
                          </View>

                          <Text style={styles.queueItemType}>{item.type}</Text>
                        </View>
                      </View>

                      <Text style={styles.queueItemPayload} numberOfLines={2}>
                        {JSON.stringify(item.payload)}
                      </Text>

                      {item.error && (
                        <Text style={styles.queueItemError}>خطا: {item.error}</Text>
                      )}

                      <View style={styles.queueItemFooter}>
                        <Text style={styles.queueItemMeta}>تلاش‌ها: {item.attempts}</Text>
                        <Text style={styles.queueItemMeta}>{item.createdAt.slice(11, 19)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Card 4: Domain Capabilities & Role Information */}
            <View style={styles.settingsCard}>
              <Text style={styles.settingsCardTitle}>مجوزها و قوانین دامنه (@crm/domain)</Text>
              <View style={styles.capabilityRow}>
                <Text style={styles.capabilityStatus}>فعال ✓</Text>
                <Text style={styles.capabilityLabel}>بازگشایی تسک‌های تکمیل‌شده (Reopen Done)</Text>
              </View>
              <View style={styles.capabilityRow}>
                <Text style={styles.capabilityStatus}>فعال ✓</Text>
                <Text style={styles.capabilityLabel}>بازیابی تسک‌های لغوشده (Restore Canceled)</Text>
              </View>
              <View style={styles.capabilityRow}>
                <Text style={styles.capabilityStatus}>سازمان آلفا</Text>
                <Text style={styles.capabilityLabel}>فضای کاری فعال (Active Workspace)</Text>
              </View>
              <View style={styles.capabilityRow}>
                <Text style={styles.capabilityStatus}>کارمند عملیات</Text>
                <Text style={styles.capabilityLabel}>نقش سازمانی کاربر (Role)</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ================= MODALS ================= */}
      <CreateTaskModal
        visible={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleCreateTask}
      />

      <CreateTicketModal
        visible={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        onSubmit={handleCreateTicket}
      />
    </SafeAreaView>
  );
}

// ==========================================
// STYLESHEET
// ==========================================

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 36 : 10,
    paddingBottom: 4,
  },
  tabContainer: {
    flexDirection: 'row-reverse',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginTop: 2,
    marginBottom: 8,
  },
  tabButton: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabContentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    writingDirection: 'rtl',
  },
  tabTextActive: {
    color: '#1E40AF',
    fontWeight: '800',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: '#EFF6FF',
  },
  tabBadgeInactive: {
    backgroundColor: '#E2E8F0',
  },
  tabBadgeOrange: {
    backgroundColor: '#FEF3C7',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tabBadgeTextActive: {
    color: '#2563EB',
  },
  tabBadgeTextInactive: {
    color: '#64748B',
  },
  tabBadgeTextOrange: {
    color: '#D97706',
  },
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 44 : 50,
    left: 16,
    right: 16,
    zIndex: 999,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  toastSuccess: {
    backgroundColor: '#065F46',
  },
  toastInfo: {
    backgroundColor: '#1E3A8A',
  },
  toastError: {
    backgroundColor: '#991B1B',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  toastDismiss: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionContainer: {
    gap: 12,
  },
  actionBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    writingDirection: 'rtl',
  },
  primaryActionButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  searchBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    writingDirection: 'rtl',
    padding: 0,
  },
  clearSearchBtn: {
    color: '#94A3B8',
    fontSize: 16,
    paddingHorizontal: 4,
  },
  filterChipRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  chipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  countSummaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
  },
  countSummaryText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    writingDirection: 'rtl',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  emptyCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
    writingDirection: 'rtl',
  },
  emptyCardDesc: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    writingDirection: 'rtl',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    padding: 16,
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  settingsCardDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  settingToggleRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  toggleBtnInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  toggleBtnActiveOnline: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  toggleBtnActiveOffline: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  toggleBtnTextActiveOnline: {
    color: '#15803D',
    fontWeight: '700',
  },
  toggleBtnTextActiveOffline: {
    color: '#B45309',
    fontWeight: '700',
  },
  formItem: {
    gap: 4,
  },
  formItemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0F172A',
  },
  settingsActionsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 6,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  resetBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  queueHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  queueBadgeCluster: {
    flexDirection: 'row',
  },
  queueCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  queueCountBadgeActive: {
    backgroundColor: '#FEF3C7',
  },
  queueCountBadgeEmpty: {
    backgroundColor: '#F1F5F9',
  },
  queueCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  queueCountTextActive: {
    color: '#B45309',
  },
  queueCountTextEmpty: {
    color: '#64748B',
  },
  queueActionsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 4,
  },
  syncQueueBtn: {
    flex: 1,
    backgroundColor: '#D97706',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  syncQueueBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  clearQueueBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearQueueBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  queueEmptyBox: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  queueEmptyText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  queueListContainer: {
    gap: 8,
    marginTop: 4,
  },
  queueItemRow: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  queueItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  queueItemBadges: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  queueItemType: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  queueStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  queueStatusPending: {
    backgroundColor: '#FEF3C7',
  },
  queueStatusSyncing: {
    backgroundColor: '#DBEAFE',
  },
  queueStatusFailed: {
    backgroundColor: '#FEE2E2',
  },
  queueStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  queueStatusTextPending: {
    color: '#92400E',
  },
  queueStatusTextSyncing: {
    color: '#1D4ED8',
  },
  queueStatusTextFailed: {
    color: '#B91C1C',
  },
  queueItemDeleteBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  queueItemDeleteText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
  },
  queueItemPayload: {
    fontSize: 11,
    color: '#475569',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'left',
  },
  queueItemError: {
    fontSize: 11,
    color: '#DC2626',
    writingDirection: 'rtl',
  },
  queueItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  queueItemMeta: {
    fontSize: 10,
    color: '#94A3B8',
  },
  capabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  capabilityLabel: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
    writingDirection: 'rtl',
  },
  capabilityStatus: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
  },
});
