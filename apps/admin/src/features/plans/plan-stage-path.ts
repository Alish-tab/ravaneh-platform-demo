import type { A01StageKey } from '@/features/plans/a01-types';

/** Plan-scoped workspace routes. Stage key matches the path segment. */
export function planStagePath(planId: string, stage: A01StageKey): string {
  return `/plans/${planId}/${stage}`;
}

export const PLAN_WORKSPACE_STAGES: readonly A01StageKey[] = [
  'intake',
  'review',
  'planning',
  'execution',
];

export function isPlanWorkspaceStage(value: string | undefined): value is A01StageKey {
  return (
    value === 'intake' || value === 'review' || value === 'planning' || value === 'execution'
  );
}
