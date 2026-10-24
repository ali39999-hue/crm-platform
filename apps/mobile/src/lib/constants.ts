import type {
  TaskPriority,
  TaskStatus,
  TaskSummary,
  TicketDto,
  TicketPriority,
  TicketStatus,
} from '@crm/contracts';
import type { TransitionActorCapabilities } from '@crm/domain';

export const ACTOR_CAPABILITIES: TransitionActorCapabilities = {
  canReopenDoneTask: true,
  canRestoreCanceledTask: true,
};

export const ALL_TASK_STATUSES: readonly TaskStatus[] = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'BLOCKED',
  'DONE',
  'CANCELED',
];

export interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  borderColor: string;
}

export interface PriorityConfig {
  label: string;
  color: string;
  bg: string;
}

export const TASK_STATUS_CONFIG: Record<TaskStatus, StatusConfig> = {
  BACKLOG: { label: 'بک‌لاگ', color: '#475467', bg: '#F2F4F7', borderColor: '#D0D5DD' },
  TODO: { label: 'در انتظار شروع', color: '#175CD3', bg: '#EFF8FF', borderColor: '#B2DDFF' },
  IN_PROGRESS: { label: 'در حال انجام', color: '#B54708', bg: '#FEF0C7', borderColor: '#FEDF89' },
  IN_REVIEW: { label: 'در انتظار بازبینی', color: '#6938EF', bg: '#F4EBFF', borderColor: '#D9D6FE' },
  BLOCKED: { label: 'مسدود شده', color: '#B42318', bg: '#FEE4E2', borderColor: '#FECDCA' },
  DONE: { label: 'تکمیل‌شده', color: '#067647', bg: '#ECFDF3', borderColor: '#A6F4C5' },
  CANCELED: { label: 'لغو شده', color: '#667085', bg: '#F8F9FA', borderColor: '#E4E8EF' },
};

export const TASK_PRIORITY_CONFIG: Record<TaskPriority, PriorityConfig> = {
  URGENT: { label: 'بسیار فوری', color: '#B42318', bg: '#FEE4E2' },
  HIGH: { label: 'بالا', color: '#B54708', bg: '#FEF0C7' },
  MEDIUM: { label: 'متوسط', color: '#026AA2', bg: '#E0F2FE' },
  LOW: { label: 'پایین', color: '#344054', bg: '#F2F4F7' },
};

export const TICKET_STATUS_CONFIG: Record<TicketStatus, StatusConfig> = {
  NEW: { label: 'جدید', color: '#026AA2', bg: '#E0F2FE', borderColor: '#B9E6FE' },
  OPEN: { label: 'باز', color: '#B54708', bg: '#FEF0C7', borderColor: '#FEDF89' },
  PENDING_CUSTOMER: { label: 'منتظر مشتری', color: '#6938EF', bg: '#F4EBFF', borderColor: '#D9D6FE' },
  PENDING_INTERNAL: { label: 'منتظر کارشناس', color: '#C4320A', bg: '#FFF6ED', borderColor: '#F9DBAF' },
  RESOLVED: { label: 'حل‌شده', color: '#067647', bg: '#ECFDF3', borderColor: '#A6F4C5' },
  CLOSED: { label: 'بسته شده', color: '#475467', bg: '#F2F4F7', borderColor: '#D0D5DD' },
};

export const TICKET_PRIORITY_CONFIG: Record<TicketPriority, PriorityConfig> = {
  URGENT: { label: 'بسیار فوری', color: '#B42318', bg: '#FEE4E2' },
  HIGH: { label: 'بالا', color: '#B54708', bg: '#FEF0C7' },
  NORMAL: { label: 'عادی', color: '#026AA2', bg: '#E0F2FE' },
  LOW: { label: 'پایین', color: '#344054', bg: '#F2F4F7' },
};

export function getTaskStatusCfg(status: TaskStatus): StatusConfig {
  return (
    TASK_STATUS_CONFIG[status] ?? {
      label: status,
      color: '#475467',
      bg: '#F2F4F7',
      borderColor: '#D0D5DD',
    }
  );
}

export function getTaskPriorityCfg(priority: TaskPriority): PriorityConfig {
  return (
    TASK_PRIORITY_CONFIG[priority] ?? {
      label: priority,
      color: '#344054',
      bg: '#F2F4F7',
    }
  );
}

export function getTicketStatusCfg(status: TicketStatus): StatusConfig {
  return (
    TICKET_STATUS_CONFIG[status] ?? {
      label: status,
      color: '#475467',
      bg: '#F2F4F7',
      borderColor: '#D0D5DD',
    }
  );
}

export function getTicketPriorityCfg(priority: TicketPriority): PriorityConfig {
  return (
    TICKET_PRIORITY_CONFIG[priority] ?? {
      label: priority,
      color: '#344054',
      bg: '#F2F4F7',
    }
  );
}

export function getTransitionButtonText(current: TaskStatus, target: TaskStatus): string {
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

export const INITIAL_TASKS: TaskSummary[] = [
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

export const INITIAL_TICKETS: TicketDto[] = [
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
