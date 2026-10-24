/**
 * Type-safe API client for CRM platform.
 * Reads NEXT_PUBLIC_API_URL or defaults to http://localhost:4000/api/v1.
 * Supports authentication token management and graceful fallback for offline/development mode.
 */

import type {
  AutomationRuleDto,
  CreateAutomationRuleRequest,
  CrmFunnelReport,
  DashboardKpiReport,
  NotificationDto,
  NotificationPreferencesDto,
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
} from '@crm/contracts';

import {
  canTransitionTask,
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
}

export const DEFAULT_CUSTOMER_ID = '33333333-3333-3333-3333-333333333333';
export const apiClient = new ApiClient();
export const customerApiClient = new ApiClient(undefined, DEFAULT_CUSTOMER_ID);
export default apiClient;
