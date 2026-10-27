import { describe, expect, it } from 'vitest';
import {
  generateIndicatorNumber,
  canDeleteLetter,
  canDeleteParaff,
  calculateWeightedProjectProgress,
  evaluateTaskApprovalTransition,
  calculate5AxisMonitoring,
} from './mizito.js';

describe('Mizito Office Automation & Letter Domain Rules', () => {
  it('generates standardized secretariat indicator number', () => {
    const indicator = generateIndicatorNumber({
      year: 1405,
      secretariatCode: 'SEC',
      sequenceNumber: 42,
    });
    expect(indicator).toBe('1405/SEC/0042');

    const customPadding = generateIndicatorNumber({
      year: 1404,
      secretariatCode: 'TECH',
      sequenceNumber: 1205,
    });
    expect(customPadding).toBe('1404/TECH/1205');
  });

  describe('Letter Deletion Authorization', () => {
    it('allows sender to delete unread letter', () => {
      const allowed = canDeleteLetter(
        { id: 'user-1', role: 'MEMBER' },
        { senderId: 'user-1', isRead: false },
      );
      expect(allowed).toBe(true);
    });

    it('rejects regular sender from deleting a letter once it is read', () => {
      const allowed = canDeleteLetter(
        { id: 'user-1', role: 'MEMBER' },
        { senderId: 'user-1', isRead: true },
      );
      expect(allowed).toBe(false);
    });

    it('allows workspace admin to delete their own letter even after it is read', () => {
      const allowed = canDeleteLetter(
        { id: 'admin-1', role: 'ADMIN' },
        { senderId: 'admin-1', isRead: true },
      );
      expect(allowed).toBe(true);
    });

    it('rejects non-sender from deleting another users letter', () => {
      const allowed = canDeleteLetter(
        { id: 'user-2', role: 'MEMBER' },
        { senderId: 'user-1', isRead: false },
      );
      expect(allowed).toBe(false);
    });
  });

  describe('Paraff Deletion Authorization', () => {
    it('allows author to delete unread paraff', () => {
      const allowed = canDeleteParaff(
        { id: 'user-1', role: 'MEMBER' },
        { authorId: 'user-1', isRead: false },
      );
      expect(allowed).toBe(true);
    });

    it('rejects author from deleting read paraff unless workspace admin', () => {
      const allowed = canDeleteParaff(
        { id: 'user-1', role: 'MEMBER' },
        { authorId: 'user-1', isRead: true },
      );
      expect(allowed).toBe(false);
    });

    it('allows workspace admin to delete their own paraff even if read', () => {
      const allowed = canDeleteParaff(
        { id: 'admin-1', role: 'ADMIN' },
        { authorId: 'admin-1', isRead: true },
      );
      expect(allowed).toBe(true);
    });
  });
});

describe('Mizito Task Weights & Weighted Progress Calculation', () => {
  it('returns 0 if there are no tasks', () => {
    const progress = calculateWeightedProjectProgress([]);
    expect(progress).toBe(0);
  });

  it('calculates weighted progress accurately based on task weight coefficients', () => {
    const tasks = [
      { weight: 1, progressPercent: 100 }, // weight * prog = 100
      { weight: 3, progressPercent: 50 },  // weight * prog = 150
      { weight: 2, progressPercent: 0 },   // weight * prog = 0
    ];
    // Total weight = 6. Total weighted points = 250.
    // Progress = 250 / 6 = 41.666... -> 42%
    const progress = calculateWeightedProjectProgress(tasks);
    expect(progress).toBe(42);
  });

  it('defaults missing weight to 1 and bounds progress between 0 and 100', () => {
    const tasks = [
      { progressPercent: 80 }, // weight defaults to 1 -> 80
      { weight: 1, progressPercent: 100 }, // 100
    ];
    // 180 / 2 = 90
    const progress = calculateWeightedProjectProgress(tasks);
    expect(progress).toBe(90);
  });
});

describe('Mizito Task Approver & Review Gate Lifecycle', () => {
  it('transitions directly to COMPLETED when no approver is assigned', () => {
    const result = evaluateTaskApprovalTransition({
      hasApprover: false,
      actorId: 'worker-1',
      targetStatus: 'COMPLETED',
    });
    expect(result.nextStatus).toBe('COMPLETED');
    expect(result.requiresApproval).toBe(false);
  });

  it('routes to AWAITING_APPROVAL when worker completes task with designated approver', () => {
    const result = evaluateTaskApprovalTransition({
      hasApprover: true,
      actorId: 'worker-1',
      approverId: 'supervisor-1',
      targetStatus: 'COMPLETED',
    });
    expect(result.nextStatus).toBe('AWAITING_APPROVAL');
    expect(result.requiresApproval).toBe(true);
  });

  it('allows designated approver to approve and advance to COMPLETED', () => {
    const result = evaluateTaskApprovalTransition({
      hasApprover: true,
      actorId: 'supervisor-1',
      approverId: 'supervisor-1',
      currentStatus: 'AWAITING_APPROVAL',
      targetStatus: 'COMPLETED',
    });
    expect(result.nextStatus).toBe('COMPLETED');
    expect(result.requiresApproval).toBe(false);
  });

  it('allows designated approver to reject back to IN_PROGRESS', () => {
    const result = evaluateTaskApprovalTransition({
      hasApprover: true,
      actorId: 'supervisor-1',
      approverId: 'supervisor-1',
      currentStatus: 'AWAITING_APPROVAL',
      targetStatus: 'IN_PROGRESS',
    });
    expect(result.nextStatus).toBe('IN_PROGRESS');
    expect(result.requiresApproval).toBe(false);
  });
});

describe('Mizito 5-Axis Executive Monitoring Calculation', () => {
  it('calculates 5-axis health score and categorizes metrics', () => {
    const summary = calculate5AxisMonitoring({
      projects: { active: 5, delayed: 1, total: 6 },
      tasks: { completed: 80, delayed: 10, awaitingApproval: 5, total: 95 },
      meetings: { held: 12, signedResolutions: 10, totalResolutions: 12 },
      customers: { activeInteractions: 45, dormantCount: 3 },
      financials: { totalArrearsMinor: 50000000, overdueChecksCount: 2 },
    });

    expect(summary.overallHealthScore).toBeGreaterThanOrEqual(0);
    expect(summary.overallHealthScore).toBeLessThanOrEqual(100);
    expect(summary.axes.projects.rate).toBeDefined();
    expect(summary.axes.tasks.onTimeRate).toBeDefined();
    expect(summary.axes.meetings.resolutionSignRate).toBeDefined();
    expect(summary.axes.financials.hasOverdueAlert).toBe(true);
  });
});
