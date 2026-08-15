import { useCallback, useEffect, useRef, useState } from 'react';

import {
  areasAreGenerated,
  DEFAULT_GENERATION_TIMING,
  isGenerationBusy,
  type PlanningGenerationPhase,
  type PlanningGenerationTiming,
} from '@/features/planning/generation';

type UsePlanningGenerationOptions = {
  initialPhase?: PlanningGenerationPhase;
  initialTargetAreaCount?: number;
  /** When true, generation ends in failed (tests / demo). */
  simulateFail?: boolean;
  timing?: PlanningGenerationTiming;
};

/**
 * Fixture-local distribution area generation lifecycle.
 * Does not call an optimizer — only drives UI phase transitions.
 */
export function usePlanningGeneration({
  initialPhase = 'ready',
  initialTargetAreaCount = 3,
  simulateFail = false,
  timing = DEFAULT_GENERATION_TIMING,
}: UsePlanningGenerationOptions = {}) {
  const [phase, setPhase] = useState<PlanningGenerationPhase>(initialPhase);
  const [targetAreaCount, setTargetAreaCount] = useState(initialTargetAreaCount);
  const inFlightRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const simulateFailRef = useRef(simulateFail);
  simulateFailRef.current = simulateFail;

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const startGeneration = useCallback(() => {
    if (inFlightRef.current) return;
    if (phase !== 'ready' && phase !== 'failed') return;

    inFlightRef.current = true;
    clearTimers();
    setPhase('submitting');

    const toGenerating = window.setTimeout(() => {
      setPhase('generating');
    }, timing.submittingMs);

    const toComplete = window.setTimeout(() => {
      inFlightRef.current = false;
      setPhase(simulateFailRef.current ? 'failed' : 'generated');
    }, timing.completeMs);

    timersRef.current = [toGenerating, toComplete];
  }, [clearTimers, phase, timing.completeMs, timing.submittingMs]);

  return {
    phase,
    targetAreaCount,
    setTargetAreaCount,
    startGeneration,
    isBusy: isGenerationBusy(phase),
    areasGenerated: areasAreGenerated(phase),
  };
}
