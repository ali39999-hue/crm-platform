/**
 * Interactive Enterprise Gantt Chart & Critical Path Method (CPM) Engine
 * Calculates Forward/Backward pass, Float/Slack days, and Critical Path sequence.
 */

export interface GanttInputTask {
  id: string;
  title: string;
  durationDays: number;
  predecessorIds?: string[] | undefined;
  weight?: number | undefined;
  progressPercent?: number | undefined;
  color?: string | undefined;
}

export interface GanttScheduledTask {
  id: string;
  title: string;
  durationDays: number;
  startOffsetDays: number;
  finishOffsetDays: number;
  startDateIso: string;
  finishDateIso: string;
  slackDays: number;
  isCritical: boolean;
  isMilestone: boolean;
  weight: number;
  progressPercent: number;
  predecessorIds: string[];
  color?: string | undefined;
}

export interface GanttScheduleResult {
  hasCycle: boolean;
  errorMessage?: string | undefined;
  totalDurationDays: number;
  projectStartDate: string;
  projectFinishDate: string;
  criticalPathIds: string[];
  scheduledTasks: GanttScheduledTask[];
}

export interface CalculateGanttScheduleOptions {
  projectStartDate: string; // ISO date string e.g. '2026-11-01'
  tasks: GanttInputTask[];
}

export function calculateGanttSchedule(options: CalculateGanttScheduleOptions): GanttScheduleResult {
  const { projectStartDate, tasks } = options;

  if (!tasks || tasks.length === 0) {
    return {
      hasCycle: false,
      totalDurationDays: 0,
      projectStartDate,
      projectFinishDate: projectStartDate,
      criticalPathIds: [],
      scheduledTasks: [],
    };
  }

  const taskMap = new Map<string, GanttInputTask>();
  const inDegree = new Map<string, number>();
  const successors = new Map<string, string[]>();
  const predecessors = new Map<string, string[]>();

  for (const t of tasks) {
    taskMap.set(t.id, t);
    inDegree.set(t.id, 0);
    successors.set(t.id, []);
    predecessors.set(t.id, []);
  }

  for (const t of tasks) {
    const preds = (t.predecessorIds || []).filter((pId) => taskMap.has(pId));
    predecessors.set(t.id, preds);
    inDegree.set(t.id, preds.length);

    for (const pId of preds) {
      successors.get(pId)!.push(t.id);
    }
  }

  // Topological sort (Kahn's algorithm)
  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }

  const topoOrder: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    topoOrder.push(current);

    for (const succ of successors.get(current)!) {
      const nextDeg = inDegree.get(succ)! - 1;
      inDegree.set(succ, nextDeg);
      if (nextDeg === 0) {
        queue.push(succ);
      }
    }
  }

  // Cycle check
  if (topoOrder.length < tasks.length) {
    return {
      hasCycle: true,
      errorMessage: 'چرخه وابستگی مستقیم یا غیرمستقیم در روابط پیش‌نیازی کشف شد',
      totalDurationDays: 0,
      projectStartDate,
      projectFinishDate: projectStartDate,
      criticalPathIds: [],
      scheduledTasks: [],
    };
  }

  // 1. Forward Pass: Earliest Start (ES) and Earliest Finish (EF)
  const es = new Map<string, number>();
  const ef = new Map<string, number>();

  for (const id of topoOrder) {
    const task = taskMap.get(id)!;
    const duration = Math.max(0, task.durationDays);
    const preds = predecessors.get(id)!;

    let start = 0;
    for (const pId of preds) {
      const pFinish = ef.get(pId) ?? 0;
      if (pFinish > start) start = pFinish;
    }

    es.set(id, start);
    ef.set(id, start + duration);
  }

  let totalDurationDays = 0;
  for (const finish of ef.values()) {
    if (finish > totalDurationDays) totalDurationDays = finish;
  }

  // 2. Backward Pass: Latest Start (LS) and Latest Finish (LF)
  const lf = new Map<string, number>();
  const ls = new Map<string, number>();

  for (let i = topoOrder.length - 1; i >= 0; i--) {
    const id = topoOrder[i]!;
    const task = taskMap.get(id)!;
    const duration = Math.max(0, task.durationDays);
    const succs = successors.get(id)!;

    let finish = totalDurationDays;
    if (succs.length > 0) {
      finish = Infinity;
      for (const sId of succs) {
        const sStart = ls.get(sId) ?? totalDurationDays;
        if (sStart < finish) finish = sStart;
      }
    }

    lf.set(id, finish);
    ls.set(id, finish - duration);
  }

  // 3. Compute Slack & Critical Path
  const baseDate = new Date(projectStartDate);
  const scheduledTasks: GanttScheduledTask[] = [];
  const criticalPathIds: string[] = [];

  for (const t of tasks) {
    const startOffset = es.get(t.id) ?? 0;
    const finishOffset = ef.get(t.id) ?? 0;
    const latestFinish = lf.get(t.id) ?? finishOffset;
    const slackDays = Math.max(0, latestFinish - finishOffset);
    const isCritical = slackDays === 0;

    if (isCritical) {
      criticalPathIds.push(t.id);
    }

    const startDate = new Date(baseDate.getTime() + startOffset * 86400000);
    const finishDate = new Date(baseDate.getTime() + finishOffset * 86400000);

    scheduledTasks.push({
      id: t.id,
      title: t.title,
      durationDays: t.durationDays,
      startOffsetDays: startOffset,
      finishOffsetDays: finishOffset,
      startDateIso: startDate.toISOString().split('T')[0]!,
      finishDateIso: finishDate.toISOString().split('T')[0]!,
      slackDays,
      isCritical,
      isMilestone: t.durationDays === 0,
      weight: t.weight && t.weight > 0 ? t.weight : 1,
      progressPercent: t.progressPercent ?? 0,
      predecessorIds: t.predecessorIds || [],
      color: t.color,
    });
  }

  const projectFinishDate = new Date(baseDate.getTime() + totalDurationDays * 86400000)
    .toISOString()
    .split('T')[0]!;

  return {
    hasCycle: false,
    totalDurationDays,
    projectStartDate,
    projectFinishDate,
    criticalPathIds,
    scheduledTasks,
  };
}
