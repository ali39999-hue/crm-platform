import { describe, expect, it } from 'vitest';
import { assertTaskTransition, canTransitionTask } from './task-transition.js';

const regular = { canReopenDoneTask: false, canRestoreCanceledTask: false };

describe('task state machine', () => {
  it('allows a normal forward transition', () => {
    expect(canTransitionTask('TODO', 'IN_PROGRESS', regular)).toBe(true);
  });

  it('rejects skipping review from IN_PROGRESS directly to DONE', () => {
    expect(canTransitionTask('IN_PROGRESS', 'DONE', regular)).toBe(false);
  });

  it('requires explicit capability to reopen a completed task', () => {
    expect(canTransitionTask('DONE', 'TODO', regular)).toBe(false);
    expect(canTransitionTask('DONE', 'TODO', { ...regular, canReopenDoneTask: true })).toBe(true);
  });

  it('throws for invalid transitions', () => {
    expect(() => assertTaskTransition('TODO', 'DONE', regular)).toThrow('Invalid task transition');
  });
});
