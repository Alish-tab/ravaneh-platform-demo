import type { ReactNode } from 'react';

export type FeedbackTone = 'info' | 'success' | 'warning' | 'error';

type InlineMessageProps = {
  tone?: FeedbackTone;
  children: ReactNode;
};

const ICON: Record<FeedbackTone, string> = {
  info: 'M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zm0 4v1m0 3v1',
  success: 'M2 8l4 4 8-8',
  warning: 'M8 1.5L1 13.5h14L8 1.5zm0 4v4m0 2.5v.5',
  error: 'M5 5l6 6m0-6-6 6',
};

function FeedbackIcon({ tone }: { tone: FeedbackTone }) {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={ICON[tone]} />
    </svg>
  );
}

export function InlineMessage({ tone = 'info', children }: InlineMessageProps) {
  return (
    <div className={`inline-msg inline-${tone}`} role="status">
      <span style={{ flexShrink: 0, marginTop: 1 }}>
        <FeedbackIcon tone={tone} />
      </span>
      <span>{children}</span>
    </div>
  );
}

type ToastProps = {
  tone?: FeedbackTone;
  title: string;
  body?: ReactNode;
  onDismiss?: () => void;
};

export function Toast({ tone = 'info', title, body, onDismiss }: ToastProps) {
  const iconColor = {
    info: 'var(--info-text)',
    warning: 'var(--warning-text)',
    error: 'var(--error-text)',
    success: 'var(--success-text)',
  }[tone];

  return (
    <div className={`toast toast-${tone}`} role="status">
      <span style={{ color: iconColor, flexShrink: 0, marginTop: 1 }}>
        <FeedbackIcon tone={tone} />
      </span>
      <div>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{title}</div>
        {body ? (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{body}</div>
        ) : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          aria-label="بستن"
          onClick={onDismiss}
          style={{
            marginInlineStart: 'auto',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 2,
          }}
        >
          <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M2 2l12 12M14 2 2 14" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
