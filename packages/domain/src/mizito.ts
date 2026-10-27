/**
 * Mizito (میزیتو) Specialized Domain Rules & Behavioral Engines
 * Including Office Automation Letters, Paraff Lock Rules, Task Weights & Approvers, and 5-Axis Monitoring
 */

export interface IndicatorOptions {
  year: number;
  secretariatCode: string;
  sequenceNumber: number;
}

/**
 * Generates official secretariat indicator tracking number (e.g. 1405/SEC/0042)
 */
export function generateIndicatorNumber(options: IndicatorOptions): string {
  const code = options.secretariatCode.trim().toUpperCase();
  const seq = String(options.sequenceNumber).padStart(4, '0');
  return `${options.year}/${code}/${seq}`;
}

export interface ActorContext {
  id: string;
  role: string;
}

export interface LetterContext {
  senderId: string;
  isRead: boolean;
}

/**
 * Mizito letter deletion rule:
 * Letter can only be deleted before being read, unless the author is a Workspace Admin/Owner.
 */
export function canDeleteLetter(actor: ActorContext, letter: LetterContext): boolean {
  if (actor.id !== letter.senderId) {
    return false;
  }
  const isAdmin = actor.role === 'ADMIN' || actor.role === 'OWNER';
  if (isAdmin) {
    return true;
  }
  return !letter.isRead;
}

export interface ParaffContext {
  authorId: string;
  isRead: boolean;
}

/**
 * Mizito paraff deletion rule:
 * Paraff can only be deleted by author before recipient reads it, unless the author is Admin/Owner.
 */
export function canDeleteParaff(actor: ActorContext, paraff: ParaffContext): boolean {
  if (actor.id !== paraff.authorId) {
    return false;
  }
  const isAdmin = actor.role === 'ADMIN' || actor.role === 'OWNER';
  if (isAdmin) {
    return true;
  }
  return !paraff.isRead;
}

export interface WeightedTaskItem {
  weight?: number | null;
  progressPercent?: number | null;
}

/**
 * Calculates weighted project progress according to task weight coefficients (1 to 5)
 * Formula: ∑(weight * progress) / ∑(weight)
 */
export function calculateWeightedProjectProgress(tasks: WeightedTaskItem[]): number {
  if (!tasks || tasks.length === 0) {
    return 0;
  }

  let totalWeight = 0;
  let totalWeightedPoints = 0;

  for (const task of tasks) {
    const weight = task.weight && task.weight > 0 ? task.weight : 1;
    const progress = Math.max(0, Math.min(100, task.progressPercent ?? 0));
    totalWeight += weight;
    totalWeightedPoints += weight * progress;
  }

  if (totalWeight === 0) {
    return 0;
  }

  return Math.round(totalWeightedPoints / totalWeight);
}

export interface TaskApprovalTransitionOptions {
  hasApprover: boolean;
  actorId: string;
  approverId?: string;
  currentStatus?: string;
  targetStatus: string;
}

export interface TaskApprovalTransitionResult {
  nextStatus: string;
  requiresApproval: boolean;
}

/**
 * Evaluates task status transition based on Mizito Task Approver role.
 * If task has an approver and a worker finishes it, status routes to 'AWAITING_APPROVAL'.
 */
export function evaluateTaskApprovalTransition(
  options: TaskApprovalTransitionOptions,
): TaskApprovalTransitionResult {
  if (!options.hasApprover) {
    return {
      nextStatus: options.targetStatus,
      requiresApproval: false,
    };
  }

  if (options.targetStatus === 'COMPLETED') {
    if (options.currentStatus === 'AWAITING_APPROVAL') {
      if (options.actorId === options.approverId) {
        return {
          nextStatus: 'COMPLETED',
          requiresApproval: false,
        };
      }
      return {
        nextStatus: 'AWAITING_APPROVAL',
        requiresApproval: true,
      };
    }

    if (options.actorId === options.approverId) {
      return {
        nextStatus: 'COMPLETED',
        requiresApproval: false,
      };
    }

    return {
      nextStatus: 'AWAITING_APPROVAL',
      requiresApproval: true,
    };
  }

  if (options.targetStatus === 'IN_PROGRESS') {
    return {
      nextStatus: 'IN_PROGRESS',
      requiresApproval: false,
    };
  }

  return {
    nextStatus: options.targetStatus,
    requiresApproval: false,
  };
}

export interface FiveAxisRawData {
  projects: { active: number; delayed: number; total: number };
  tasks: { completed: number; delayed: number; awaitingApproval: number; total: number };
  meetings: { held: number; signedResolutions: number; totalResolutions: number };
  customers: { activeInteractions: number; dormantCount: number };
  financials: { totalArrearsMinor: number; overdueChecksCount: number };
}

export interface FiveAxisMonitoringSummary {
  overallHealthScore: number;
  axes: {
    projects: { rate: number; delayedCount: number; activeCount: number };
    tasks: { onTimeRate: number; awaitingApprovalCount: number; delayedCount: number };
    meetings: { resolutionSignRate: number; heldCount: number };
    customers: { activeCount: number; dormantCount: number };
    financials: { totalArrearsMinor: number; overdueChecksCount: number; hasOverdueAlert: boolean };
  };
}

/**
 * Computes Mizito 5-Axis Executive Monitoring dashboard metrics and overall organization health score.
 */
export function calculate5AxisMonitoring(data: FiveAxisRawData): FiveAxisMonitoringSummary {
  const projectRate =
    data.projects.total > 0
      ? Math.round(((data.projects.total - data.projects.delayed) / data.projects.total) * 100)
      : 100;

  const taskOnTimeRate =
    data.tasks.total > 0
      ? Math.round(((data.tasks.total - data.tasks.delayed) / data.tasks.total) * 100)
      : 100;

  const resolutionSignRate =
    data.meetings.totalResolutions > 0
      ? Math.round((data.meetings.signedResolutions / data.meetings.totalResolutions) * 100)
      : 100;

  const hasOverdueAlert =
    data.financials.overdueChecksCount > 0 || data.financials.totalArrearsMinor > 0;

  const financialPenalty = hasOverdueAlert ? 15 : 0;
  const overallHealthScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        projectRate * 0.3 + taskOnTimeRate * 0.3 + resolutionSignRate * 0.2 + 20 - financialPenalty,
      ),
    ),
  );

  return {
    overallHealthScore,
    axes: {
      projects: {
        rate: projectRate,
        delayedCount: data.projects.delayed,
        activeCount: data.projects.active,
      },
      tasks: {
        onTimeRate: taskOnTimeRate,
        awaitingApprovalCount: data.tasks.awaitingApproval,
        delayedCount: data.tasks.delayed,
      },
      meetings: {
        resolutionSignRate,
        heldCount: data.meetings.held,
      },
      customers: {
        activeCount: data.customers.activeInteractions,
        dormantCount: data.customers.dormantCount,
      },
      financials: {
        totalArrearsMinor: data.financials.totalArrearsMinor,
        overdueChecksCount: data.financials.overdueChecksCount,
        hasOverdueAlert,
      },
    },
  };
}
