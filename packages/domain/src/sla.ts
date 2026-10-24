export type SlaPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export const SLA_HOURS_TARGETS: Record<SlaPriority, number> = {
  URGENT: 4,
  HIGH: 8,
  NORMAL: 24,
  LOW: 48,
};

export type SlaClock = {
  ticketId: string;
  priority: SlaPriority;
  targetResolutionAt: Date;
  isPaused: boolean;
  pausedAt?: Date | null;
  totalPausedDurationMs: number;
};

/**
 * Calculates deadline based on business hours.
 * For MVP: default business hours 9am to 6pm (9 hours/day), excluding weekends (Friday in Iran, or Sat/Sun).
 */
export function calculateSlaDeadline(
  startDate: Date,
  priority: SlaPriority,
  weekendDays: number[] = [5], // 5 is Friday
): Date {
  const targetHours = SLA_HOURS_TARGETS[priority];
  const deadline = new Date(startDate.getTime());

  let addedHours = 0;
  while (addedHours < targetHours) {
    deadline.setTime(deadline.getTime() + 3600000); // add 1 hour
    const day = deadline.getDay();
    // skip weekends
    if (weekendDays.includes(day)) {
      continue;
    }
    addedHours += 1;
  }

  return deadline;
}

export function isSlaBreached(targetResolutionAt: Date, now: Date = new Date()): boolean {
  return now.getTime() > targetResolutionAt.getTime();
}
