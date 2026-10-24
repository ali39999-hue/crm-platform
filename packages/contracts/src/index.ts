/** API-facing shared types only. Server authorization and validation remain server-owned. */
export type ApiError = {
  statusCode: number;
  code: string;
  message: string;
  requestId?: string;
  details?: Array<{ field?: string; reason: string }>;
};

export type PageQuery = {
  cursor?: string;
  limit?: number;
  sort?: string;
};

export type PageResult<T> = {
  items: T[];
  nextCursor: string | null;
};

export type TaskSummary = {
  id: string;
  key: string;
  title: string;
  status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'DONE' | 'CANCELED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeId: string | null;
  dueAt: string | null;
  updatedAt: string;
};
