/**
 * Type-safe API client for CRM platform.
 * Reads NEXT_PUBLIC_API_URL or defaults to http://localhost:4000/api/v1.
 * Supports authentication token management and graceful fallback for offline/development mode.
 */

import type {
  AutomationRuleDto,
  AutomationRunDto,
  CreateAutomationRuleRequest,
  SimulateAutomationRequest,
  SimulateAutomationResponse,
  CreateSavedViewRequest,
  CrmFunnelReport,
  CustomReportQueryDto,
  CustomReportResultDto,
  AnalyticsTimeframe,
  ReportGroupBreakdown,
  DashboardKpiReport,
  NotificationDto,
  NotificationPreferencesDto,
  SavedViewDto,
  SavedViewEntityType,
  SearchQueryDto,
  SearchResultDto,
  SearchResultItem,
  SupportSlaReport,
  WorkloadReportItem,
  AccountDto,
  AddTicketMessageRequest,
  ApiError,
  ApiResponse,
  ContactDto,
  ConvertLeadRequest,
  ConvertLeadResponse,
  CreateAccountRequest,
  CreateContactRequest,
  CreateDealRequest,
  CreateLeadRequest,
  CreateTaskRequest,
  CreateTicketRequest,
  CurrentUserDto,
  CustomerTimelineItem,
  DealDto,
  LeadDto,
  PageQuery,
  PageResult,
  RecordVisibility,
  TaskDetails,
  TaskPriority,
  TaskStatus,
  TaskSummary,
  TicketDto,
  TicketMessageDto,
  TicketPriority,
  TransitionTaskRequest,
  WorkspaceDto,
  ActivityDto,
  ActivityStatus,
  ActivityType,
  CalendarConflictDto,
  CreateActivityRequest,
  CreateDocumentRequest,
  CreateDocumentSpaceRequest,
  DocumentDetailDto,
  DocumentRevisionDto,
  DocumentSpaceDto,
  DocumentSummaryDto,
  DocumentVisibility,
  UpdateActivityRequest,
  UpdateDocumentRequest,
  InviteMemberRequest,
  OrganizationMemberDto,
  OrganizationSettingsDto,
  UpdateMemberRoleRequest,
  UpdateOrganizationSettingsRequest,
  DuplicateCandidateDto,
  MergeRecordsRequest,
  PipelineStageDto,
  UpdateDealDto,
  CreateCustomFieldRequest,
  CustomFieldDefinitionDto,
  CustomFieldEntityType,
  CustomFieldType,
  UpdateCustomFieldRequest,
} from '@crm/contracts';

import {
  canTransitionTask,
  sanitizeDocumentContent,
  generateSlug,
  type TransitionActorCapabilities,
} from '@crm/domain';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'API_CLIENT_ERROR',
    public details?: Array<{ field?: string; reason: string }>,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

const DEFAULT_ORG_ID = '11111111-1111-1111-1111-111111111111';
const DEFAULT_EMPLOYEE_ID = '22222222-2222-2222-2222-222222222222';
const DEFAULT_API_URL = 'http://localhost:4000/api/v1';

export class ApiClient {
  private baseUrl: string;
  private token: string;

  // In-memory fallback state for offline / build time
  private fallbackTasks: TaskDetails[] = [
    {
      id: '10000000-0000-0000-0000-000000000001',
      key: 'TSK-1001',
      title: 'بررسی مدارک و اعتبارسنجی قرارداد مشتری جدید',
      description: 'بررسی کامل اسناد هویتی و ثبتی شرکت و استعلام تضامین بانکی',
      status: 'TODO',
      priority: 'HIGH',
      visibility: 'INTERNAL',
      assigneeId: DEFAULT_EMPLOYEE_ID,
      assigneeName: 'کارمند عملیات',
      creatorId: DEFAULT_EMPLOYEE_ID,
      creatorName: 'کارمند عملیات',
      projectId: null,
      projectName: null,
      dueAt: '۱۴۰۵/۰۸/۰۴',
      version: 1,
      commentsCount: 0,
      dependencies: [],
      createdAt: '2026-10-20T08:00:00.000Z',
      updatedAt: '2026-10-20T08:00:00.000Z',
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      key: 'TSK-1002',
      title: 'پیاده‌سازی تست‌های امنیتی احراز هویت و مجوزها',
      description: 'نوشتن تست‌های رگرسیون برای نقش‌های چندسازمانی و توکن‌های دسترسی',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      visibility: 'INTERNAL',
      assigneeId: DEFAULT_EMPLOYEE_ID,
      assigneeName: 'کارمند عملیات',
      creatorId: DEFAULT_EMPLOYEE_ID,
      creatorName: 'کارمند عملیات',
      projectId: null,
      projectName: null,
      dueAt: '۱۴۰۵/۰۸/۰۲',
      version: 1,
      commentsCount: 2,
      dependencies: ['10000000-0000-0000-0000-000000000001'],
      createdAt: '2026-10-21T09:30:00.000Z',
      updatedAt: '2026-10-22T10:15:00.000Z',
    },
    {
      id: '10000000-0000-0000-0000-000000000003',
      key: 'TSK-1003',
      title: 'بازبینی معماری پایگاه داده و شاخص‌گذاری جدول‌های CRM',
      description: 'بررسی کندی کوئری‌های جدول Lead و Account و ایجاد Composite Index',
      status: 'IN_REVIEW',
      priority: 'MEDIUM',
      visibility: 'INTERNAL',
      assigneeId: DEFAULT_EMPLOYEE_ID,
      assigneeName: 'کارمند عملیات',
      creatorId: DEFAULT_EMPLOYEE_ID,
      creatorName: 'کارمند عملیات',
      projectId: null,
      projectName: null,
      dueAt: '۱۴۰۵/۰۸/۰۶',
      version: 2,
      commentsCount: 1,
      dependencies: [],
      createdAt: '2026-10-18T11:00:00.000Z',
      updatedAt: '2026-10-23T14:20:00.000Z',
    },
    {
      id: '10000000-0000-0000-0000-000000000004',
      key: 'TSK-1004',
      title: 'تنظیمات اولیه زیرساخت کانتینرها و مانیتورینگ',
      description: 'پیکربندی داکر کامپوز و مانیتورینگ سلامت سرویس با پرومتئوس',
      status: 'DONE',
      priority: 'LOW',
      visibility: 'INTERNAL',
      assigneeId: DEFAULT_EMPLOYEE_ID,
      assigneeName: 'کارمند عملیات',
      creatorId: DEFAULT_EMPLOYEE_ID,
      creatorName: 'کارمند عملیات',
      projectId: null,
      projectName: null,
      dueAt: '۱۴۰۵/۰۸/۰۱',
      version: 3,
      commentsCount: 0,
      dependencies: [],
      createdAt: '2026-10-15T07:45:00.000Z',
      updatedAt: '2026-10-20T16:00:00.000Z',
    },
  ];

  private fallbackAccounts: AccountDto[] = [
    {
      id: '50000000-0000-0000-0000-000000000001',
      name: 'پتروشیمی سپهر',
      type: 'CUSTOMER',
      status: 'ACTIVE',
      website: 'https://sepehr-petro.com',
      phone: '021-22334455',
      ownerId: DEFAULT_EMPLOYEE_ID,
      createdAt: '2026-10-01T10:00:00.000Z',
      updatedAt: '2026-10-15T12:00:00.000Z',
    },
    {
      id: '50000000-0000-0000-0000-000000000002',
      name: 'فولاد گستر آریا',
      type: 'CUSTOMER',
      status: 'ACTIVE',
      website: 'https://foolad-arya.ir',
      phone: '021-88776655',
      ownerId: DEFAULT_EMPLOYEE_ID,
      createdAt: '2026-09-15T09:00:00.000Z',
      updatedAt: '2026-10-18T14:30:00.000Z',
    },
    {
      id: '50000000-0000-0000-0000-000000000003',
      name: 'فناوری داده‌پژوهان',
      type: 'PROSPECT',
      status: 'ACTIVE',
      website: 'https://datapajohan.ir',
      phone: '021-44556677',
      ownerId: DEFAULT_EMPLOYEE_ID,
      createdAt: '2026-10-10T11:20:00.000Z',
      updatedAt: '2026-10-22T08:10:00.000Z',
    },
  ];

  private fallbackContacts: ContactDto[] = [
    {
      id: 'cnt-1',
      accountId: '50000000-0000-0000-0000-000000000001',
      accountName: 'پتروشیمی سپهر',
      firstName: 'سحر',
      lastName: 'صادقی',
      email: 'sadeghi@sepehr-petro.com',
      phone: '09121112233',
      ownerId: DEFAULT_EMPLOYEE_ID,
      createdAt: '2026-10-02T10:00:00.000Z',
      updatedAt: '2026-10-02T10:00:00.000Z',
    },
    {
      id: 'cnt-2',
      accountId: '50000000-0000-0000-0000-000000000002',
      accountName: 'فولاد گستر آریا',
      firstName: 'آرشام',
      lastName: 'میرزایی',
      email: 'mirzaei@foolad-arya.ir',
      phone: '09123334455',
      ownerId: DEFAULT_EMPLOYEE_ID,
      createdAt: '2026-09-16T12:00:00.000Z',
      updatedAt: '2026-09-16T12:00:00.000Z',
    },
  ];

  private fallbackLeads: LeadDto[] = [
    {
      id: 'lead-1',
      displayName: 'شرکت توسعه هوش مصنوعی زاگرس',
      email: 'zagros-ai@example.com',
      phone: '09124445566',
      source: 'WEBSITE',
      status: 'QUALIFIED',
      ownerId: DEFAULT_EMPLOYEE_ID,
      createdAt: '2026-10-18T10:00:00.000Z',
      updatedAt: '2026-10-21T14:00:00.000Z',
    },
    {
      id: 'lead-2',
      displayName: 'بازرگانی پارس آریا',
      email: 'info@pars-arya.ir',
      phone: '09125556677',
      source: 'REFERRAL',
      status: 'NEW',
      ownerId: DEFAULT_EMPLOYEE_ID,
      createdAt: '2026-10-22T09:30:00.000Z',
      updatedAt: '2026-10-22T09:30:00.000Z',
    },
  ];

  private fallbackDeals: DealDto[] = [
    {
      id: 'deal-1',
      accountId: '50000000-0000-0000-0000-000000000002',
      name: 'قرارداد سالانه پشتیبانی سازمانی',
      stage: 'PROPOSAL',
      amountMinor: 350000000,
      currency: 'IRR',
      probability: 70,
      targetCloseAt: '2026-11-15T00:00:00.000Z',
      ownerId: DEFAULT_EMPLOYEE_ID,
      createdAt: '2026-10-10T14:00:00.000Z',
      updatedAt: '2026-10-20T16:00:00.000Z',
    },
    {
      id: 'deal-2',
      accountId: '50000000-0000-0000-0000-000000000001',
      name: 'توسعه سفارشی ماژول ERP',
      stage: 'NEGOTIATION',
      amountMinor: 1200000000,
      currency: 'IRR',
      probability: 85,
      targetCloseAt: '2026-11-30T00:00:00.000Z',
      ownerId: DEFAULT_EMPLOYEE_ID,
      createdAt: '2026-10-12T11:00:00.000Z',
      updatedAt: '2026-10-23T10:00:00.000Z',
    },
  ];

  private fallbackTickets: TicketDto[] = [
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
      messagesCount: 2,
      createdAt: '۱۴۰۵/۰۸/۰۲ - ساعت ۱۰:۳۰',
      updatedAt: '۱۴۰۵/۰۸/۰۲ - ساعت ۱۱:۴۵',
    },
    {
      id: '90000000-0000-0000-0000-000000000003',
      reference: 'TKT-1038',
      title: 'درخواست وب‌هوک برای یکپارچه‌سازی با سامانه مالی',
      status: 'RESOLVED',
      priority: 'NORMAL',
      accountId: '50000000-0000-0000-0000-000000000001',
      accountName: 'پتروشیمی سپهر',
      assigneeName: 'کارشناس فنی',
      targetResolutionAt: '۱۴۰۵/۰۷/۲۸',
      messagesCount: 3,
      createdAt: '۱۴۰۵/۰۷/۲۷',
      updatedAt: '۱۴۰۵/۰۷/۲۸',
    },
    {
      id: '90000000-0000-0000-0000-000000000004',
      reference: 'TKT-1041',
      title: 'درخواست افزایش سهمیه فایل‌های پیوست',
      status: 'PENDING_CUSTOMER',
      priority: 'NORMAL',
      accountId: '50000000-0000-0000-0000-000000000002',
      accountName: 'فولاد گستر آریا',
      assigneeName: 'کارشناس پشتیبانی',
      targetResolutionAt: '۱۴۰۵/۰۸/۰۳',
      messagesCount: 2,
      createdAt: '۱۴۰۵/۰۸/۰۱',
      updatedAt: '۱۴۰۵/۰۸/۰۲',
    },
  ];

  private fallbackTicketMessages: Record<string, TicketMessageDto[]> = {
    '90000000-0000-0000-0000-000000000001': [
      {
        id: 'msg-1',
        ticketId: '90000000-0000-0000-0000-000000000001',
        authorName: 'کاربر مشتری (شما)',
        body: 'سلام، ما نمی‌توانیم گزارش خروجی ماهانه را دریافت کنیم. لطفاً دسترسی ما را فعال کنید.',
        visibility: 'CUSTOMER_SHARED',
        createdAt: '۱۰:۳۰',
      },
      {
        id: 'msg-2',
        ticketId: '90000000-0000-0000-0000-000000000001',
        authorName: 'کارشناس پشتیبانی',
        body: 'یادداشت داخلی: لاگ‌های دسترسی کاربر بررسی شد. نیاز به بازنشانی مجوز دارد.',
        visibility: 'INTERNAL',
        createdAt: '۱۱:۰۰',
      },
      {
        id: 'msg-3',
        ticketId: '90000000-0000-0000-0000-000000000001',
        authorName: 'پشتیبانی فنی پلتفرم',
        body: 'با سلام، درخواست شما دریافت و در حال بررسی سطح دسترسی سازمانی شما هستیم.',
        visibility: 'CUSTOMER_SHARED',
        createdAt: '۱۱:۴۵',
      },
    ],
  };

  private fallbackTimeline: CustomerTimelineItem[] = [
    {
      id: 'act-1',
      entityType: 'ACCOUNT',
      entityId: '50000000-0000-0000-0000-000000000001',
      kind: 'ACCOUNT_CREATED',
      summary: 'حساب شرکت پتروشیمی سپهر ثبت گردید',
      occurredAt: '2026-10-01T10:00:00.000Z',
      actorName: 'کارمند عملیات',
    },
    {
      id: 'act-2',
      entityType: 'DEAL',
      entityId: 'deal-2',
      kind: 'DEAL_PROPOSAL_SENT',
      summary: 'پیشنهاد قیمت توسعه سفارشی ماژول ERP به مبلغ ۱,۲۰۰,۰۰۰,۰۰۰ ریال ارسال گردید',
      occurredAt: '2026-10-12T11:00:00.000Z',
      actorName: 'کارمند عملیات',
      metadata: { accountId: '50000000-0000-0000-0000-000000000001' },
    },
    {
      id: 'act-3',
      entityType: 'TICKET',
      entityId: '90000000-0000-0000-0000-000000000001',
      kind: 'TICKET_CREATED',
      summary: 'تیکت TKT-1042 با عنوان «عدم دسترسی به ماژول گزارش‌گیری» ثبت شد',
      occurredAt: '2026-10-20T10:30:00.000Z',
      actorName: 'کاربر مشتری',
      metadata: { accountId: '50000000-0000-0000-0000-000000000001' },
    },
    {
      id: 'act-4',
      entityType: 'ACCOUNT',
      entityId: '50000000-0000-0000-0000-000000000001',
      kind: 'CALL_LOGGED',
      summary: 'تماس تلفنی با مدیر فناوری در خصوص زمان تحویل نسخه آزمایشی انجام شد',
      occurredAt: '2026-10-22T14:15:00.000Z',
      actorName: 'کارشناس فروش',
    },
    {
      id: 'act-5',
      entityType: 'ACCOUNT',
      entityId: '50000000-0000-0000-0000-000000000002',
      kind: 'ACCOUNT_CREATED',
      summary: 'حساب شرکت فولاد گستر آریا ثبت گردید',
      occurredAt: '2026-09-15T09:00:00.000Z',
      actorName: 'کارمند عملیات',
    },
    {
      id: 'act-6',
      entityType: 'DEAL',
      entityId: 'deal-1',
      kind: 'DEAL_NEGOTIATION',
      summary: 'مذاکره قرارداد سالانه پشتیبانی سازمانی ۳۵۰,۰۰۰,۰۰۰ ریالی پیگیری شد',
      occurredAt: '2026-10-10T14:00:00.000Z',
      actorName: 'کارشناس فروش',
      metadata: { accountId: '50000000-0000-0000-0000-000000000002' },
    },
    {
      id: 'act-7',
      entityType: 'TICKET',
      entityId: '90000000-0000-0000-0000-000000000004',
      kind: 'TICKET_CREATED',
      summary: 'تیکت TKT-1041 در خصوص افزایش سهمیه فایل‌های پیوست ثبت شد',
      occurredAt: '2026-10-21T08:00:00.000Z',
      actorName: 'کارشناس پشتیبانی',
      metadata: { accountId: '50000000-0000-0000-0000-000000000002' },
    },
    {
      id: 'act-8',
      entityType: 'ACCOUNT',
      entityId: '50000000-0000-0000-0000-000000000003',
      kind: 'ACCOUNT_CREATED',
      summary: 'حساب شرکت فناوری داده‌پژوهان ثبت گردید',
      occurredAt: '2026-10-10T11:20:00.000Z',
      actorName: 'کارمند عملیات',
    },
    {
      id: 'act-9',
      entityType: 'ACCOUNT',
      entityId: '50000000-0000-0000-0000-000000000003',
      kind: 'NOTE_LOGGED',
      summary: 'بررسی نیازمندی‌های یکپارچه‌سازی با سامانه احراز هویت تک‌مرحله‌ای (SSO)',
      occurredAt: '2026-10-21T16:45:00.000Z',
      actorName: 'مدیر فنی',
    },
  ];

  private fallbackSavedViews: SavedViewDto[] = [
    {
      id: 'view-all',
      organizationId: DEFAULT_ORG_ID,
      name: 'همه وظایف',
      entityType: 'TASK',
      filters: { status: 'ALL' },
      isShared: true,
      createdBy: DEFAULT_EMPLOYEE_ID,
      isDefault: true,
      createdAt: '2026-10-20T08:00:00.000Z',
      updatedAt: '2026-10-20T08:00:00.000Z',
    },
    {
      id: 'view-my-tasks',
      organizationId: DEFAULT_ORG_ID,
      name: 'وظایف من',
      entityType: 'TASK',
      filters: { assigneeId: DEFAULT_EMPLOYEE_ID },
      isShared: false,
      createdBy: DEFAULT_EMPLOYEE_ID,
      isDefault: false,
      createdAt: '2026-10-20T08:00:00.000Z',
      updatedAt: '2026-10-20T08:00:00.000Z',
    },
    {
      id: 'view-urgent',
      organizationId: DEFAULT_ORG_ID,
      name: 'کارهای فوری',
      entityType: 'TASK',
      filters: { priority: 'URGENT' },
      isShared: true,
      createdBy: DEFAULT_EMPLOYEE_ID,
      isDefault: false,
      createdAt: '2026-10-21T09:00:00.000Z',
      updatedAt: '2026-10-21T09:00:00.000Z',
    },
    {
      id: 'view-pending',
      organizationId: DEFAULT_ORG_ID,
      name: 'کارهای در انتظار',
      entityType: 'TASK',
      filters: { status: 'TODO' },
      isShared: true,
      createdBy: DEFAULT_EMPLOYEE_ID,
      isDefault: false,
      createdAt: '2026-10-21T09:30:00.000Z',
      updatedAt: '2026-10-21T09:30:00.000Z',
    },
    {
      id: 'view-in-progress',
      organizationId: DEFAULT_ORG_ID,
      name: 'در حال انجام',
      entityType: 'TASK',
      filters: { status: 'IN_PROGRESS' },
      isShared: true,
      createdBy: DEFAULT_EMPLOYEE_ID,
      isDefault: false,
      createdAt: '2026-10-22T10:00:00.000Z',
      updatedAt: '2026-10-22T10:00:00.000Z',
    },
  ];

  private fallbackSpaces: DocumentSpaceDto[] = [
    {
      id: 'space-general-001',
      organizationId: DEFAULT_ORG_ID,
      name: 'پایگاه دانش عمومی',
      slug: 'general-knowledge-base',
      description: 'مستندات استاندارد، فرآیندهای کاری و راهنماهای سازمانی',
      icon: 'book',
      isDefault: true,
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    },
    {
      id: 'space-customer-portal-002',
      organizationId: DEFAULT_ORG_ID,
      name: 'راهنماهای مشتریان',
      slug: 'customer-portal-guides',
      description: 'اسناد و مستندات آموزشی قابل مشاهده در پورتال مشتریان',
      icon: 'globe',
      isDefault: false,
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    },
  ];

  private fallbackDocuments: DocumentDetailDto[] = [
    {
      id: 'doc-101',
      organizationId: DEFAULT_ORG_ID,
      spaceId: 'space-general-001',
      spaceName: 'پایگاه دانش عمومی',
      title: 'دستورالعمل امنیت داده‌ها و حریم خصوصی کارکنان',
      slug: 'security-data-privacy-policy',
      content: '# سیاست‌های امنیت اطلاعات\nکلیه کارکنان موظف به رعایت اصول محرمانگی داده‌ها، عدم افشای رمز عبور و استفاده از احراز هویت دو مرحله‌ای هستند.',
      visibility: 'WORKSPACE',
      isPublished: true,
      authorId: DEFAULT_EMPLOYEE_ID,
      authorName: 'سارا احمدی',
      version: 1,
      tags: ['امنیت', 'سیاست‌ها'],
      createdAt: '2026-10-10T10:00:00.000Z',
      updatedAt: '2026-10-10T10:00:00.000Z',
      revisions: [
        {
          id: 'rev-001',
          documentId: 'doc-101',
          version: 1,
          title: 'دستورالعمل امنیت داده‌ها و حریم خصوصی کارکنان',
          content: '# سیاست‌های امنیت اطلاعات\nکلیه کارکنان موظف به رعایت اصول محرمانگی داده‌ها، عدم افشای رمز عبور و استفاده از احراز هویت دو مرحله‌ای هستند.',
          summaryChange: 'نسخه اولیه سند',
          authorId: DEFAULT_EMPLOYEE_ID,
          authorName: 'سارا احمدی',
          createdAt: '2026-10-10T10:00:00.000Z',
        },
      ],
    },
    {
      id: 'doc-102',
      organizationId: DEFAULT_ORG_ID,
      spaceId: 'space-customer-portal-002',
      spaceName: 'راهنماهای مشتریان',
      title: 'راهنمای جامع ثبت تیکت و پیگیری پشتیبانی در پورتال',
      slug: 'customer-ticket-guide',
      content: '# راهنمای سامانه پشتیبانی\nمشتریان گرامی می‌توانند از طریق این راهنما با نحوه ثبت درخواست، الصاق مستندات و پیگیری پاسخ‌های تیم فنی آشنا شوند.',
      visibility: 'CUSTOMER_VISIBLE',
      isPublished: true,
      authorId: '55555555-5555-5555-5555-555555555555',
      authorName: 'پویا مرادی',
      version: 1,
      tags: ['پشتیبانی', 'آموزش'],
      createdAt: '2026-10-12T14:00:00.000Z',
      updatedAt: '2026-10-12T14:00:00.000Z',
      revisions: [
        {
          id: 'rev-002',
          documentId: 'doc-102',
          version: 1,
          title: 'راهنمای جامع ثبت تیکت و پیگیری پشتیبانی در پورتال',
          content: '# راهنمای سامانه پشتیبانی\nمشتریان گرامی می‌توانند از طریق این راهنما با نحوه ثبت درخواست، الصاق مستندات و پیگیری پاسخ‌های تیم فنی آشنا شوند.',
          summaryChange: 'انتشار راهنمای کاربری برای مشتریان',
          authorId: '55555555-5555-5555-5555-555555555555',
          authorName: 'پویا مرادی',
          createdAt: '2026-10-12T14:00:00.000Z',
        },
      ],
    },
    {
      id: 'doc-103',
      organizationId: DEFAULT_ORG_ID,
      spaceId: 'space-general-001',
      spaceName: 'پایگاه دانش عمومی',
      title: 'پیش‌نویس محرمانه استراتژی تجاری فصل پاییز',
      slug: 'private-sales-strategy',
      content: '# استراتژی پاییز\nمذاکرات تجاری با مشتریان سطح بالا در حال برنامه‌ریزی است و تارگت فروش سازمانی تعیین گردید.',
      visibility: 'PRIVATE',
      isPublished: false,
      authorId: DEFAULT_EMPLOYEE_ID,
      authorName: 'سارا احمدی',
      version: 1,
      tags: ['استراتژی', 'محرمانه'],
      createdAt: '2026-10-15T09:00:00.000Z',
      updatedAt: '2026-10-15T09:00:00.000Z',
      revisions: [
        {
          id: 'rev-003',
          documentId: 'doc-103',
          version: 1,
          title: 'پیش‌نویس محرمانه استراتژی تجاری فصل پاییز',
          content: '# استراتژی پاییز\nمذاکرات تجاری با مشتریان سطح بالا در حال برنامه‌ریزی است و تارگت فروش سازمانی تعیین گردید.',
          summaryChange: 'پیش‌نویس خصوصی',
          authorId: DEFAULT_EMPLOYEE_ID,
          authorName: 'سارا احمدی',
          createdAt: '2026-10-15T09:00:00.000Z',
        },
      ],
    },
  ];

  private fallbackScheduledActivities: ActivityDto[] = [
    {
      id: 'act-meeting-101',
      organizationId: DEFAULT_ORG_ID,
      type: 'MEETING',
      title: 'جلسه بررسی پیشرفت استقرار CRM با مدیران پتروشیمی',
      description: 'بررسی دسترسی‌های سازمانی، تنظیمات پورتال و رفع موانع فنی',
      startsAt: new Date(Date.now() + 3600000 * 2).toISOString(),
      endsAt: new Date(Date.now() + 3600000 * 3).toISOString(),
      isAllDay: false,
      status: 'SCHEDULED',
      ownerId: DEFAULT_EMPLOYEE_ID,
      ownerName: 'سارا احمدی',
      participantIds: [DEFAULT_EMPLOYEE_ID],
      associatedEntityType: 'ACCOUNT',
      associatedEntityId: '50000000-0000-0000-0000-000000000001',
      associatedEntityTitle: 'پتروشیمی سپهر',
      visibility: 'CUSTOMER_SHARED',
      reminderMinutesBefore: 30,
      createdAt: '2026-10-24T10:00:00.000Z',
      updatedAt: '2026-10-24T10:00:00.000Z',
    },
    {
      id: 'act-call-102',
      organizationId: DEFAULT_ORG_ID,
      type: 'CALL',
      title: 'تماس پیگیری فرصت تجاری ارتقای زیرساخت سرورها',
      description: 'هماهنگی نهایی پیش‌فاکتور و تایید واحد تدارکات',
      startsAt: new Date(Date.now() + 3600000 * 5).toISOString(),
      endsAt: new Date(Date.now() + 3600000 * 5.5).toISOString(),
      isAllDay: false,
      status: 'SCHEDULED',
      ownerId: DEFAULT_EMPLOYEE_ID,
      ownerName: 'سارا احمدی',
      participantIds: [DEFAULT_EMPLOYEE_ID],
      associatedEntityType: 'DEAL',
      associatedEntityId: '80000000-0000-0000-0000-000000000001',
      associatedEntityTitle: 'قرارداد توسعه سالانه',
      visibility: 'INTERNAL',
      reminderMinutesBefore: 15,
      createdAt: '2026-10-24T11:00:00.000Z',
      updatedAt: '2026-10-24T11:00:00.000Z',
    },
    {
      id: 'act-remind-103',
      organizationId: DEFAULT_ORG_ID,
      type: 'REMINDER',
      title: 'یادآوری ارسال گزارش ممیزی ماهانه',
      description: 'خروجی اکسل گزارش فعالیت کارکنان تهیه و ارسال گردد',
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      endsAt: new Date(Date.now() + 86400000 + 1800000).toISOString(),
      isAllDay: false,
      status: 'SCHEDULED',
      ownerId: DEFAULT_EMPLOYEE_ID,
      ownerName: 'سارا احمدی',
      participantIds: [DEFAULT_EMPLOYEE_ID],
      visibility: 'INTERNAL',
      reminderMinutesBefore: 60,
      createdAt: '2026-10-24T12:00:00.000Z',
      updatedAt: '2026-10-24T12:00:00.000Z',
    },
  ];

  private fallbackOrganizationSettings: OrganizationSettingsDto = {
    id: DEFAULT_ORG_ID,
    name: 'شرکت آلفا (اصلی)',
    slug: 'alpha',
    timezone: 'Asia/Tehran',
    locale: 'fa-IR',
    branding: {
      primaryColor: '#6366f1',
    },
    retentionPolicy: {
      auditLogsDays: 90,
      tempFilesDays: 7,
    },
    updatedAt: '2026-10-01T00:00:00.000Z',
  };

  private fallbackMembers: OrganizationMemberDto[] = [
    {
      id: 'mem-001',
      userId: '11111111-1111-1111-1111-111111111111',
      email: 'admin@org-alpha.com',
      displayName: 'علی مدیر',
      role: 'SystemOwner',
      active: true,
      joinedAt: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 'mem-002',
      userId: '22222222-2222-2222-2222-222222222222',
      email: 'employee@org-alpha.com',
      displayName: 'سارا احمدی',
      role: 'Employee',
      active: true,
      joinedAt: '2026-09-10T00:00:00.000Z',
    },
    {
      id: 'mem-003',
      userId: '55555555-5555-5555-5555-555555555555',
      email: 'support@org-alpha.com',
      displayName: 'پویا مرادی',
      role: 'SupportAgent',
      active: true,
      joinedAt: '2026-09-15T00:00:00.000Z',
    },
  ];

  private fallbackPipelineStages: PipelineStageDto[] = [
    {
      id: 'stg-1',
      organizationId: DEFAULT_ORG_ID,
      name: 'کشف و صلاحیت‌سنجی',
      key: 'DISCOVERY',
      order: 1,
      defaultProbability: 20,
      isWon: false,
      isLost: false,
      color: '#6366f1',
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    },
    {
      id: 'stg-2',
      organizationId: DEFAULT_ORG_ID,
      name: 'ارائه پروپوزال',
      key: 'PROPOSAL',
      order: 2,
      defaultProbability: 50,
      isWon: false,
      isLost: false,
      color: '#3b82f6',
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    },
    {
      id: 'stg-3',
      organizationId: DEFAULT_ORG_ID,
      name: 'مذاکره و پیش‌قرارداد',
      key: 'NEGOTIATION',
      order: 3,
      defaultProbability: 80,
      isWon: false,
      isLost: false,
      color: '#f59e0b',
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    },
    {
      id: 'stg-4',
      organizationId: DEFAULT_ORG_ID,
      name: 'موفق و نهایی‌شده',
      key: 'WON',
      order: 4,
      defaultProbability: 100,
      isWon: true,
      isLost: false,
      color: '#10b981',
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    },
    {
      id: 'stg-5',
      organizationId: DEFAULT_ORG_ID,
      name: 'از دست رفته',
      key: 'LOST',
      order: 5,
      defaultProbability: 0,
      isWon: false,
      isLost: true,
      color: '#ef4444',
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    },
  ];

  private fallbackDuplicates: DuplicateCandidateDto[] = [
    {
      id: 'dup-1',
      entityType: 'LEAD',
      primaryRecord: {
        id: '70000000-0000-0000-0000-000000000001',
        title: 'علیرضا حسینی',
        email: 'hosseini@dadevarz.com',
        phone: '09129876543',
      },
      duplicateRecord: {
        id: 'lead-dup-sample',
        title: 'ع. حسینی (ثبت از وبسایت)',
        email: 'hosseini@dadevarz.com',
        phone: '09129876543',
      },
      matchReason: 'ایمیل و شماره تماس یکسان',
      confidenceScore: 98,
    },
  ];

  private fallbackCustomFields: CustomFieldDefinitionDto[] = [
    {
      id: 'cf-001',
      organizationId: DEFAULT_ORG_ID,
      entityType: 'ACCOUNT',
      key: 'national_id',
      label: 'شناسه ملی / کد اقتصادی',
      type: 'TEXT',
      isRequired: true,
      order: 1,
      active: true,
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    },
    {
      id: 'cf-002',
      organizationId: DEFAULT_ORG_ID,
      entityType: 'DEAL',
      key: 'channel_source',
      label: 'کانال معرفی فرصت تجاری',
      type: 'SELECT',
      options: ['نمایشگاه تخصصی', 'معرفی مشتری سابق', 'کمپین دیجیتال', 'تماس مستقیم'],
      isRequired: false,
      defaultValue: 'نمایشگاه تخصصی',
      order: 2,
      active: true,
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    },
    {
      id: 'cf-003',
      organizationId: DEFAULT_ORG_ID,
      entityType: 'TASK',
      key: 'estimated_hours',
      label: 'برآورد نفر-ساعت کار',
      type: 'NUMBER',
      isRequired: false,
      order: 3,
      active: true,
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    },
  ];

  constructor(baseUrl?: string, token?: string) {
    this.baseUrl =
      baseUrl ||
      (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
      DEFAULT_API_URL;
    this.token = token || DEFAULT_EMPLOYEE_ID;
  }

  public setToken(token: string): void {
    this.token = token;
  }

  public getToken(): string {
    return this.token;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private isOfflineOrNetworkError(err: unknown): boolean {
    if (!err) return false;
    if (err instanceof ApiClientError) {
      // 502, 503, 504 are gateway/unreachable errors
      return [502, 503, 504].includes(err.statusCode);
    }
    if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
      return true;
    }
    const message = (err as Error).message || '';
    return (
      message.includes('ECONNREFUSED') ||
      message.includes('ENOTFOUND') ||
      message.includes('Failed to fetch') ||
      message.includes('fetch failed')
    );
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${this.token}`,
      ...(options.headers as Record<string, string> | undefined),
    };

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (fetchErr: any) {
      throw new ApiClientError(
        fetchErr?.message || 'Network connection failed',
        503,
        'NETWORK_ERROR',
      );
    }

    if (!response.ok) {
      let errorBody: ApiError | undefined;
      try {
        errorBody = await response.json();
      } catch {
        // Ignored if non-JSON error
      }

      const message =
        errorBody?.message ||
        `Request failed with status ${response.status}: ${response.statusText}`;
      const code = errorBody?.code || `HTTP_${response.status}`;
      throw new ApiClientError(
        message,
        response.status,
        code,
        errorBody?.details,
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    const json = (await response.json()) as ApiResponse<T> | T;
    if (json && typeof json === 'object' && 'data' in json) {
      return (json as ApiResponse<T>).data;
    }
    return json as T;
  }

  /* ---------------- Auth & Workspace ---------------- */

  async getMe(): Promise<CurrentUserDto> {
    try {
      return await this.request<CurrentUserDto>('/me');
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const isCustomer = this.token === '33333333-3333-3333-3333-333333333333';
        return {
          id: this.token,
          email: isCustomer ? 'customer@client.com' : 'employee@org-alpha.com',
          displayName: isCustomer ? 'کاربر پورتال مشتری' : 'کارمند عملیات',
          activeOrganization: {
            id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            name: 'شرکت آلفا',
            slug: 'alpha',
            role: isCustomer ? 'CustomerPortalUser' : 'Employee',
          },
          memberships: [
            {
              organizationId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
              organizationName: 'شرکت آلفا',
              role: isCustomer ? 'CustomerPortalUser' : 'Employee',
              active: true,
            },
          ],
        };
      }
      throw err;
    }
  }

  async getWorkspaces(): Promise<WorkspaceDto[]> {
    try {
      return await this.request<WorkspaceDto[]>('/workspaces');
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        return [
          {
            id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            name: 'شرکت آلفا',
            slug: 'alpha',
            role: 'Employee',
            isCurrent: true,
          },
        ];
      }
      throw err;
    }
  }

  /* ---------------- Tasks ---------------- */

  async getMyWork(): Promise<TaskSummary[]> {
    try {
      return await this.request<TaskSummary[]>('/tasks/my-work');
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        return this.fallbackTasks.map((t) => ({ ...t }));
      }
      throw err;
    }
  }

  async getTasks(query?: PageQuery): Promise<PageResult<TaskSummary>> {
    try {
      const params = new URLSearchParams();
      if (query?.cursor) params.set('cursor', query.cursor);
      if (query?.limit) params.set('limit', String(query.limit));
      if (query?.sort) params.set('sort', query.sort);
      if (query?.status) params.set('status', query.status);
      if (query?.priority) params.set('priority', query.priority);
      if (query?.assigneeId) params.set('assigneeId', query.assigneeId);

      const qs = params.toString();
      const path = `/tasks${qs ? `?${qs}` : ''}`;
      return await this.request<PageResult<TaskSummary>>(path);
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        let filtered = [...this.fallbackTasks];
        if (query?.status && query.status !== 'ALL') {
          filtered = filtered.filter((t) => t.status === query.status);
        }
        if (query?.priority) {
          filtered = filtered.filter((t) => t.priority === query.priority);
        }
        return {
          items: filtered.map((t) => ({ ...t })),
          nextCursor: null,
          totalCount: filtered.length,
        };
      }
      throw err;
    }
  }

  async getTaskById(id: string): Promise<TaskDetails> {
    try {
      return await this.request<TaskDetails>(`/tasks/${encodeURIComponent(id)}`);
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const found = this.fallbackTasks.find((t) => t.id === id);
        if (!found) {
          throw new ApiClientError(`Task ${id} not found`, 404, 'NOT_FOUND');
        }
        return { ...found };
      }
      throw err;
    }
  }

  async createTask(dto: CreateTaskRequest): Promise<TaskDetails> {
    try {
      return await this.request<TaskDetails>('/tasks', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const nextNum = 1000 + this.fallbackTasks.length + 1;
        const now = new Date().toISOString();
        const newTask: TaskDetails = {
          id: `tsk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          key: `TSK-${nextNum}`,
          title: dto.title.trim(),
          description: dto.description?.trim() ?? null,
          status: 'TODO',
          priority: dto.priority ?? 'MEDIUM',
          visibility: dto.visibility ?? 'INTERNAL',
          assigneeId: dto.assigneeId ?? DEFAULT_EMPLOYEE_ID,
          assigneeName: 'کارمند عملیات',
          creatorId: DEFAULT_EMPLOYEE_ID,
          creatorName: 'کارمند عملیات',
          projectId: dto.projectId ?? null,
          projectName: null,
          dueAt: dto.dueAt ?? 'تعیین‌نشده',
          version: 1,
          commentsCount: 0,
          dependencies: [],
          createdAt: now,
          updatedAt: now,
        };
        this.fallbackTasks.unshift(newTask);
        return { ...newTask };
      }
      throw err;
    }
  }

  async transitionTask(
    id: string,
    dto: TransitionTaskRequest,
  ): Promise<TaskDetails> {
    try {
      return await this.request<TaskDetails>(
        `/tasks/${encodeURIComponent(id)}/transitions`,
        {
          method: 'POST',
          body: JSON.stringify(dto),
        },
      );
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const taskIndex = this.fallbackTasks.findIndex((t) => t.id === id);
        if (taskIndex === -1) {
          throw new ApiClientError(`Task ${id} not found`, 404, 'NOT_FOUND');
        }
        const task = this.fallbackTasks[taskIndex]!;

        const capabilities: TransitionActorCapabilities = {
          canReopenDoneTask: true,
          canRestoreCanceledTask: true,
        };

        const allowed = canTransitionTask(task.status, dto.targetStatus, capabilities);
        if (!allowed) {
          throw new ApiClientError(
            `Invalid task transition: ${task.status} -> ${dto.targetStatus}`,
            400,
            'INVALID_TASK_TRANSITION',
          );
        }

        const updated: TaskDetails = {
          ...task,
          status: dto.targetStatus,
          version: task.version + 1,
          updatedAt: new Date().toISOString(),
        };
        this.fallbackTasks[taskIndex] = updated;
        return { ...updated };
      }
      throw err;
    }
  }

  async addDependency(id: string, dependsOnId: string): Promise<TaskDetails> {
    try {
      return await this.request<TaskDetails>(
        `/tasks/${encodeURIComponent(id)}/dependencies`,
        {
          method: 'POST',
          body: JSON.stringify({ dependsOnId }),
        },
      );
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const taskIndex = this.fallbackTasks.findIndex((t) => t.id === id);
        if (taskIndex === -1) {
          throw new ApiClientError(`Task ${id} not found`, 404, 'NOT_FOUND');
        }
        const task = this.fallbackTasks[taskIndex]!;
        if (!task.dependencies.includes(dependsOnId)) {
          task.dependencies.push(dependsOnId);
          task.version += 1;
          task.updatedAt = new Date().toISOString();
        }
        return { ...task };
      }
      throw err;
    }
  }

  /* ---------------- CRM (Accounts, Contacts, Leads, Deals) ---------------- */

  async getAccounts(): Promise<AccountDto[]> {
    try {
      return await this.request<AccountDto[]>('/crm/accounts');
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        return this.fallbackAccounts.map((a) => ({ ...a }));
      }
      throw err;
    }
  }

  async createAccount(dto: CreateAccountRequest): Promise<AccountDto> {
    try {
      return await this.request<AccountDto>('/crm/accounts', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const now = new Date().toISOString();
        const newAccount: AccountDto = {
          id: `acc-${Date.now()}`,
          name: dto.name.trim(),
          type: dto.type ?? 'PROSPECT',
          status: 'ACTIVE',
          website: dto.website ?? null,
          phone: dto.phone ?? null,
          ownerId: dto.ownerId ?? DEFAULT_EMPLOYEE_ID,
          createdAt: now,
          updatedAt: now,
        };
        this.fallbackAccounts.unshift(newAccount);
        return { ...newAccount };
      }
      throw err;
    }
  }

  async getContacts(accountId?: string): Promise<ContactDto[]> {
    try {
      const path = accountId
        ? `/crm/contacts?accountId=${encodeURIComponent(accountId)}`
        : '/crm/contacts';
      return await this.request<ContactDto[]>(path);
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        if (accountId) {
          return this.fallbackContacts
            .filter((c) => c.accountId === accountId)
            .map((c) => ({ ...c }));
        }
        return this.fallbackContacts.map((c) => ({ ...c }));
      }
      throw err;
    }
  }

  async createContact(dto: CreateContactRequest): Promise<ContactDto> {
    try {
      return await this.request<ContactDto>('/crm/contacts', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const now = new Date().toISOString();
        const account = dto.accountId
          ? this.fallbackAccounts.find((a) => a.id === dto.accountId)
          : undefined;
        const newContact: ContactDto = {
          id: `cnt-${Date.now()}`,
          accountId: dto.accountId ?? null,
          accountName: account?.name ?? null,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          email: dto.email ?? null,
          phone: dto.phone ?? null,
          ownerId: dto.ownerId ?? DEFAULT_EMPLOYEE_ID,
          createdAt: now,
          updatedAt: now,
        };
        this.fallbackContacts.unshift(newContact);
        return { ...newContact };
      }
      throw err;
    }
  }

  async getLeads(): Promise<LeadDto[]> {
    try {
      return await this.request<LeadDto[]>('/crm/leads');
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        return this.fallbackLeads.map((l) => ({ ...l }));
      }
      throw err;
    }
  }

  async createLead(
    dto: CreateLeadRequest,
  ): Promise<{ lead: LeadDto; isDuplicateCandidate: boolean; duplicateCandidateId?: string }> {
    try {
      return await this.request<{
        lead: LeadDto;
        isDuplicateCandidate: boolean;
        duplicateCandidateId?: string;
      }>('/crm/leads', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const now = new Date().toISOString();
        const matched = this.fallbackLeads.find(
          (l) =>
            (dto.email && l.email?.toLowerCase() === dto.email.toLowerCase()) ||
            (dto.phone && l.phone === dto.phone),
        );
        const newLead: LeadDto = {
          id: `lead-${Date.now()}`,
          displayName: dto.displayName.trim(),
          email: dto.email ?? null,
          phone: dto.phone ?? null,
          source: dto.source ?? 'MANUAL',
          status: 'NEW',
          ownerId: dto.ownerId ?? DEFAULT_EMPLOYEE_ID,
          accountId: null,
          convertedContactId: null,
          convertedDealId: null,
          createdAt: now,
          updatedAt: now,
        };
        this.fallbackLeads.unshift(newLead);
        return {
          lead: { ...newLead },
          isDuplicateCandidate: Boolean(matched),
          ...(matched ? { duplicateCandidateId: matched.id } : {}),
        };
      }
      throw err;
    }
  }

  async convertLead(
    id: string,
    dto: ConvertLeadRequest,
  ): Promise<ConvertLeadResponse> {
    try {
      return await this.request<ConvertLeadResponse>(
        `/crm/leads/${encodeURIComponent(id)}/convert`,
        {
          method: 'POST',
          body: JSON.stringify(dto),
        },
      );
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const lead = this.fallbackLeads.find((l) => l.id === id);
        if (!lead) {
          throw new ApiClientError(`Lead ${id} not found`, 404, 'NOT_FOUND');
        }
        const now = new Date().toISOString();
        const accountId = `acc-${Date.now()}`;
        const contactId = `cnt-${Date.now()}`;
        const dealId = dto.dealName ? `deal-${Date.now()}` : undefined;

        this.fallbackAccounts.unshift({
          id: accountId,
          name: dto.accountName ?? lead.displayName,
          type: 'CUSTOMER',
          status: 'ACTIVE',
          ownerId: DEFAULT_EMPLOYEE_ID,
          createdAt: now,
          updatedAt: now,
        });

        this.fallbackContacts.unshift({
          id: contactId,
          accountId,
          firstName: lead.displayName.split(' ')[0] ?? lead.displayName,
          lastName: lead.displayName.split(' ')[1] ?? 'کاربر',
          email: lead.email ?? null,
          phone: lead.phone ?? null,
          ownerId: DEFAULT_EMPLOYEE_ID,
          createdAt: now,
          updatedAt: now,
        });

        if (dealId) {
          this.fallbackDeals.unshift({
            id: dealId,
            accountId,
            name: dto.dealName!,
            stage: 'DISCOVERY',
            amountMinor: dto.dealAmountMinor ?? null,
            currency: dto.dealCurrency ?? 'IRR',
            ownerId: DEFAULT_EMPLOYEE_ID,
            createdAt: now,
            updatedAt: now,
          });
        }

        lead.status = 'CONVERTED';
        lead.accountId = accountId;
        lead.convertedContactId = contactId;
        lead.convertedDealId = dealId ?? null;
        lead.updatedAt = now;

        return {
          leadId: lead.id,
          accountId,
          contactId,
          dealId: dealId ?? null,
        };
      }
      throw err;
    }
  }

  async getDeals(accountId?: string): Promise<DealDto[]> {
    try {
      const path = accountId
        ? `/crm/deals?accountId=${encodeURIComponent(accountId)}`
        : '/crm/deals';
      return await this.request<DealDto[]>(path);
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        if (accountId) {
          return this.fallbackDeals
            .filter((d) => d.accountId === accountId)
            .map((d) => ({ ...d }));
        }
        return this.fallbackDeals.map((d) => ({ ...d }));
      }
      throw err;
    }
  }

  async createDeal(dto: CreateDealRequest): Promise<DealDto> {
    try {
      return await this.request<DealDto>('/crm/deals', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const now = new Date().toISOString();
        const newDeal: DealDto = {
          id: `deal-${Date.now()}`,
          accountId: dto.accountId ?? null,
          name: dto.name.trim(),
          stage: dto.stage ?? 'LEAD',
          amountMinor: dto.amountMinor ?? null,
          currency: dto.currency ?? 'IRR',
          probability: dto.probability ?? 50,
          targetCloseAt: dto.targetCloseAt ?? null,
          ownerId: dto.ownerId ?? DEFAULT_EMPLOYEE_ID,
          createdAt: now,
          updatedAt: now,
        };
        this.fallbackDeals.unshift(newDeal);
        return { ...newDeal };
      }
      throw err;
    }
  }

  private fallbackNotifications: NotificationDto[] = [
    {
      id: '99000000-0000-0000-0000-000000000001',
      type: 'TASK_ASSIGNED',
      title: 'تخصیص وظیفه جدید',
      message: 'وظیفه TSK-1001 به شما واگذار شد.',
      readAt: null,
      dedupeKey: 'task-assign-1001',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '99000000-0000-0000-0000-000000000002',
      type: 'TICKET_REPLIED',
      title: 'پیام جدید در تیکت',
      message: 'پیام جدیدی در تیکت TKT-1042 ثبت شد.',
      readAt: null,
      dedupeKey: 'ticket-reply-1042',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ];

  private fallbackRules: AutomationRuleDto[] = [
    {
      id: '88000000-0000-0000-0000-000000000001',
      name: 'اطلاع‌رسانی خودکار برای وظایف با اولویت فوری',
      trigger: 'TASK_CREATED',
      conditionField: 'priority',
      conditionValue: 'URGENT',
      actionType: 'SEND_NOTIFICATION',
      actionPayload: { title: 'وظیفه فوری', message: 'وظیفه با اولویت فوری ایجاد گردید.' },
      enabled: true,
      executionCount: 2,
      lastExecutedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '88000000-0000-0000-0000-000000000002',
      name: 'ایجاد تسک پیگیری پس از تبدیل موفق سرنخ به مشتری',
      trigger: 'LEAD_CONVERTED',
      conditionField: null,
      conditionValue: null,
      actionType: 'ASSIGN_USER',
      actionPayload: { title: 'جلسه آشنایی و تحویل قرارداد مشتری جدید' },
      enabled: true,
      executionCount: 1,
      lastExecutedAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  private fallbackRuns: AutomationRunDto[] = [
    {
      id: 'run-001',
      organizationId: DEFAULT_ORG_ID,
      ruleId: '88000000-0000-0000-0000-000000000001',
      ruleName: 'اطلاع‌رسانی خودکار برای وظایف با اولویت فوری',
      trigger: 'TASK_CREATED',
      status: 'SUCCESS',
      executedAction: 'SEND_NOTIFICATION',
      actionDetails: 'ارسال اعلان فوری به مدیر سیستم و کارشناس عملیات',
      payloadSummary: 'Task: TSK-1004 (priority: URGENT)',
      executedAt: new Date(Date.now() - 3600000).toISOString(),
      durationMs: 42,
    },
    {
      id: 'run-002',
      organizationId: DEFAULT_ORG_ID,
      ruleId: '88000000-0000-0000-0000-000000000002',
      ruleName: 'ایجاد تسک پیگیری پس از تبدیل موفق سرنخ به مشتری',
      trigger: 'LEAD_CONVERTED',
      status: 'SUCCESS',
      executedAction: 'ASSIGN_USER',
      actionDetails: 'تخصیص تسک پذیرش به تیم فروش سازمانی',
      payloadSummary: 'Lead: پتروشیمی سپهر (CONVERTED)',
      executedAt: new Date(Date.now() - 7200000).toISOString(),
      durationMs: 65,
    },
  ];

  /* ---------------- Support & Ticketing ---------------- */

  async getTickets(accountId?: string): Promise<TicketDto[]> {
    try {
      const path = accountId
        ? `/tickets?accountId=${encodeURIComponent(accountId)}`
        : '/tickets';
      return await this.request<TicketDto[]>(path);
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        // Customer portal token filtering: customer only sees tickets belonging to their account
        const isCustomer = this.token === '33333333-3333-3333-3333-333333333333';
        const targetAccountId = accountId ?? (isCustomer ? '50000000-0000-0000-0000-000000000001' : undefined);

        if (targetAccountId) {
          return this.fallbackTickets
            .filter((t) => t.accountId === targetAccountId)
            .map((t) => ({ ...t }));
        }
        return this.fallbackTickets.map((t) => ({ ...t }));
      }
      throw err;
    }
  }

  async createTicket(dto: CreateTicketRequest): Promise<TicketDto> {
    try {
      return await this.request<TicketDto>('/tickets', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const nextRef = `TKT-${1040 + this.fallbackTickets.length + 1}`;
        const newTicketId = `tkt-${Date.now()}`;
        const now = new Date().toISOString();

        const account = dto.accountId
          ? this.fallbackAccounts.find((a) => a.id === dto.accountId)
          : this.fallbackAccounts[0];

        const newTicket: TicketDto = {
          id: newTicketId,
          reference: nextRef,
          title: dto.title.trim(),
          status: 'NEW',
          priority: dto.priority ?? 'NORMAL',
          accountId: dto.accountId ?? account?.id ?? null,
          accountName: account?.name ?? 'حساب مشتری',
          assigneeId: dto.assigneeId ?? null,
          assigneeName: 'تخصیص خودکار به پشتیبانی',
          targetResolutionAt: '۲۴ ساعت کاری',
          messagesCount: 1,
          createdAt: now,
          updatedAt: now,
        };

        this.fallbackTickets.unshift(newTicket);
        this.fallbackTicketMessages[newTicketId] = [
          {
            id: `msg-${Date.now()}`,
            ticketId: newTicketId,
            authorId: this.token,
            authorName: this.token === '33333333-3333-3333-3333-333333333333' ? 'کاربر مشتری (شما)' : 'کارمند عملیات',
            body: dto.description.trim(),
            visibility: 'CUSTOMER_SHARED',
            createdAt: now,
          },
        ];

        return { ...newTicket };
      }
      throw err;
    }
  }

  async getTicketMessages(ticketId: string): Promise<TicketMessageDto[]> {
    try {
      const messages = await this.request<TicketMessageDto[]>(
        `/tickets/${encodeURIComponent(ticketId)}/messages`,
      );
      // Safety gate: Customer portal users never receive internal notes
      if (this.token === '33333333-3333-3333-3333-333333333333') {
        return messages.filter((m) => m.visibility !== 'INTERNAL');
      }
      return messages;
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const list = this.fallbackTicketMessages[ticketId] ?? [];
        if (this.token === '33333333-3333-3333-3333-333333333333') {
          return list.filter((m) => m.visibility !== 'INTERNAL').map((m) => ({ ...m }));
        }
        return list.map((m) => ({ ...m }));
      }
      throw err;
    }
  }

  async addTicketMessage(
    ticketId: string,
    dto: AddTicketMessageRequest,
  ): Promise<TicketMessageDto> {
    try {
      return await this.request<TicketMessageDto>(
        `/tickets/${encodeURIComponent(ticketId)}/messages`,
        {
          method: 'POST',
          body: JSON.stringify(dto),
        },
      );
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const isCustomer = this.token === '33333333-3333-3333-3333-333333333333';
        // Customer cannot post INTERNAL notes
        const visibility: RecordVisibility = isCustomer
          ? 'CUSTOMER_SHARED'
          : (dto.visibility ?? 'CUSTOMER_SHARED');

        const newMsg: TicketMessageDto = {
          id: `msg-${Date.now()}`,
          ticketId,
          authorId: this.token,
          authorName: isCustomer ? 'کاربر مشتری (شما)' : 'کارشناس پشتیبانی',
          body: dto.body.trim(),
          visibility,
          createdAt: 'هم‌اکنون',
        };

        if (!this.fallbackTicketMessages[ticketId]) {
          this.fallbackTicketMessages[ticketId] = [];
        }
        this.fallbackTicketMessages[ticketId].push(newMsg);

        const ticket = this.fallbackTickets.find((t) => t.id === ticketId);
        if (ticket) {
          ticket.messagesCount = this.fallbackTicketMessages[ticketId].length;
          ticket.updatedAt = new Date().toISOString();
        }

        return { ...newMsg };
      }
      throw err;
    }
  }

  /* ---------------- Notifications ---------------- */

  async getNotifications(limit = 50): Promise<NotificationDto[]> {
    try {
      return await this.request<NotificationDto[]>(`/notifications?limit=${limit}`);
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        return this.fallbackNotifications.map((n) => ({ ...n }));
      }
      throw err;
    }
  }

  async markNotificationAsRead(id: string): Promise<NotificationDto> {
    try {
      return await this.request<NotificationDto>(`/notifications/${encodeURIComponent(id)}/read`, {
        method: 'POST',
      });
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const found = this.fallbackNotifications.find((n) => n.id === id);
        if (found) {
          found.readAt = new Date().toISOString();
          return { ...found };
        }
      }
      throw err;
    }
  }

  async markAllNotificationsAsRead(): Promise<{ count: number }> {
    try {
      return await this.request<{ count: number }>('/notifications/read-all', {
        method: 'POST',
      });
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const now = new Date().toISOString();
        let c = 0;
        this.fallbackNotifications.forEach((n) => {
          if (!n.readAt) {
            n.readAt = now;
            c++;
          }
        });
        return { count: c };
      }
      throw err;
    }
  }

  /* ---------------- Reporting & KPIs ---------------- */

  async getDashboardKpi(): Promise<DashboardKpiReport> {
    try {
      return await this.request<DashboardKpiReport>('/reporting/dashboard');
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        return {
          workload: [
            {
              userId: DEFAULT_EMPLOYEE_ID,
              userName: 'کارمند عملیات',
              activeTasksCount: this.fallbackTasks.filter((t) => t.status !== 'DONE').length,
              overdueTasksCount: 0,
              completedTasksCount: this.fallbackTasks.filter((t) => t.status === 'DONE').length,
            },
          ],
          crmFunnel: {
            totalLeads: this.fallbackLeads.length,
            convertedLeads: this.fallbackLeads.filter((l) => l.status === 'CONVERTED').length,
            conversionRatePercent: 33,
            totalDealsValue: this.fallbackDeals.reduce((acc, d) => acc + (d.amountMinor ?? 0), 0),
            weightedPipelineValue: 450000000,
            stagesBreakdown: [
              { stage: 'LEAD', count: 1, amount: 250000000 },
              { stage: 'NEGOTIATION', count: 1, amount: 1200000000 },
            ],
          },
          supportSla: {
            totalTickets: this.fallbackTickets.length,
            openTickets: this.fallbackTickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length,
            resolvedTickets: this.fallbackTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
            slaBreachRatePercent: 0,
            averageResolutionHours: 3.5,
          },
          generatedAt: new Date().toISOString(),
        };
      }
      throw err;
    }
  }

  /* ---------------- Automation Rules ---------------- */

  async getAutomationRules(): Promise<AutomationRuleDto[]> {
    try {
      return await this.request<AutomationRuleDto[]>('/automation/rules');
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        return this.fallbackRules.map((r) => ({ ...r }));
      }
      throw err;
    }
  }

  async toggleAutomationRule(id: string, enabled: boolean): Promise<AutomationRuleDto> {
    try {
      return await this.request<AutomationRuleDto>(`/automation/rules/${encodeURIComponent(id)}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled }),
      });
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const found = this.fallbackRules.find((r) => r.id === id);
        if (found) {
          found.enabled = enabled;
          return { ...found };
        }
      }
      throw err;
    }
  }

  async createAutomationRule(dto: CreateAutomationRuleRequest): Promise<AutomationRuleDto> {
    try {
      return await this.request<AutomationRuleDto>('/automation/rules', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const newRule: AutomationRuleDto = {
          id: `rule-${Date.now()}`,
          name: dto.name.trim(),
          trigger: dto.trigger,
          conditionField: dto.conditionField ?? null,
          conditionValue: dto.conditionValue ?? null,
          actionType: dto.actionType,
          actionPayload: dto.actionPayload ?? {},
          enabled: dto.enabled !== false,
          executionCount: 0,
          lastExecutedAt: null,
        };
        this.fallbackRules.unshift(newRule);
        return { ...newRule };
      }
      throw err;
    }
  }

  async deleteAutomationRule(id: string): Promise<{ success: boolean }> {
    try {
      return await this.request<{ success: boolean }>(`/automation/rules/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const idx = this.fallbackRules.findIndex((r) => r.id === id);
        if (idx !== -1) {
          this.fallbackRules.splice(idx, 1);
        }
        return { success: true };
      }
      throw err;
    }
  }

  async getAutomationRuns(limit = 50): Promise<AutomationRunDto[]> {
    try {
      return await this.request<AutomationRunDto[]>(`/automation/rules/runs?limit=${limit}`);
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        return this.fallbackRuns.slice(0, limit).map((r) => ({ ...r }));
      }
      throw err;
    }
  }

  async simulateAutomationRule(
    id: string,
    testPayload: Record<string, any>,
  ): Promise<SimulateAutomationResponse> {
    try {
      return await this.request<SimulateAutomationResponse>(
        `/automation/rules/${encodeURIComponent(id)}/simulate`,
        {
          method: 'POST',
          body: JSON.stringify({ testPayload }),
        },
      );
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const rule = this.fallbackRules.find((r) => r.id === id);
        if (!rule) {
          throw new ApiClientError(`Rule ${id} not found`, 404, 'NOT_FOUND');
        }
        let matched = true;
        if (rule.conditionField && rule.conditionValue) {
          matched = String(testPayload[rule.conditionField]) === String(rule.conditionValue);
        }
        return {
          matched,
          wouldExecute: matched
            ? `قانون «${rule.name}» مطابقت دارد و اقدام ${rule.actionType} اجرا خواهد شد.`
            : `شرط قانون برقرار نیست (مقدار فیلد ${rule.conditionField} با ${rule.conditionValue} مطابقت ندارد).`,
          details: {
            conditionField: rule.conditionField,
            conditionValue: rule.conditionValue,
            payloadValue: rule.conditionField ? testPayload[rule.conditionField] : undefined,
            operator: 'EQUALS',
          },
        };
      }
      throw err;
    }
  }

  async getEntityTimeline(
    entityType: string,
    entityId: string,
    limit = 50,
  ): Promise<CustomerTimelineItem[]> {
    try {
      const path = `/activities/entity/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}?limit=${limit}`;
      return await this.request<CustomerTimelineItem[]>(path);
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        return this.fallbackTimeline
          .filter(
            (item) =>
              item.entityType.toUpperCase() === entityType.toUpperCase() &&
              item.entityId === entityId,
          )
          .map((item) => ({ ...item }));
      }
      throw err;
    }
  }

  async getCustomerTimeline(
    accountId: string,
    limit = 50,
  ): Promise<CustomerTimelineItem[]> {
    try {
      const path = `/activities/account/${encodeURIComponent(accountId)}?limit=${limit}`;
      return await this.request<CustomerTimelineItem[]>(path);
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        return this.fallbackTimeline
          .filter(
            (item) =>
              item.entityId === accountId ||
              item.metadata?.accountId === accountId,
          )
          .map((item) => ({ ...item }));
      }
      throw err;
    }
  }

  async logTimelineActivity(item: {
    entityType: 'ACCOUNT' | 'LEAD' | 'CONTACT' | 'DEAL' | 'TICKET';
    entityId: string;
    kind: string;
    summary: string;
    actorName?: string;
    metadata?: Record<string, any>;
  }): Promise<CustomerTimelineItem> {
    const newItem: CustomerTimelineItem = {
      id: `act-${Date.now()}`,
      entityType: item.entityType,
      entityId: item.entityId,
      kind: item.kind,
      summary: item.summary,
      occurredAt: new Date().toISOString(),
      actorName: item.actorName ?? 'کارمند عملیات',
      ...(item.metadata ? { metadata: item.metadata } : {}),
    };
    this.fallbackTimeline.unshift(newItem);
    return newItem;
  }

  /* ---------------- Global Search ---------------- */

  async search(query: SearchQueryDto): Promise<SearchResultDto> {
    try {
      const params = new URLSearchParams();
      if (query.q) {
        params.set('q', query.q);
      }
      if (query.entityTypes && query.entityTypes.length > 0) {
        params.set('entityTypes', query.entityTypes.join(','));
      }
      if (query.limit) {
        params.set('limit', String(query.limit));
      }
      const qs = params.toString();
      return await this.request<SearchResultDto>(`/search${qs ? `?${qs}` : ''}`);
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const rawQ = query.q ?? '';
        const term = rawQ.trim().toLowerCase();
        if (!term) {
          return { query: rawQ, totalHits: 0, items: [] };
        }

        const isCustomer = this.token === DEFAULT_CUSTOMER_ID;
        const requestedTypes =
          query.entityTypes && query.entityTypes.length > 0
            ? new Set(query.entityTypes.map((t) => t.toUpperCase()))
            : null;

        const shouldInclude = (type: string) => {
          if (isCustomer) {
            return type === 'TICKET' && (!requestedTypes || requestedTypes.has('TICKET'));
          }
          return !requestedTypes || requestedTypes.has(type);
        };

        const results: SearchResultItem[] = [];

        // 1. Tasks
        if (shouldInclude('TASK')) {
          for (const task of this.fallbackTasks) {
            const matchesTitle = task.title.toLowerCase().includes(term);
            const matchesKey = task.key.toLowerCase().includes(term);
            const matchesDesc = task.description?.toLowerCase().includes(term) ?? false;
            if (matchesTitle || matchesKey || matchesDesc) {
              results.push({
                id: task.id,
                entityType: 'TASK',
                title: task.title,
                subtitle: task.key,
                status: task.status,
                url: `/tasks/${task.id}`,
                createdAt: task.createdAt,
              });
            }
          }
        }

        // 2. Accounts
        if (shouldInclude('ACCOUNT')) {
          for (const acc of this.fallbackAccounts) {
            const matchesName = acc.name.toLowerCase().includes(term);
            const matchesPhone = acc.phone?.toLowerCase().includes(term) ?? false;
            const matchesWeb = acc.website?.toLowerCase().includes(term) ?? false;
            const matchesType = acc.type.toLowerCase().includes(term);
            if (matchesName || matchesPhone || matchesWeb || matchesType) {
              results.push({
                id: acc.id,
                entityType: 'ACCOUNT',
                title: acc.name,
                subtitle: acc.phone || acc.website || acc.type || null,
                status: acc.status,
                url: `/crm/accounts/${acc.id}`,
                createdAt: acc.createdAt,
              });
            }
          }
        }

        // 3. Contacts
        if (shouldInclude('CONTACT')) {
          for (const contact of this.fallbackContacts) {
            const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
            const matchesName = fullName.includes(term);
            const matchesEmail = contact.email?.toLowerCase().includes(term) ?? false;
            const matchesPhone = contact.phone?.toLowerCase().includes(term) ?? false;
            if (matchesName || matchesEmail || matchesPhone) {
              results.push({
                id: contact.id,
                entityType: 'CONTACT',
                title: `${contact.firstName} ${contact.lastName}`,
                subtitle: contact.email || contact.phone || contact.accountName || null,
                status: null,
                url: `/crm/contacts/${contact.id}`,
                createdAt: contact.createdAt,
              });
            }
          }
        }

        // 4. Leads
        if (shouldInclude('LEAD')) {
          for (const lead of this.fallbackLeads) {
            const matchesName = lead.displayName.toLowerCase().includes(term);
            const matchesEmail = lead.email?.toLowerCase().includes(term) ?? false;
            const matchesPhone = lead.phone?.toLowerCase().includes(term) ?? false;
            if (matchesName || matchesEmail || matchesPhone) {
              results.push({
                id: lead.id,
                entityType: 'LEAD',
                title: lead.displayName,
                subtitle: lead.email || lead.phone || lead.source || null,
                status: lead.status,
                url: `/crm/leads/${lead.id}`,
                createdAt: lead.createdAt,
              });
            }
          }
        }

        // 5. Tickets
        if (shouldInclude('TICKET')) {
          for (const ticket of this.fallbackTickets) {
            const matchesTitle = ticket.title.toLowerCase().includes(term);
            const matchesRef = ticket.reference.toLowerCase().includes(term);
            if (matchesTitle || matchesRef) {
              results.push({
                id: ticket.id,
                entityType: 'TICKET',
                title: ticket.title,
                subtitle: ticket.reference,
                status: ticket.status,
                url: `/tickets/${ticket.id}`,
                createdAt: ticket.createdAt,
              });
            }
          }
        }

        const limit = query.limit ?? 20;
        const sliced = results.slice(0, limit);
        return {
          query: rawQ,
          totalHits: results.length,
          items: sliced,
        };
      }
      throw err;
    }
  }

  /* ---------------- Saved Views ---------------- */

  async getSavedViews(entityType?: string): Promise<SavedViewDto[]> {
    try {
      const path = entityType
        ? `/crm/saved-views?entityType=${encodeURIComponent(entityType)}`
        : '/crm/saved-views';
      return await this.request<SavedViewDto[]>(path);
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        if (entityType) {
          return this.fallbackSavedViews
            .filter((v) => v.entityType.toUpperCase() === entityType.toUpperCase())
            .map((v) => ({ ...v }));
        }
        return this.fallbackSavedViews.map((v) => ({ ...v }));
      }
      throw err;
    }
  }

  async createSavedView(dto: CreateSavedViewRequest): Promise<SavedViewDto> {
    try {
      return await this.request<SavedViewDto>('/crm/saved-views', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const now = new Date().toISOString();
        const newView: SavedViewDto = {
          id: `view-${Date.now()}`,
          organizationId: DEFAULT_ORG_ID,
          name: dto.name.trim(),
          entityType: (dto.entityType ?? 'TASK') as SavedViewEntityType,
          filters: dto.filters ?? {},
          ...(dto.sortField !== undefined ? { sortField: dto.sortField } : {}),
          ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
          isShared: Boolean(dto.isShared),
          createdBy: this.token,
          isDefault: Boolean(dto.isDefault),
          createdAt: now,
          updatedAt: now,
        };
        this.fallbackSavedViews.unshift(newView);
        return { ...newView };
      }
      throw err;
    }
  }

  async deleteSavedView(id: string): Promise<{ success: boolean }> {
    try {
      return await this.request<{ success: boolean }>(`/crm/saved-views/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const idx = this.fallbackSavedViews.findIndex((v) => v.id === id);
        if (idx !== -1) {
          this.fallbackSavedViews.splice(idx, 1);
        }
        return { success: true };
      }
      throw err;
    }
  }

  /* ---------------- Enterprise Documents & Collaboration ---------------- */

  async getSpaces(): Promise<DocumentSpaceDto[]> {
    try {
      return await this.request<DocumentSpaceDto[]>('/documents/spaces');
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        return this.fallbackSpaces.map((s) => ({ ...s }));
      }
      throw err;
    }
  }

  async createSpace(dto: CreateDocumentSpaceRequest): Promise<DocumentSpaceDto> {
    try {
      return await this.request<DocumentSpaceDto>('/documents/spaces', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const now = new Date().toISOString();
        const space: DocumentSpaceDto = {
          id: `space-${Date.now()}`,
          organizationId: DEFAULT_ORG_ID,
          name: dto.name.trim(),
          slug: generateSlug(dto.name),
          ...(dto.description ? { description: dto.description } : {}),
          icon: dto.icon || 'folder',
          isDefault: false,
          createdAt: now,
          updatedAt: now,
        };
        this.fallbackSpaces.push(space);
        return { ...space };
      }
      throw err;
    }
  }

  async getDocuments(filters?: {
    spaceId?: string;
    visibility?: DocumentVisibility;
    isPublished?: boolean;
    search?: string;
  }): Promise<DocumentSummaryDto[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.spaceId) params.set('spaceId', filters.spaceId);
      if (filters?.visibility) params.set('visibility', filters.visibility);
      if (filters?.isPublished !== undefined)
        params.set('isPublished', String(filters.isPublished));
      if (filters?.search) params.set('search', filters.search);

      const qs = params.toString();
      return await this.request<DocumentSummaryDto[]>(
        `/documents${qs ? `?${qs}` : ''}`,
      );
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const isCustomer = this.token === DEFAULT_CUSTOMER_ID;

        return this.fallbackDocuments
          .filter((d) => {
            if (isCustomer) {
              // Customer portal only sees published CUSTOMER_VISIBLE docs
              return d.visibility === 'CUSTOMER_VISIBLE' && d.isPublished;
            }
            if (filters?.spaceId && d.spaceId !== filters.spaceId) return false;
            if (filters?.visibility && d.visibility !== filters.visibility)
              return false;
            if (
              filters?.isPublished !== undefined &&
              d.isPublished !== filters.isPublished
            )
              return false;
            if (filters?.search) {
              const q = filters.search.toLowerCase();
              const mTitle = d.title.toLowerCase().includes(q);
              const mTags = d.tags.some((t) => t.toLowerCase().includes(q));
              if (!mTitle && !mTags) return false;
            }
            return true;
          })
          .map((d) => {
            const { content, revisions, ...summary } = d;
            return { ...summary };
          });
      }
      throw err;
    }
  }

  async getDocumentDetail(id: string): Promise<DocumentDetailDto> {
    try {
      return await this.request<DocumentDetailDto>(
        `/documents/${encodeURIComponent(id)}`,
      );
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const isCustomer = this.token === DEFAULT_CUSTOMER_ID;
        const doc = this.fallbackDocuments.find((d) => d.id === id);
        if (!doc) {
          throw new ApiClientError(`Document ${id} not found`, 404, 'NOT_FOUND');
        }
        if (isCustomer && (doc.visibility !== 'CUSTOMER_VISIBLE' || !doc.isPublished)) {
          throw new ApiClientError(
            'محدودیت دسترسی: دسترسی به اسناد داخلی برای کاربران پورتال مشتریان مجاز نیست',
            403,
            'FORBIDDEN',
          );
        }
        return { ...doc, revisions: doc.revisions?.map((r) => ({ ...r })) };
      }
      throw err;
    }
  }

  async createDocument(dto: CreateDocumentRequest): Promise<DocumentDetailDto> {
    try {
      return await this.request<DocumentDetailDto>('/documents', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const now = new Date().toISOString();
        const space = this.fallbackSpaces.find((s) => s.id === dto.spaceId);
        const newId = `doc-${Date.now()}`;
        const cleanContent = sanitizeDocumentContent(dto.content);

        const initialRevision: DocumentRevisionDto = {
          id: `rev-${Date.now()}`,
          documentId: newId,
          version: 1,
          title: dto.title.trim(),
          content: cleanContent,
          summaryChange: 'نسخه اولیه سند',
          authorId: this.token,
          authorName: 'سارا احمدی',
          createdAt: now,
        };

        const newDoc: DocumentDetailDto = {
          id: newId,
          organizationId: DEFAULT_ORG_ID,
          spaceId: dto.spaceId,
          ...(space ? { spaceName: space.name } : {}),
          title: dto.title.trim(),
          slug: generateSlug(dto.title),
          content: cleanContent,
          visibility: dto.visibility,
          isPublished: dto.isPublished ?? true,
          authorId: this.token,
          authorName: 'سارا احمدی',
          version: 1,
          tags: dto.tags ?? [],
          ...(dto.associatedEntityType ? { associatedEntityType: dto.associatedEntityType } : {}),
          ...(dto.associatedEntityId ? { associatedEntityId: dto.associatedEntityId } : {}),
          createdAt: now,
          updatedAt: now,
          revisions: [initialRevision],
        };

        this.fallbackDocuments.unshift(newDoc);
        return { ...newDoc };
      }
      throw err;
    }
  }

  async updateDocument(
    id: string,
    dto: UpdateDocumentRequest,
  ): Promise<DocumentDetailDto> {
    try {
      return await this.request<DocumentDetailDto>(
        `/documents/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          body: JSON.stringify(dto),
        },
      );
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const docIndex = this.fallbackDocuments.findIndex((d) => d.id === id);
        if (docIndex === -1) {
          throw new ApiClientError(`Document ${id} not found`, 404, 'NOT_FOUND');
        }
        const existing = this.fallbackDocuments[docIndex]!;

        if (
          dto.expectedVersion !== undefined &&
          existing.version !== dto.expectedVersion
        ) {
          throw new ApiClientError(
            `تعارض ویرایش همزمان: نسخه سند تغییر کرده است`,
            409,
            'VERSION_CONFLICT',
          );
        }

        const now = new Date().toISOString();
        const nextVersion = existing.version + 1;
        const newTitle = dto.title !== undefined ? dto.title.trim() : existing.title;
        const newContent =
          dto.content !== undefined
            ? sanitizeDocumentContent(dto.content)
            : existing.content;

        const rev: DocumentRevisionDto = {
          id: `rev-${Date.now()}`,
          documentId: existing.id,
          version: nextVersion,
          title: newTitle,
          content: newContent,
          summaryChange: dto.summaryChange || `ویرایش نسخه ${nextVersion}`,
          authorId: this.token,
          authorName: 'سارا احمدی',
          createdAt: now,
        };

        const updated: DocumentDetailDto = {
          ...existing,
          title: newTitle,
          slug: generateSlug(newTitle),
          content: newContent,
          ...(dto.visibility !== undefined ? { visibility: dto.visibility } : {}),
          ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
          ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
          version: nextVersion,
          updatedAt: now,
          revisions: [rev, ...(existing.revisions || [])],
        };

        this.fallbackDocuments[docIndex] = updated;
        return { ...updated };
      }
      throw err;
    }
  }

  async restoreDocumentRevision(
    id: string,
    revisionVersion: number,
    summaryChange?: string,
  ): Promise<DocumentDetailDto> {
    try {
      return await this.request<DocumentDetailDto>(
        `/documents/${encodeURIComponent(id)}/restore`,
        {
          method: 'POST',
          body: JSON.stringify({ revisionVersion, summaryChange }),
        },
      );
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const doc = this.fallbackDocuments.find((d) => d.id === id);
        if (!doc) {
          throw new ApiClientError(`Document ${id} not found`, 404, 'NOT_FOUND');
        }
        const targetRev = doc.revisions?.find((r) => r.version === revisionVersion);
        if (!targetRev) {
          throw new ApiClientError(
            `Revision ${revisionVersion} not found`,
            404,
            'NOT_FOUND',
          );
        }
        return this.updateDocument(id, {
          title: targetRev.title,
          content: targetRev.content,
          summaryChange:
            summaryChange || `بازیابی سند به نسخه ${revisionVersion}`,
        });
      }
      throw err;
    }
  }

  async deleteDocument(id: string): Promise<boolean> {
    try {
      await this.request<{ success: boolean }>(
        `/documents/${encodeURIComponent(id)}`,
        { method: 'DELETE' },
      );
      return true;
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const idx = this.fallbackDocuments.findIndex((d) => d.id === id);
        if (idx !== -1) {
          this.fallbackDocuments.splice(idx, 1);
        }
        return true;
      }
      throw err;
    }
  }

  /* ---------------- Scheduled Activities & Calendar ---------------- */

  async getCalendarActivities(filters?: {
    from?: string;
    to?: string;
    type?: ActivityType;
    status?: ActivityStatus;
    ownerId?: string;
  }): Promise<ActivityDto[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.from) params.set('from', filters.from);
      if (filters?.to) params.set('to', filters.to);
      if (filters?.type) params.set('type', filters.type);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.ownerId) params.set('ownerId', filters.ownerId);

      const qs = params.toString();
      return await this.request<ActivityDto[]>(
        `/activities/calendar${qs ? `?${qs}` : ''}`,
      );
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const isCustomer = this.token === DEFAULT_CUSTOMER_ID;
        return this.fallbackScheduledActivities
          .filter((a) => {
            if (isCustomer && a.visibility !== 'CUSTOMER_SHARED') return false;
            if (filters?.type && a.type !== filters.type) return false;
            if (filters?.status && a.status !== filters.status) return false;
            if (filters?.ownerId && a.ownerId !== filters.ownerId) return false;
            if (filters?.from && new Date(a.endsAt) < new Date(filters.from)) return false;
            if (filters?.to && new Date(a.startsAt) > new Date(filters.to)) return false;
            return true;
          })
          .map((a) => ({ ...a }));
      }
      throw err;
    }
  }

  async checkCalendarConflicts(
    startsAt: string,
    endsAt: string,
    participantIds?: string[],
  ): Promise<CalendarConflictDto> {
    try {
      const params = new URLSearchParams({ startsAt, endsAt });
      if (participantIds && participantIds.length > 0) {
        params.set('participantIds', participantIds.join(','));
      }
      return await this.request<CalendarConflictDto>(
        `/activities/conflicts?${params.toString()}`,
      );
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const targetStart = new Date(startsAt).getTime();
        const targetEnd = new Date(endsAt).getTime();
        const participants = participantIds ?? [this.token];
        const participantSet = new Set(participants);

        const conflicting = this.fallbackScheduledActivities.filter((act) => {
          if (act.status === 'CANCELLED') return false;
          const actStart = new Date(act.startsAt).getTime();
          const actEnd = new Date(act.endsAt).getTime();
          const hasOverlap = targetStart < actEnd && targetEnd > actStart;
          if (!hasOverlap) return false;

          return (
            participantSet.has(act.ownerId) ||
            act.participantIds.some((p) => participantSet.has(p))
          );
        });

        return {
          hasConflict: conflicting.length > 0,
          conflictingActivities: conflicting.map((c) => ({ ...c })),
        };
      }
      throw err;
    }
  }

  async createScheduledActivity(
    dto: CreateActivityRequest,
  ): Promise<{ activity: ActivityDto; conflictInfo: CalendarConflictDto }> {
    try {
      return await this.request<{
        activity: ActivityDto;
        conflictInfo: CalendarConflictDto;
      }>('/activities', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const now = new Date().toISOString();
        const startsAtDate = new Date(dto.startsAt);
        const endsAtDate = dto.endsAt
          ? new Date(dto.endsAt)
          : new Date(startsAtDate.getTime() + 3600000);

        const startsAtIso = startsAtDate.toISOString();
        const endsAtIso = endsAtDate.toISOString();

        const conflictInfo = await this.checkCalendarConflicts(
          startsAtIso,
          endsAtIso,
          dto.participantIds,
        );

        const newAct: ActivityDto = {
          id: `act-${Date.now()}`,
          organizationId: DEFAULT_ORG_ID,
          type: dto.type,
          title: dto.title.trim(),
          ...(dto.description ? { description: dto.description } : {}),
          startsAt: startsAtIso,
          endsAt: endsAtIso,
          isAllDay: Boolean(dto.isAllDay),
          status: 'SCHEDULED',
          ownerId: this.token,
          ownerName: 'سارا احمدی',
          participantIds: dto.participantIds ?? [this.token],
          ...(dto.associatedEntityType ? { associatedEntityType: dto.associatedEntityType } : {}),
          ...(dto.associatedEntityId ? { associatedEntityId: dto.associatedEntityId } : {}),
          ...(dto.associatedEntityTitle ? { associatedEntityTitle: dto.associatedEntityTitle } : {}),
          visibility: dto.visibility ?? 'INTERNAL',
          ...(dto.reminderMinutesBefore !== undefined
            ? { reminderMinutesBefore: dto.reminderMinutesBefore }
            : {}),
          createdAt: now,
          updatedAt: now,
        };

        this.fallbackScheduledActivities.unshift(newAct);

        // Append to passive timeline
        this.fallbackTimeline.unshift({
          id: `act-tl-${Date.now()}`,
          entityType: (newAct.associatedEntityType as any) || 'TASK',
          entityId: newAct.associatedEntityId || newAct.id,
          kind: `ACTIVITY_${newAct.type}_SCHEDULED`,
          summary: `رویداد «${newAct.title}» برای تاریخ ${new Date(newAct.startsAt).toLocaleDateString('fa-IR')} زمان‌بندی شد`,
          occurredAt: now,
          actorName: 'سارا احمدی',
        });

        return { activity: { ...newAct }, conflictInfo };
      }
      throw err;
    }
  }

  async updateScheduledActivity(
    id: string,
    dto: UpdateActivityRequest,
  ): Promise<ActivityDto> {
    try {
      return await this.request<ActivityDto>(
        `/activities/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          body: JSON.stringify(dto),
        },
      );
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const idx = this.fallbackScheduledActivities.findIndex((a) => a.id === id);
        if (idx === -1) {
          throw new ApiClientError(`Activity ${id} not found`, 404, 'NOT_FOUND');
        }
        const existing = this.fallbackScheduledActivities[idx]!;
        const updated: ActivityDto = {
          ...existing,
          ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.startsAt !== undefined ? { startsAt: new Date(dto.startsAt).toISOString() } : {}),
          ...(dto.endsAt !== undefined ? { endsAt: new Date(dto.endsAt).toISOString() } : {}),
          ...(dto.isAllDay !== undefined ? { isAllDay: dto.isAllDay } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.associatedEntityType !== undefined ? { associatedEntityType: dto.associatedEntityType } : {}),
          ...(dto.associatedEntityId !== undefined ? { associatedEntityId: dto.associatedEntityId } : {}),
          ...(dto.associatedEntityTitle !== undefined ? { associatedEntityTitle: dto.associatedEntityTitle } : {}),
          ...(dto.participantIds !== undefined ? { participantIds: dto.participantIds } : {}),
          ...(dto.visibility !== undefined ? { visibility: dto.visibility } : {}),
          ...(dto.reminderMinutesBefore !== undefined ? { reminderMinutesBefore: dto.reminderMinutesBefore } : {}),
          updatedAt: new Date().toISOString(),
        };

        this.fallbackScheduledActivities[idx] = updated;
        return { ...updated };
      }
      throw err;
    }
  }

  async deleteScheduledActivity(id: string): Promise<boolean> {
    try {
      await this.request<{ success: boolean }>(
        `/activities/${encodeURIComponent(id)}`,
        { method: 'DELETE' },
      );
      return true;
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const idx = this.fallbackScheduledActivities.findIndex((a) => a.id === id);
        if (idx !== -1) {
          this.fallbackScheduledActivities.splice(idx, 1);
        }
        return true;
      }
      throw err;
    }
  }

  /* ---------------- Organization Workspace & Member Management ---------------- */

  async getOrganizationSettings(): Promise<OrganizationSettingsDto> {
    try {
      return await this.request<OrganizationSettingsDto>('/organization/settings');
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        return { ...this.fallbackOrganizationSettings };
      }
      throw err;
    }
  }

  async updateOrganizationSettings(
    dto: UpdateOrganizationSettingsRequest,
  ): Promise<OrganizationSettingsDto> {
    try {
      return await this.request<OrganizationSettingsDto>('/organization/settings', {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const updated: OrganizationSettingsDto = {
          ...this.fallbackOrganizationSettings,
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
          ...(dto.locale !== undefined ? { locale: dto.locale } : {}),
          ...(dto.branding !== undefined ? { branding: { ...dto.branding } } : {}),
          ...(dto.retentionPolicy !== undefined
            ? {
                retentionPolicy: {
                  auditLogsDays:
                    dto.retentionPolicy.auditLogsDays ??
                    this.fallbackOrganizationSettings.retentionPolicy?.auditLogsDays ??
                    90,
                  tempFilesDays:
                    dto.retentionPolicy.tempFilesDays ??
                    this.fallbackOrganizationSettings.retentionPolicy?.tempFilesDays ??
                    7,
                },
              }
            : {}),
          updatedAt: new Date().toISOString(),
        };
        this.fallbackOrganizationSettings = updated;
        return { ...updated };
      }
      throw err;
    }
  }

  async getOrganizationMembers(): Promise<OrganizationMemberDto[]> {
    try {
      return await this.request<OrganizationMemberDto[]>('/organization/members');
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        return this.fallbackMembers.map((m) => ({ ...m }));
      }
      throw err;
    }
  }

  async inviteOrganizationMember(dto: InviteMemberRequest): Promise<OrganizationMemberDto> {
    try {
      return await this.request<OrganizationMemberDto>('/organization/members/invite', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const newMember: OrganizationMemberDto = {
          id: `mem-${Date.now()}`,
          userId: `usr-${Date.now()}`,
          email: dto.email.trim().toLowerCase(),
          displayName: dto.displayName.trim(),
          role: dto.role,
          active: true,
          joinedAt: new Date().toISOString(),
        };
        this.fallbackMembers.push(newMember);
        return { ...newMember };
      }
      throw err;
    }
  }

  async updateOrganizationMemberRole(
    memberId: string,
    dto: UpdateMemberRoleRequest,
  ): Promise<OrganizationMemberDto> {
    try {
      return await this.request<OrganizationMemberDto>(
        `/organization/members/${encodeURIComponent(memberId)}/role`,
        {
          method: 'PATCH',
          body: JSON.stringify(dto),
        },
      );
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const idx = this.fallbackMembers.findIndex((m) => m.id === memberId);
        if (idx === -1) {
          throw new ApiClientError(`Member ${memberId} not found`, 404, 'NOT_FOUND');
        }
        const member = this.fallbackMembers[idx]!;
        member.role = dto.role;
        return { ...member };
      }
      throw err;
    }
  }

  async revokeOrganizationMember(memberId: string): Promise<{ success: boolean }> {
    try {
      return await this.request<{ success: boolean }>(
        `/organization/members/${encodeURIComponent(memberId)}/revoke`,
        { method: 'POST' },
      );
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const idx = this.fallbackMembers.findIndex((m) => m.id === memberId);
        if (idx !== -1) {
          this.fallbackMembers[idx]!.active = false;
        }
        return { success: true };
      }
      throw err;
    }
  }

  async getRolesMatrix(): Promise<{
    roles: string[];
    matrix: Record<string, Record<string, string>>;
  }> {
    try {
      return await this.request<{
        roles: string[];
        matrix: Record<string, Record<string, string>>;
      }>('/organization/roles');
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        return {
          roles: [
            'SystemOwner',
            'OrganizationAdmin',
            'Manager',
            'Employee',
            'Sales',
            'SupportAgent',
            'CustomerPortalUser',
            'Auditor',
            'IntegrationAccount',
          ],
          matrix: {},
        };
      }
      throw err;
    }
  }

  /* ---------------- Custom Reporting & Analytics ---------------- */

  async getCustomReport(query: CustomReportQueryDto): Promise<CustomReportResultDto> {
    try {
      const params = new URLSearchParams({ metric: query.metric });
      if (query.groupBy) params.set('groupBy', query.groupBy);
      if (query.timeframe) params.set('timeframe', query.timeframe);

      return await this.request<CustomReportResultDto>(
        `/reporting/custom?${params.toString()}`,
      );
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const timeframe = query.timeframe || 'MONTH';
        const groupBy = query.groupBy || 'STATUS';
        const groups: ReportGroupBreakdown[] = [];
        let totalCount = 0;
        let totalValue: number | undefined = undefined;

        if (query.metric === 'DEALS') {
          totalCount = this.fallbackDeals.length;
          totalValue = this.fallbackDeals.reduce((sum, d) => sum + (d.amountMinor ?? 0), 0);
          const map = new Map<string, { count: number; value: number }>();
          for (const d of this.fallbackDeals) {
            const cur = map.get(d.stage) || { count: 0, value: 0 };
            cur.count += 1;
            cur.value += d.amountMinor ?? 0;
            map.set(d.stage, cur);
          }
          for (const [key, info] of map.entries()) {
            groups.push({
              key,
              label: key,
              count: info.count,
              value: info.value,
              percentage: totalCount > 0 ? Math.round((info.count / totalCount) * 100) : 0,
            });
          }
        } else if (query.metric === 'LEADS') {
          totalCount = this.fallbackLeads.length;
          const map = new Map<string, number>();
          for (const l of this.fallbackLeads) {
            map.set(l.status, (map.get(l.status) || 0) + 1);
          }
          for (const [key, count] of map.entries()) {
            groups.push({
              key,
              label: key,
              count,
              percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
            });
          }
        } else if (query.metric === 'TASKS') {
          totalCount = this.fallbackTasks.length;
          const map = new Map<string, number>();
          for (const t of this.fallbackTasks) {
            const k = groupBy === 'PRIORITY' ? t.priority : t.status;
            map.set(k, (map.get(k) || 0) + 1);
          }
          for (const [key, count] of map.entries()) {
            groups.push({
              key,
              label: key,
              count,
              percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
            });
          }
        } else {
          totalCount = this.fallbackTickets.length;
          const map = new Map<string, number>();
          for (const t of this.fallbackTickets) {
            const k = groupBy === 'PRIORITY' ? t.priority : t.status;
            map.set(k, (map.get(k) || 0) + 1);
          }
          for (const [key, count] of map.entries()) {
            groups.push({
              key,
              label: key,
              count,
              percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
            });
          }
        }

        const res: CustomReportResultDto = {
          metric: query.metric,
          groupBy,
          timeframe,
          totalCount,
          groups,
          generatedAt: new Date().toISOString(),
        };
        if (totalValue !== undefined) res.totalValue = totalValue;
        return res;
      }
      throw err;
    }
  }

  async exportReport(query: CustomReportQueryDto): Promise<{ csv: string; filename: string }> {
    try {
      return await this.request<{ csv: string; filename: string }>('/reporting/export', {
        method: 'POST',
        body: JSON.stringify(query),
      });
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const report = await this.getCustomReport(query);
        const headers = ['گروه', 'تعداد', 'درصد'];
        if (report.totalValue !== undefined) headers.push('ارزش ریالی');
        const rows = report.groups.map((g) => {
          const r = [g.label, String(g.count), `${g.percentage}%`];
          if (g.value !== undefined) r.push(String(g.value));
          return r.join(',');
        });
        const csv = [headers.join(','), ...rows].join('\n');
        return {
          csv,
          filename: `report-${query.metric.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`,
        };
      }
      throw err;
    }
  }

  /* ---------------- Sales Pipelines & Duplicate Management ---------------- */

  async getPipelineStages(): Promise<PipelineStageDto[]> {
    try {
      return await this.request<PipelineStageDto[]>('/crm/pipeline-stages');
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        return this.fallbackPipelineStages.map((s) => ({ ...s }));
      }
      throw err;
    }
  }

  async updateDeal(dealId: string, dto: UpdateDealDto): Promise<DealDto> {
    try {
      return await this.request<DealDto>(`/crm/deals/${encodeURIComponent(dealId)}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const idx = this.fallbackDeals.findIndex((d) => d.id === dealId);
        if (idx === -1) {
          throw new ApiClientError(`Deal ${dealId} not found`, 404, 'NOT_FOUND');
        }
        const existing = this.fallbackDeals[idx]!;
        const updated: DealDto = {
          ...existing,
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.stage !== undefined ? { stage: dto.stage } : {}),
          ...(dto.amountMinor !== undefined ? { amountMinor: dto.amountMinor } : {}),
          ...(dto.probability !== undefined ? { probability: dto.probability } : {}),
          ...(dto.targetCloseAt !== undefined ? { targetCloseAt: dto.targetCloseAt } : {}),
          updatedAt: new Date().toISOString(),
        };
        this.fallbackDeals[idx] = updated;
        return { ...updated };
      }
      throw err;
    }
  }

  async getDuplicateCandidates(): Promise<DuplicateCandidateDto[]> {
    try {
      return await this.request<DuplicateCandidateDto[]>('/crm/duplicates/candidates');
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        return this.fallbackDuplicates.map((d) => ({ ...d }));
      }
      throw err;
    }
  }

  async mergeRecords(dto: MergeRecordsRequest): Promise<{ success: boolean; mergedId: string }> {
    try {
      return await this.request<{ success: boolean; mergedId: string }>('/crm/duplicates/merge', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const idx = this.fallbackDuplicates.findIndex(
          (d) =>
            d.entityType === dto.entityType &&
            (d.primaryRecord.id === dto.targetRecordId ||
              d.duplicateRecord.id === dto.sourceRecordId),
        );
        if (idx !== -1) {
          this.fallbackDuplicates.splice(idx, 1);
        }
        return { success: true, mergedId: dto.targetRecordId };
      }
      throw err;
    }
  }

  /* ---------------- Custom Fields & Dynamic Schema ---------------- */

  async getCustomFields(
    entityType?: CustomFieldEntityType,
  ): Promise<CustomFieldDefinitionDto[]> {
    try {
      const path = entityType
        ? `/custom-fields?entityType=${encodeURIComponent(entityType)}`
        : '/custom-fields';
      return await this.request<CustomFieldDefinitionDto[]>(path);
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        return this.fallbackCustomFields
          .filter((f) => !entityType || f.entityType === entityType)
          .map((f) => ({ ...f }));
      }
      throw err;
    }
  }

  async createCustomField(
    dto: CreateCustomFieldRequest,
  ): Promise<CustomFieldDefinitionDto> {
    try {
      return await this.request<CustomFieldDefinitionDto>('/custom-fields', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const now = new Date().toISOString();
        const newField: CustomFieldDefinitionDto = {
          id: `cf-${Date.now()}`,
          organizationId: DEFAULT_ORG_ID,
          entityType: dto.entityType,
          key: dto.key.trim().toLowerCase().replace(/[\s-]+/g, '_'),
          label: dto.label.trim(),
          type: dto.type,
          options: dto.options,
          isRequired: Boolean(dto.isRequired),
          defaultValue: dto.defaultValue,
          order: dto.order ?? 99,
          active: true,
          createdAt: now,
          updatedAt: now,
        };
        this.fallbackCustomFields.push(newField);
        return { ...newField };
      }
      throw err;
    }
  }

  async updateCustomField(
    id: string,
    dto: UpdateCustomFieldRequest,
  ): Promise<CustomFieldDefinitionDto> {
    try {
      return await this.request<CustomFieldDefinitionDto>(
        `/custom-fields/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          body: JSON.stringify(dto),
        },
      );
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const idx = this.fallbackCustomFields.findIndex((f) => f.id === id);
        if (idx === -1) {
          throw new ApiClientError(`Custom field ${id} not found`, 404, 'NOT_FOUND');
        }
        const existing = this.fallbackCustomFields[idx]!;
        const updated: CustomFieldDefinitionDto = {
          ...existing,
          ...(dto.label !== undefined ? { label: dto.label.trim() } : {}),
          ...(dto.options !== undefined ? { options: dto.options } : {}),
          ...(dto.isRequired !== undefined ? { isRequired: dto.isRequired } : {}),
          ...(dto.defaultValue !== undefined ? { defaultValue: dto.defaultValue } : {}),
          ...(dto.order !== undefined ? { order: dto.order } : {}),
          ...(dto.active !== undefined ? { active: dto.active } : {}),
          updatedAt: new Date().toISOString(),
        };
        this.fallbackCustomFields[idx] = updated;
        return { ...updated };
      }
      throw err;
    }
  }

  async deleteCustomField(id: string): Promise<{ success: boolean }> {
    try {
      return await this.request<{ success: boolean }>(
        `/custom-fields/${encodeURIComponent(id)}`,
        { method: 'DELETE' },
      );
    } catch (err) {
      if (this.isOfflineOrNetworkError(err)) {
        const idx = this.fallbackCustomFields.findIndex((f) => f.id === id);
        if (idx !== -1) {
          this.fallbackCustomFields.splice(idx, 1);
        }
        return { success: true };
      }
      throw err;
    }
  }
}

export type {
  CreateCustomFieldRequest,
  CustomFieldDefinitionDto,
  CustomFieldEntityType,
  CustomFieldType,
  UpdateCustomFieldRequest,
  DuplicateCandidateDto,
  MergeRecordsRequest,
  PipelineStageDto,
  UpdateDealDto,
  InviteMemberRequest,
  OrganizationMemberDto,
  OrganizationSettingsDto,
  UpdateMemberRoleRequest,
  UpdateOrganizationSettingsRequest,
  ActivityDto,
  ActivityStatus,
  ActivityType,
  CalendarConflictDto,
  CreateActivityRequest,
  UpdateActivityRequest,
  CreateDocumentRequest,
  CreateDocumentSpaceRequest,
  DocumentDetailDto,
  DocumentRevisionDto,
  DocumentSpaceDto,
  DocumentSummaryDto,
  DocumentVisibility,
  UpdateDocumentRequest,
  CreateSavedViewRequest,
  SavedViewDto,
  SavedViewEntityType,
  SearchQueryDto,
  SearchResultDto,
  SearchResultItem,
};
export const DEFAULT_CUSTOMER_ID = '33333333-3333-3333-3333-333333333333';
export const apiClient = new ApiClient();
export const customerApiClient = new ApiClient(undefined, DEFAULT_CUSTOMER_ID);
export default apiClient;
