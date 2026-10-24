import { describe, expect, it } from 'vitest';
import {
  areBlockingDependenciesResolved,
  assertNoCycle,
  wouldCreateCycle,
  type TaskDependencyEdge,
} from './task-dependency.js';

describe('Task Dependency DAG and Cycle Detection', () => {
  it('allows normal linear dependencies without cycles', () => {
    const edges: TaskDependencyEdge[] = [
      { taskId: 'task-A', dependsOnId: 'task-B' },
      { taskId: 'task-B', dependsOnId: 'task-C' },
    ];
    // Adding C -> D
    expect(wouldCreateCycle(edges, { taskId: 'task-C', dependsOnId: 'task-D' })).toBe(false);
  });

  it('allows diamond DAG graphs without cycles', () => {
    // Diamond DAG: A -> B, A -> C, B -> D, C -> D
    const edges: TaskDependencyEdge[] = [
      { taskId: 'task-A', dependsOnId: 'task-B' },
      { taskId: 'task-A', dependsOnId: 'task-C' },
      { taskId: 'task-B', dependsOnId: 'task-D' },
    ];
    expect(wouldCreateCycle(edges, { taskId: 'task-C', dependsOnId: 'task-D' })).toBe(false);
  });

  it('rejects direct self-dependency (A -> A)', () => {
    expect(wouldCreateCycle([], { taskId: 'task-A', dependsOnId: 'task-A' })).toBe(true);
    expect(() =>
      assertNoCycle([], { taskId: 'task-A', dependsOnId: 'task-A' }),
    ).toThrow('Circular dependency rejected');
  });

  it('rejects 2-node immediate cycle (A -> B, then B -> A)', () => {
    const edges: TaskDependencyEdge[] = [{ taskId: 'task-A', dependsOnId: 'task-B' }];
    expect(wouldCreateCycle(edges, { taskId: 'task-B', dependsOnId: 'task-A' })).toBe(true);
  });

  it('rejects multi-node indirect cycle (A -> B -> C -> D, then D -> A)', () => {
    const edges: TaskDependencyEdge[] = [
      { taskId: 'task-A', dependsOnId: 'task-B' },
      { taskId: 'task-B', dependsOnId: 'task-C' },
      { taskId: 'task-C', dependsOnId: 'task-D' },
    ];
    expect(wouldCreateCycle(edges, { taskId: 'task-D', dependsOnId: 'task-A' })).toBe(true);
  });

  it('verifies blocking dependencies resolution rule', () => {
    expect(
      areBlockingDependenciesResolved([
        { status: 'DONE' },
        { status: 'CANCELED' },
      ]),
    ).toBe(true);

    expect(
      areBlockingDependenciesResolved([
        { status: 'DONE' },
        { status: 'IN_PROGRESS' },
      ]),
    ).toBe(false);
  });
});
