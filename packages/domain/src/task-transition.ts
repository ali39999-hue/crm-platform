export const TASK_STATUSES = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'BLOCKED',
  'DONE',
  'CANCELED',
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export type TransitionActorCapabilities = {
  canReopenDoneTask: boolean;
  canRestoreCanceledTask: boolean;
};

const transitions: Record<TaskStatus, readonly TaskStatus[]> = {
  BACKLOG: ['TODO', 'CANCELED'],
  TODO: ['IN_PROGRESS', 'BLOCKED', 'CANCELED'],
  IN_PROGRESS: ['TODO', 'IN_REVIEW', 'BLOCKED', 'CANCELED'],
  IN_REVIEW: ['IN_PROGRESS', 'DONE', 'BLOCKED'],
  BLOCKED: ['TODO', 'IN_PROGRESS', 'CANCELED'],
  DONE: [],
  CANCELED: [],
};

/** Pure business rule. Authorization to perform privileged transitions is checked separately. */
export function canTransitionTask(
  from: TaskStatus,
  to: TaskStatus,
  actor: TransitionActorCapabilities,
): boolean {
  if (from === to) return false;
  if (from === 'DONE' && to === 'TODO') return actor.canReopenDoneTask;
  if (from === 'CANCELED' && to === 'TODO') return actor.canRestoreCanceledTask;
  return transitions[from].includes(to);
}

export function assertTaskTransition(
  from: TaskStatus,
  to: TaskStatus,
  actor: TransitionActorCapabilities,
): void {
  if (!canTransitionTask(from, to, actor)) {
    throw new Error(`Invalid task transition: ${from} -> ${to}`);
  }
}
