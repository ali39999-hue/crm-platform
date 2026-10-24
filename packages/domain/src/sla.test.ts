import { describe, expect, it } from 'vitest';
import { calculateSlaDeadline, isSlaBreached, SLA_HOURS_TARGETS } from './sla.js';

describe('SLA calculation engine', () => {
  it('has valid target hours per priority', () => {
    expect(SLA_HOURS_TARGETS.URGENT).toBe(4);
    expect(SLA_HOURS_TARGETS.HIGH).toBe(8);
    expect(SLA_HOURS_TARGETS.NORMAL).toBe(24);
    expect(SLA_HOURS_TARGETS.LOW).toBe(48);
  });

  it('calculates urgent deadline correctly', () => {
    const start = new Date('2026-10-24T09:00:00Z'); // Saturday (work day)
    const deadline = calculateSlaDeadline(start, 'URGENT', [5]); // Friday weekend
    // 4 hours later
    expect(deadline.getTime() - start.getTime()).toBe(4 * 3600000);
  });

  it('detects when an SLA is breached', () => {
    const pastDeadline = new Date('2026-10-20T10:00:00Z');
    const now = new Date('2026-10-24T10:00:00Z');
    expect(isSlaBreached(pastDeadline, now)).toBe(true);

    const futureDeadline = new Date('2026-10-25T10:00:00Z');
    expect(isSlaBreached(futureDeadline, now)).toBe(false);
  });
});
