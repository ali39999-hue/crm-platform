import type { TaskStatus } from './task-transition.js';

export type TaskDependencyEdge = {
  taskId: string;
  dependsOnId: string;
};

/**
 * Checks if adding an edge (taskId depends on dependsOnId) creates a circular dependency.
 * A cycle is formed if `dependsOnId` can already reach `taskId` through existing dependency chains,
 * or if a task depends directly on itself.
 */
export function wouldCreateCycle(
  existingEdges: TaskDependencyEdge[],
  newEdge: TaskDependencyEdge,
): boolean {
  // 1. Direct self-dependency
  if (newEdge.taskId === newEdge.dependsOnId) {
    return true;
  }

  // 2. Build adjacency list: target -> tasks that depend on it
  // If task A depends on B, edge is A -> B.
  // To check if B already depends on A (directly or indirectly), traverse paths from B.
  const adj = new Map<string, string[]>();
  for (const edge of existingEdges) {
    const list = adj.get(edge.taskId) ?? [];
    list.push(edge.dependsOnId);
    adj.set(edge.taskId, list);
  }

  // Add the candidate edge
  const candidateList = adj.get(newEdge.taskId) ?? [];
  candidateList.push(newEdge.dependsOnId);
  adj.set(newEdge.taskId, candidateList);

  // Traverse from dependsOnId using DFS to see if it can reach taskId
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(current: string): boolean {
    if (inStack.has(current)) return true;
    if (visited.has(current)) return false;

    visited.add(current);
    inStack.add(current);

    const neighbors = adj.get(current) ?? [];
    for (const neighbor of neighbors) {
      if (dfs(neighbor)) {
        return true;
      }
    }

    inStack.delete(current);
    return false;
  }

  // Run DFS from every node in the graph
  for (const node of adj.keys()) {
    if (!visited.has(node)) {
      if (dfs(node)) {
        return true;
      }
    }
  }

  return false;
}

export function assertNoCycle(
  existingEdges: TaskDependencyEdge[],
  newEdge: TaskDependencyEdge,
): void {
  if (wouldCreateCycle(existingEdges, newEdge)) {
    throw new Error(
      `Circular dependency rejected: Task ${newEdge.taskId} cannot depend on ${newEdge.dependsOnId}`,
    );
  }
}

/**
 * Rule: A task cannot be marked as DONE if any blocking dependency is not yet completed.
 */
export function areBlockingDependenciesResolved(
  dependencies: Array<{ status: TaskStatus }>,
): boolean {
  return dependencies.every((dep) => dep.status === 'DONE' || dep.status === 'CANCELED');
}
