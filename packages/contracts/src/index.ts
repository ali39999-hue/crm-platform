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

/* Auth Contracts */

export type LoginRequest = {
  email: string;
  password?: string;
};
export type LoginRequestDto = LoginRequest;

export type RefreshTokenRequest = {
  refreshToken: string;
};
export type RefreshTokenRequestDto = RefreshTokenRequest;

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType?: string;
  user: CurrentUserDto;
};
export type AuthResponseDto = AuthResponse;

export type SwitchWorkspaceRequest = {
  organizationId: string;
};
export type SwitchWorkspaceRequestDto = SwitchWorkspaceRequest;

export type LogoutRequest = {
  refreshToken?: string;
};
export type LogoutRequestDto = LogoutRequest;

export type LogoutResponse = {
  success: boolean;
  message: string;
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
  products?: DealProductItemDto[] | undefined;
  lossReason?: string | null | undefined;
  lossDescription?: string | null | undefined;
  lostAt?: string | null | undefined;
  nextActionTitle?: string | null | undefined;
  nextActionDueAt?: string | null | undefined;
  isRotting?: boolean | undefined;
  daysInCurrentStage?: number | undefined;
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
  nextActionTitle?: string;
  nextActionDueAt?: string;
  products?: DealProductItemDto[];
};

export type UpdateDealRequest = {
  accountId?: string;
  name?: string;
  stage?: string;
  amountMinor?: number;
  currency?: string;
  probability?: number;
  targetCloseAt?: string;
  ownerId?: string;
  lossReason?: string | null;
  lossDescription?: string | null;
  nextActionTitle?: string | null;
  nextActionDueAt?: string | null;
  products?: DealProductItemDto[];
};
export type UpdateDealDto = UpdateDealRequest;

/* Didar CRM-Inspired: Line Items, Invoicing, Loss Reasons, and Rotting */

export type VoipCallStatus = 'RINGING' | 'ANSWERED' | 'MISSED' | 'ENDED';
export type VoipCallDirection = 'INBOUND' | 'OUTBOUND';

export type VoipCallEventDto = {
  callId: string;
  callerNumber: string;
  calleeNumber: string;
  direction: VoipCallDirection;
  status: VoipCallStatus;
  durationSeconds?: number | undefined;
  recordingUrl?: string | undefined;
  timestamp: string;
};

export type VoipCallerProfileDto = {
  callId: string;
  callerNumber: string;
  matchedContact?: { id: string; name: string; email?: string | undefined } | null | undefined;
  matchedAccount?: { id: string; name: string } | null | undefined;
  recentDeals?: Array<{ id: string; name: string; amountMinor: number; stage: string }> | undefined;
  recentTickets?: Array<{ id: string; subject: string; status: string }> | undefined;
  isExistingCustomer: boolean;
};

export type ClickToCallRequest = {
  phoneNumber: string;
  extension: string;
  contactId?: string | undefined;
};

export type CheckStatus = 'PENDING' | 'CLEARED' | 'BOUNCED';

export type CheckItemDto = {
  id: string;
  checkNumber: string;
  sayadiNumber?: string | undefined;
  bankName: string;
  branchName?: string | undefined;
  amountMinor: number;
  dueDate: string;
  status: CheckStatus;
  drawerName: string;
  reminderSent: boolean;
};

export type InstallmentPlanDto = {
  id: string;
  dealId: string;
  totalAmountMinor: number;
  downPaymentMinor: number;
  installmentsCount: number;
  checks: CheckItemDto[];
  createdAt: string;
};

export type CreateInstallmentPlanRequest = {
  dealId: string;
  downPaymentMinor: number;
  installmentsCount: number;
  checks: Array<Omit<CheckItemDto, 'id' | 'reminderSent'>>;
};

export type DealLossReasonType =
  | 'PRICE_TOO_HIGH'
  | 'COMPETITOR_WON'
  | 'FEATURE_GAP'
  | 'BUDGET_CANCELED'
  | 'CLIENT_UNRESPONSIVE'
  | 'OTHER';

export type MarkDealLostRequest = {
  lossReason: DealLossReasonType;
  lossDescription?: string | undefined;
};

export type ProductCatalogItemDto = {
  id: string;
  organizationId: string;
  sku: string;
  name: string;
  unit: string;
  unitPriceMinor: number;
  currency: string;
  taxRatePercent: number; // e.g. 10% VAT in Iran
  active: boolean;
};

export type DealProductItemDto = {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceMinor: number;
  discountPercent?: number | undefined;
  taxRatePercent?: number | undefined;
  totalPriceMinor: number;
};

export type ProformaInvoiceDto = {
  id: string;
  organizationId: string;
  dealId: string;
  invoiceNumber: string;
  accountName: string;
  subtotalMinor: number;
  discountTotalMinor: number;
  taxTotalMinor: number;
  finalTotalMinor: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  items: DealProductItemDto[];
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';
  createdAt: string;
};

export type CreateInvoiceRequest = {
  dealId: string;
  dueDate?: string | undefined;
  items: DealProductItemDto[];
  currency?: string | undefined;
};

export type SalesTargetDto = {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  period: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  targetAmountMinor: number;
  achievedAmountMinor: number;
  achievementPercent: number;
  year: number;
  month?: number | undefined;
};

export type SalesLossAnalyticsDto = {
  totalLostDealsCount: number;
  totalLostAmountMinor: number;
  breakdownByReason: Array<{
    reason: DealLossReasonType;
    label: string;
    count: number;
    amountMinor: number;
    percentage: number;
  }>;
};

export type PipelineStageDto = {
  id: string;
  organizationId: string;
  name: string;
  key: string;
  order: number;
  defaultProbability: number;
  isWon: boolean;
  isLost: boolean;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePipelineStageRequest = {
  name: string;
  key: string;
  order?: number;
  defaultProbability?: number;
  isWon?: boolean;
  isLost?: boolean;
  color?: string;
};

export type UpdatePipelineStageRequest = {
  name?: string;
  key?: string;
  order?: number;
  defaultProbability?: number;
  isWon?: boolean;
  isLost?: boolean;
  color?: string;
};

export type ReorderPipelineStagesRequest = {
  stageIds: string[];
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

/* Notification Contracts */

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_STATUS_CHANGED'
  | 'TICKET_REPLIED'
  | 'LEAD_CONVERTED'
  | 'SYSTEM_ALERT';

export type NotificationDto = {
  id: string;
  type: NotificationType | string;
  title: string;
  message: string;
  readAt: string | null;
  dedupeKey?: string | null;
  createdAt: string;
  metadata?: Record<string, any>;
};

export type NotificationPreferencesDto = {
  inApp: boolean;
  email: boolean;
  push: boolean;
  digest: boolean;
  sms?: boolean | undefined;
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
    timeZone?: string | undefined;
  } | undefined;
};

export type DeadLetterStatus = 'PENDING_RETRY' | 'FAILED' | 'RESOLVED';

export type DeadLetterNotificationDto = {
  id: string;
  organizationId: string;
  userId: string;
  channel: string;
  recipient: string;
  title: string;
  message: string;
  payload?: Record<string, any> | undefined;
  dedupeKey?: string | null | undefined;
  retryCount: number;
  maxRetries: number;
  lastError: string;
  status: DeadLetterStatus;
  createdAt: string;
  failedAt: string;
  resolvedAt?: string | null | undefined;
};

/* Reporting & Analytics Contracts */

export type WorkloadReportItem = {
  userId: string;
  userName: string;
  activeTasksCount: number;
  overdueTasksCount: number;
  completedTasksCount: number;
};

export type CrmFunnelReport = {
  totalLeads: number;
  convertedLeads: number;
  conversionRatePercent: number;
  totalDealsValue: number;
  weightedPipelineValue: number;
  stagesBreakdown: Array<{
    stage: string;
    count: number;
    amount: number;
  }>;
};

export type SupportSlaReport = {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  slaBreachRatePercent: number;
  averageResolutionHours: number;
};

export type DashboardKpiReport = {
  workload: WorkloadReportItem[];
  crmFunnel: CrmFunnelReport;
  supportSla: SupportSlaReport;
  generatedAt: string;
};

/* Automation Contracts */

export type AutomationTrigger =
  | 'TASK_CREATED'
  | 'TASK_STATUS_CHANGED'
  | 'LEAD_CREATED'
  | 'LEAD_CONVERTED'
  | 'TICKET_CREATED';

export type AutomationActionType =
  | 'SEND_NOTIFICATION'
  | 'ASSIGN_USER'
  | 'CHANGE_STATUS'
  | 'WEBHOOK_POST';

export type AutomationRuleDto = {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  conditionField?: string | null;
  conditionValue?: string | null;
  actionType: AutomationActionType;
  actionPayload: Record<string, any>;
  enabled: boolean;
  executionCount: number;
  lastExecutedAt?: string | null;
};

export type CreateAutomationRuleRequest = {
  name: string;
  trigger: AutomationTrigger;
  conditionField?: string | undefined;
  conditionValue?: string | undefined;
  actionType: AutomationActionType;
  actionPayload: Record<string, any>;
  enabled?: boolean | undefined;
};

export type AutomationRunDto = {
  id: string;
  organizationId: string;
  ruleId: string;
  ruleName: string;
  trigger: AutomationTrigger;
  status: 'SUCCESS' | 'SKIPPED' | 'FAILED';
  executedAction: AutomationActionType;
  actionDetails: string;
  payloadSummary: string;
  executedAt: string;
  durationMs: number;
};

export type SimulateAutomationRequest = {
  testPayload: Record<string, any>;
};

export type SimulateAutomationResponse = {
  matched: boolean;
  wouldExecute: string;
  details: {
    conditionField?: string | null | undefined;
    conditionValue?: string | null | undefined;
    payloadValue?: any;
    operator?: string | undefined;
  };
};

/* Global Search Contracts */

export type SearchEntityType = 'TASK' | 'ACCOUNT' | 'CONTACT' | 'LEAD' | 'TICKET';

export type SearchResultItem = {
  id: string;
  entityType: 'TASK' | 'ACCOUNT' | 'CONTACT' | 'LEAD' | 'TICKET';
  title: string;
  subtitle?: string | null;
  status?: string | null;
  url: string;
  createdAt: string;
};

export type SearchResultDto = {
  query: string;
  totalHits: number;
  items: SearchResultItem[];
};

export type SearchQueryDto = {
  q: string;
  entityTypes?: string[];
  limit?: number;
};

/* Files & Attachments Contracts */

export type FileScanStatus = 'PENDING_SCAN' | 'VERIFIED' | 'REJECTED';
export type FileVisibility = 'INTERNAL' | 'CUSTOMER_SHARED';

export type FileDto = {
  id: string;
  organizationId: string;
  uploaderId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  visibility: FileVisibility;
  status: FileScanStatus;
  storageKey: string;
  scanDetails?: string | null;
  associatedEntityType?: string | null;
  associatedEntityId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UploadIntentRequest = {
  fileName: string;
  fileSize: number;
  mimeType: string;
  visibility?: FileVisibility;
  associatedEntityType?: string;
  associatedEntityId?: string;
};

export type UploadIntentResponse = {
  file: FileDto;
  uploadUrl: string;
  uploadToken: string;
  expiresAt: string;
};

export type SignedDownloadResponse = {
  fileId: string;
  fileName: string;
  downloadUrl: string;
  downloadToken: string;
  expiresAt: string;
};

export type VerifyFileScanRequest = {
  status: 'VERIFIED' | 'REJECTED';
  scanDetails?: string;
};

/* Saved Views Contracts */

export type SavedViewEntityType = 'TASK' | 'ACCOUNT' | 'CONTACT' | 'LEAD' | 'TICKET';

export type SavedViewDto = {
  id: string;
  organizationId: string;
  entityType: 'TASK' | 'ACCOUNT' | 'CONTACT' | 'LEAD' | 'TICKET';
  name: string;
  filters: Record<string, any>;
  sortField?: string | undefined;
  sortOrder?: 'ASC' | 'DESC' | undefined;
  isShared: boolean;
  createdBy: string;
  createdAt: string;
  isDefault?: boolean | undefined;
  updatedAt?: string | undefined;
};

export type CreateSavedViewRequest = {
  entityType: 'TASK' | 'ACCOUNT' | 'CONTACT' | 'LEAD' | 'TICKET';
  name: string;
  filters: Record<string, any>;
  sortField?: string | undefined;
  sortOrder?: 'ASC' | 'DESC' | undefined;
  isShared?: boolean | undefined;
  isDefault?: boolean | undefined;
};

export type UpdateSavedViewRequest = {
  name?: string | undefined;
  filters?: Record<string, any> | undefined;
  sortField?: string | undefined;
  sortOrder?: 'ASC' | 'DESC' | undefined;
  isShared?: boolean | undefined;
  isDefault?: boolean | undefined;
};

/* Enterprise Documents & Knowledge Base Contracts */

export type DocumentVisibility = 'PRIVATE' | 'TEAM' | 'WORKSPACE' | 'CUSTOMER_VISIBLE';

export type DocumentSpaceDto = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string | undefined;
  icon?: string | undefined;
  isDefault?: boolean | undefined;
  createdAt: string;
  updatedAt: string;
};

export type CreateDocumentSpaceRequest = {
  name: string;
  description?: string | undefined;
  icon?: string | undefined;
};

export type DocumentSummaryDto = {
  id: string;
  organizationId: string;
  spaceId: string;
  spaceName?: string | undefined;
  title: string;
  slug: string;
  visibility: DocumentVisibility;
  isPublished: boolean;
  authorId: string;
  authorName: string;
  version: number;
  tags: string[];
  associatedEntityType?: string | undefined;
  associatedEntityId?: string | undefined;
  createdAt: string;
  updatedAt: string;
};

export type DocumentRevisionDto = {
  id: string;
  documentId: string;
  version: number;
  title: string;
  content: string;
  summaryChange?: string | undefined;
  authorId: string;
  authorName: string;
  createdAt: string;
};

export type DocumentDetailDto = DocumentSummaryDto & {
  content: string;
  revisions?: DocumentRevisionDto[] | undefined;
};

export type CreateDocumentRequest = {
  spaceId: string;
  title: string;
  content: string;
  visibility: DocumentVisibility;
  isPublished?: boolean | undefined;
  tags?: string[] | undefined;
  associatedEntityType?: string | undefined;
  associatedEntityId?: string | undefined;
};

export type UpdateDocumentRequest = {
  title?: string | undefined;
  content?: string | undefined;
  visibility?: DocumentVisibility | undefined;
  isPublished?: boolean | undefined;
  tags?: string[] | undefined;
  summaryChange?: string | undefined;
  expectedVersion?: number | undefined;
  associatedEntityType?: string | undefined;
  associatedEntityId?: string | undefined;
};

export type RestoreDocumentRevisionRequest = {
  revisionVersion: number;
  summaryChange?: string | undefined;
};

/* Enterprise Activities & Calendar Scheduling Contracts */

export type ActivityType = 'MEETING' | 'CALL' | 'EMAIL' | 'NOTE' | 'REMINDER';
export type ActivityStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export type ActivityDto = {
  id: string;
  organizationId: string;
  type: ActivityType;
  title: string;
  description?: string | undefined;
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  status: ActivityStatus;
  ownerId: string;
  ownerName: string;
  participantIds: string[];
  associatedEntityType?: string | undefined;
  associatedEntityId?: string | undefined;
  associatedEntityTitle?: string | undefined;
  visibility: 'INTERNAL' | 'CUSTOMER_SHARED';
  reminderMinutesBefore?: number | undefined;
  createdAt: string;
  updatedAt: string;
};

export type CreateActivityRequest = {
  type: ActivityType;
  title: string;
  description?: string | undefined;
  startsAt: string;
  endsAt?: string | undefined;
  isAllDay?: boolean | undefined;
  associatedEntityType?: string | undefined;
  associatedEntityId?: string | undefined;
  associatedEntityTitle?: string | undefined;
  participantIds?: string[] | undefined;
  visibility?: 'INTERNAL' | 'CUSTOMER_SHARED' | undefined;
  reminderMinutesBefore?: number | undefined;
};

export type UpdateActivityRequest = {
  title?: string | undefined;
  description?: string | undefined;
  startsAt?: string | undefined;
  endsAt?: string | undefined;
  isAllDay?: boolean | undefined;
  status?: ActivityStatus | undefined;
  associatedEntityType?: string | undefined;
  associatedEntityId?: string | undefined;
  associatedEntityTitle?: string | undefined;
  participantIds?: string[] | undefined;
  visibility?: 'INTERNAL' | 'CUSTOMER_SHARED' | undefined;
  reminderMinutesBefore?: number | undefined;
};

export type CalendarConflictDto = {
  hasConflict: boolean;
  conflictingActivities: ActivityDto[];
};

/* Enterprise Organization Settings & Member Management Contracts */

export type OrganizationSettingsDto = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  locale: string;
  branding?: {
    logoUrl?: string | undefined;
    primaryColor?: string | undefined;
  } | undefined;
  retentionPolicy?: {
    auditLogsDays: number;
    tempFilesDays: number;
  } | undefined;
  updatedAt: string;
};

export type UpdateOrganizationSettingsRequest = {
  name?: string | undefined;
  timezone?: string | undefined;
  locale?: string | undefined;
  branding?: {
    logoUrl?: string | undefined;
    primaryColor?: string | undefined;
  } | undefined;
  retentionPolicy?: {
    auditLogsDays?: number | undefined;
    tempFilesDays?: number | undefined;
  } | undefined;
};

export type OrganizationMemberDto = {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: string;
  active: boolean;
  joinedAt: string;
};

export type InviteMemberRequest = {
  email: string;
  displayName: string;
  role: string;
};

export type UpdateMemberRoleRequest = {
  role: string;
};

/* Enterprise Analytics & Custom Reporting Contracts */

export type AnalyticsTimeframe = 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';

export type CustomReportQueryDto = {
  metric: 'LEADS' | 'DEALS' | 'TASKS' | 'TICKETS';
  groupBy?: 'STATUS' | 'ASSIGNEE' | 'STAGE' | 'PRIORITY' | undefined;
  timeframe?: AnalyticsTimeframe | undefined;
};

export type ReportGroupBreakdown = {
  key: string;
  label: string;
  count: number;
  value?: number | undefined;
  percentage: number;
};

export type CustomReportResultDto = {
  metric: string;
  groupBy: string;
  timeframe: AnalyticsTimeframe;
  totalCount: number;
  totalValue?: number | undefined;
  groups: ReportGroupBreakdown[];
  generatedAt: string;
};

/* Duplicate Resolution & Merge Contracts */

export type DuplicateCandidateDto = {
  id: string;
  entityType: 'ACCOUNT' | 'CONTACT' | 'LEAD';
  primaryRecord: {
    id: string;
    title: string;
    email?: string | undefined;
    phone?: string | undefined;
  };
  duplicateRecord: {
    id: string;
    title: string;
    email?: string | undefined;
    phone?: string | undefined;
  };
  matchReason: string;
  confidenceScore: number;
};

export type MergeRecordsRequest = {
  entityType: 'ACCOUNT' | 'CONTACT' | 'LEAD';
  targetRecordId: string;
  sourceRecordId: string;
};

/* Enterprise Custom Fields & Dynamic Schema Contracts */

export type CustomFieldType = 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'SELECT' | 'DATE';
export type CustomFieldEntityType = 'ACCOUNT' | 'CONTACT' | 'LEAD' | 'DEAL' | 'TASK' | 'TICKET';

export type CustomFieldDefinitionDto = {
  id: string;
  organizationId: string;
  entityType: CustomFieldEntityType;
  key: string;
  label: string;
  type: CustomFieldType;
  options?: string[] | undefined;
  isRequired: boolean;
  defaultValue?: any;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateCustomFieldRequest = {
  entityType: CustomFieldEntityType;
  key: string;
  label: string;
  type: CustomFieldType;
  options?: string[] | undefined;
  isRequired?: boolean | undefined;
  defaultValue?: any;
  order?: number | undefined;
};

export type UpdateCustomFieldRequest = {
  label?: string | undefined;
  options?: string[] | undefined;
  isRequired?: boolean | undefined;
  defaultValue?: any;
  order?: number | undefined;
  active?: boolean | undefined;
};

export type ValidateCustomFieldsRequest = {
  entityType: CustomFieldEntityType;
  values: Record<string, any>;
};

export type ValidateCustomFieldsResponse = {
  isValid: boolean;
  errors: Array<{ fieldKey: string; message: string }>;
};

/* Enterprise Projects & Milestones Contracts */

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type ProjectHealth = 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK';

export type MilestoneDto = {
  id: string;
  projectId: string;
  title: string;
  dueDate: string;
  isCompleted: boolean;
  createdAt: string;
};

export type ProjectSummaryDto = {
  id: string;
  organizationId: string;
  key: string;
  name: string;
  description?: string | undefined;
  status: ProjectStatus;
  health: ProjectHealth;
  ownerId: string;
  ownerName: string;
  startDate?: string | undefined;
  targetDate?: string | undefined;
  progressPercent: number;
  tasksCount: number;
  completedTasksCount: number;
  milestonesCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectDetailDto = ProjectSummaryDto & {
  milestones: MilestoneDto[];
  associatedAccountId?: string | undefined;
  associatedAccountName?: string | undefined;
};

export type CreateProjectRequest = {
  key: string;
  name: string;
  description?: string | undefined;
  status?: ProjectStatus | undefined;
  health?: ProjectHealth | undefined;
  startDate?: string | undefined;
  targetDate?: string | undefined;
  associatedAccountId?: string | undefined;
};

export type UpdateProjectRequest = {
  name?: string | undefined;
  description?: string | undefined;
  status?: ProjectStatus | undefined;
  health?: ProjectHealth | undefined;
  startDate?: string | undefined;
  targetDate?: string | undefined;
  ownerId?: string | undefined;
};

export type CreateMilestoneRequest = {
  title: string;
  dueDate: string;
  isCompleted?: boolean | undefined;
};

/* Enterprise Time Tracking & Work Logs Contracts */

export type WorkLogEntityType = 'TASK' | 'PROJECT' | 'TICKET';

export type WorkLogDto = {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  entityType: WorkLogEntityType;
  entityId: string;
  entityTitle: string;
  durationMinutes: number;
  description: string;
  isBillable: boolean;
  loggedDate: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateWorkLogRequest = {
  entityType: WorkLogEntityType;
  entityId: string;
  entityTitle: string;
  durationMinutes: number;
  description: string;
  isBillable?: boolean | undefined;
  loggedDate?: string | undefined;
};

export type UpdateWorkLogRequest = {
  durationMinutes?: number | undefined;
  description?: string | undefined;
  isBillable?: boolean | undefined;
  loggedDate?: string | undefined;
};

export type WorkLogSummaryDto = {
  totalMinutes: number;
  totalHours: number;
  billableHours: number;
  entriesCount: number;
  dailyBreakdown: Array<{
    date: string;
    minutes: number;
    hours: number;
  }>;
};

/* Enterprise Support Macros & Canned Responses Contracts */

export type SupportMacroDto = {
  id: string;
  organizationId: string;
  title: string;
  shortcut: string;
  category: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateSupportMacroRequest = {
  title: string;
  shortcut: string;
  category: string;
  content: string;
  tags?: string[] | undefined;
};

export type UpdateSupportMacroRequest = {
  title?: string | undefined;
  shortcut?: string | undefined;
  category?: string | undefined;
  content?: string | undefined;
  tags?: string[] | undefined;
};

export type AssignTicketRequest = {
  assigneeId?: string | undefined;
  status?: TicketStatus | undefined;
};

/* Enterprise Team Mentions & Collaboration Contracts */

export type MentionEntityType = 'TASK' | 'TICKET' | 'DOCUMENT' | 'DEAL';

export type MentionDto = {
  id: string;
  organizationId: string;
  sourceEntityType: MentionEntityType;
  sourceEntityId: string;
  sourceTitle: string;
  authorId: string;
  authorName: string;
  recipientId: string;
  recipientName: string;
  contextSnippet: string;
  readAt?: string | null | undefined;
  createdAt: string;
};

export type CreateMentionRequest = {
  sourceEntityType: MentionEntityType;
  sourceEntityId: string;
  sourceTitle: string;
  recipientId: string;
  contextSnippet: string;
};

/* Enterprise API Keys & Integration Providers Contracts */

export type ApiKeyDto = {
  id: string;
  organizationId: string;
  name: string;
  keyPrefix: string;
  secretKey?: string | undefined; // Only returned on creation
  scopes: string[];
  lastUsedAt?: string | null | undefined;
  expiresAt?: string | null | undefined;
  active: boolean;
  createdAt: string;
};

export type CreateApiKeyRequest = {
  name: string;
  scopes?: string[] | undefined;
  expiresInDays?: number | undefined;
};

export type IntegrationProviderKey =
  | 'SLACK'
  | 'GITHUB'
  | 'SMS_KAVENEGAR'
  | 'EMAIL_SMTP'
  | 'ZAPPER';

export type IntegrationStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR';

export type IntegrationProviderDto = {
  id: string;
  organizationId: string;
  providerKey: IntegrationProviderKey;
  name: string;
  description: string;
  icon: string;
  status: IntegrationStatus;
  configSummary?: Record<string, string> | undefined;
  lastSyncedAt?: string | null | undefined;
  errorMessage?: string | null | undefined;
  updatedAt: string;
};

export type ConnectIntegrationRequest = {
  providerKey: IntegrationProviderKey;
  credentials: Record<string, string>;
};

/* Enterprise Team & Department Management Contracts */

export type TeamDto = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string | undefined;
  leadMemberId?: string | undefined;
  leadMemberName?: string | undefined;
  memberIds: string[];
  membersCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateTeamRequest = {
  name: string;
  description?: string | undefined;
  leadMemberId?: string | undefined;
  memberIds?: string[] | undefined;
};

export type UpdateTeamRequest = {
  name?: string | undefined;
  description?: string | undefined;
  leadMemberId?: string | undefined;
  memberIds?: string[] | undefined;
};

export type AddTeamMemberRequest = {
  memberId: string;
};

/* Enterprise Audit Log Contracts */

export type AuditRecordDto = {
  id: string;
  organizationId: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  requestId?: string | undefined;
  metadata?: Record<string, any> | undefined;
  createdAt: string;
};



