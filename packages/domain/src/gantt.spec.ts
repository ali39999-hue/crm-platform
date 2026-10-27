import { describe, expect, it } from 'vitest';
import {
  calculateGanttSchedule,
  type GanttInputTask,
} from './gantt.js';

describe('Gantt Chart & Critical Path Method (CPM) Domain Engine', () => {
  it('calculates earliest start and finish for sequential tasks', () => {
    const tasks: GanttInputTask[] = [
      { id: 'task-1', title: 'طراحی معماری', durationDays: 3, predecessorIds: [] },
      { id: 'task-2', title: 'پیاده‌سازی بک‌اند', durationDays: 4, predecessorIds: ['task-1'] },
      { id: 'task-3', title: 'تست یکپارچگی', durationDays: 2, predecessorIds: ['task-2'] },
    ];

    const result = calculateGanttSchedule({
      projectStartDate: '2026-11-01',
      tasks,
    });

    expect(result.hasCycle).toBe(false);
    expect(result.totalDurationDays).toBe(9); // 3 + 4 + 2 = 9
    expect(result.criticalPathIds).toEqual(['task-1', 'task-2', 'task-3']);

    const t1 = result.scheduledTasks.find((t) => t.id === 'task-1');
    const t2 = result.scheduledTasks.find((t) => t.id === 'task-2');
    const t3 = result.scheduledTasks.find((t) => t.id === 'task-3');

    expect(t1?.startOffsetDays).toBe(0);
    expect(t1?.finishOffsetDays).toBe(3);
    expect(t1?.isCritical).toBe(true);

    expect(t2?.startOffsetDays).toBe(3);
    expect(t2?.finishOffsetDays).toBe(7);
    expect(t2?.isCritical).toBe(true);

    expect(t3?.startOffsetDays).toBe(7);
    expect(t3?.finishOffsetDays).toBe(9);
    expect(t3?.isCritical).toBe(true);
  });

  it('accurately identifies Critical Path and Float/Slack time for parallel branches', () => {
    // Branch 1: task-1 (3d) -> task-2 (5d) -> task-4 (2d) [Total 10 days - CRITICAL]
    // Branch 2: task-1 (3d) -> task-3 (2d) -> task-4 (2d) [Total 7 days - Task 3 has 3 days slack]
    const tasks: GanttInputTask[] = [
      { id: 't1', title: 'تعیین نیازمندی‌ها', durationDays: 3, predecessorIds: [] },
      { id: 't2', title: 'ماژول پرداخت و چک صیادی', durationDays: 5, predecessorIds: ['t1'] },
      { id: 't3', title: 'طراحی بنر و لوگو', durationDays: 2, predecessorIds: ['t1'] },
      { id: 't4', title: 'تحویل و استقرار نهایی', durationDays: 2, predecessorIds: ['t2', 't3'] },
    ];

    const result = calculateGanttSchedule({
      projectStartDate: '2026-11-01',
      tasks,
    });

    expect(result.hasCycle).toBe(false);
    expect(result.totalDurationDays).toBe(10);
    expect(result.criticalPathIds).toContain('t1');
    expect(result.criticalPathIds).toContain('t2');
    expect(result.criticalPathIds).toContain('t4');
    expect(result.criticalPathIds).not.toContain('t3');

    const t3 = result.scheduledTasks.find((t) => t.id === 't3');
    expect(t3?.isCritical).toBe(false);
    expect(t3?.slackDays).toBe(3); // Float time is 3 days
  });

  it('detects circular dependencies and flags error gracefully without infinite loop', () => {
    const cyclicalTasks: GanttInputTask[] = [
      { id: 'a', title: 'کار الف', durationDays: 2, predecessorIds: ['b'] },
      { id: 'b', title: 'کار ب', durationDays: 3, predecessorIds: ['a'] },
    ];

    const result = calculateGanttSchedule({
      projectStartDate: '2026-11-01',
      tasks: cyclicalTasks,
    });

    expect(result.hasCycle).toBe(true);
    expect(result.errorMessage).toBeDefined();
  });

  it('handles milestones with 0 duration', () => {
    const tasks: GanttInputTask[] = [
      { id: 'm1', title: 'مایل‌استون شروع فاز آزمایشی', durationDays: 0, predecessorIds: [] },
      { id: 'dev', title: 'توسعه ماژول', durationDays: 5, predecessorIds: ['m1'] },
    ];

    const result = calculateGanttSchedule({
      projectStartDate: '2026-11-01',
      tasks,
    });

    const m1 = result.scheduledTasks.find((t) => t.id === 'm1');
    expect(m1?.isMilestone).toBe(true);
    expect(m1?.startOffsetDays).toBe(0);
    expect(m1?.finishOffsetDays).toBe(0);
  });
});
