import type { ReactNode } from 'react';

/**
 * Visual status tones from Design Foundation.
 * Not domain enums — map real Backend states onto these later.
 */
export type StatusTone = 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'accent';

type StatusBadgeProps = {
  tone?: StatusTone;
  label: ReactNode;
  pulse?: boolean;
  dotColor?: string;
};

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: 'badge badge-neutral',
  success: 'badge badge-success',
  warning: 'badge badge-warning',
  error: 'badge badge-error',
  info: 'badge badge-info',
  accent: 'badge badge-accent',
};

const TONE_DOT: Record<StatusTone, string> = {
  neutral: 'var(--text-muted)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  error: 'var(--error)',
  info: 'var(--info)',
  accent: 'var(--accent)',
};

export function StatusBadge({
  tone = 'neutral',
  label,
  pulse = false,
  dotColor,
}: StatusBadgeProps) {
  return (
    <span className={TONE_CLASS[tone]}>
      <span
        className={['badge-dot', pulse ? 'pulse' : ''].filter(Boolean).join(' ')}
        style={{ backgroundColor: dotColor ?? TONE_DOT[tone] }}
        aria-hidden
      />
      {label}
    </span>
  );
}
