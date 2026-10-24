import React, { useState, useMemo } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
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
} from '@crm/contracts';
import { canTransitionTask, type TransitionActorCapabilities } from '@crm/domain';

// ==========================================
// TYPES & CONFIGURATION
// ==========================================

const ACTOR_CAPABILITIES: TransitionActorCapabilities = {
  canReopenDoneTask: true,
  canRestoreCanceledTask: true,
};

const ALL_TASK_STATUSES: readonly TaskStatus[] = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'BLOCKED',
  'DONE',
  'CANCELED',
];

const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bg: string; borderColor: string }
> = {
  BACKLOG: { label: 'بک‌لاگ', color: '#475467', bg: '#F2F4F7', borderColor: '#D0D5DD' },
  TODO: { label: 'در انتظار شروع', color: '#175CD3', bg: '#EFF8FF', borderColor: '#B2DDFF' },
  IN_PROGRESS: { label: 'در حال انجام', color: '#B54708', bg: '#FEF0C7', borderColor: '#FEDF89' },
  IN_REVIEW: { label: 'در انتظار بازبینی', color: '#6938EF', bg: '#F4EBFF', borderColor: '#D9D6FE' },
  BLOCKED: { label: 'مسدود شده', color: '#B42318', bg: '#FEE4E2', borderColor: '#FECDCA' },
  DONE: { label: 'تکمیل‌شده', color: '#067647', bg: '#ECFDF3', borderColor: '#A6F4C5' },
  CANCELED: { label: 'لغو شده', color: '#667085', bg: '#F8F9FA', borderColor: '#E4E8EF' },
};

const TASK_PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; bg: string }
> = {
  URGENT: { label: 'بسیار فوری', color: '#B42318', bg: '#FEE4E2' },
  HIGH: { label: 'بالا', color: '#B54708', bg: '#FEF0C7' },
  MEDIUM: { label: 'متوسط', color: '#026AA2', bg: '#E0F2FE' },
  LOW: { label: 'پایین', color: '#344054', bg: '#F2F4F7' },
};

const TICKET_STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; color: string; bg: string; borderColor: string }
> = {
  NEW: { label: 'جدید', color: '#026AA2', bg: '#E0F2FE', borderColor: '#B9E6FE' },
  OPEN: { label: 'باز', color: '#B54708', bg: '#FEF0C7', borderColor: '#FEDF89' },
  PENDING_CUSTOMER: { label: 'منتظر مشتری', color: '#6938EF', bg: '#F4EBFF', borderColor: '#D9D6FE' },
  PENDING_INTERNAL: { label: 'منتظر کارشناس', color: '#C4320A', bg: '#FFF6ED', borderColor: '#F9DBAF' },
  RESOLVED: { label: 'حل‌شده', color: '#067647', bg: '#ECFDF3', borderColor: '#A6F4C5' },
  CLOSED: { label: 'بسته شده', color: '#475467', bg: '#F2F4F7', borderColor: '#D0D5DD' },
};

const TICKET_PRIORITY_CONFIG: Record<
  TicketPriority,
  { label: string; color: string; bg: string }
> = {
  URGENT: { label: 'بسیار فوری', color: '#B42318', bg: '#FEE4E2' },
  HIGH: { label: 'بالا', color: '#B54708', bg: '#FEF0C7' },
  NORMAL: { label: 'عادی', color: '#026AA2', bg: '#E0F2FE' },
  LOW: { label: 'پایین', color: '#344054', bg: '#F2F4F7' },
};

function getTaskStatusCfg(status: TaskStatus) {
  return (
    TASK_STATUS_CONFIG[status] ?? {
      label: status,
      color: '#475467',
      bg: '#F2F4F7',
      borderColor: '#D0D5DD',
    }
  );
}

function getTaskPriorityCfg(priority: TaskPriority) {
  return (
    TASK_PRIORITY_CONFIG[priority] ?? {
      label: priority,
      color: '#344054',
      bg: '#F2F4F7',
    }
  );
}

function getTicketStatusCfg(status: TicketStatus) {
  return (
    TICKET_STATUS_CONFIG[status] ?? {
      label: status,
      color: '#475467',
      bg: '#F2F4F7',
      borderColor: '#D0D5DD',
    }
  );
}

function getTicketPriorityCfg(priority: TicketPriority) {
  return (
    TICKET_PRIORITY_CONFIG[priority] ?? {
      label: priority,
      color: '#344054',
      bg: '#F2F4F7',
    }
  );
}

function getTransitionButtonText(current: TaskStatus, target: TaskStatus): string {
  if (current === 'DONE' && target === 'TODO') return 'بازگشایی ↺';
  if (current === 'CANCELED' && target === 'TODO') return 'بازیابی ↺';
  if (target === 'IN_PROGRESS') return 'شروع کار ▶';
  if (target === 'IN_REVIEW') return 'ارسال به بازبینی 🔍';
  if (target === 'DONE') return 'تکمیل کار ✓';
  if (target === 'BLOCKED') return 'اعلام مانع ✕';
  if (target === 'CANCELED') return 'لغو تسک ⊘';
  if (target === 'TODO') return 'انتقال به صف ↩';
  if (target === 'BACKLOG') return 'انتقال به بک‌لاگ';
  return target;
}

// ==========================================
// INITIAL MOCK DATA
// ==========================================

const INITIAL_TASKS: TaskSummary[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    key: 'TSK-1001',
    title: 'بررسی مدارک و اعتبارسنجی قرارداد مشتری جدید',
    status: 'TODO',
    priority: 'HIGH',
    visibility: 'INTERNAL',
    assigneeId: '22222222-2222-2222-2222-222222222222',
    assigneeName: 'علی رضایی',
    projectId: 'proj-01',
    projectName: 'پروژه ساماندهی مشتریان سازمانی',
    dueAt: '۱۴۰۵/۰۸/۰۴',
    version: 1,
    createdAt: '۱۴۰۵/۰۷/۲۸',
    updatedAt: '۱۴۰۵/۰۷/۲۸',
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    key: 'TSK-1002',
    title: 'پیاده‌سازی تست‌های امنیتی احراز هویت و مجوزها',
    status: 'IN_PROGRESS',
    priority: 'URGENT',
    visibility: 'INTERNAL',
    assigneeId: '22222222-2222-2222-2222-222222222222',
    assigneeName: 'سارا احمدی',
    projectId: 'proj-02',
    projectName: 'امنیت و کنترل دسترسی',
    dueAt: '۱۴۰۵/۰۸/۰۲',
    version: 2,
    createdAt: '۱۴۰۵/۰۷/۲۷',
    updatedAt: '۱۴۰۵/۰۷/۲۹',
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    key: 'TSK-1003',
    title: 'بازبینی معماری پایگاه داده و شاخص‌گذاری جدول‌های CRM',
    status: 'IN_REVIEW',
    priority: 'MEDIUM',
    visibility: 'INTERNAL',
    assigneeId: '22222222-2222-2222-2222-222222222222',
    assigneeName: 'حسین محمدی',
    projectId: 'proj-03',
    projectName: 'بهینه‌سازی دیتابیس',
    dueAt: '۱۴۰۵/۰۸/۰۶',
    version: 3,
    createdAt: '۱۴۰۵/۰۷/۲۵',
    updatedAt: '۱۴۰۵/۰۷/۳۰',
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    key: 'TSK-1004',
    title: 'تنظیمات اولیه زیرساخت کانتینرها و مانیتورینگ',
    status: 'DONE',
    priority: 'LOW',
    visibility: 'INTERNAL',
    assigneeId: '22222222-2222-2222-2222-222222222222',
    assigneeName: 'علی رضایی',
    projectId: 'proj-04',
    projectName: 'زیرساخت ابری',
    dueAt: '۱۴۰۵/۰۸/۰۱',
    version: 4,
    createdAt: '۱۴۰۵/۰۷/۲۰',
    updatedAt: '۱۴۰۵/۰۸/۰۱',
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    key: 'TSK-1005',
    title: 'رفع مغایرت صدور صورت‌حساب در درگاه بانکی',
    status: 'BLOCKED',
    priority: 'URGENT',
    visibility: 'INTERNAL',
    assigneeId: '22222222-2222-2222-2222-222222222222',
    assigneeName: 'سارا احمدی',
    projectId: 'proj-01',
    projectName: 'ماژول مالی',
    dueAt: '۱۴۰۵/۰۸/۰۳',
    version: 2,
    createdAt: '۱۴۰۵/۰۷/۲۶',
    updatedAt: '۱۴۰۵/۰۷/۲۹',
  },
  {
    id: '10000000-0000-0000-0000-000000000006',
    key: 'TSK-1006',
    title: 'مذاکره اولیه قرارداد سازمانی با مدیران شرکت پتروشیمی',
    status: 'BACKLOG',
    priority: 'HIGH',
    visibility: 'INTERNAL',
    assigneeId: '22222222-2222-2222-2222-222222222222',
    assigneeName: 'مهرداد کریمی',
    projectId: 'proj-05',
    projectName: 'توسعه فروش سازمانی',
    dueAt: '۱۴۰۵/۰۸/۱۰',
    version: 1,
    createdAt: '۱۴۰۵/۰۷/۲۹',
    updatedAt: '۱۴۰۵/۰۷/۲۹',
  },
];

const INITIAL_TICKETS: TicketDto[] = [
  {
    id: '90000000-0000-0000-0000-000000000001',
    reference: 'TKT-1042',
    title: 'عدم دسترسی به ماژول گزارش‌گیری برای کاربر جدید',
    status: 'OPEN',
    priority: 'HIGH',
    accountId: '50000000-0000-0000-0000-000000000001',
    accountName: 'پتروشیمی سپهر',
    assigneeName: 'کارشناس پشتیبانی',
    targetResolutionAt: 'امروز، ساعت ۱۸:۰۰',
    messagesCount: 3,
    createdAt: '۱۴۰۵/۰۸/۰۲ - ساعت ۱۰:۳۰',
    updatedAt: '۱۴۰۵/۰۸/۰۲ - ساعت ۱۱:۴۵',
  },
  {
    id: '90000000-0000-0000-0000-000000000002',
    reference: 'TKT-1043',
    title: 'خطای اعتبارسنجی در ارسال اطلاعات وب‌هوک به درگاه',
    status: 'PENDING_INTERNAL',
    priority: 'URGENT',
    accountId: '50000000-0000-0000-0000-000000000002',
    accountName: 'صنایع فولاد غرب',
    assigneeName: 'کارشناس فنی زیرساخت',
    targetResolutionAt: 'امروز، ساعت ۱۶:۰۰',
    messagesCount: 5,
    createdAt: '۱۴۰۵/۰۸/۰۱ - ساعت ۱۴:۲۰',
    updatedAt: '۱۴۰۵/۰۸/۰۲ - ساعت ۰۹:۱۵',
  },
  {
    id: '90000000-0000-0000-0000-000000000003',
    reference: 'TKT-1038',
    title: 'درخواست فعال‌سازی اتصال به سامانه مالی و انبارداری',
    status: 'RESOLVED',
    priority: 'NORMAL',
    accountId: '50000000-0000-0000-0000-000000000001',
    accountName: 'پتروشیمی سپهر',
    assigneeName: 'تیم یکپارچه‌سازی API',
    targetResolutionAt: '۱۴۰۵/۰۷/۲۸',
    messagesCount: 4,
    createdAt: '۱۴۰۵/۰۷/۲۷',
    updatedAt: '۱۴۰۵/۰۷/۲۸',
  },
  {
    id: '90000000-0000-0000-0000-000000000004',
    reference: 'TKT-1035',
    title: 'مشکل عدم نمایش تاریخ‌های شمسی در تقویم رویدادها',
    status: 'CLOSED',
    priority: 'LOW',
    accountId: '50000000-0000-0000-0000-000000000003',
    accountName: 'گروه صنعتی مانا',
    assigneeName: 'پشتیبانی فرانت‌اند',
    targetResolutionAt: '۱۴۰۵/۰۷/۲۱',
    messagesCount: 2,
    createdAt: '۱۴۰۵/۰۷/۲۰',
    updatedAt: '۱۴۰۵/۰۷/۲۱',
  },
];

type ActiveTab = 'tasks' | 'tickets';
type TaskFilter = 'ALL' | 'IN_PROGRESS' | 'TODO' | 'BLOCKED' | 'DONE';
type TicketFilter = 'ALL' | 'OPEN' | 'PENDING' | 'RESOLVED';

type ToastState = {
  message: string;
  type: 'success' | 'info' | 'error';
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function App() {
  // Navigation Tabs: "کارهای من" (My Work) & "تیکت‌ها" (Tickets)
  const [activeTab, setActiveTab] = useState<ActiveTab>('tasks');
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('ALL');
  const [ticketFilter, setTicketFilter] = useState<TicketFilter>('ALL');
  const [taskSearch, setTaskSearch] = useState('');
  const [ticketSearch, setTicketSearch] = useState('');

  // Domain & Data State
  const [tasks, setTasks] = useState<TaskSummary[]>(INITIAL_TASKS);
  const [tickets, setTickets] = useState<TicketDto[]>(INITIAL_TICKETS);

  // Offline / Mock State & Pending Sync Queue
  const [isOffline, setIsOffline] = useState(false);
  const [pendingSyncMutations, setPendingSyncMutations] = useState<string[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Task Creation Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('MEDIUM');
  const [newTaskProject, setNewTaskProject] = useState('');

  // Ticket Creation Modal State
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketAccount, setNewTicketAccount] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState<TicketPriority>('NORMAL');
  const [newTicketDescription, setNewTicketDescription] = useState('');

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  };

  // ==========================================
  // TASK TRANSITION & DOMAIN RULE ENFORCEMENT
  // ==========================================

  const handleTaskTransition = (task: TaskSummary, targetStatus: TaskStatus) => {
    // 1. Domain Rule Check via @crm/domain
    const isAllowed = canTransitionTask(task.status, targetStatus, ACTOR_CAPABILITIES);

    if (!isAllowed) {
      Alert.alert(
        'خطای قانون دامنه (Domain Invariant)',
        `بر اساس قوانین تجاری سیستم، انتقال وظیفه از «${getTaskStatusCfg(task.status).label}» به «${getTaskStatusCfg(targetStatus).label}» مجاز نمی‌باشد. گردش کار نیازمند رعایت سلسله‌مراتب وضعیت‌ها است.`,
        [{ text: 'متوجه شدم', style: 'cancel' }],
      );
      return;
    }

    // 2. Perform Valid Transition
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
      const syncRecord = `انتقال وضعیت تسک ${task.key} به ${targetLabel}`;
      setPendingSyncMutations((prev) => [...prev, syncRecord]);
      showToast(`ذخیره در حافظه محلی: وضعیت به «${targetLabel}» تغییر یافت.`, 'info');
    } else {
      showToast(`تسک ${task.key} به وضعیت «${targetLabel}» ارتقا یافت.`, 'success');
    }
  };

  // Test intentionally invalid transition to verify graceful domain error alert
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

  // Handle Task Creation
  const handleCreateTaskSubmit = () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('خطا در اعتبارسنجی', 'لطفاً عنوان تسک را وارد فرمایید.', [
        { text: 'بازگشت', style: 'cancel' },
      ]);
      return;
    }

    const nextIndex = tasks.length + 1001;
    const newKey = `TSK-${nextIndex}`;
    const newTask: TaskSummary = {
      id: `task-${Date.now()}`,
      key: newKey,
      title: newTaskTitle.trim(),
      status: 'TODO',
      priority: newTaskPriority,
      visibility: 'INTERNAL',
      assigneeId: '22222222-2222-2222-2222-222222222222',
      assigneeName: 'کاربر همراه (شما)',
      projectId: 'proj-default',
      projectName: newTaskProject.trim() || 'پروژه جاری سازمان',
      dueAt: '۱۴۰۵/۰۸/۱۵',
      version: 1,
      createdAt: 'امروز',
      updatedAt: 'امروز',
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setNewTaskProject('');
    setNewTaskPriority('MEDIUM');
    setIsTaskModalOpen(false);

    if (isOffline) {
      setPendingSyncMutations((prev) => [...prev, `ایجاد تسک ${newKey}`]);
      showToast(`تسک ${newKey} در حالت آفلاین ثبت شد و در صف همگام‌سازی قرار گرفت.`, 'info');
    } else {
      showToast(`تسک جدید با شناسه ${newKey} با موفقیت افزوده شد.`, 'success');
    }
  };

  // ==========================================
  // TICKET ACTIONS
  // ==========================================

  const handleCreateTicketSubmit = () => {
    if (!newTicketTitle.trim()) {
      Alert.alert('خطا در اعتبارسنجی', 'لطفاً موضوع و عنوان تیکت را وارد نمایید.', [
        { text: 'بازگشت', style: 'cancel' },
      ]);
      return;
    }

    if (!newTicketDescription.trim()) {
      Alert.alert('خطا در اعتبارسنجی', 'لطفاً شرح کامل درخواست را مرقوم فرمایید.', [
        { text: 'بازگشت', style: 'cancel' },
      ]);
      return;
    }

    const nextNumber = tickets.length + 1044;
    const newRef = `TKT-${nextNumber}`;
    const newId = `tkt-${Date.now()}`;

    const newTicket: TicketDto = {
      id: newId,
      reference: newRef,
      title: newTicketTitle.trim(),
      status: 'OPEN',
      priority: newTicketPriority,
      accountId: 'account-1',
      accountName: newTicketAccount.trim() || 'شرکت طرف قرارداد',
      assigneeName: 'تخصیص خودکار به پشتیبانی',
      targetResolutionAt: '۲۴ ساعت کاری آینده',
      messagesCount: 1,
      createdAt: 'امروز، هم‌اکنون',
      updatedAt: 'امروز، هم‌اکنون',
    };

    setTickets([newTicket, ...tickets]);

    // Reset Form
    setNewTicketTitle('');
    setNewTicketAccount('');
    setNewTicketPriority('NORMAL');
    setNewTicketDescription('');
    setIsTicketModalOpen(false);

    if (isOffline) {
      setPendingSyncMutations((prev) => [...prev, `ثبت تیکت ${newRef}`]);
      showToast(`تیکت ${newRef} به صورت محلی ذخیره شد (آفلاین).`, 'info');
    } else {
      showToast(`تیکت جدید با شناسه ${newRef} با موفقیت ارسال گردید.`, 'success');
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
      setPendingSyncMutations((prev) => [...prev, `تغییر وضعیت تیکت ${ticket.reference}`]);
      showToast(`تیکت ${ticket.reference} به وضعیت «${nextLabel}» تغییر یافت (آفلاین).`, 'info');
    } else {
      showToast(`وضعیت تیکت ${ticket.reference} به «${nextLabel}» تغییر یافت.`, 'success');
    }
  };

  // ==========================================
  // OFFLINE & SYNC CONTROLS
  // ==========================================

  const handleToggleNetwork = () => {
    if (!isOffline) {
      setIsOffline(true);
      showToast('حالت آفلاین فعال شد. تغییرات در حافظه محلی ذخیره می‌شوند.', 'info');
    } else {
      setIsOffline(false);
      if (pendingSyncMutations.length > 0) {
        const count = pendingSyncMutations.length;
        setPendingSyncMutations([]);
        showToast(`اتصال برقرار شد؛ ${count} تغییر با سرور همگام‌سازی گردید.`, 'success');
      } else {
        showToast('اتصال با سرور برقرار شد. سامانه آنلاین است.', 'success');
      }
    }
  };

  const handleManualSync = () => {
    if (isOffline) {
      Alert.alert(
        'خطای اتصال به شبکه',
        'دستگاه در حالت آفلاین قرار دارد. جهت ارسال تغییرات محلی به سرور، ابتدا ارتباط آنلاین را فعال کنید.',
        [
          { text: 'فعال‌سازی وضعیت آنلاین', onPress: handleToggleNetwork },
          { text: 'انصراف', style: 'cancel' },
        ],
      );
      return;
    }

    if (pendingSyncMutations.length === 0) {
      showToast('تمامی داده‌ها با سرور مرکزی هماهنگ و به‌روز هستند.', 'info');
      return;
    }

    const count = pendingSyncMutations.length;
    setPendingSyncMutations([]);
    showToast(`${count} عملیات صف با موفقیت در سرور ثبت شد.`, 'success');
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

  const activeTasksCount = tasks.filter((t) => t.status !== 'DONE' && t.status !== 'CANCELED').length;
  const activeTicketsCount = tickets.filter(
    (t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED',
  ).length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f8fa" />

      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          {/* Online/Offline Toggle */}
          <TouchableOpacity
            style={[styles.networkBadge, isOffline ? styles.offlineBadge : styles.onlineBadge]}
            onPress={handleToggleNetwork}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.networkDot,
                { backgroundColor: isOffline ? '#D97706' : '#16A34A' },
              ]}
            />
            <Text
              style={[
                styles.networkText,
                { color: isOffline ? '#92400E' : '#166534' },
              ]}
            >
              {isOffline ? 'آفلاین (محلی)' : 'آنلاین'}
            </Text>
          </TouchableOpacity>

          {/* Org & App Eyebrow */}
          <View style={styles.headerTitles}>
            <Text style={styles.eyebrow}>فضای کاری سازمان CRM</Text>
            <Text style={styles.appTitle}>سامانه همراه پیشگامان</Text>
          </View>
        </View>

        {/* Offline Notice Banner */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <View style={styles.offlineBannerContent}>
              <Text style={styles.offlineBannerTitle}>
                ⚡ حالت کاری آفلاین فعال است
              </Text>
              <Text style={styles.offlineBannerDesc}>
                تغییرات به صورت محلی ذخیره می‌شوند.
                {pendingSyncMutations.length > 0
                  ? ` (${pendingSyncMutations.length} مورد در صف ارسال)`
                  : ' (صف همگام‌سازی خالی است)'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.syncButton}
              onPress={handleManualSync}
              activeOpacity={0.8}
            >
              <Text style={styles.syncButtonText}>همگام‌سازی</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Navigation Tabs: "کارهای من" & "تیکت‌ها" */}
        <View style={styles.tabContainer}>
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
        </View>
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
        {activeTab === 'tasks' ? (
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
              filteredTasks.map((task) => {
                const statusCfg = getTaskStatusCfg(task.status);
                const priorityCfg = getTaskPriorityCfg(task.priority);

                // Compute transitions strictly allowed by domain rules
                const availableTransitions = ALL_TASK_STATUSES.filter((target) =>
                  canTransitionTask(task.status, target, ACTOR_CAPABILITIES),
                );

                return (
                  <View key={task.id} style={styles.itemCard}>
                    {/* Header Row: Key & Badges */}
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.badgesCluster}>
                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor: statusCfg.bg,
                              borderColor: statusCfg.borderColor,
                            },
                          ]}
                        >
                          <Text style={[styles.badgeText, { color: statusCfg.color }]}>
                            {statusCfg.label}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: priorityCfg.bg, borderColor: priorityCfg.bg },
                          ]}
                        >
                          <Text style={[styles.badgeText, { color: priorityCfg.color }]}>
                            {priorityCfg.label}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.taskKeyBadge}>{task.key}</Text>
                    </View>

                    {/* Task Title */}
                    <Text style={styles.itemTitle}>{task.title}</Text>

                    {/* Metadata Pill Box */}
                    <View style={styles.metadataBox}>
                      {task.dueAt && (
                        <View style={styles.metaRow}>
                          <Text style={styles.metaLabel}>مهلت:</Text>
                          <Text style={styles.metaValue}>{task.dueAt}</Text>
                        </View>
                      )}
                      {task.projectName && (
                        <View style={styles.metaRow}>
                          <Text style={styles.metaLabel}>پروژه:</Text>
                          <Text style={styles.metaValue}>{task.projectName}</Text>
                        </View>
                      )}
                      {task.assigneeName && (
                        <View style={styles.metaRow}>
                          <Text style={styles.metaLabel}>مسئول:</Text>
                          <Text style={styles.metaValue}>{task.assigneeName}</Text>
                        </View>
                      )}
                    </View>

                    {/* Version & Update Time */}
                    <View style={styles.metaFooterRow}>
                      <Text style={styles.versionTag}>نسخه: v{task.version}</Text>
                      <Text style={styles.updatedAtTag}>بروزرسانی: {task.updatedAt}</Text>
                    </View>

                    <View style={styles.cardDivider} />

                    {/* Quick Transitions Section */}
                    <View style={styles.transitionSection}>
                      <Text style={styles.transitionPrompt}>
                        گردش کار و تغییر وضعیت:
                      </Text>

                      {availableTransitions.length > 0 ? (
                        <View style={styles.actionButtonWrap}>
                          {availableTransitions.map((target) => {
                            const btnLabel = getTransitionButtonText(task.status, target);
                            const targetCfg = getTaskStatusCfg(target);
                            return (
                              <TouchableOpacity
                                key={target}
                                style={[
                                  styles.quickTransitionButton,
                                  { borderColor: targetCfg.borderColor },
                                ]}
                                onPress={() => handleTaskTransition(task, target)}
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={[
                                    styles.quickTransitionButtonText,
                                    { color: targetCfg.color },
                                  ]}
                                >
                                  {btnLabel}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ) : (
                        <Text style={styles.noTransitionNote}>
                          وظیفه در وضعیت نهایی است.
                        </Text>
                      )}

                      {/* Test domain rule rejection */}
                      <TouchableOpacity
                        style={styles.testDomainButton}
                        onPress={() => handleTestInvalidTransition(task)}
                      >
                        <Text style={styles.testDomainButtonText}>
                          تست قانون محدودیت دامنه (رد انتقال غیرمجاز)
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : (
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
              filteredTickets.map((ticket) => {
                const statusCfg = getTicketStatusCfg(ticket.status);
                const priorityCfg = getTicketPriorityCfg(ticket.priority);
                const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';

                return (
                  <View key={ticket.id} style={styles.itemCard}>
                    {/* Header Row: Reference & Badges */}
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.badgesCluster}>
                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor: statusCfg.bg,
                              borderColor: statusCfg.borderColor,
                            },
                          ]}
                        >
                          <Text style={[styles.badgeText, { color: statusCfg.color }]}>
                            {statusCfg.label}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: priorityCfg.bg, borderColor: priorityCfg.bg },
                          ]}
                        >
                          <Text style={[styles.badgeText, { color: priorityCfg.color }]}>
                            {priorityCfg.label}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.ticketRefBadge}>{ticket.reference}</Text>
                    </View>

                    {/* Title */}
                    <Text style={styles.itemTitle}>{ticket.title}</Text>

                    {/* Account & Details Box */}
                    <View style={styles.metadataBox}>
                      {ticket.accountName && (
                        <View style={styles.metaRow}>
                          <Text style={styles.metaLabel}>مشتری:</Text>
                          <Text style={styles.metaValue}>{ticket.accountName}</Text>
                        </View>
                      )}
                      <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>پیام‌ها:</Text>
                        <Text style={styles.metaValue}>💬 {ticket.messagesCount} پیام</Text>
                      </View>
                      {ticket.assigneeName && (
                        <View style={styles.metaRow}>
                          <Text style={styles.metaLabel}>مسئول:</Text>
                          <Text style={styles.metaValue}>{ticket.assigneeName}</Text>
                        </View>
                      )}
                      {ticket.targetResolutionAt && (
                        <View style={styles.metaRow}>
                          <Text style={styles.metaLabel}>هدف حل (SLA):</Text>
                          <Text style={styles.metaValue}>{ticket.targetResolutionAt}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardDivider} />

                    {/* Footer Row: Status Action & Date */}
                    <View style={styles.ticketFooterRow}>
                      <Text style={styles.updatedAtTag}>{ticket.createdAt}</Text>

                      <TouchableOpacity
                        style={[
                          styles.ticketStatusBtn,
                          isResolved ? styles.reopenTicketBtn : styles.resolveTicketBtn,
                        ]}
                        onPress={() => handleToggleTicketStatus(ticket)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.ticketStatusBtnText,
                            isResolved ? styles.reopenTicketBtnText : styles.resolveTicketBtnText,
                          ]}
                        >
                          {isResolved ? 'بازگشایی مجدد تیکت ↺' : 'تغییر به حل‌شده ✓'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* ================= TASK CREATION MODAL ================= */}
      <Modal
        visible={isTaskModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsTaskModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setIsTaskModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>تعریف وظیفه جدید</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formItem}>
                <Text style={styles.formItemLabel}>عنوان وظیفه *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="مثلاً: بررسی نیازمندی‌های ماژول انبارداری..."
                  placeholderTextColor="#94A3B8"
                  value={newTaskTitle}
                  onChangeText={setNewTaskTitle}
                  textAlign="right"
                />
              </View>

              <View style={styles.formItem}>
                <Text style={styles.formItemLabel}>نام پروژه یا موضوع</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="مثلاً: سامانه مدیریت مالی..."
                  placeholderTextColor="#94A3B8"
                  value={newTaskProject}
                  onChangeText={setNewTaskProject}
                  textAlign="right"
                />
              </View>

              <View style={styles.formItem}>
                <Text style={styles.formItemLabel}>اولویت وظیفه</Text>
                <View style={styles.prioritySelectorRow}>
                  {(
                    [
                      { key: 'LOW', label: 'پایین' },
                      { key: 'MEDIUM', label: 'متوسط' },
                      { key: 'HIGH', label: 'بالا' },
                      { key: 'URGENT', label: 'بسیار فوری' },
                    ] as const
                  ).map((p) => {
                    const isSelected = newTaskPriority === p.key;
                    const pCfg = getTaskPriorityCfg(p.key);
                    return (
                      <TouchableOpacity
                        key={p.key}
                        style={[
                          styles.priorityChipBtn,
                          isSelected && {
                            backgroundColor: pCfg.bg,
                            borderColor: pCfg.color,
                          },
                        ]}
                        onPress={() => setNewTaskPriority(p.key)}
                      >
                        <Text
                          style={[
                            styles.priorityChipBtnText,
                            isSelected && { color: pCfg.color, fontWeight: '700' },
                          ]}
                        >
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={styles.modalSubmitButton}
                  onPress={handleCreateTaskSubmit}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalSubmitButtonText}>ثبت و ایجاد وظیفه</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setIsTaskModalOpen(false)}
                >
                  <Text style={styles.modalCancelButtonText}>انصراف</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= TICKET CREATION MODAL ================= */}
      <Modal
        visible={isTicketModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsTicketModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setIsTicketModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>ثبت تیکت پشتیبانی جدید</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formItem}>
                <Text style={styles.formItemLabel}>موضوع تیکت *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="مثلاً: خطای دسترسی به گزارشات فصلی"
                  placeholderTextColor="#94A3B8"
                  value={newTicketTitle}
                  onChangeText={setNewTicketTitle}
                  textAlign="right"
                />
              </View>

              <View style={styles.formItem}>
                <Text style={styles.formItemLabel}>نام مشتری یا شرکت کارفرما</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="مثلاً: پتروشیمی زاگرس"
                  placeholderTextColor="#94A3B8"
                  value={newTicketAccount}
                  onChangeText={setNewTicketAccount}
                  textAlign="right"
                />
              </View>

              <View style={styles.formItem}>
                <Text style={styles.formItemLabel}>اولویت رسیدگی (SLA)</Text>
                <View style={styles.prioritySelectorRow}>
                  {(
                    [
                      { key: 'LOW', label: 'پایین' },
                      { key: 'NORMAL', label: 'عادی' },
                      { key: 'HIGH', label: 'بالا' },
                      { key: 'URGENT', label: 'بسیار فوری' },
                    ] as const
                  ).map((p) => {
                    const isSelected = newTicketPriority === p.key;
                    const pCfg = getTicketPriorityCfg(p.key);
                    return (
                      <TouchableOpacity
                        key={p.key}
                        style={[
                          styles.priorityChipBtn,
                          isSelected && {
                            backgroundColor: pCfg.bg,
                            borderColor: pCfg.color,
                          },
                        ]}
                        onPress={() => setNewTicketPriority(p.key)}
                      >
                        <Text
                          style={[
                            styles.priorityChipBtnText,
                            isSelected && { color: pCfg.color, fontWeight: '700' },
                          ]}
                        >
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formItem}>
                <Text style={styles.formItemLabel}>شرح کامل درخواست و جزییات خطا *</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="توضیحات و شرایط وقوع مشکل را با جزییات شرح دهید..."
                  placeholderTextColor="#94A3B8"
                  value={newTicketDescription}
                  onChangeText={setNewTicketDescription}
                  multiline={true}
                  numberOfLines={4}
                  textAlign="right"
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={[styles.modalSubmitButton, { backgroundColor: '#0284C7' }]}
                  onPress={handleCreateTicketSubmit}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalSubmitButtonText}>ثبت و ارسال تیکت</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setIsTicketModalOpen(false)}
                >
                  <Text style={styles.modalCancelButtonText}>انصراف</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitles: {
    alignItems: 'flex-end',
  },
  eyebrow: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  appTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  onlineBadge: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  offlineBadge: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  networkText: {
    fontSize: 12,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  offlineBanner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  offlineBannerContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  offlineBannerTitle: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  offlineBannerDesc: {
    color: '#B45309',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  syncButton: {
    backgroundColor: '#D97706',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    writingDirection: 'rtl',
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
    flex: 1,
    paddingVertical: 9,
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
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    writingDirection: 'rtl',
  },
  tabTextActive: {
    color: '#1E40AF',
    fontWeight: '800',
  },
  tabBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },
  tabBadgeActive: {
    backgroundColor: '#EFF6FF',
  },
  tabBadgeInactive: {
    backgroundColor: '#E2E8F0',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabBadgeTextActive: {
    color: '#2563EB',
  },
  tabBadgeTextInactive: {
    color: '#64748B',
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
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskKeyBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ticketRefBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgesCluster: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  metadataBox: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  metaLabel: {
    fontSize: 11,
    color: '#64748B',
    writingDirection: 'rtl',
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    writingDirection: 'rtl',
  },
  metaFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  versionTag: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  updatedAtTag: {
    fontSize: 11,
    color: '#94A3B8',
    writingDirection: 'rtl',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 2,
  },
  transitionSection: {
    gap: 6,
  },
  transitionPrompt: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  actionButtonWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickTransitionButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  quickTransitionButtonText: {
    fontSize: 11,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  noTransitionNote: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
    writingDirection: 'rtl',
    fontStyle: 'italic',
  },
  testDomainButton: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  testDomainButtonText: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'underline',
  },
  ticketFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketStatusBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  resolveTicketBtn: {
    backgroundColor: '#ECFDF3',
    borderColor: '#A6F4C5',
  },
  resolveTicketBtnText: {
    color: '#027A48',
    fontSize: 11,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  reopenTicketBtn: {
    backgroundColor: '#EFF8FF',
    borderColor: '#B2DDFF',
  },
  reopenTicketBtnText: {
    color: '#175CD3',
    fontSize: 11,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  ticketStatusBtnText: {
    fontSize: 11,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  formItem: {
    marginBottom: 12,
    gap: 5,
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
    fontSize: 13,
    color: '#0F172A',
    writingDirection: 'rtl',
  },
  formTextArea: {
    height: 80,
    paddingTop: 8,
  },
  prioritySelectorRow: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  priorityChipBtn: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  priorityChipBtnText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    writingDirection: 'rtl',
  },
  modalButtonRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 8,
    marginBottom: 14,
  },
  modalSubmitButton: {
    flex: 2,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
});
