/**
 * Frontend-only distribution-area generation phases (designer OptPhase, product naming).
 */
export type PlanningGenerationPhase =
  | 'ready'
  | 'submitting'
  | 'generating'
  | 'generated'
  | 'failed';

export function isGenerationBusy(phase: PlanningGenerationPhase): boolean {
  return phase === 'submitting' || phase === 'generating';
}

export function areasAreGenerated(phase: PlanningGenerationPhase): boolean {
  return phase === 'generated';
}

/** Local demo timings — not network simulation. */
export type PlanningGenerationTiming = {
  submittingMs: number;
  /** Delay from start until generated/failed (includes submitting). */
  completeMs: number;
};

export const DEFAULT_GENERATION_TIMING: PlanningGenerationTiming = {
  submittingMs: 400,
  completeMs: 1200,
};
