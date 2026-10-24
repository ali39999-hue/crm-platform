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
