/** API-facing shared types only. Server authorization and validation remain server-owned. */
export type ApiError = {
  statusCode: number;
  code: string;
  message: string;
  requestId?: string;
  details?: Array<{ field?: string; reason: string }>;
};

export type ApiResponse<T> = {
  data: T;
  meta?: {
    requestId?: string;
    timestamp?: string;
  };
};

export type PageQuery = {
  cursor?: string;
  limit?: number;
  sort?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
};

export type PageResult<T> = {
  items: T[];
  nextCursor: string | null;
  totalCount?: number;
};

export type TaskStatus =
  | 'BACKLOG'
  | 'TODO'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'BLOCKED'
  | 'DONE'
  | 'CANCELED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type RecordVisibility = 'INTERNAL' | 'CUSTOMER_SHARED';

export type TaskSummary = {
  id: string;
  key: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  visibility: RecordVisibility;
  assigneeId: string | null;
  assigneeName?: string | null;
  projectId: string | null;
  projectName?: string | null;
  dueAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type TaskDetails = TaskSummary & {
  description: string | null;
  creatorId: string;
  creatorName?: string;
  commentsCount: number;
  dependencies: string[];
};

export type CreateTaskRequest = {
  title: string;
  description?: string;
  priority?: TaskPriority;
  visibility?: RecordVisibility;
  projectId?: string;
  assigneeId?: string;
  dueAt?: string;
};

export type TransitionTaskRequest = {
  targetStatus: TaskStatus;
  expectedVersion: number;
  reason?: string;
};

export type CurrentUserDto = {
  id: string;
  email: string;
  displayName: string;
  activeOrganization: {
    id: string;
    name: string;
    slug: string;
    role: string;
  };
  memberships: Array<{
    organizationId: string;
    organizationName: string;
    role: string;
    active: boolean;
  }>;
};

export type WorkspaceDto = {
  id: string;
  name: string;
  slug: string;
  role: string;
  isCurrent: boolean;
};

/* CRM Contracts */

export type AccountDto = {
  id: string;
  name: string;
  type: string;
  status: string;
  website?: string | null;
  phone?: string | null;
  ownerId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateAccountRequest = {
  name: string;
  type?: string;
  website?: string;
  phone?: string;
  ownerId?: string;
};

export type ContactDto = {
  id: string;
  accountId?: string | null;
  accountName?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  ownerId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateContactRequest = {
  accountId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  ownerId?: string;
};

export type LeadDto = {
  id: string;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  status: 'NEW' | 'QUALIFIED' | 'DISQUALIFIED' | 'CONVERTED';
  ownerId?: string | null;
  accountId?: string | null;
  convertedContactId?: string | null;
  convertedDealId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateLeadRequest = {
  displayName: string;
  email?: string;
  phone?: string;
  source?: string;
  ownerId?: string;
};

export type ConvertLeadRequest = {
  idempotencyKey: string;
  accountName?: string;
  dealName?: string;
  dealAmountMinor?: number;
  dealCurrency?: string;
};

export type ConvertLeadResponse = {
  leadId: string;
  accountId: string;
  contactId: string;
  dealId?: string | null;
};

export type DealDto = {
  id: string;
  accountId?: string | null;
  name: string;
  stage: string;
  amountMinor?: number | null;
  currency?: string | null;
  probability?: number | null;
  targetCloseAt?: string | null;
  ownerId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateDealRequest = {
  accountId?: string;
  name: string;
  stage?: string;
  amountMinor?: number;
  currency?: string;
  probability?: number;
  targetCloseAt?: string;
  ownerId?: string;
};

export type CustomerTimelineItem = {
  id: string;
  entityType: 'LEAD' | 'ACCOUNT' | 'CONTACT' | 'DEAL' | 'TICKET';
  entityId: string;
  kind: string;
  summary: string;
  occurredAt: string;
  actorName?: string | null;
  metadata?: Record<string, any>;
};

/* Support & Ticketing Contracts */

export type TicketStatus =
  | 'NEW'
  | 'OPEN'
  | 'PENDING_CUSTOMER'
  | 'PENDING_INTERNAL'
  | 'RESOLVED'
  | 'CLOSED';

export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type TicketDto = {
  id: string;
  reference: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  accountId?: string | null;
  accountName?: string | null;
  assigneeId?: string | null;
  assigneeName?: string | null;
  targetResolutionAt?: string;
  messagesCount: number;
  createdAt: string;
  updatedAt: string;
};

export type TicketMessageDto = {
  id: string;
  ticketId: string;
  authorId?: string | null;
  authorName?: string | null;
  body: string;
  visibility: RecordVisibility;
  createdAt: string;
};

export type CreateTicketRequest = {
  title: string;
  description: string;
  priority?: TicketPriority;
  accountId?: string;
  assigneeId?: string;
};

export type AddTicketMessageRequest = {
  body: string;
  visibility?: RecordVisibility;
};
