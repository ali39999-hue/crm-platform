export type JobStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRYING'
  | 'CANCELLED';

export type JobPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export const JOB_PRIORITY_WEIGHT: Record<JobPriority, number> = {
  CRITICAL: 40,
  HIGH: 30,
  NORMAL: 20,
  LOW: 10,
};

export type KnownJobType =
  | 'SEND_EMAIL'
  | 'PROCESS_OUTBOX'
  | 'IMPORT_CSV_BATCH'
  | 'CALCULATE_METRICS'
  | 'WEBHOOK_RETRY';

export type JobType = KnownJobType | (string & {});

export interface JobRecord {
  id: string;
  organizationId: string;
  type: string;
  priority: JobPriority;
  payload: Record<string, any>;
  result: Record<string, any> | null;
  error: string | null;
  status: JobStatus;
  maxAttempts: number;
  attempts: number;
  runAt: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface JobStatsDto {
  total: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
  retrying: number;
  cancelled: number;
}

export interface EnqueueJobInput {
  id?: string | undefined;
  organizationId: string;
  type: string;
  priority?: JobPriority | undefined;
  payload?: Record<string, any> | undefined;
  maxAttempts?: number | undefined;
  runAt?: string | undefined;
}

export interface JobQueryFilter {
  organizationId?: string | undefined;
  status?: JobStatus | JobStatus[] | undefined;
  type?: string | undefined;
  priority?: JobPriority | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
  orderBy?: 'priority' | 'createdAt' | undefined;
  orderDirection?: 'asc' | 'desc' | undefined;
}

export type JobHandlerResult = Record<string, any> | void;
export type JobHandler = (job: JobRecord) => Promise<JobHandlerResult> | JobHandlerResult;

export class EnqueueJobDto {
  type!: string;
  priority?: JobPriority | undefined;
  payload?: Record<string, any> | undefined;
  maxAttempts?: number | undefined;
  runAt?: string | undefined;
}
