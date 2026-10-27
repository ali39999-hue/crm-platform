import { Platform } from 'react-native';
import type {
  ApiError,
  CreateTaskRequest,
  CreateTicketRequest,
  AddTicketMessageRequest,
  PageQuery,
  TaskDetails,
  TaskSummary,
  TicketDto,
  TicketMessageDto,
  TransitionTaskRequest,
  DealDto,
  UpdateDealDto,
  MarkDealLostRequest,
} from '@crm/contracts';
import {
  canTransitionTask,
  type TransitionActorCapabilities,
} from '@crm/domain';

export class ApiClientError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly requestId?: string;
  public readonly details?: Array<{ field?: string; reason: string }>;

  constructor(error: {
    message: string;
    statusCode?: number;
    code?: string;
    requestId?: string;
    details?: Array<{ field?: string; reason: string }>;
  }) {
    super(error.message);
    this.name = 'ApiClientError';
    this.statusCode = error.statusCode ?? 500;
    this.code = error.code ?? 'API_ERROR';
    this.requestId = error.requestId;
    this.details = error.details;
  }
}

export interface ApiClientConfig {
  baseUrl?: string;
  authToken?: string;
}

export const DEFAULT_AUTH_TOKEN = '22222222-2222-2222-2222-222222222222';

export function getDefaultApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return Platform.OS === 'android'
    ? 'http://10.0.2.2:4000/api/v1'
    : 'http://localhost:4000/api/v1';
}

export class ApiClient {
  private baseUrl: string;
  private authToken: string;

  constructor(config?: ApiClientConfig) {
    this.baseUrl = (config?.baseUrl || getDefaultApiUrl()).replace(/\/+$/, '');
    this.authToken = config?.authToken || DEFAULT_AUTH_TOKEN;
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setAuthToken(token: string): void {
    this.authToken = token.trim();
  }

  public getAuthToken(): string {
    return this.authToken;
  }

  private getAuthHeader(): string {
    const token = this.authToken.trim();
    if (!token) return '';
    return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;
    const authHeader = this.getAuthHeader();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errBody: Partial<ApiError> = {};
        try {
          errBody = await response.json();
        } catch {
          errBody = {
            message: `HTTP error ${response.status}: ${response.statusText}`,
          };
        }

        throw new ApiClientError({
          statusCode: errBody.statusCode ?? response.status,
          code: errBody.code ?? `HTTP_${response.status}`,
          message: errBody.message ?? response.statusText ?? 'Request failed',
          requestId: errBody.requestId,
          details: errBody.details,
        });
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError({
        statusCode: 0,
        code: 'NETWORK_FAILURE',
        message: error instanceof Error ? error.message : 'Network request failed',
      });
    }
  }

  /**
   * GET /tasks/my-work
   * Returns tasks assigned to the current user.
   */
  public async getMyWork(): Promise<TaskSummary[]> {
    return this.request<TaskSummary[]>('/tasks/my-work');
  }

  /**
   * GET /tasks
   * Returns paginated tasks with optional filter queries.
   */
  public async getTasks(
    query?: PageQuery,
  ): Promise<{ items: TaskSummary[]; nextCursor: string | null }> {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.priority) params.append('priority', query.priority);
    if (query?.assigneeId) params.append('assigneeId', query.assigneeId);
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.cursor) params.append('cursor', query.cursor);

    const qs = params.toString();
    const endpoint = `/tasks${qs ? `?${qs}` : ''}`;
    return this.request<{ items: TaskSummary[]; nextCursor: string | null }>(endpoint);
  }

  /**
   * POST /tasks
   * Creates a new task.
   */
  public async createTask(dto: CreateTaskRequest): Promise<TaskDetails> {
    return this.request<TaskDetails>('/tasks', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  /**
   * POST /tasks/:id/transitions
   * Transitions task status with optimistic version check and domain invariant rules.
   */
  public async transitionTask(
    id: string,
    dto: TransitionTaskRequest,
    capabilities?: TransitionActorCapabilities,
  ): Promise<TaskDetails> {
    // Optional client-side domain guard
    if (capabilities) {
      const allowed = canTransitionTask(
        // caller can pass current status check or let server handle
        dto.targetStatus,
        dto.targetStatus,
        capabilities,
      );
      if (!allowed) {
        throw new ApiClientError({
          statusCode: 400,
          code: 'DOMAIN_TRANSITION_NOT_ALLOWED',
          message: 'انتقال وضعیت از لحاظ قوانین دامنه نامعتبر است',
        });
      }
    }

    return this.request<TaskDetails>(`/tasks/${id}/transitions`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  /**
   * GET /tickets
   * Returns support tickets, optionally filtered by accountId.
   */
  public async getTickets(accountId?: string): Promise<TicketDto[]> {
    const endpoint = accountId
      ? `/tickets?accountId=${encodeURIComponent(accountId)}`
      : '/tickets';
    return this.request<TicketDto[]>(endpoint);
  }

  /**
   * POST /tickets
   * Creates a new support ticket.
   */
  public async createTicket(dto: CreateTicketRequest): Promise<TicketDto> {
    return this.request<TicketDto>('/tickets', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  /**
   * POST /tickets/:id/messages
   * Appends a message/note to an existing ticket.
   */
  public async addTicketMessage(
    ticketId: string,
    dto: AddTicketMessageRequest,
  ): Promise<TicketMessageDto> {
    return this.request<TicketMessageDto>(`/tickets/${ticketId}/messages`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  /**
   * GET /crm/deals
   * Fetches sales pipeline deals.
   */
  public async getDeals(): Promise<DealDto[]> {
    return this.request<DealDto[]>('/crm/deals');
  }

  /**
   * PATCH /crm/deals/:id
   * Updates deal stage or attributes.
   */
  public async updateDeal(id: string, dto: UpdateDealDto): Promise<DealDto> {
    return this.request<DealDto>(`/crm/deals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  /**
   * POST /crm/deals/:id/lost
   * Marks a deal as lost with mandatory loss reason taxonomy.
   */
  public async markDealLost(id: string, dto: MarkDealLostRequest): Promise<DealDto> {
    return this.request<DealDto>(`/crm/deals/${id}/lost`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }
}

export const apiClient = new ApiClient();
