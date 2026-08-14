import type { A01PresentationStatus, A01StageKey } from '@/features/plans/a01-types';
import { A01_STAGE_LABELS, A01_STATUS_PRESENTATION } from '@/features/plans/presentation';
import { StatusBadge } from '@/shared/ui';

export function PlanStatusBadge({ status }: { status: A01PresentationStatus }) {
  const cfg = A01_STATUS_PRESENTATION[status];
  return <StatusBadge tone={cfg.tone} label={cfg.label} pulse={cfg.pulse} />;
}

export function StagePill({ stage }: { stage: A01StageKey }) {
  return <span className="a01-stage-pill">{A01_STAGE_LABELS[stage]}</span>;
}
